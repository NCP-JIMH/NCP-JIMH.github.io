import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AssessmentModal } from './components/AssessmentModal';
import { BodyMap } from './components/BodyMap';
import { CmoDashboard, type EvaluatedCrewEntry } from './components/CmoDashboard';
import { ContingencyBar } from './components/ContingencyBar';
import { OrganModal } from './components/OrganModal';
import { SEED_CREW_TELEMETRY } from './data/seedTelemetry';
import type {
    CabinEnvironmentState,
    CrewMember,
    MissionEnvironment,
    SystemId,
    TelemetryPoint,
} from './types/medical';
import { evaluateCrewHealth, scoreToStatus } from './utils/riskEngine';

const STORAGE_KEYS = {
    CREW: 'nasa_medops_crew_v1',
    ENV: 'nasa_medops_env_v1',
    ACTIVE_CREW: 'nasa_medops_active_crew_v1',
} as const;

const DEFAULT_ENV_STATE: CabinEnvironmentState = {
    missionDay: 15,
    environment: 'LEO_ISS',
    co2Ppm: 2100,
    o2Percent: 20.9,
    solarStormLevel: 'NONE',
    activeSolarEventSummary: 'Initializing space weather telemetry...',
    cmoIncapacitatedOverride: false,
};

function cloneSeedCrew(): CrewMember[] {
    return JSON.parse(JSON.stringify(SEED_CREW_TELEMETRY)) as CrewMember[];
}

function loadInitialCrew(): CrewMember[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.CREW);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed as CrewMember[];
            }
        }
    } catch {
        // Fallback to clean seed telemetry
    }
    return cloneSeedCrew();
}

function loadInitialEnv(): CabinEnvironmentState {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ENV);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.missionDay === 'number') {
                return { ...DEFAULT_ENV_STATE, ...parsed };
            }
        }
    } catch {
        // Fallback to default environment
    }
    return { ...DEFAULT_ENV_STATE };
}

function resolveTelemetryUpToDay(
    crew: CrewMember,
    environment: MissionEnvironment,
    missionDay: number
): TelemetryPoint[] {
    const fullSeries = crew.telemetryByEnvironment?.[environment] ?? crew.telemetryHistory;
    const filtered = fullSeries.filter((pt) => pt.missionDay <= missionDay);
    if (filtered.length > 0) return filtered;
    return fullSeries.length > 0 ? [fullSeries[0]] : [];
}

export const App: React.FC = () => {
    const [crewList, setCrewList] = useState<CrewMember[]>(loadInitialCrew);
    const [env, setEnv] = useState<CabinEnvironmentState>(loadInitialEnv);
    const [activeCrewId, setActiveCrewId] = useState<string>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CREW);
        return saved || SEED_CREW_TELEMETRY[0]?.id || 'crew-1';
    });

    const [activeTab, setActiveTab] = useState<'individual' | 'cmo'>('individual');
    const [organModalSystem, setOrganModalSystem] = useState<SystemId | null>(null);
    const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
    const [assessmentSystemFilter, setAssessmentSystemFilter] = useState<SystemId | null>(null);

    // Persist mission state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.CREW, JSON.stringify(crewList));
        } catch {
            // Ignore storage quota issues
        }
    }, [crewList]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.ENV, JSON.stringify(env));
        } catch {
            // Ignore storage quota issues
        }
    }, [env]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_CREW, activeCrewId);
        } catch {
            // Ignore storage quota issues
        }
    }, [activeCrewId]);

    // Reactively evaluate all 4 crew members at the active environment & missionDay
    const evaluatedFleet: EvaluatedCrewEntry[] = useMemo(() => {
        return crewList.map((member) => {
            const seriesUpToDay = resolveTelemetryUpToDay(member, env.environment, env.missionDay);
            const slicedCrew: CrewMember = {
                ...member,
                telemetryHistory: seriesUpToDay,
                telemetryByEnvironment: member.telemetryByEnvironment
                ? {
                    ...member.telemetryByEnvironment,
                    [env.environment]: seriesUpToDay,
                }
                : undefined,
            };
            const { updatedSystems, overallIndex } = evaluateCrewHealth(slicedCrew, env);
            return {
                crew: {
                    ...member,
                    systems: updatedSystems,
                },
                overallIndex,
            };
        });
    }, [crewList, env]);

    const activeEntry = useMemo(() => {
        return (
            evaluatedFleet.find((entry) => entry.crew.id === activeCrewId) ?? evaluatedFleet[0]
        );
    }, [evaluatedFleet, activeCrewId]);

    const activeCrew = activeEntry.crew;
    const activeTelemetryUpToDay = useMemo(
        () => resolveTelemetryUpToDay(activeCrew, env.environment, env.missionDay),
                                           [activeCrew, env.environment, env.missionDay]
    );

    // CMO availability & protocol unlock state
    const designatedCmo = useMemo(() => crewList.find((c) => c.isCMO), [crewList]);
    const cmoAvailable = Boolean(designatedCmo && !designatedCmo.isDeceasedOrIncapacitated);
    const cmoUnlocked = Boolean(
        (activeTab === 'cmo' && cmoAvailable) ||
        activeCrew.isCMO ||
        env.cmoIncapacitatedOverride ||
        !cmoAvailable
    );

    // Toggle flight-day countermeasure completion
    const handleToggleCountermeasure = useCallback(
        (crewId: string, missionDay: number, countermeasureId: string) => {
            setCrewList((prev) =>
            prev.map((member) => {
                if (member.id !== crewId) return member;
                const byDay = { ...(member.completedCountermeasuresByDay ?? {}) };
                const currentIds = new Set(byDay[missionDay] ?? []);
                if (currentIds.has(countermeasureId)) {
                    currentIds.delete(countermeasureId);
                } else {
                    currentIds.add(countermeasureId);
                }
                byDay[missionDay] = Array.from(currentIds);
                return {
                    ...member,
                    completedCountermeasuresByDay: byDay,
                };
            })
            );
        },
        []
    );

    // Append or update the active flight day's TelemetryPoint from AssessmentModal
    const handleSubmitAssessment = useCallback(
        (
            crewId: string,
            missionDay: number,
            _targetSystem: SystemId,
            updatedFields: Partial<TelemetryPoint>
        ) => {
            setCrewList((prev) =>
            prev.map((member) => {
                if (member.id !== crewId) return member;

                const updateSeries = (series: TelemetryPoint[]): TelemetryPoint[] => {
                    const idx = series.findIndex((pt) => pt.missionDay === missionDay);
                    if (idx >= 0) {
                        const copy = [...series];
                        copy[idx] = { ...copy[idx], ...updatedFields, missionDay };
                        return copy;
                    }
                    const fallbackBase = series[series.length - 1] ?? {
                        missionDay,
                        heartRateBpm: 70,
                        systolicBp: 115,
                        hrvRmssdMs: 45,
                        sleepHours: 7.2,
                        pvtReactionMs: 265,
                        bmdLossPct: 0.5,
                        aredSessionsWeek: 5,
                        visualAcuityShiftD: 0.1,
                        wbcCount10e9L: 6.2,
                        cumulativeDoseMsv: 5.0,
                    };
                    const next = [...series, { ...fallbackBase, ...updatedFields, missionDay }];
                    return next.sort((a, b) => a.missionDay - b.missionDay);
                };

                const updatedByEnv = member.telemetryByEnvironment
                ? {
                    ...member.telemetryByEnvironment,
                    [env.environment]: updateSeries(
                        member.telemetryByEnvironment[env.environment] ?? member.telemetryHistory
                    ),
                }
                : undefined;

                const updatedHistory =
                env.environment === 'LEO_ISS' || !updatedByEnv
                ? updateSeries(member.telemetryHistory)
                : member.telemetryHistory;

                return {
                    ...member,
                    telemetryHistory: updatedHistory,
                    telemetryByEnvironment: updatedByEnv,
                };
            })
            );
        },
        [env.environment]
    );

    const handleToggleCmoIncapacitated = useCallback((crewId: string) => {
        setCrewList((prev) =>
        prev.map((member) =>
        member.id === crewId
        ? { ...member, isDeceasedOrIncapacitated: !member.isDeceasedOrIncapacitated }
        : member
        )
        );
    }, []);

    const handleResetMissionTelemetry = () => {
        localStorage.removeItem(STORAGE_KEYS.CREW);
        localStorage.removeItem(STORAGE_KEYS.ENV);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CREW);
        setCrewList(cloneSeedCrew());
        setEnv({ ...DEFAULT_ENV_STATE });
        setActiveCrewId(SEED_CREW_TELEMETRY[0]?.id || 'crew-1');
        setOrganModalSystem(null);
        setAssessmentModalOpen(false);
    };

    const activeOverallStatus = scoreToStatus(activeEntry.overallIndex);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Top Contingency & Environment Control Bar */}
        <ContingencyBar env={env} onChangeEnv={setEnv} cmoAvailable={cmoAvailable} />

        {/* Main Content Container */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-5 space-y-5">
        {/* Sub-Header: Navigation, Active Crew Selector & Reset Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
        type="button"
        onClick={() => setActiveTab('individual')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'individual'
            ? 'bg-sky-500 text-slate-950'
            : 'text-slate-300 hover:text-white'
        }`}
        >
        Astronaut Self-Assessment & Body Map
        </button>
        <button
        type="button"
        onClick={() => setActiveTab('cmo')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeTab === 'cmo'
            ? 'bg-sky-500 text-slate-950'
            : 'text-slate-300 hover:text-white'
        }`}
        >
        CMO Fleet Triage Matrix
        </button>
        </div>

        {/* Active Astronaut Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
        {evaluatedFleet.map(({ crew, overallIndex }) => {
            const isSelected = crew.id === activeCrew.id;
            const st = scoreToStatus(overallIndex);
            const dotClass =
            st === 'critical'
            ? 'bg-rose-400'
            : st === 'caution'
            ? 'bg-amber-400'
            : 'bg-emerald-400';

        return (
            <button
            key={crew.id}
            type="button"
            onClick={() => setActiveCrewId(crew.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isSelected
                ? 'bg-slate-800 border-sky-400 text-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            >
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="font-mono text-[11px]">{crew.avatarCode}</span>
            <span>{crew.name}</span>
            <span className="font-mono text-[11px] text-slate-400">{overallIndex}%</span>
            </button>
        );
        })}
        </div>

        {/* Quick Actions: Guided Exam & Reset Mission Telemetry */}
        <div className="flex items-center gap-2">
        <button
        type="button"
        onClick={() => {
            setAssessmentSystemFilter(null);
            setAssessmentModalOpen(true);
        }}
        className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-bold text-slate-950 transition-colors"
        >
        + Guided Diagnostic Exam
        </button>
        <button
        type="button"
        onClick={handleResetMissionTelemetry}
        className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 text-xs font-mono text-slate-300 hover:text-rose-200 transition-colors"
        title="Clear localStorage overrides and restore baseline 30-day OSDR/PhysioNet telemetry"
        >
        Reset Mission Telemetry
        </button>
        </div>
        </div>

        {/* Active View Content */}
        {activeTab === 'individual' ? (
            <div className="space-y-4">
            {/* Active Crew Readiness Banner */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
            <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
            {activeCrew.avatarCode}
            </span>
            <h1 className="text-lg font-bold text-slate-100">{activeCrew.name}</h1>
            <span className="text-xs text-slate-400">• {activeCrew.role}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
            Select any anatomical system hotspot on the silhouette to inspect multi-day
            sparklines, CMP lab panels, and flight-day countermeasures.
            </p>
            </div>

            <div className="flex items-center gap-4">
            <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400">
            Composite Health Index
            </div>
            <div
            className={`text-2xl font-mono font-extrabold ${
                activeOverallStatus === 'critical'
                ? 'text-rose-400'
                : activeOverallStatus === 'caution'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
            >
            {activeEntry.overallIndex} / 100
            </div>
            </div>
            </div>
            </div>

            {/* Interactive SVG Body Map */}
            <BodyMap
            systems={activeCrew.systems}
            selectedSystem={organModalSystem}
            onSelectSystem={(sysId) => setOrganModalSystem(sysId)}
            crewName={activeCrew.name}
            missionDay={env.missionDay}
            />
            </div>
        ) : (
            <CmoDashboard
            fleet={evaluatedFleet}
            activeCrewId={activeCrew.id}
            env={env}
            onSelectCrewAndBodyMap={(crewId) => {
                setActiveCrewId(crewId);
                setActiveTab('individual');
            }}
            onInspectSystem={(crewId, systemId) => {
                setActiveCrewId(crewId);
                setOrganModalSystem(systemId);
            }}
            onLaunchAssessment={(crewId) => {
                setActiveCrewId(crewId);
                setAssessmentSystemFilter(null);
                setAssessmentModalOpen(true);
            }}
            onToggleCmoIncapacitated={handleToggleCmoIncapacitated}
            />
        )}
        </main>

        {/* Subsystem Drill-Down Modal */}
        <OrganModal
        isOpen={organModalSystem !== null}
        systemId={organModalSystem}
        crew={activeCrew}
        diagnostic={organModalSystem ? activeCrew.systems[organModalSystem] : null}
        telemetryUpToDay={activeTelemetryUpToDay}
        env={env}
        onClose={() => setOrganModalSystem(null)}
        onToggleCountermeasure={handleToggleCountermeasure}
        onOpenAssessment={(sysId) => {
            setAssessmentSystemFilter(sysId);
            setAssessmentModalOpen(true);
        }}
        />

        {/* Guided Diagnostic Assessment Modal */}
        <AssessmentModal
        isOpen={assessmentModalOpen}
        crew={activeCrew}
        activePoint={activeTelemetryUpToDay[activeTelemetryUpToDay.length - 1]}
        env={env}
        cmoUnlocked={cmoUnlocked}
        initialSystemFilter={assessmentSystemFilter}
        onClose={() => setAssessmentModalOpen(false)}
        onSubmitAssessment={handleSubmitAssessment}
        />
        </div>
    );
};

export default App;
