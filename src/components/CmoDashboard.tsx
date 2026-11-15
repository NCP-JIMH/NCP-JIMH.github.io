import React from 'react';
import type {
    CabinEnvironmentState,
    CrewMember,
    SystemId,
    TriageStatus,
} from '../types/medical';
import { scoreToStatus } from '../utils/riskEngine';

export interface EvaluatedCrewEntry {
    crew: CrewMember;
    overallIndex: number;
}

interface CmoDashboardProps {
    fleet: EvaluatedCrewEntry[];
    activeCrewId: string;
    env: CabinEnvironmentState;
    onSelectCrewAndBodyMap: (crewId: string) => void;
    onInspectSystem: (crewId: string, systemId: SystemId) => void;
    onLaunchAssessment: (crewId: string) => void;
    onToggleCmoIncapacitated: (crewId: string) => void;
}

const SYSTEM_SHORT_ORDER: { id: SystemId; code: string; name: string }[] = [
    { id: 'cardiovascular', code: 'CARD', name: 'Cardiovascular' },
{ id: 'neuro_ocular', code: 'SANS', name: 'Neuro-Ocular' },
{ id: 'musculoskeletal', code: 'MSK', name: 'Musculoskeletal' },
{ id: 'behavioral_circadian', code: 'CIRC', name: 'Behavioral / Circadian' },
{ id: 'radiation_immune', code: 'RAD', name: 'Radiation & Immune' },
];

const PILL_STYLES: Record<TriageStatus, string> = {
    nominal: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25',
    caution: 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25',
    critical: 'bg-rose-500/20 border-rose-500/60 text-rose-300 hover:bg-rose-500/30',
    nodata: 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700',
};

const GAUGE_COLORS: Record<TriageStatus, { bar: string; text: string; border: string }> = {
    nominal: {
        bar: 'bg-emerald-400',
        text: 'text-emerald-400',
        border: 'border-slate-800',
    },
    caution: {
        bar: 'bg-amber-400',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
    },
    critical: {
        bar: 'bg-rose-500',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
    },
    nodata: {
        bar: 'bg-slate-500',
        text: 'text-slate-400',
        border: 'border-slate-800',
    },
};

export const CmoDashboard: React.FC<CmoDashboardProps> = ({
    fleet,
    activeCrewId,
    env,
    onSelectCrewAndBodyMap,
    onInspectSystem,
    onLaunchAssessment,
    onToggleCmoIncapacitated,
}) => {
    const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
    const [approvedDays, setApprovedDays] = React.useState<Record<string, boolean>>({});

    const reportKey = `${env.environment}-FD-${env.missionDay}`;
    const isCurrentDayApproved = Boolean(approvedDays[reportKey]);

    const criticalCount = fleet.filter((f) => scoreToStatus(f.overallIndex) === 'critical').length;
    const cautionCount = fleet.filter((f) => scoreToStatus(f.overallIndex) === 'caution').length;
    const avgReadiness = Math.round(
        fleet.reduce((acc, item) => acc + item.overallIndex, 0) / Math.max(1, fleet.length)
    );
    const cmoMember = fleet.find((f) => f.crew.isCMO)?.crew;
    const isCmoOnDuty = Boolean(
        cmoMember && !cmoMember.isDeceasedOrIncapacitated && !env.cmoIncapacitatedOverride
    );

    return (
        <section className="space-y-4">
        {/* Fleet Summary Strip */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
        Crew Medical Officer (CMO) Fleet Triage Matrix
        </h2>
        <p className="text-xs text-slate-400">
        Multi-astronaut physiological readiness • {env.environment.replace('_', ' ')} • Flight
        Day {env.missionDay}
        </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
        <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
        CREW: {fleet.length}
        </span>
        <span className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300">
        CAUTION: {cautionCount}
        </span>
        <span className="px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300">
        CRITICAL: {criticalCount}
        </span>
        </div>
        </div>

        {/* 4-Crew Triage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fleet.map(({ crew, overallIndex }) => {
            const overallStatus = scoreToStatus(overallIndex);
            const gauge = GAUGE_COLORS[overallStatus];
            const isSelected = crew.id === activeCrewId;
            const isCmoUnavailable =
            crew.isCMO && (crew.isDeceasedOrIncapacitated || env.cmoIncapacitatedOverride);

            const degradedTriggers = SYSTEM_SHORT_ORDER.map((s) => crew.systems[s.id]).filter(
                (diag) => diag && (diag.status === 'critical' || diag.status === 'caution')
            );

            return (
                <article
                key={crew.id}
                className={`bg-slate-900/90 border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all ${
                    isSelected ? 'border-sky-400 ring-1 ring-sky-400/30' : gauge.border
                }`}
                >
                {/* Card Header: Identity & Overall Readiness Gauge */}
                <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-sky-300">
                {crew.avatarCode}
                </span>
                <h3 className="text-base font-bold text-slate-100">{crew.name}</h3>
                {crew.isCMO && (
                    <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isCmoUnavailable
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    }`}
                    >
                    {isCmoUnavailable ? 'CMO INCAPACITATED' : 'CMO'}
                    </span>
                )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{crew.role}</span>
                {crew.isCMO && (
                    <button
                    type="button"
                    onClick={() => onToggleCmoIncapacitated(crew.id)}
                    className="text-[10px] font-mono text-rose-300 hover:text-rose-200 underline"
                    >
                    {crew.isDeceasedOrIncapacitated
                        ? '(Restore CMO Duty)'
                : '(Flag Incapacitated)'}
                </button>
                )}
                </div>
                </div>

                {/* Overall Index Gauge */}
                <div className="text-right shrink-0 min-w-[92px]">
                <div className="text-[10px] font-mono uppercase text-slate-400">Readiness</div>
                <div className={`text-xl font-mono font-extrabold ${gauge.text}`}>
                {overallIndex}%
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
                <div
                className={`h-full transition-all duration-300 ${gauge.bar}`}
                style={{ width: `${Math.max(0, Math.min(100, overallIndex))}%` }}
                />
                </div>
                </div>
                </div>

                {/* 5-System Status Pills */}
                <div>
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                Subsystem Triage (Click pill to inspect)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                {SYSTEM_SHORT_ORDER.map((sys) => {
                    const diag = crew.systems[sys.id];
                    const st: TriageStatus = diag?.status ?? 'nodata';
                return (
                    <button
                    key={sys.id}
                    type="button"
                    onClick={() => onInspectSystem(crew.id, sys.id)}
                    title={`${sys.name}: ${diag?.primaryTrigger ?? 'No data'}`}
                    className={`rounded-lg border px-1.5 py-1.5 text-center transition-colors ${PILL_STYLES[st]}`}
                    >
                    <div className="text-[10px] font-mono font-bold">{sys.code}</div>
                    <div className="text-xs font-mono font-extrabold">
                    {diag?.score !== null && diag?.score !== undefined ? diag.score : '--'}
                    </div>
                    </button>
                );
                })}
                </div>
                </div>

                {/* Active Triggers */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 min-h-[68px] flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                Active Clinical Triggers
                </div>
                {degradedTriggers.length === 0 ? (
                    <div className="text-xs text-emerald-300/90">
                    All 5 physiological subsystems within mission nominal parameters.
                    </div>
                ) : (
                    <ul className="space-y-1">
                    {degradedTriggers.slice(0, 2).map((trig) => (
                        <li
                        key={trig.systemId}
                        className={`text-xs flex items-start gap-1.5 ${
                            trig.status === 'critical' ? 'text-rose-300' : 'text-amber-300'
                        }`}
                        >
                        <span className="font-mono font-bold shrink-0">
                        [{trig.status.toUpperCase()}]
                        </span>
                        <span className="line-clamp-1">{trig.primaryTrigger}</span>
                        </li>
                    ))}
                    {degradedTriggers.length > 2 && (
                        <li className="text-[11px] font-mono text-slate-400">
                        +{degradedTriggers.length - 2} additional degraded subsystem(s)
                        </li>
                    )}
                    </ul>
                )}
                </div>

                {/* Quick-Launch Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                <button
                type="button"
                onClick={() => onSelectCrewAndBodyMap(crew.id)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
                >
                Open Body Map
                </button>
                <button
                type="button"
                onClick={() => onLaunchAssessment(crew.id)}
                className="flex-1 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-xs font-semibold text-sky-200 transition-colors"
                >
                Run Assessment
                </button>
                </div>
                </article>
            );
        })}
        </div>

        {/* Daily Fleet Telemetry Report Trigger */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
        Flight Day {String(env.missionDay).padStart(2, '0')} Consolidated Fleet Summary • Mean Readiness:{' '}
        <strong className="text-slate-200 font-mono">{avgReadiness}%</strong>
        </div>
        <button
        type="button"
        onClick={() => setIsReportModalOpen(true)}
        className="px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 text-xs font-semibold text-indigo-200 transition-colors"
        >
        {isCurrentDayApproved
            ? `View Approved FD-${String(env.missionDay).padStart(2, '0')} Report`
            : `Review & Approve FD-${String(env.missionDay).padStart(2, '0')} Fleet Report`}
            </button>
            </div>

            {/* Fleet Report Modal */}
            {isReportModalOpen && (
                <div
                className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                >
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                <div className="text-[11px] font-mono text-indigo-400 uppercase">
                Earth Downlink Medical Brief • {env.environment.replace('_', ' ')}
                </div>
                <h3 className="text-base font-bold text-slate-100">
                Fleet Health & Pattern Report — FD-{String(env.missionDay).padStart(2, '0')}
                </h3>
                </div>
                <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                Close
                </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-slate-400 text-[10px]">MEAN READINESS</div>
                <div className="text-lg font-bold text-sky-300">{avgReadiness}%</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-slate-400 text-[10px]">CAUTION CREW</div>
                <div className="text-lg font-bold text-amber-300">{cautionCount}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <div className="text-slate-400 text-[10px]">CRITICAL CREW</div>
                <div className="text-lg font-bold text-rose-400">{criticalCount}</div>
                </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300 max-h-60 overflow-y-auto">
                <div className="font-mono text-[10px] uppercase text-slate-400">
                Detected Physiological Patterns & Crew Status
                </div>
                {fleet.map(({ crew, overallIndex }) => {
                    const degraded = SYSTEM_SHORT_ORDER.map((s) => crew.systems[s.id]).filter(
                        (d) => d && d.status !== 'nominal'
                    );
                    return (
                        <div key={crew.id} className="border-b border-slate-800/80 pb-2 last:border-b-0">
                        <div className="font-semibold text-slate-100">
                        {crew.avatarCode} ({crew.name}) — Readiness: {overallIndex}%
                        </div>
                        <div className="text-slate-400">
                        {degraded.length === 0
                            ? 'All subsystems nominal; countermeasures adhering to flight plan.'
                    : degraded.map((d) => `${d.systemId.toUpperCase()}: ${d.primaryTrigger}`).join(' | ')}
                    </div>
                    </div>
                    );
                })}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                Cancel
                </button>
                {!isCurrentDayApproved && (
                    <button
                    type="button"
                    onClick={() => {
                        setApprovedDays((prev) => ({ ...prev, [reportKey]: true }));
                        setIsReportModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950"
                    >
                    Aprobar Reporte para Telemetría (FD-{String(env.missionDay).padStart(2, '0')})
                    </button>
                )}
                </div>
                </div>
                </div>
            )}
            </section>
    );
};

export default CmoDashboard;
