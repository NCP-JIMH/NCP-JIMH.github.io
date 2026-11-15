import React from 'react';
import type {
    CabinEnvironmentState,
    CrewMember,
    SystemDiagnostic,
    SystemId,
    TelemetryPoint,
    TriageStatus,
} from '../types/medical';
import { Sparkline } from './Sparkline';

interface OrganModalProps {
    isOpen: boolean;
    systemId: SystemId | null;
    crew: CrewMember;
    diagnostic: SystemDiagnostic | null;
    telemetryUpToDay: TelemetryPoint[];
    env: CabinEnvironmentState;
    onClose: () => void;
    onToggleCountermeasure: (crewId: string, missionDay: number, countermeasureId: string) => void;
    onOpenAssessment: (systemId: SystemId) => void;
}

const SYSTEM_TITLES: Record<SystemId, { title: string; subtitle: string }> = {
    cardiovascular: {
        title: 'Cardiovascular & Autonomic System',
        subtitle: 'Hemodynamic stability, cephalad fluid shift & vagal reserve',
    },
    neuro_ocular: {
        title: 'Neuro-Ocular System (SANS)',
        subtitle: 'Spaceflight-Associated Neuro-Ocular Syndrome & ICP tracking',
    },
    musculoskeletal: {
        title: 'Musculoskeletal & Bone Remodeling',
        subtitle: 'Axial skeletal unloading, DXA delta & ARED resistance compliance',
    },
    behavioral_circadian: {
        title: 'Behavioral Health & Circadian Rhythm',
        subtitle: 'Actigraphy sleep architecture & PVT-B neurocognitive vigilance',
    },
    radiation_immune: {
        title: 'Radiation Dosimetry & Immune Function',
        subtitle: 'Cumulative GCR/SPE absorbed dose & leukocyte surveillance',
    },
};

const STATUS_BADGE: Record<
TriageStatus,
{ label: string; badgeClass: string; scoreClass: string }
> = {
    nominal: {
        label: 'NOMINAL',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        scoreClass: 'text-emerald-400',
    },
    caution: {
        label: 'CAUTION',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        scoreClass: 'text-amber-400',
    },
    critical: {
        label: 'CRITICAL',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        scoreClass: 'text-rose-400',
    },
    nodata: {
        label: 'NO DATA',
        badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600',
        scoreClass: 'text-slate-400',
    },
};

export const OrganModal: React.FC<OrganModalProps> = ({
    isOpen,
    systemId,
    crew,
    diagnostic,
    telemetryUpToDay,
    env,
    onClose,
    onToggleCountermeasure,
    onOpenAssessment,
}) => {
    if (!isOpen || !systemId || !diagnostic) return null;

    const meta = SYSTEM_TITLES[systemId];
    const badge = STATUS_BADGE[diagnostic.status];
    const safeSeries =
    telemetryUpToDay.length > 0 ? telemetryUpToDay : crew.telemetryHistory.slice(0, 1);
    const latest = safeSeries[safeSeries.length - 1];

    const renderSystemSparklines = () => {
        switch (systemId) {
            case 'cardiovascular':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Sparkline
                    values={safeSeries.map((p) => p.heartRateBpm)}
                    color="#f43f5e"
                    label="Resting Heart Rate"
                    unit="bpm"
                    />
                    <Sparkline
                    values={safeSeries.map((p) => p.systolicBp)}
                    color="#38bdf8"
                    label="Systolic BP"
                    unit="mmHg"
                    />
                    <Sparkline
                    values={safeSeries.map((p) => p.hrvRmssdMs)}
                    color="#10b981"
                    label="Autonomic HRV (RMSSD)"
                    unit="ms"
                    />
                    </div>
                );

            case 'neuro_ocular':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Sparkline
                    values={safeSeries.map((p) => p.visualAcuityShiftD)}
                    color="#f59e0b"
                    label="Hyperopic Refractive Shift"
                    unit="D"
                    />
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                    <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Active Cabin ppCO₂ Load</span>
                    <span className="font-mono font-semibold text-slate-100">{env.co2Ppm} ppm</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                    Elevated cabin CO₂ increases cerebral vasodilation and intracranial fluid load,
                    compounding microgravity SANS risk.
                    </p>
                    </div>
                    </div>
                );

            case 'musculoskeletal':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Sparkline
                    values={safeSeries.map((p) => p.bmdLossPct)}
                    color="#f59e0b"
                    label="Cumulative BMD Loss"
                    unit="%"
                    />
                    <Sparkline
                    values={safeSeries.map((p) => p.aredSessionsWeek)}
                    color="#38bdf8"
                    label="ARED Resistive Adherence"
                    unit="sess/wk"
                    />
                    </div>
                );

            case 'behavioral_circadian':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Sparkline
                    values={safeSeries.map((p) => p.sleepHours)}
                    color="#818cf8"
                    label="Consolidated Sleep"
                    unit="hrs"
                    />
                    <Sparkline
                    values={safeSeries.map((p) => p.pvtReactionMs)}
                    color="#f43f5e"
                    label="PVT-B Reaction Time"
                    unit="ms"
                    />
                    </div>
                );

            case 'radiation_immune':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Sparkline
                    values={safeSeries.map((p) => p.cumulativeDoseMsv)}
                    color="#f43f5e"
                    label="Cumulative Radiation Dose"
                    unit="mSv"
                    />
                    <Sparkline
                    values={safeSeries.map((p) => p.wbcCount10e9L)}
                    color="#34d399"
                    label="Fingerstick WBC Count"
                    unit="10⁹/L"
                    />
                    </div>
                );
        }
    };

    const totalBonus = diagnostic.countermeasures
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.penaltyReduction, 0);

    return (
        <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="organ-modal-title"
        >
        <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div>
        <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
        {crew.name} ({crew.avatarCode}) • FD-{String(env.missionDay).padStart(2, '0')} •{' '}
        {env.environment.replace('_', ' ')}
        </span>
        <span
        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.badgeClass}`}
        >
        {badge.label}
        </span>
        </div>
        <h2 id="organ-modal-title" className="text-lg font-bold text-slate-100">
        {meta.title}
        </h2>
        <p className="text-xs text-slate-400">{meta.subtitle}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
        <div className="text-[10px] font-mono uppercase text-slate-400">System Index</div>
        <div className={`text-2xl font-mono font-extrabold ${badge.scoreClass}`}>
        {diagnostic.score !== null ? `${diagnostic.score}/100` : 'N/A'}
        </div>
        </div>
        <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
        />
        </svg>
        </button>
        </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
        {/* Primary Trigger & Clinical Summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
        Primary Diagnostic Trigger
        </span>
        <button
        type="button"
        onClick={() => {
            onClose();
            onOpenAssessment(systemId);
        }}
        className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
        >
        <span>Log New Diagnostic Reading</span>
        <span>→</span>
        </button>
        </div>
        <div className="text-sm font-semibold text-slate-100">{diagnostic.primaryTrigger}</div>
        <p className="text-xs text-slate-300 leading-relaxed">{diagnostic.clinicalSummary}</p>
        </div>

        {/* Time-Series Telemetry Sparklines */}
        <div>
        <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        Trajectory Telemetry (FD-01 → FD-{String(env.missionDay).padStart(2, '0')})
        </h3>
        <span className="text-[11px] font-mono text-slate-500">
        {safeSeries.length} sample{safeSeries.length === 1 ? '' : 's'}
        </span>
        </div>
        {renderSystemSparklines()}
        </div>

        {/* Optional Serum CMP Readout Card (NASA OSDR OSD-575 Hook) */}
        {latest?.cmp && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Serum Comprehensive Metabolic Panel (CMP • FD-{String(latest.missionDay).padStart(2, '0')})
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded">
            OSDR OSD-575
            </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
                { label: 'Na⁺', val: latest.cmp.sodiumMmolL.toFixed(1), unit: 'mmol/L' },
                         { label: 'K⁺', val: latest.cmp.potassiumMmolL.toFixed(2), unit: 'mmol/L' },
                         { label: 'Creatinine', val: latest.cmp.creatinineMgDl.toFixed(2), unit: 'mg/dL' },
                         { label: 'BUN', val: latest.cmp.bunMgDl.toFixed(1), unit: 'mg/dL' },
                         { label: 'Ca²⁺', val: latest.cmp.calciumMgDl.toFixed(2), unit: 'mg/dL' },
                         { label: 'Glucose', val: latest.cmp.glucoseMgDl.toFixed(1), unit: 'mg/dL' },
            ].map((item) => (
                <div
                key={item.label}
                className="bg-slate-900 border border-slate-800/90 rounded-lg p-2.5"
                >
                <div className="text-[10px] font-mono text-slate-400">{item.label}</div>
                <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                {item.val}
                </div>
                <div className="text-[10px] font-mono text-slate-500">{item.unit}</div>
                </div>
            ))}
            </div>
            </div>
        )}

        {/* Actionable Countermeasure Checklist */}
        <div>
        <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        Flight-Day Countermeasures (FD-{String(env.missionDay).padStart(2, '0')})
        </h3>
        <span className="text-[11px] font-mono text-emerald-400">
        Mitigation Credit: -{totalBonus} penalty pts
        </span>
        </div>

        {diagnostic.countermeasures.length === 0 ? (
            <div className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            No active countermeasures prescribed for current flight day.
            </div>
        ) : (
            <div className="space-y-2">
            {diagnostic.countermeasures.map((cm) => (
                <label
                key={cm.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    cm.completed
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-100'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 text-slate-200'
                }`}
                >
                <input
                type="checkbox"
                checked={cm.completed}
                onChange={() => onToggleCountermeasure(crew.id, env.missionDay, cm.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                <div className="text-xs font-medium leading-snug">{cm.label}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                Risk Penalty Reduction: -{cm.penaltyReduction} pts •{' '}
                {cm.completed ? 'Logged & Applied' : 'Pending Execution'}
                </div>
                </div>
                </label>
            ))}
            </div>
        )}
        </div>
        </div>
        </div>
        </div>
    );
};

export default OrganModal;
