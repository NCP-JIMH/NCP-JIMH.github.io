import { CabinEnvironmentState, CountermeasureItem, CrewMember, MissionEnvironment, SystemDiagnostic, SystemId, TriageStatus } from '../types/medical';


// Environment risk multipliers anchored in aerospace physiology
const ENV_MODIFIERS: Record<MissionEnvironment, Record<SystemId, number>> = {
    LEO_ISS: {
        cardiovascular: 1.0,
        neuro_ocular: 1.0,
        musculoskeletal: 1.0,
        behavioral_circadian: 1.0,
        radiation_immune: 0.75, // Geomagnetic protection (~0.40 mSv/d est vs <1.3 mSv/d free-space cap [V1 4033])
    },
    LUNAR_SURFACE: {
        cardiovascular: 0.85,
        neuro_ocular: 0.85, // Operational partial-G model; parabolic flight suggests >0.50-Gz needed to curb headward shift
        musculoskeletal: 0.80, // Operational partial-loading model; human 1/6g longitudinal BMD rate unverified
        behavioral_circadian: 1.15,
        radiation_immune: 1.25, // Outside magnetosphere (~0.50 mSv/d est; <0.9 mSv/d surface cap [V1 4033])
    },
    MARS_TRANSIT: {
        cardiovascular: 1.20,
        neuro_ocular: 1.25, // Prolonged 0g cephalad fluid shift across multi-month cruise
        musculoskeletal: 1.25, // Multi-month 0g unloading (1.0–1.5% BMD loss/mo)
        behavioral_circadian: 1.35, // Extreme confinement & comms delay (Mars-500 analog: 7.0% active-wake decline)
        radiation_immune: 1.45, // Deep-space GCR (1.3–1.5 mSv/d) + unshielded SPE risk [V1 4030/4031/4033]
    },
};

export const NASA_CLINICAL_THRESHOLDS = {
    cardiovascular: {
        hrvRmssdCautionMs: 25,          // MVP heuristic (no NASA-STD-3001 RMSSD cutoff; stand-test uses PHI/PTOT)
        hrCautionBpm: 95,               // MVP heuristic (stand-test presyncope: HR drop >15 bpm)
        sbpCautionMmHg: 95,             // MVP heuristic (stand-test presyncope: SBP drop >25 mmHg/min)
        o2CautionPct760: 19.5,          // PIO2 139.0 mmHg @ 760 mmHg (<145–155 mmHg normoxia; NASA-STD-3001 [V2 6003])
        o2CriticalPct760: 17.1,         // PIO2 121.9 mmHg @ 760 mmHg (<122 mmHg 1-hr TWA floor; NASA-STD-3001 [V2 6003])
        o2FlammabilityCapPct: 25.9,     // Max O2% above 80 kPa (Intl ECLSS Baseline ECLSS-20)
        citation: 'NASA-STD-3001 Vol 2 [V2 6003]; OCHMO-TB-003; OCHMO-TB-019',
    },
    neuro_ocular: {
        refractiveCautionD: 0.50,       // Mader et al. 2011 lower bound (+0.50 to +2.00 D) / SANS CPG Class 1+
        refractiveCriticalD: 1.50,      // Upper post-mission hyperopic shift range (+0.50 to +2.00 D; OCHMO-MTB-001)
        octEarlyOdeDeltaUm: 19.4,       // Earliest peripapillary ΔTRT sign of ODE (Laurie et al. / OCHMO-MTB-001)
        octLpDeltaUm: 55,               // Post-flight LP threshold with >= Frisen Grade 1 ODE (OCHMO-MTB-001)
        co2Target7dPpm760: 3289,        // <2.5 mmHg ppCO2 @ 760 mmHg (<1% headache probability; OCHMO-TB-004)
        co2Caution1hPpm760: 3947,       // 3.0 mmHg ppCO2 @ 760 mmHg (1-hr limit, <1.4% headache; NASA-STD-3001 [V2 6004])
        citation: 'NASA-STD-3001 Vol 2 [V2 6004]; OCHMO-MTB-001; OCHMO-TB-004',
    },
    musculoskeletal: {
        aredMinSessionsWeek: 4,         // MVP adherence heuristic (no weekly count in STD-3001 excerpt)
        bmdLossCautionPct: 3.0,         // ~2–3 mo cumulative 0g loss at 1.0–1.5%/mo (NASA HRP Bone Evidence Report)
        citation: 'NASA HRP Bone Evidence Report; NASA-STD-3001 Vol 1 Sec 4.7',
    },
    behavioral_circadian: {
        sleepCautionHours: 6.0,         // Chronic <=6.0h degrades vigilance & mood (SLEEP 2022)
        sleepCriticalHours: 5.0,        // <5.0h elevates all negative somatic behavioral states (SLEEP 2022)
        pvtCautionMs: 355,              // 3-min PVT-B lapse threshold used in ISS RST (Basner et al. 2011)
        pvtCriticalMs: 500,             // Standard 10-min PVT lapse threshold (Basner et al. 2011)
        co2SymptomPpm760: 4605,         // 3.5 mmHg ppCO2 @ 760 mmHg: cough, poor sleep, blurred vision, headaches (OCHMO-TB-004)
        co2SeverePpm760: 5921,          // 4.5 mmHg ppCO2 @ 760 mmHg: 5th cranial nerve dysesthesia (OCHMO-TB-004)
        citation: 'Basner et al. 2011 (PVT-B); SLEEP 2022; OCHMO-TB-004; Mars-500 PNAS 2013',
    },
    radiation_immune: {
        doseCautionMsv: 250,            // Reference SPE cap [V1 4031] / 250 mGy-Eq 30d BFO / long-LEO benchmark
        doseCriticalMsv: 600,           // Universal career effective dose PEL (<600 mSv; NASA-STD-3001 [V1 4030])
        wbcMin10e9L: 3.8,               // MVP hematology heuristic (STD-3001 Sec 4.4 values unavailable)
        wbcMax10e9L: 11.5,              // MVP hematology heuristic
        citation: 'NASA-STD-3001 Vol 1 [V1 4030], [V1 4031], [V1 4033], Table 4.8-1',
    },
    cabin_thermal_future: {
        tempComfortMinC: 20,            // Crew Performance comfort range (NASA-STD-3001 [V2 6013])
        tempComfortMaxC: 25,
        tempHealthMinC: 18,             // Crew Health operating limit (NASA-STD-3001 [V2 6012])
        tempHealthMaxC: 27,
        rhComfortMinPct: 30,            // Crew Performance humidity (NASA-STD-3001 [V2 6013])
        rhComfortMaxPct: 60,
        rhHealthMinPct: 25,             // Indefinite exposure envelope (NASA-STD-3001 [V2 6012] & Table 6.2-2)
        rhHealthMaxPct: 75,
        citation: 'NASA-STD-3001 Vol 2 [V2 6012], [V2 6013], Table 6.2-2; OCHMO ECLSS Brief',
    },
} as const;

export const ENV_DRIFT_RATES: Record<MissionEnvironment, {
    radiationMsvPerDay: number;
    radiationDesignCapMsvPerDay: number;
    bmdLossPctPerMonth: string;
    typicalSleepHours: string;
    cephaladFluidAttenuation: string;
}> = {
    LEO_ISS: {
        radiationMsvPerDay: 0.40, // Derived from ~72 mSv / 182d (secondary SMF tool); NASA NTRS range 40–90 mSv / 6–8 mo
        radiationDesignCapMsvPerDay: 1.3,
        bmdLossPctPerMonth: '1.0–1.5%/mo avg (0.71% femoral neck, 0.83% lumbar spine)',
        typicalSleepHours: '6.0–6.5 h/night (6.61h TIB sleeping; 40.0% weekdays <=6h)',
        cephaladFluidAttenuation: 'None (0g baseline; 29% short / 60% long-duration subjective vision degradation)',
    },
    LUNAR_SURFACE: {
        radiationMsvPerDay: 0.50, // Secondary SMF planetary surface planning estimate
        radiationDesignCapMsvPerDay: 0.9,
        bmdLossPctPerMonth: 'Unverified in humans at 1/6g (modeled 0.80x LEO pending longitudinal data)',
        typicalSleepHours: 'Unverified surface ops (expect circadian shifts akin to 15.7% ISS shift rate)',
        cephaladFluidAttenuation: 'Unverified at 1/6g (0.17g < >0.50-Gz parabolic-flight fluid-shift threshold)',
    },
    MARS_TRANSIT: {
        radiationMsvPerDay: 1.50, // Unshielded free-space GCR at 2009 solar min [NASA-STD-3001 Vol 1 Rev C]
        radiationDesignCapMsvPerDay: 1.3,
        bmdLossPctPerMonth: '1.0–1.5%/mo (0g transit unloading; cumulative multi-month risk)',
        typicalSleepHours: '6.95 h/24h corrected mean in Mars-500 520d analog (7.0% active-wake decline)',
        cephaladFluidAttenuation: 'None (prolonged 0g cephalad fluid shift across multi-month cruise)',
    },
};


export function scoreToStatus(score: number | null): TriageStatus {
    if (score === null) return 'nodata';
    if (score >= 75) return 'nominal';
    if (score >= 50) return 'caution';
    return 'critical';
}

function computeAdjustedScore(
    basePenalty: number,
    multiplier: number,
    countermeasures: CountermeasureItem[]
): number {
    const totalReduction = countermeasures
    .filter((cm) => cm.completed)
    .reduce((sum, cm) => sum + cm.penaltyReduction, 0);
    const effectivePenalty = Math.max(0, basePenalty - totalReduction);
    return Math.min(100, Math.max(0, Math.round(100 - effectivePenalty * multiplier)));
}

export function evaluateCrewHealth(
    crew: CrewMember,
    env: CabinEnvironmentState
): { updatedSystems: Record<SystemId, SystemDiagnostic>; overallIndex: number } {
    const activeSeries = crew.telemetryByEnvironment?.[env.environment] ?? crew.telemetryHistory;
    const latest = activeSeries[activeSeries.length - 1];
    const mod = ENV_MODIFIERS[env.environment];
    const completedIds = new Set(crew.completedCountermeasuresByDay?.[env.missionDay] ?? []);

    const buildCm = (
        id: string,
        targetSystem: SystemId,
        label: string,
        penaltyReduction: number
    ): CountermeasureItem => ({
        id,
        label,
        targetSystem,
        penaltyReduction,
        completed: completedIds.has(id),
    });

    // 1. CARDIOVASCULAR (Fluid shift, HRV, HR, O2) — NASA-STD-3001 [V2 6003]; OCHMO-TB-019
    let cvPenalty = 0;
    let cvTrigger = 'Nominal Microgravity Adaptation';
    if (latest.hrvRmssdMs < NASA_CLINICAL_THRESHOLDS.cardiovascular.hrvRmssdCautionMs) {
        cvPenalty += 22;
        cvTrigger = 'Autonomic Reserve Deficit (Heuristic HRV <25 ms; OCHMO-TB-019)';
    }
    if (
        latest.heartRateBpm > NASA_CLINICAL_THRESHOLDS.cardiovascular.hrCautionBpm ||
        latest.systolicBp < NASA_CLINICAL_THRESHOLDS.cardiovascular.sbpCautionMmHg
    ) {
        cvPenalty += 25;
        cvTrigger = 'Orthostatic / Hemodynamic Instability (Heuristic HR >95 / SBP <95; OCHMO-TB-019)';
    }
    if (env.o2Percent < NASA_CLINICAL_THRESHOLDS.cardiovascular.o2CriticalPct760) {
        cvPenalty += 60;
        cvTrigger = 'Environmental Trigger: Critical Cabin Hypoxia (<17.1% O₂ / PIO₂ <122 mmHg; NASA-STD-3001 V2 6003)';
    } else if (env.o2Percent < NASA_CLINICAL_THRESHOLDS.cardiovascular.o2CautionPct760) {
        cvPenalty += 32;
        cvTrigger = 'Environmental Trigger: Mild Cabin Hypoxia (<19.5% O₂ / PIO₂ <139 mmHg, below 145 mmHg normoxia; V2 6003)';
    }
    const cvBaseScore = Math.max(0, Math.round(100 - cvPenalty * mod.cardiovascular));
    const cvCountermeasures: CountermeasureItem[] = cvBaseScore < 75
    ? [
        buildCm('cv-lbnp', 'cardiovascular', 'Execute 20-min LBNP (-10 to -20 mmHg) or gradient compression garment protocol [OCHMO-TB-019]', 15),
        buildCm('cv-cevis', 'cardiovascular', 'Complete CEVIS aerobic interval session + 24–48 oz (710–1420 mL) NaCl-water loading pre-deorbit [OCHMO-TB-019]', 12),
    ]
    : [buildCm('cv-sprint', 'cardiovascular', 'Maintain daily SPRINT aerobic/resistive schedule [OCHMO-TB-019]', 5)];
    const cvScore = computeAdjustedScore(cvPenalty, mod.cardiovascular, cvCountermeasures);

    // 2. NEURO-OCULAR / SANS (ICP, Hyperopic shift, CO2 impact) — OCHMO-MTB-001; NASA-STD-3001 [V2 6004]
    let sansPenalty = 0;
    let sansTrigger = 'Stable Intracranial Fluid Balance';
    if (latest.visualAcuityShiftD >= NASA_CLINICAL_THRESHOLDS.neuro_ocular.refractiveCautionD) {
        sansPenalty += 32;
        sansTrigger = 'SANS Hyperopic Shift (≥+0.50 D; Mader et al. 2011 / OCHMO-MTB-001)';
    }
    if (latest.visualAcuityShiftD >= NASA_CLINICAL_THRESHOLDS.neuro_ocular.refractiveCriticalD) {
        sansPenalty += 28;
        sansTrigger = 'Severe SANS Progression Risk (≥+1.50 D; Mader et al. 2011 / OCHMO-MTB-001)';
    }
    if (env.co2Ppm > NASA_CLINICAL_THRESHOLDS.neuro_ocular.co2Caution1hPpm760) {
        sansPenalty += 26;
        sansTrigger = `Environmental Trigger: Cabin CO₂ >3.0 mmHg (${env.co2Ppm} ppm @ 760 mmHg; NASA-STD-3001 V2 6004)`;
    }
    const sansBaseScore = Math.max(0, Math.round(100 - sansPenalty * mod.neuro_ocular));
    const sansCountermeasures: CountermeasureItem[] = sansBaseScore < 75
    ? [
        buildCm('sans-oct', 'neuro_ocular', 'Perform OCT scan (flag ΔTRT >19.4 µm early ODE; ≥55 µm LP trigger) & Amsler grid [OCHMO-MTB-001]', 10),
        buildCm('sans-co2-lbnp', 'neuro_ocular', 'Verify CO₂ scrubbers (<3289 ppm / <2.5 mmHg 7-day target) & apply -20 mmHg LBNP relief [OCHMO-TB-004]', 18),
    ]
    : [buildCm('sans-screen', 'neuro_ocular', 'Continue weekly visual acuity & OCT retinal screening [OCHMO-MTB-001]', 5)];
    const sansScore = computeAdjustedScore(sansPenalty, mod.neuro_ocular, sansCountermeasures);

    // 3. MUSCULOSKELETAL (BMD loss rate, ARED adherence) — NASA HRP Bone Report (1.0–1.5%/mo in 0g)
    let mskPenalty = 0;
    let mskTrigger = 'Countermeasure Load Balanced';
    if (latest.aredSessionsWeek < NASA_CLINICAL_THRESHOLDS.musculoskeletal.aredMinSessionsWeek) {
        mskPenalty += 22;
        mskTrigger = 'Unloading Deficit: Low ARED/SPRINT Adherence (Operational Heuristic; <4/wk)';
    }
    if (latest.bmdLossPct > NASA_CLINICAL_THRESHOLDS.musculoskeletal.bmdLossCautionPct) {
        mskPenalty += 32;
        mskTrigger = 'Cumulative Bone Resorption (>3.0% BMD Loss; ~2–3 mo @ 1.0–1.5%/mo NASA HRP Rate)';
    }
    const mskBaseScore = Math.max(0, Math.round(100 - mskPenalty * mod.musculoskeletal));
    const mskCountermeasures: CountermeasureItem[] = mskBaseScore < 75
    ? [
        buildCm('msk-ared', 'musculoskeletal', 'Increase ARED squat/deadlift/heel-raise loading to 5–6x/week [NASA HRP Bone Report]', 18),
        buildCm('msk-vitd', 'musculoskeletal', 'Confirm 800 IU/day Vitamin D + Omega-3 intake and hydrate to prevent renal stones', 10),
    ]
    : [buildCm('msk-t2', 'musculoskeletal', 'Maintain current ARED + T2 treadmill harness loading [NASA HRP Bone Report]', 5)];
    const mskScore = computeAdjustedScore(mskPenalty, mod.musculoskeletal, mskCountermeasures);

    // 4. BEHAVIORAL & CIRCADIAN (Sleep debt, PVT-B, CO2) — SLEEP 2022; Basner et al. 2011; OCHMO-TB-004
    let behPenalty = 0;
    let behTrigger = 'Circadian Entrainment Nominal';
    if (latest.sleepHours < NASA_CLINICAL_THRESHOLDS.behavioral_circadian.sleepCriticalHours) {
        behPenalty += 52;
        behTrigger = 'Severe Sleep Deficiency (<5.0h Sleep; Somatic Exhaustion Risk [SLEEP 2022])';
    } else if (latest.sleepHours < NASA_CLINICAL_THRESHOLDS.behavioral_circadian.sleepCautionHours) {
        behPenalty += 26;
        behTrigger = 'Circadian Desynchronization (<6.0h Sleep; Vigilance Deficit [SLEEP 2022])';
    }
    if (latest.pvtReactionMs >= NASA_CLINICAL_THRESHOLDS.behavioral_circadian.pvtCriticalMs) {
        behPenalty += 52;
        behTrigger = 'Severe Neurobehavioral Impairment (PVT ≥500 ms Standard Lapse [Basner et al. 2011])';
    } else if (latest.pvtReactionMs > NASA_CLINICAL_THRESHOLDS.behavioral_circadian.pvtCautionMs) {
        behPenalty += 26;
        behTrigger = 'Neurobehavioral Fatigue (PVT-B >355 ms Lapse Threshold [Basner et al. 2011])';
    }
    if (env.co2Ppm >= NASA_CLINICAL_THRESHOLDS.behavioral_circadian.co2SeverePpm760) {
        behPenalty += 52;
        behTrigger = `Environmental Trigger: Severe Hypercapnia ≥4.5 mmHg (${env.co2Ppm} ppm @ 760 mmHg; OCHMO-TB-004)`;
    } else if (env.co2Ppm >= NASA_CLINICAL_THRESHOLDS.behavioral_circadian.co2SymptomPpm760) {
        behPenalty += 26;
        behTrigger = `Environmental Trigger: Hypercapnic Symptoms ≥3.5 mmHg (${env.co2Ppm} ppm @ 760 mmHg; OCHMO-TB-004)`;
    }
    const behBaseScore = Math.max(0, Math.round(100 - behPenalty * mod.behavioral_circadian));
    const behCountermeasures: CountermeasureItem[] = behBaseScore < 75
    ? [
        buildCm('beh-led', 'behavioral_circadian', 'Shift cabin LED lighting to red-shifted spectrum 2h pre-sleep; blue-enriched on wake [Mars-500 / ISS]', 15),
        buildCm('beh-vr', 'behavioral_circadian', 'Complete 10-min VR natural scene relaxation or private audio journal', 12),
    ]
    : [buildCm('beh-sleep', 'behavioral_circadian', 'Maintain scheduled 8h sleep opportunity (>8h reduces fatigue [SLEEP 2022])', 5)];
    const behScore = computeAdjustedScore(behPenalty, mod.behavioral_circadian, behCountermeasures);

    // 5. RADIATION & IMMUNE (Dosimetry, DONKI/NOAA SPE, WBC) — NASA-STD-3001 [V1 4030/4031/4033]
    let radPenalty = 0;
    let radTrigger = 'Background GCR Within Mission Limits [NASA-STD-3001 V1 4033]';
    if (latest.cumulativeDoseMsv >= NASA_CLINICAL_THRESHOLDS.radiation_immune.doseCriticalMsv) {
        radPenalty += 68;
        radTrigger = 'Career Radiation PEL Exceeded (≥600 mSv; NASA-STD-3001 V1 4030)';
    } else if (latest.cumulativeDoseMsv >= NASA_CLINICAL_THRESHOLDS.radiation_immune.doseCautionMsv) {
        radPenalty += 35;
        radTrigger = 'Elevated Cumulative Exposure (≥250 mSv SPE / Long-LEO Benchmark; NASA-STD-3001 V1 4031)';
    }
    if (env.solarStormLevel === 'MINOR_FLR') {
        radPenalty += 15;
        radTrigger = 'Space Weather Trigger: Active Solar Flare (FLR) — Monitor GCR/SPE Flux [V1 4033]';
    }
    if (env.solarStormLevel === 'MAJOR_SPE_CME') {
        radPenalty += 40;
        radTrigger = 'Space Weather Trigger: Major SPE/CME — Enforce <250 mSv Limit [NASA-STD-3001 V1 4031]';
    }
    if (
        latest.wbcCount10e9L < NASA_CLINICAL_THRESHOLDS.radiation_immune.wbcMin10e9L ||
        latest.wbcCount10e9L > NASA_CLINICAL_THRESHOLDS.radiation_immune.wbcMax10e9L
    ) {
        radPenalty += 25;
        radTrigger = 'Immune Dysregulation / Abnormal Fingerstick WBC (3.8–11.5 Heuristic; STD-3001 Sec 4.4)';
    }
    const radBaseScore = Math.max(0, Math.round(100 - radPenalty * mod.radiation_immune));
    const radCountermeasures: CountermeasureItem[] = radBaseScore < 75
    ? [
        buildCm('rad-shelter', 'radiation_immune', 'Relocate to high-density polyethylene / water-wall storm shelter (<250 mSv SPE limit [V1 4031])', 25),
        buildCm('rad-hemocue', 'radiation_immune', 'Run HemoCue fingerstick WBC check and prioritize antioxidant-rich rations', 12),
    ]
    : [buildCm('rad-dosimeter', 'radiation_immune', 'Continue passive dosimeter logging (<1.3 mSv/d free-space / <0.9 mSv/d surface [V1 4033])', 5)];
    const radScore = computeAdjustedScore(radPenalty, mod.radiation_immune, radCountermeasures);

    const updatedSystems: Record<SystemId, SystemDiagnostic> = {
        cardiovascular: {
            systemId: 'cardiovascular',
            score: cvScore,
            status: scoreToStatus(cvScore),
            primaryTrigger: cvTrigger,
            clinicalSummary: cvScore < 75 ? 'Reduced venous return and autonomic reserve detected.' : 'Cardiac output and vascular tone within mission baseline.',
            countermeasures: cvCountermeasures,
            lastUpdatedDay: env.missionDay,
        },
        neuro_ocular: {
            systemId: 'neuro_ocular',
            score: sansScore,
            status: scoreToStatus(sansScore),
            primaryTrigger: sansTrigger,
            clinicalSummary: sansScore < 75 ? 'Hyperopic shift / elevated intracranial pressure markers present.' : 'Optic nerve head and visual acuity stable.',
            countermeasures: sansCountermeasures,
            lastUpdatedDay: env.missionDay,
        },
        musculoskeletal: {
            systemId: 'musculoskeletal',
            score: mskScore,
            status: scoreToStatus(mskScore),
            primaryTrigger: mskTrigger,
            clinicalSummary: mskScore < 75 ? 'Accelerated lower-limb/lumbar unloading detected.' : 'Bone turnover and postural muscle strength preserved.',
            countermeasures: mskCountermeasures,
            lastUpdatedDay: env.missionDay,
        },
        behavioral_circadian: {
            systemId: 'behavioral_circadian',
            score: behScore,
            status: scoreToStatus(behScore),
            primaryTrigger: behTrigger,
            clinicalSummary: behScore < 75 ? 'Sleep fragmentation and slowed psychomotor vigilance detected.' : 'Cognitive reaction speed and circadian rhythm aligned.',
            countermeasures: behCountermeasures,
            lastUpdatedDay: env.missionDay,
        },
        radiation_immune: {
            systemId: 'radiation_immune',
            score: radScore,
            status: scoreToStatus(radScore),
            primaryTrigger: radTrigger,
            clinicalSummary: radScore < 75 ? 'Elevated ionizing radiation flux or leukocyte shift.' : 'Dosimetry and cell-mediated immunity nominal.',
            countermeasures: radCountermeasures,
            lastUpdatedDay: env.missionDay,
        },
    };
    const scores = Object.values(updatedSystems)
    .map((s) => s.score)
    .filter((s): s is number => s !== null);
    const overallIndex = scores.length
    ? Math.round(scores.reduce((acc, v) => acc + v, 0) / scores.length)
    : 100;

    return { updatedSystems, overallIndex };
}
