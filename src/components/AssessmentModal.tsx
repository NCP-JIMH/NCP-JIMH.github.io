import React, { useEffect, useMemo, useState } from 'react';
import { ASSESSMENT_PROTOCOLS } from '../data/protocols';
import type {
    AssessmentProtocol,
    CabinEnvironmentState,
    CrewMember,
    SystemId,
    TelemetryPoint,
} from '../types/medical';

interface AssessmentModalProps {
    isOpen: boolean;
    crew: CrewMember;
    activePoint: TelemetryPoint | undefined;
    env: CabinEnvironmentState;
    cmoUnlocked: boolean;
    initialSystemFilter?: SystemId | null;
    onClose: () => void;
    onSubmitAssessment: (
        crewId: string,
        missionDay: number,
        targetSystem: SystemId,
        updatedFields: Partial<TelemetryPoint>
    ) => void;
}

const SYSTEM_LABELS: Record<SystemId, string> = {
    cardiovascular: 'Cardiovascular',
    neuro_ocular: 'Neuro-Ocular / SANS',
    musculoskeletal: 'Musculoskeletal',
    behavioral_circadian: 'Behavioral & Circadian',
    radiation_immune: 'Radiation & Immune',
};

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
    isOpen,
    crew,
    activePoint,
    env,
    cmoUnlocked,
    initialSystemFilter = null,
    onClose,
    onSubmitAssessment,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [systemFilter, setSystemFilter] = useState<SystemId | 'ALL'>('ALL');
    const [selectedProtocolId, setSelectedProtocolId] = useState<string>(
        ASSESSMENT_PROTOCOLS[0]?.id ?? ''
    );
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [formValues, setFormValues] = useState<Record<string, number>>({});
    const [submittedBanner, setSubmittedBanner] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSystemFilter(initialSystemFilter ?? 'ALL');
            setSubmittedBanner(null);
            setActiveStepIndex(0);
        }
    }, [isOpen, initialSystemFilter]);

    const sortedAndFilteredProtocols = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return [...ASSESSMENT_PROTOCOLS]
        .sort((a, b) => a.urgencyRank - b.urgencyRank)
        .filter((proto) => {
            if (systemFilter !== 'ALL' && proto.targetSystem !== systemFilter) {
                return false;
            }
            if (!q) return true;
            return (
                proto.title.toLowerCase().includes(q) ||
                proto.hardwareNeeded.toLowerCase().includes(q) ||
                SYSTEM_LABELS[proto.targetSystem].toLowerCase().includes(q)
            );
        });
    }, [searchQuery, systemFilter]);

    const selectedProtocol: AssessmentProtocol | undefined = useMemo(() => {
        return (
            sortedAndFilteredProtocols.find((p) => p.id === selectedProtocolId) ??
            sortedAndFilteredProtocols[0]
        );
    }, [sortedAndFilteredProtocols, selectedProtocolId]);

    useEffect(() => {
        setActiveStepIndex(0);
        setSubmittedBanner(null);
    }, [selectedProtocol?.id, env.missionDay, crew.id]);

    useEffect(() => {
        if (!selectedProtocol) return;

        const seeded: Record<string, number> = {};
        for (const inp of selectedProtocol.inputs) {
            const existingVal = activePoint
            ? (activePoint[inp.key as keyof TelemetryPoint] as number | undefined)
            : undefined;
            if (typeof existingVal === 'number' && !Number.isNaN(existingVal)) {
                seeded[inp.key] = existingVal;
            } else if (inp.type === 'select' && inp.options && inp.options.length > 0) {
                seeded[inp.key] = inp.options[0].value;
            } else {
                seeded[inp.key] = 0;
            }
        }
        setFormValues(seeded);
    }, [selectedProtocol, activePoint, env.missionDay, crew.id]);

    if (!isOpen) return null;

    const isLocked = Boolean(
        selectedProtocol?.requiresCMO && !cmoUnlocked && !env.cmoIncapacitatedOverride
    );
    const currentStep = selectedProtocol?.steps[activeStepIndex];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProtocol || isLocked) return;

        const patch: Partial<TelemetryPoint> = {};
        for (const inp of selectedProtocol.inputs) {
            const val = formValues[inp.key];
            if (typeof val === 'number' && !Number.isNaN(val)) {
                (patch as Record<string, number>)[inp.key] = val;
            }
        }

        onSubmitAssessment(crew.id, env.missionDay, selectedProtocol.targetSystem, patch);
        setSubmittedBanner(
            `FD-${String(env.missionDay).padStart(2, '0')} telemetry updated for ${crew.name}. Risk engine recalculated.`
        );
    };

    return (
        <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-modal-title"
        >
        <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5 border-b border-slate-800 bg-slate-900">
        <div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-sky-400 uppercase">
        <span>Guided Diagnostic & Self-Exam Console</span>
        <span>•</span>
        <span>
        {crew.name} (FD-{String(env.missionDay).padStart(2, '0')})
        </span>
        </div>
        <h2 id="assessment-modal-title" className="text-lg font-bold text-slate-100">
        Clinical Assessment Protocols
        </h2>
        </div>

        <div className="flex items-center gap-3">
        <span
        className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md border ${
            cmoUnlocked
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
        }`}
        >
        {cmoUnlocked
            ? env.cmoIncapacitatedOverride
            ? 'CMO OVERRIDE UNLOCKED'
            : 'CMO CLEARANCE ACTIVE'
    : 'CMO-ONLY PROTOCOLS LOCKED'}
    </span>

    <button
    type="button"
    onClick={onClose}
    aria-label="Close assessment modal"
    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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

    {/* Main Split Layout */}
    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
    {/* Left Column: Protocol Search, Filter & Urgency-Ranked List */}
    <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-3 bg-slate-950/50">
    <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search protocol, hardware, system..."
    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400"
    />

    {/* System Filter Pills */}
    <div className="flex flex-wrap gap-1">
    <button
    type="button"
    onClick={() => setSystemFilter('ALL')}
    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
        systemFilter === 'ALL'
        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
    }`}
    >
    ALL ({ASSESSMENT_PROTOCOLS.length})
    </button>
    {(Object.keys(SYSTEM_LABELS) as SystemId[]).map((sys) => (
        <button
        key={sys}
        type="button"
        onClick={() => setSystemFilter(sys)}
        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
            systemFilter === sys
            ? 'bg-sky-500/20 border-sky-400 text-sky-200'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        >
        {SYSTEM_LABELS[sys].split(' ')[0]}
        </button>
    ))}
    </div>

    <div className="text-[10px] font-mono uppercase text-slate-500">
    Sorted by Clinical Urgency Rank
    </div>

    <div className="space-y-2">
    {sortedAndFilteredProtocols.length === 0 ? (
        <div className="text-xs text-slate-400 p-4 text-center border border-slate-800 rounded-lg">
        No protocols match your filter.
        </div>
    ) : (
        sortedAndFilteredProtocols.map((proto) => {
            const locked = proto.requiresCMO && !cmoUnlocked;
            const isSelected = selectedProtocol?.id === proto.id;

            return (
                <button
                key={proto.id}
                type="button"
                onClick={() => setSelectedProtocolId(proto.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                    ? 'bg-slate-900 border-sky-400 ring-1 ring-sky-400/40'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                }`}
                >
                <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-sky-400">
                P{proto.urgencyRank} • {SYSTEM_LABELS[proto.targetSystem]}
                </span>
                {proto.requiresCMO ? (
                    <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        locked
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                    >
                    {locked ? 'LOCKED (CMO)' : 'CMO UNLOCKED'}
                    </span>
                ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    SELF-EXAM
                    </span>
                )}
                </div>
                <div className="text-xs font-semibold text-slate-100 leading-snug">
                {proto.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                {proto.hardwareNeeded} • ~{proto.estimatedMinutes} min
                </div>
                </button>
            );
        })
    )}
    </div>
    </div>

    {/* Right Column: Step-by-Step Procedure & Telemetry Input Form */}
    <div className="md:col-span-7 p-5 flex flex-col justify-between">
    {!selectedProtocol ? (
        <div className="text-xs text-slate-400 m-auto">Select a protocol to begin.</div>
    ) : (
        <div className="space-y-5">
        <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-mono text-sky-400 uppercase">
        {SYSTEM_LABELS[selectedProtocol.targetSystem]} • Est.{' '}
        {selectedProtocol.estimatedMinutes} min
        </span>
        <span className="text-[11px] font-mono text-slate-400">
        Hardware: {selectedProtocol.hardwareNeeded}
        </span>
        </div>
        <h3 className="text-base font-bold text-slate-100">{selectedProtocol.title}</h3>
        </div>

        {isLocked ? (
            <div className="bg-rose-950/30 border border-rose-500/50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Protocol Locked — CMO Authorization Required
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
            This diagnostic procedure requires Chief Medical Officer credentials. Switch
            to the CMO profile or activate the{' '}
            <strong className="font-semibold">
            &ldquo;CMO Incapacitated: Contingency Active&rdquo;
            </strong>{' '}
            override in the top mission bar to unlock autonomous crew self-execution.
            </p>
            </div>
        ) : (
            <>
            {/* Interactive Step Viewer */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-300">
            Step {currentStep?.stepNumber ?? 1} of {selectedProtocol.steps.length}
            </span>
            <div className="flex items-center gap-1.5">
            {selectedProtocol.steps.map((st, idx) => (
                <button
                key={st.stepNumber}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`w-6 h-6 rounded text-[11px] font-mono font-bold transition-colors ${
                    idx === activeStepIndex
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                >
                {st.stepNumber}
                </button>
            ))}
            </div>
            </div>

            {currentStep && (
                <div className="space-y-2.5">
                <p className="text-sm text-slate-100 leading-relaxed">
                {currentStep.instruction}
                </p>
                <div className="bg-sky-950/40 border border-sky-500/30 rounded-lg px-3 py-2 text-xs text-sky-200 flex items-start gap-2">
                <span className="font-mono font-bold text-sky-400 shrink-0">
                VISUAL CUE:
                </span>
                <span>{currentStep.visualCue}</span>
                </div>
                </div>
            )}

            <div className="flex justify-between pt-1">
            <button
            type="button"
            disabled={activeStepIndex === 0}
            onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
            className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-200 disabled:opacity-40 hover:bg-slate-700"
            >
            ← Previous Step
            </button>
            <button
            type="button"
            disabled={activeStepIndex >= selectedProtocol.steps.length - 1}
            onClick={() =>
                setActiveStepIndex((i) =>
                Math.min(selectedProtocol.steps.length - 1, i + 1)
                )
            }
            className="px-3 py-1 rounded bg-slate-800 text-xs text-slate-200 disabled:opacity-40 hover:bg-slate-700"
            >
            Next Step →
            </button>
            </div>
            </div>

            {/* Diagnostic Measurement Entry Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Log Telemetry Values (FD-{String(env.missionDay).padStart(2, '0')})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedProtocol.inputs.map((inp) => (
                <div
                key={inp.key}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3"
                >
                <label className="block text-[11px] text-slate-400 mb-1.5">
                {inp.label}
                {inp.unit ? ` (${inp.unit})` : ''}
                </label>

                {inp.type === 'select' && inp.options ? (
                    <select
                    value={formValues[inp.key] ?? inp.options[0]?.value ?? 0}
                    onChange={(e) =>
                        setFormValues((prev) => ({
                            ...prev,
                            [inp.key]: Number(e.target.value),
                        }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-400"
                    >
                    {inp.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                        {opt.label}
                        </option>
                    ))}
                    </select>
                ) : (
                    <input
                    type="number"
                    step="any"
                    required
                    value={formValues[inp.key] ?? 0}
                    onChange={(e) =>
                        setFormValues((prev) => ({
                            ...prev,
                            [inp.key]: Number(e.target.value),
                        }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-400"
                    />
                )}
                </div>
            ))}
            </div>

            {submittedBanner && (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-emerald-200 font-medium">
                {submittedBanner}
                </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
            >
            Close
            </button>
            <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-bold text-slate-950 transition-colors"
            >
            Commit Telemetry & Re-Evaluate
            </button>
            </div>
            </form>
            </>
        )}
        </div>
    )}
    </div>
    </div>
    </div>
    </div>
    );
};

export default AssessmentModal;
