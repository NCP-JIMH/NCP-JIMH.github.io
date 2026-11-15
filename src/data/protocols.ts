import type { AssessmentProtocol } from '../types/medical';

export const ASSESSMENT_PROTOCOLS: AssessmentProtocol[] = [
    {
        id: 'proto-sans-oct',
        title: 'SANS Ocular & MiniOCT Retinal Assessment',
        targetSystem: 'neuro_ocular',
        urgencyRank: 1,
        requiresCMO: true,
        hardwareNeeded: 'MiniOCT + Near-Vision Chart + Amsler Grid',
        estimatedMinutes: 8,
        steps: [
            {
                stepNumber: 1,
                instruction:
                'Occlude left eye and read the handheld near-vision acuity card at 40 cm under cabin task lighting; repeat for right eye.',
                visualCue: 'Record worst-eye hyperopic refractive shift in diopters (+D) relative to pre-flight baseline.',
            },
            {
                stepNumber: 2,
                instruction:
                'Fixate on the central dot of the Amsler grid at 35 cm and note any wavy, blurred, or missing grid lines.',
                visualCue: 'Central scotoma or metamorphopsia indicates choroidal folds or optic disc edema.',
            },
            {
                stepNumber: 3,
                instruction:
                'Align the MiniOCT forehead rest, capture peripapillary RNFL B-scans for both eyes, and verify signal strength >= 7/10.',
                visualCue: 'Inspect optic nerve head contour for posterior globe flattening or retinal nerve fiber thickening.',
            },
        ],
        inputs: [
            {
                key: 'visualAcuityShiftD',
                label: 'Hyperopic Refractive Shift (Worst Eye)',
                type: 'number',
                unit: 'D',
            },
        ],
    },
{
    id: 'proto-rad-hemocue',
    title: 'Radiation Dosimetry & HemoCue Fingerstick WBC',
    targetSystem: 'radiation_immune',
    urgencyRank: 2,
    requiresCMO: true,
    hardwareNeeded: 'RadLab Active Dosimeter + HemoCue WBC Diff',
    estimatedMinutes: 6,
    steps: [
        {
            stepNumber: 1,
            instruction:
            'Dock personal RadLab dosimeter to telemetry cradle and record cumulative mission absorbed dose.',
            visualCue: 'Verify shielded vs. unshielded detector channel agreement before logging.',
        },
        {
            stepNumber: 2,
            instruction:
            'Cleanse ring finger with alcohol wipe, perform capillary lancet puncture, and wick second blood drop into HemoCue microcuvette.',
            visualCue: 'Ensure microcuvette optical window is free of air bubbles prior to analyzer insertion.',
        },
        {
            stepNumber: 3,
            instruction:
            'Insert microcuvette into HemoCue WBC analyzer and wait 3 minutes for automated total leukocyte readout.',
            visualCue: 'Dispose of sharps and biohazard cuvette in designated containment pouch.',
        },
    ],
    inputs: [
        {
            key: 'wbcCount10e9L',
            label: 'Total Leukocyte (WBC) Count',
            type: 'number',
            unit: '10⁹/L',
        },
        {
            key: 'cumulativeDoseMsv',
            label: 'Cumulative Mission Radiation Dose',
            type: 'number',
            unit: 'mSv',
        },
    ],
},
{
    id: 'proto-cv-autonomic',
    title: 'Cardiovascular & Autonomic Reserve Check',
    targetSystem: 'cardiovascular',
    urgencyRank: 3,
    requiresCMO: false,
    hardwareNeeded: 'EveryWear Chest/Wrist Sensor + Automated BP Cuff',
    estimatedMinutes: 5,
    steps: [
        {
            stepNumber: 1,
            instruction:
            'Rest quietly in neutral free-floating or supine posture for 3 minutes with paced breathing (6 breaths/min).',
            visualCue: 'Confirm green ECG/PPG contact waveform on biometric wrist display.',
        },
        {
            stepNumber: 2,
            instruction:
            'Capture 2-minute beat-to-beat RR interval window to compute resting heart rate and HRV (RMSSD).',
            visualCue: 'Avoid talking or upper-body isometric tension during the 120-second capture.',
        },
        {
            stepNumber: 3,
            instruction:
            'Position brachial cuff at heart level and trigger automated oscillometric systolic blood pressure reading.',
            visualCue: 'Log resting HR, systolic BP, and RMSSD immediately upon cuff deflation.',
        },
    ],
    inputs: [
        {
            key: 'heartRateBpm',
            label: 'Resting Heart Rate',
            type: 'number',
            unit: 'bpm',
        },
        {
            key: 'systolicBp',
            label: 'Resting Systolic Blood Pressure',
            type: 'number',
            unit: 'mmHg',
        },
        {
            key: 'hrvRmssdMs',
            label: 'Autonomic HRV (RMSSD)',
            type: 'number',
            unit: 'ms',
        },
    ],
},
{
    id: 'proto-beh-pvt',
    title: '3-Min PVT-B Neurobehavioral & Sleep Audit',
    targetSystem: 'behavioral_circadian',
    urgencyRank: 4,
    requiresCMO: false,
    hardwareNeeded: 'None (Guided Self-Exam + Actiwatch Sync)',
    estimatedMinutes: 4,
    steps: [
        {
            stepNumber: 1,
            instruction:
            'Sync wrist actigraphy log from the past 24-hour sleep period and verify total consolidated sleep duration.',
            visualCue: 'Exclude awake in-bed restlessness intervals flagged by actigraphy.',
        },
        {
            stepNumber: 2,
            instruction:
            'Perform the 3-minute Psychomotor Vigilance Test (PVT-B) in a quiet crew quarter using thumb response button.',
            visualCue: 'Respond as rapidly as possible to millisecond counter onset without false starts.',
        },
    ],
    inputs: [
        {
            key: 'sleepHours',
            label: 'Consolidated Sleep Duration (Last 24h)',
            type: 'number',
            unit: 'hrs',
        },
        {
            key: 'pvtReactionMs',
            label: 'Mean PVT-B Reaction Time',
            type: 'number',
            unit: 'ms',
        },
    ],
},
{
    id: 'proto-msk-ared',
    title: 'ARED Resistive Load & Bone Unloading Review',
    targetSystem: 'musculoskeletal',
    urgencyRank: 5,
    requiresCMO: false,
    hardwareNeeded: 'ARED Exercise Telemetry Log + Ultrasound Densitometer',
    estimatedMinutes: 5,
    steps: [
        {
            stepNumber: 1,
            instruction:
            'Review trailing 7-day Advanced Resistive Exercise Device (ARED) squat, deadlift, and heel-raise session count.',
            visualCue: 'Only sessions completing >= 80% prescribed axial load sets count toward weekly adherence.',
        },
        {
            stepNumber: 2,
            instruction:
            'Perform calcaneal quantitative ultrasound or model-estimated cumulative bone mineral density delta.',
            visualCue: 'Compare current cumulative BMD loss % against pre-flight DXA reference.',
        },
    ],
    inputs: [
        {
            key: 'aredSessionsWeek',
            label: 'Completed ARED Sessions (Past 7 Days)',
            type: 'select',
            options: [
                { label: '0 sessions / wk', value: 0 },
                { label: '1 session / wk', value: 1 },
                { label: '2 sessions / wk', value: 2 },
                { label: '3 sessions / wk', value: 3 },
                { label: '4 sessions / wk', value: 4 },
                { label: '5 sessions / wk', value: 5 },
                { label: '6 sessions / wk', value: 6 },
                { label: '7 sessions / wk', value: 7 },
            ],
        },
        {
            key: 'bmdLossPct',
            label: 'Cumulative BMD Loss',
            type: 'number',
            unit: '%',
        },
    ],
},
{
    id: 'proto-cmo-contingency-triage',
    title: 'Contingency Multi-System Acute Vitals & Radiation Triage',
    targetSystem: 'radiation_immune',
    urgencyRank: 6,
    requiresCMO: true,
    hardwareNeeded: 'Portable Vital Signs Monitor + Pocket Dosimeter',
    estimatedMinutes: 7,
    steps: [
        {
            stepNumber: 1,
            instruction:
            'Activate autonomous contingency mode if CMO is incapacitated and attach 3-lead ECG/SpO2 sensor.',
            visualCue: 'Ensure audio voice prompts are enabled on crew medical tablet.',
        },
        {
            stepNumber: 2,
            instruction:
            'Capture resting heart rate, systolic pressure, and pocket dosimeter cumulative mSv reading.',
            visualCue: 'Transmit snapshot directly to Fleet Triage Matrix and Flight Surgeon downlink.',
        },
    ],
    inputs: [
        {
            key: 'heartRateBpm',
            label: 'Heart Rate',
            type: 'number',
            unit: 'bpm',
        },
        {
            key: 'systolicBp',
            label: 'Systolic BP',
            type: 'number',
            unit: 'mmHg',
        },
        {
            key: 'cumulativeDoseMsv',
            label: 'Cumulative Dose',
            type: 'number',
            unit: 'mSv',
        },
    ],
},
];

export default ASSESSMENT_PROTOCOLS;
