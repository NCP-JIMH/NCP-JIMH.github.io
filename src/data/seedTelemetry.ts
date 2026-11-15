import rawEnvTelemetry from '../src/data/envTelemetry.json';
import type { CrewMember, MissionEnvironment, TelemetryPoint } from '../types/medical';

type EnvMap = Record<MissionEnvironment, TelemetryPoint[]>;
const envData = rawEnvTelemetry as unknown as Record<string, EnvMap>;

export const SEED_CREW_TELEMETRY: CrewMember[] = Object.entries(envData).map(
    ([crewId, telemetryByEnvironment], index) => ({
        id: crewId,
        name: `Crew Member ${index + 1}`,
        role: index === 0 ? 'Commander' : index === 1 ? 'Chief Medical Officer' : 'Mission Specialist',
        isCMO: index === 1,
        isDeceasedOrIncapacitated: false,
        avatarCode: `CM-0${index + 1}`,
        telemetryHistory: telemetryByEnvironment.LEO_ISS ?? [],
        telemetryByEnvironment,
        systems: {
            cardiovascular: { systemId: 'cardiovascular', score: 95, status: 'nominal', primaryTrigger: 'Baseline', clinicalSummary: 'Nominal telemetry', countermeasures: [], lastUpdatedDay: 1 },
            neuro_ocular: { systemId: 'neuro_ocular', score: 95, status: 'nominal', primaryTrigger: 'Baseline', clinicalSummary: 'Nominal telemetry', countermeasures: [], lastUpdatedDay: 1 },
            musculoskeletal: { systemId: 'musculoskeletal', score: 95, status: 'nominal', primaryTrigger: 'Baseline', clinicalSummary: 'Nominal telemetry', countermeasures: [], lastUpdatedDay: 1 },
            behavioral_circadian: { systemId: 'behavioral_circadian', score: 95, status: 'nominal', primaryTrigger: 'Baseline', clinicalSummary: 'Nominal telemetry', countermeasures: [], lastUpdatedDay: 1 },
            radiation_immune: { systemId: 'radiation_immune', score: 95, status: 'nominal', primaryTrigger: 'Baseline', clinicalSummary: 'Nominal telemetry', countermeasures: [], lastUpdatedDay: 1 },
        },
    })
);

export default SEED_CREW_TELEMETRY;
