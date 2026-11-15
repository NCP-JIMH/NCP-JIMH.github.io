export type MissionEnvironment = 'LEO_ISS' | 'LUNAR_SURFACE' | 'MARS_TRANSIT';
export type TriageStatus = 'nominal' | 'caution' | 'critical' | 'nodata';
export type SystemId =
| 'cardiovascular'
| 'neuro_ocular'
| 'musculoskeletal'
| 'behavioral_circadian'
| 'radiation_immune';

export interface TelemetryPoint {
    missionDay: number;
    heartRateBpm: number;
    systolicBp: number;
    hrvRmssdMs: number;          // Autonomic stress / sleep recovery
    sleepHours: number;          // Target >= 7.0h; ISS avg 5.4-6.0h
    pvtReactionMs: number;       // Psychomotor Vigilance Test (ms)
    bmdLossPct: number;          // Cumulative bone mineral density loss %
    aredSessionsWeek: number;    // Resistive exercise adherence (0-7)
    visualAcuityShiftD: number;  // Hyperopic shift in diopters (SANS indicator)
    wbcCount10e9L: number;       // HemoCue fingerstick WBC (normal: 4.5-11.0)
    cumulativeDoseMsv: number;   // RadLab cumulative radiation dose
    cmp?: { sodiumMmolL: number; potassiumMmolL: number; creatinineMgDl: number; bunMgDl: number; calciumMgDl: number; glucoseMgDl: number };
}

export interface CountermeasureItem {
    id: string;
    label: string;
    targetSystem: SystemId;
    penaltyReduction: number;
    completed: boolean;
}

export interface SystemDiagnostic {
    systemId: SystemId;
    score: number | null;              // 0-100 (null = 'nodata')
    status: TriageStatus;
    primaryTrigger: string;            // e.g., "Cephalad Fluid Shift (Microgravity)"
    clinicalSummary: string;           // Plain-language explanation for crew
    countermeasures: CountermeasureItem[]; // Actionable, checkable steps
    lastUpdatedDay: number;
}

export interface CrewMember {
    id: string;
    name: string;
    role: string;
    isCMO: boolean;
    isDeceasedOrIncapacitated: boolean;
    avatarCode: string;
    telemetryHistory: TelemetryPoint[];
    systems: Record<SystemId, SystemDiagnostic>;
    completedCountermeasuresByDay?: Record<number, string[]>; // Persisted IDs per missionDay
    telemetryByEnvironment?: Record<MissionEnvironment, TelemetryPoint[]>;
}

export interface CabinEnvironmentState {
    missionDay: number;
    environment: MissionEnvironment;
    co2Ppm: number;              // Nominal < 2500 ppm; Caution > 4000; Critical > 6000
    o2Percent: number;           // Nominal 20.9%; Hypoxic < 19.5%
    solarStormLevel: 'NONE' | 'MINOR_FLR' | 'MAJOR_SPE_CME';
    activeSolarEventSummary: string;
    cmoIncapacitatedOverride: boolean;
}

export interface AssessmentProtocol {
    id: string;
    title: string;
    targetSystem: SystemId;
    urgencyRank: number;         // Lower = appears first when search bar is empty
    requiresCMO: boolean;        // Unlocked automatically if cmoIncapacitatedOverride === true
    hardwareNeeded: string;      // e.g., "None (Guided Self-Exam)", "MiniOCT", "HemoCue"
    estimatedMinutes: number;
    steps: {
        stepNumber: number;
        instruction: string;
        visualCue: string;
    }[];
    inputs: {
        key: string;
        label: string;
        type: 'number' | 'select';
        options?: { label: string; value: number }[];
        unit?: string;
    }[];
}
