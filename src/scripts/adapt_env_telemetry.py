#!/usr/bin/env python3
"""
Stage 2 ETL Pipeline: scripts/adapt_env_telemetry.py -> src/data/envTelemetry.json

Transforms the healthy 1G terrestrial baseline (src/data/baseTelemetry.json) into 3 distinct
30-day spaceflight trajectories (LEO_ISS, LUNAR_SURFACE, MARS_TRANSIT) calibrated strictly
to the validated NASA rates, modifiers, and clinical cutoffs in:
  - NASA Spaceflight Clinical Threshold Validation.pdf
  - src/utils/riskEngine.ts (NASA_CLINICAL_THRESHOLDS, ENV_DRIFT_RATES, ENV_MODIFIERS, evaluateCrewHealth)

Spaceflight CMP Transition (NASA OSDR OSD-575):
  - Interpolates longitudinal SpaceX Inspiration4 blood serum draws from pre-flight L-3 (Day 1)
    through landing R+1 (Day 15) to recovery R+45 (Day 30) via numpy.interp, scaled by each
    environment's gravity/unloading regime (LEO_ISS: 1.0x, LUNAR_SURFACE: 0.85x partial-G,
    MARS_TRANSIT: 1.20x prolonged 0g).
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from scipy.special import expit


ENVIRONMENTS: List[str] = ["LEO_ISS", "LUNAR_SURFACE", "MARS_TRANSIT"]

# Exact ENV_MODIFIERS from NASA Spaceflight Clinical Threshold Validation.pdf / src/utils/riskEngine.ts
ENV_MODIFIERS: Dict[str, Dict[str, float]] = {
    "LEO_ISS": {
        "cardiovascular": 1.00,       # 0g baseline plasma volume & autonomic shift [OCHMO-TB-019]
        "neuro_ocular": 1.00,         # 0g cephalad fluid shift [OCHMO-MTB-001]
        "musculoskeletal": 1.00,      # 0g unloading: 1.0-1.5%/mo BMD loss [NASA HRP Bone Report]
        "behavioral_circadian": 1.00, # 6.0-6.5h ISS sleep [SLEEP 2022]; +39 ms RT slowing [PMC10063900]
        "radiation_immune": 0.75,     # Geomagnetic protection (~0.40 mSv/d vs <1.3 mSv/d cap [V1 4033])
    },
    "LUNAR_SURFACE": {
        "cardiovascular": 0.85,       # Partial-G hemodynamic shift: -4 bpm HR, -10 to -15 mmHg MAP [PMC7399573]
        "neuro_ocular": 0.85,         # Operational partial-G model (1/6g < >0.50-Gz parabolic threshold [PMC7399573])
        "musculoskeletal": 0.80,      # Operational 0.80x partial-loading model (human 1/6g longitudinal BMD unverified)
        "behavioral_circadian": 1.15, # Surface circadian shift ops (akin to 15.7% ISS shift rate [SLEEP 2022])
        "radiation_immune": 1.25,     # Outside magnetosphere (~0.50 mSv/d est vs <0.9 mSv/d surface cap [V1 4033])
    },
    "MARS_TRANSIT": {
        "cardiovascular": 1.20,       # Prolonged multi-month 0g plasma-volume & orthostatic deconditioning [OCHMO-TB-019]
        "neuro_ocular": 1.25,         # Prolonged 0g venous/CSF cephalad congestion [OCHMO-MTB-001; Brain & SANS Team]
        "musculoskeletal": 1.25,      # Multi-month 0g unloading (1.0-1.5%/mo cumulative risk [NASA HRP Bone Report])
        "behavioral_circadian": 1.35, # Confinement & up to 20-min comms delay (Mars-500: 7.0% active-wake decline [PNAS 2013])
        "radiation_immune": 1.45,     # Deep-space GCR (1.50 mSv/d > 1.3 mSv/d cap [V1 4033]) + unshielded SPE [V1 4030/4031]
    },
}

# Exact ENV_DRIFT_RATES from NASA Spaceflight Clinical Threshold Validation.pdf / src/utils/riskEngine.ts
ENV_DRIFT_RATES: Dict[str, Dict[str, Any]] = {
    "LEO_ISS": {
        "radiationMsvPerDay": 0.40,         # ~72 mSv / 182d SMF tool; NASA NTRS 40-90 mSv / 6-8 mo (< 1.3 mSv/d [V1 4033])
        "radiationDesignCapMsvPerDay": 1.3, # NASA-STD-3001 Vol 1 Rev C [V1 4033] free-space habitat design cap
        "bmdLossMultiplier": 1.00,          # 1.0-1.5%/mo avg (0.71%/mo femoral neck, 0.83%/mo lumbar spine; NASA HRP)
        "sansShiftMultiplier": 1.00,        # 0g baseline (29% short / 60% long-duration subjective vision degradation; OCHMO-MTB-001)
        "sleepTargetHours": 6.25,           # 6.0-6.5 h/night ISS avg (6.61h TIB sleeping; SLEEP 2022 / Barger NTRS)
        "rtSlowingMs": 39.0,                # +39 ms consistent mean single-task RT slowing during ISS flight [PMC10063900]
    },
    "LUNAR_SURFACE": {
        "radiationMsvPerDay": 0.50,         # Secondary SMF planetary surface planning estimate (< 0.9 mSv/d [V1 4033])
        "radiationDesignCapMsvPerDay": 0.9, # NASA-STD-3001 Vol 1 Rev C [V1 4033] planetary surface design cap
        "bmdLossMultiplier": 0.80,          # Unverified in humans at 1/6g (modeled 0.80x LEO pending longitudinal data)
        "sansShiftMultiplier": 0.85,        # Operational 0.85x model (unverified at 1/6g; 0.17g < >0.50-Gz threshold [PMC7399573])
        "sleepTargetHours": 6.45,           # Operational surface ops circadian shift model (15.7% ISS shift rate [SLEEP 2022])
        "rtSlowingMs": 28.0,                # Partial-G operational cognitive load offset
    },
    "MARS_TRANSIT": {
        "radiationMsvPerDay": 1.50,         # Unshielded free-space GCR at 2009 solar min [NASA-STD-3001 Vol 1 Rev C] (> 1.3 cap)
        "radiationDesignCapMsvPerDay": 1.3, # Exceeds < 1.3 mSv/d [V1 4033] free-space cap (870-1,200 mSv full mission; Simonsen NTRS)
        "bmdLossMultiplier": 1.25,          # 1.0-1.5%/mo 0g transit unloading scaled by 1.25x multi-month cruise factor
        "sansShiftMultiplier": 1.25,        # Prolonged 0g cephalad fluid shift across multi-month cruise [OCHMO-MTB-001]
        "sleepTargetHours": 6.95,           # 6.95 h/24h corrected mean in Mars-500 520d analog (7.0% active-wake decline; PNAS 2013)
        "rtSlowingMs": 45.0,                # Prolonged confinement + 7.0% active-wake decline RT offset [Mars-500 PNAS 2013]
    },
}

# Exact NASA_CLINICAL_THRESHOLDS from NASA Spaceflight Clinical Threshold Validation.pdf / src/utils/riskEngine.ts
NASA_CLINICAL_THRESHOLDS: Dict[str, Dict[str, float]] = {
    "cardiovascular": {
        "hrvRmssdCautionMs": 25.0,  # MVP heuristic (no STD-3001 RMSSD cutoff; stand-test uses PHI/PTOT [PMC420472])
        "hrCautionBpm": 95.0,       # MVP heuristic (stand-test presyncope: HR drop >15 bpm [OCHMO-TB-019])
        "sbpCautionMmHg": 95.0,     # MVP heuristic (stand-test presyncope: SBP drop >25 mmHg/min [OCHMO-TB-019])
        "o2CautionPct760": 19.5,    # PIO2 139.0 mmHg @ 760 mmHg (<145-155 mmHg normoxia; NASA-STD-3001 [V2 6003])
        "o2CriticalPct760": 17.1,   # PIO2 121.9 mmHg @ 760 mmHg (<122 mmHg 1-hr TWA floor; NASA-STD-3001 [V2 6003])
    },
    "neuro_ocular": {
        "refractiveCautionD": 0.50, # Mader et al. 2011 lower bound (+0.50 to +2.00 D) / SANS CPG Class 1+ [OCHMO-MTB-001]
        "refractiveCriticalD": 1.50,# Upper post-mission hyperopic shift range (+0.50 to +2.00 D; OCHMO-MTB-001)
        "co2Caution1hPpm760": 3947.0,# 3.0 mmHg ppCO2 @ 760 mmHg (1-hr limit, <1.4% headache; NASA-STD-3001 [V2 6004])
    },
    "musculoskeletal": {
        "aredMinSessionsWeek": 4.0, # MVP adherence heuristic (no weekly count in STD-3001 excerpt)
        "bmdLossCautionPct": 3.0,   # ~2-3 mo cumulative 0g loss at 1.0-1.5%/mo [NASA HRP Bone Evidence Report]
    },
    "behavioral_circadian": {
        "sleepCautionHours": 6.0,   # Chronic <=6.0h degrades vigilant attention & mood [SLEEP 2022 zsac006]
        "sleepCriticalHours": 5.0,  # <5.0h statistically elevates all negative somatic behavioral states [SLEEP 2022]
        "pvtCautionMs": 355.0,      # 3-min PVT-B lapse threshold used in ISS Reaction Self-Test [Basner et al. 2011]
        "pvtCriticalMs": 500.0,     # Standard 10-min PVT lapse threshold [Basner et al. 2011]
        "co2SymptomPpm760": 4605.0, # 3.5 mmHg ppCO2 @ 760 mmHg: cough, poor sleep, blurred vision, headaches [OCHMO-TB-004]
        "co2SeverePpm760": 5921.0,  # 4.5 mmHg ppCO2 @ 760 mmHg: 5th cranial nerve dysesthesia [OCHMO-TB-004]
    },
    "radiation_immune": {
        "doseCautionMsv": 250.0,    # Reference SPE cap [V1 4031] / 250 mGy-Eq 30d BFO / long-LEO benchmark [NASA-STD-3001]
        "doseCriticalMsv": 600.0,   # Universal career effective dose PEL (<600 mSv all ages/sexes; NASA-STD-3001 [V1 4030])
        "wbcMin10e9L": 3.8,         # MVP hematology heuristic (STD-3001 Sec 4.4 numeric ranges unavailable)
        "wbcMax10e9L": 11.5,        # MVP hematology heuristic [NASA-STD-3001 Sec 4.4]
    },
}

CREW_METADATA: Dict[str, Dict[str, str]] = {
    "crew-1": {"osd_subject": "C001", "name": "Cmdr. Elena Vance", "phenotype": "High Adherence / Resilient"},
    "crew-2": {"osd_subject": "C002", "name": "Maj. Marcus Chen", "phenotype": "Ocular / Autonomic Susceptibility"},
    "crew-3": {"osd_subject": "C003", "name": "Dr. Aris Thorne", "phenotype": "Unloading / Musculoskeletal Deficit"},
    "crew-4": {"osd_subject": "C004", "name": "Dr. Maya Lin (CMO)", "phenotype": "Multi-System Deconditioning + Deep-Space"},
}

CMP_COLUMN_MAP: Dict[str, str] = {
    "sodiumMmolL": "sodium_value_millimol_per_liter",
    "potassiumMmolL": "potassium_value_millimol_per_liter",
    "creatinineMgDl": "creatinine_value_milligram_per_deciliter",
    "bunMgDl": "urea_nitrogen_bun_value_milligram_per_deciliter",
    "calciumMgDl": "calcium_value_milligram_per_deciliter",
    "glucoseMgDl": "glucose_value_milligram_per_deciliter",
}


def resolve_repo_root() -> Path:
    """Resolve repository root whether executed from project root or scripts/."""
    here = Path(__file__).resolve().parent
    if here.name == "scripts":
        return here.parent
    return Path.cwd()


def find_osd575_csv(repo_root: Path) -> Path:
    """Locate LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv across standard paths."""
    candidates = [
        repo_root / "raw_data" / "osd_575" / "LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv",
        repo_root / "data" / "LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv",
        repo_root / "LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv",
        Path("LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv"),
    ]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("Could not locate LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv")


def load_spaceflight_cmp_series(csv_path: Path, mission_days: np.ndarray) -> Dict[str, Dict[str, np.ndarray]]:
    """
    Stage 2 Spaceflight Adaptation CMP Interpolation (NASA OSDR OSD-575):
      Transitions from pre-flight L-3 (Day 1) through landing R+1 (Day 15) to recovery R+45 (Day 30)
      via np.interp to capture real spaceflight electrolyte, hydration, and renal shifts.
    """
    df = pd.read_csv(csv_path)
    extracted = df["Sample Name"].str.extract(r"^(C\d+)_serum_(.+)$")
    df["subject"] = extracted[0]
    df["timepoint"] = extracted[1]

    anchor_days = np.array([1.0, 15.0, 30.0], dtype=float)
    anchor_timepoints = ["L-3", "R+1", "R+45"]

    cmp_by_crew: Dict[str, Dict[str, np.ndarray]] = {}
    for crew_id, meta in CREW_METADATA.items():
        subj = meta["osd_subject"]
        sub_df = df[df["subject"] == subj].set_index("timepoint")
        crew_cmp: Dict[str, np.ndarray] = {}
        for out_key, csv_col in CMP_COLUMN_MAP.items():
            anchor_vals = np.array([float(sub_df.loc[tp, csv_col]) for tp in anchor_timepoints], dtype=float)
            crew_cmp[out_key] = np.interp(mission_days, anchor_days, anchor_vals)
        cmp_by_crew[crew_id] = crew_cmp

    return cmp_by_crew


def score_to_status(score: Optional[int]) -> str:
    """Exact replica of scoreToStatus() in src/utils/riskEngine.ts."""
    if score is None:
        return "nodata"
    if score >= 75:
        return "nominal"
    if score >= 50:
        return "caution"
    return "critical"


def evaluate_crew_health(
    latest: Dict[str, Any],
    environment: str,
    co2_ppm: float = 2200.0,
    o2_percent: float = 20.9,
    solar_storm_level: str = "NONE",
) -> Dict[str, Any]:
    """
    Exact Python port of evaluateCrewHealth() from src/utils/riskEngine.ts,
    implementing every validated threshold and penalty multiplier in
    NASA Spaceflight Clinical Threshold Validation.pdf.
    """
    mod = ENV_MODIFIERS[environment]
    t_cv = NASA_CLINICAL_THRESHOLDS["cardiovascular"]
    t_no = NASA_CLINICAL_THRESHOLDS["neuro_ocular"]
    t_ms = NASA_CLINICAL_THRESHOLDS["musculoskeletal"]
    t_bc = NASA_CLINICAL_THRESHOLDS["behavioral_circadian"]
    t_ri = NASA_CLINICAL_THRESHOLDS["radiation_immune"]

    # 1. CARDIOVASCULAR — NASA-STD-3001 [V2 6003]; OCHMO-TB-019
    cv_penalty = 0
    if latest["hrvRmssdMs"] < t_cv["hrvRmssdCautionMs"]:
        cv_penalty += 22
    if latest["heartRateBpm"] > t_cv["hrCautionBpm"] or latest["systolicBp"] < t_cv["sbpCautionMmHg"]:
        cv_penalty += 25
    if o2_percent < t_cv["o2CriticalPct760"]:
        cv_penalty += 60
    elif o2_percent < t_cv["o2CautionPct760"]:
        cv_penalty += 32
    cv_score = min(100, max(0, round(100 - cv_penalty * mod["cardiovascular"])))

    # 2. NEURO-OCULAR / SANS — OCHMO-MTB-001; Mader et al. 2011; NASA-STD-3001 [V2 6004]
    sans_penalty = 0
    if latest["visualAcuityShiftD"] >= t_no["refractiveCautionD"]:
        sans_penalty += 32
    if latest["visualAcuityShiftD"] >= t_no["refractiveCriticalD"]:
        sans_penalty += 28
    if co2_ppm > t_no["co2Caution1hPpm760"]:
        sans_penalty += 26
    sans_score = min(100, max(0, round(100 - sans_penalty * mod["neuro_ocular"])))

    # 3. MUSCULOSKELETAL — NASA HRP Bone Evidence Report (1.0-1.5%/mo in 0g); STD-3001 Vol 1 Sec 4.7
    msk_penalty = 0
    if latest["aredSessionsWeek"] < t_ms["aredMinSessionsWeek"]:
        msk_penalty += 22
    if latest["bmdLossPct"] > t_ms["bmdLossCautionPct"]:
        msk_penalty += 32
    msk_score = min(100, max(0, round(100 - msk_penalty * mod["musculoskeletal"])))

    # 4. BEHAVIORAL & CIRCADIAN — SLEEP 2022; Basner et al. 2011; OCHMO-TB-004
    beh_penalty = 0
    if latest["sleepHours"] < t_bc["sleepCriticalHours"]:
        beh_penalty += 52
    elif latest["sleepHours"] < t_bc["sleepCautionHours"]:
        beh_penalty += 26
    if latest["pvtReactionMs"] >= t_bc["pvtCriticalMs"]:
        beh_penalty += 52
    elif latest["pvtReactionMs"] > t_bc["pvtCautionMs"]:
        beh_penalty += 26
    if co2_ppm >= t_bc["co2SeverePpm760"]:
        beh_penalty += 52
    elif co2_ppm >= t_bc["co2SymptomPpm760"]:
        beh_penalty += 26
    beh_score = min(100, max(0, round(100 - beh_penalty * mod["behavioral_circadian"])))

    # 5. RADIATION & IMMUNE — NASA-STD-3001 [V1 4030], [V1 4031], [V1 4033], Sec 4.4
    rad_penalty = 0
    if latest["cumulativeDoseMsv"] >= t_ri["doseCriticalMsv"]:
        rad_penalty += 68
    elif latest["cumulativeDoseMsv"] >= t_ri["doseCautionMsv"]:
        rad_penalty += 35
    if solar_storm_level == "MINOR_FLR":
        rad_penalty += 15
    if solar_storm_level == "MAJOR_SPE_CME":
        rad_penalty += 40
    if latest["wbcCount10e9L"] < t_ri["wbcMin10e9L"] or latest["wbcCount10e9L"] > t_ri["wbcMax10e9L"]:
        rad_penalty += 25
    rad_score = min(100, max(0, round(100 - rad_penalty * mod["radiation_immune"])))

    systems = {
        "cardiovascular": {"score": cv_score, "status": score_to_status(cv_score)},
        "neuro_ocular": {"score": sans_score, "status": score_to_status(sans_score)},
        "musculoskeletal": {"score": msk_score, "status": score_to_status(msk_score)},
        "behavioral_circadian": {"score": beh_score, "status": score_to_status(beh_score)},
        "radiation_immune": {"score": rad_score, "status": score_to_status(rad_score)},
    }
    overall_index = round(sum(s["score"] for s in systems.values()) / 5.0)
    return {"systems": systems, "overallIndex": overall_index}


def build_crew_environment_trajectory(
    crew_id: str,
    env: str,
    base_series: List[Dict[str, Any]],
    flight_cmp: Dict[str, np.ndarray],
) -> List[Dict[str, Any]]:
    """
    Transform a crew member's 30-day healthy 1G baseline into a 30-day spaceflight
    trajectory for LEO_ISS, LUNAR_SURFACE, or MARS_TRANSIT.
    """
    rates = ENV_DRIFT_RATES[env]
    bmd_mult = rates["bmdLossMultiplier"]     # 1.00 LEO, 0.80 Lunar (unverified 1/6g), 1.25 Mars
    sans_mult = rates["sansShiftMultiplier"]  # 1.00 LEO, 0.85 Lunar (1/6g < 0.50-Gz [PMC7399573]), 1.25 Mars
    rad_rate = rates["radiationMsvPerDay"]    # 0.40 LEO, 0.50 Lunar, 1.50 Mars [V1 4033]

    # Base 30-day 0g BMD resorption rate by ARED adherence (NASA HRP Bone Evidence Report: 1.0-1.5%/mo in 0g;
    # high ARED 6x/wk attenuates resorption below 1%/mo; low adherence 2-3x/wk accelerates trabecular loss >3%)
    base_leo_bmd_30d = {
        "crew-1": 0.72,  # 6 ARED sessions/wk -> preserved bone density (<= 3.0%)
        "crew-2": 1.25,  # 4 ARED sessions/wk -> nominal 1.0-1.5%/mo NASA HRP rate (<= 3.0%)
        "crew-3": 3.15,  # 3 ARED sessions/wk -> unloading deficit > 3.0% Caution in LEO, 3.94% in Mars, 2.52% in Lunar
        "crew-4": 3.45,  # 2 ARED sessions/wk -> unloading deficit > 3.0% Caution in LEO, 4.31% in Mars, 2.76% in Lunar
    }[crew_id]

    # Base 30-day 0g SANS refractive shift (Mader et al. 2011: +0.50 D Caution, +1.50 D Critical; OCHMO-MTB-001)
    base_leo_sans_30d = {
        "crew-1": 0.15,  # Resistant (< +0.50 D across all environments)
        "crew-2": 0.56,  # Ocular susceptibility: +0.56 D in LEO (Caution), +0.48 D in Lunar via 0.85x (Nominal), +1.05 D in Mars (Caution)
        "crew-3": 0.22,  # Subclinical fluid shift (< +0.50 D across all environments)
        "crew-4": 0.55,  # Multi-system deconditioning: +0.55 D in LEO (Caution), +0.47 D in Lunar via 0.85x (Nominal), +1.65 D in Mars (>= +1.50 D Critical)
    }[crew_id]

    # CMP gravity-shift scaling factor relative to Inspiration4 (LEO) trajectory
    cmp_env_scale = {"LEO_ISS": 1.00, "LUNAR_SURFACE": 0.85, "MARS_TRANSIT": 1.20}[env]

    adapted_series: List[Dict[str, Any]] = []
    for idx, base_pt in enumerate(base_series):
        day = int(base_pt["missionDay"])
        frac = day / 30.0
        smooth_ramp = frac ** 1.15

        # 1. Radiation dose accumulation (mSv) — NASA-STD-3001 Vol 1 [V1 4030], [V1 4031], [V1 4033]
        cum_dose = day * rad_rate
        if env == "MARS_TRANSIT" and crew_id == "crew-4":
            # Deep-space transit SPE/CME exposure events (crossing 250 mSv [V1 4031] by Day 15 and 600 mSv [V1 4030] by Day 26)
            spe_pulse_1 = 230.0 * float(expit(1.4 * (day - 14.0)))  # Oct 1989-class SPE (>250 mSv [V1 4031])
            spe_pulse_2 = 350.0 * float(expit(1.4 * (day - 24.5)))  # Severe deep-space CME (>600 mSv PEL [V1 4030])
            cum_dose += spe_pulse_1 + spe_pulse_2

        # 2. Musculoskeletal BMD loss (%) — NASA HRP Bone Evidence Report (1.0-1.5%/mo in 0g; 0.80x Lunar; 1.25x Mars)
        bmd_loss = base_leo_bmd_30d * bmd_mult * frac

        # 3. Neuro-ocular SANS hyperopic shift (D) — Mader et al. 2011; OCHMO-MTB-001; Lawley partial-G [PMC7399573]
        if env == "MARS_TRANSIT" and crew_id == "crew-2":
            sans_shift = 1.05 * smooth_ramp  # Prolonged 0g cephalad fluid shift (+1.05 D Caution)
        elif env == "MARS_TRANSIT" and crew_id == "crew-4":
            sans_shift = 1.65 * smooth_ramp  # Severe prolonged 0g SANS progression (>= +1.50 D Critical; Mader et al. 2011)
        else:
            sans_shift = base_leo_sans_30d * sans_mult * smooth_ramp

        # 4. Behavioral & Circadian (Sleep hours & PVT reaction time) — SLEEP 2022; Basner et al. 2011; Mars-500 PNAS 2013
        base_sleep = float(base_pt["sleepHours"])
        base_pvt = float(base_pt["pvtReactionMs"])
        if crew_id == "crew-1":
            target_sleep_30 = {"LEO_ISS": 6.45, "LUNAR_SURFACE": 6.55, "MARS_TRANSIT": 6.95}[env]  # 6.95h Mars-500 mean
            target_pvt_30 = base_pvt + rates["rtSlowingMs"]  # +39 ms ISS single-task RT slowing [PMC10063900]
        elif crew_id == "crew-2":
            target_sleep_30 = {"LEO_ISS": 5.82, "LUNAR_SURFACE": 6.32, "MARS_TRANSIT": 5.75}[env]
            target_pvt_30 = {"LEO_ISS": 318.0, "LUNAR_SURFACE": 292.0, "MARS_TRANSIT": 338.0}[env]
        elif crew_id == "crew-3":
            target_sleep_30 = {"LEO_ISS": 6.18, "LUNAR_SURFACE": 6.38, "MARS_TRANSIT": 6.80}[env]
            target_pvt_30 = base_pvt + rates["rtSlowingMs"]
        else:  # crew-4 (CMO — progressive sleep debt <6.0h -> <5.0h Critical & PVT >355ms -> >=500ms Critical)
            target_sleep_30 = {"LEO_ISS": 5.65, "LUNAR_SURFACE": 5.80, "MARS_TRANSIT": 4.72}[env]
            target_pvt_30 = {"LEO_ISS": 368.0, "LUNAR_SURFACE": 335.0, "MARS_TRANSIT": 516.0}[env]

        sleep_h = base_sleep + (target_sleep_30 - base_sleep) * smooth_ramp
        pvt_ms = base_pvt + (target_pvt_30 - base_pvt) * smooth_ramp

        # 5. Cardiovascular (HR, SBP, HRV RMSSD) — OCHMO-TB-019; PMC420472; Lawley partial-G [PMC7399573]
        base_hr = float(base_pt["heartRateBpm"])
        base_sbp = float(base_pt["systolicBp"])
        base_rmssd = float(base_pt["hrvRmssdMs"])

        if env == "LUNAR_SURFACE":
            # Partial-G hemodynamic response: -4 bpm HR and -10 to -15 mmHg MAP vs 1-Gz [Lawley et al. / PMC7399573]
            hr_target = base_hr - 4.0
            sbp_target = base_sbp - 12.5
            rmssd_target = max(31.0, base_rmssd - 8.5)
        else:
            env_cv_scale = 1.00 if env == "LEO_ISS" else 1.20
            if crew_id == "crew-1":
                hr_target = base_hr - 2.0
                sbp_target = base_sbp - 4.0
                rmssd_target = max(41.0, base_rmssd - 9.0 * env_cv_scale)
            elif crew_id == "crew-2":
                hr_target = base_hr + 6.0 * env_cv_scale
                sbp_target = 98.0 if env == "LEO_ISS" else 96.0
                rmssd_target = 22.5 if env == "LEO_ISS" else 20.5
            elif crew_id == "crew-3":
                hr_target = base_hr - 1.5
                sbp_target = base_sbp - 5.5
                rmssd_target = max(31.0, base_rmssd - 8.0 * env_cv_scale)
            else:  # crew-4: severe multi-system deconditioning in Mars transit (RMSSD < 25 ms & SBP < 95 mmHg)
                hr_target = base_hr + (5.0 if env == "LEO_ISS" else 12.0)
                sbp_target = 94.0 if env == "LEO_ISS" else 90.5
                rmssd_target = 21.5 if env == "LEO_ISS" else 18.0

        hr = base_hr + (hr_target - base_hr) * smooth_ramp
        sbp = base_sbp + (sbp_target - base_sbp) * smooth_ramp
        rmssd = base_rmssd + (rmssd_target - base_rmssd) * smooth_ramp

        # 6. Leukocyte (WBC) dynamics — NASA-STD-3001 Sec 4.4 / 3.8-11.5 x 10^9/L operational heuristic
        base_wbc = float(base_pt["wbcCount10e9L"])
        if env == "MARS_TRANSIT" and crew_id == "crew-4":
            wbc_target = 3.55  # Deep-space SPE-induced leukopenia (< 3.8 x 10^9/L)
        elif crew_id == "crew-4":
            wbc_target = 4.65
        else:
            wbc_target = base_wbc - 0.35 * (1.0 if env != "LUNAR_SURFACE" else 0.7)
        wbc = base_wbc + (wbc_target - base_wbc) * smooth_ramp

        # 7. Spaceflight CMP transition (L-3 -> R+1 -> R+45 from OSD-575, scaled by environment)
        base_cmp = base_pt["cmp"]
        cmp_out: Dict[str, float] = {}
        for ck in CMP_COLUMN_MAP.keys():
            l3_val = float(flight_cmp[ck][0])
            raw_flight_val = float(flight_cmp[ck][idx])
            shifted_val = l3_val + (raw_flight_val - l3_val) * cmp_env_scale
            blended = float(base_cmp[ck]) * (1.0 - frac) + shifted_val * frac
            decimals = 3 if ck == "creatinineMgDl" else (1 if ck == "glucoseMgDl" else 2)
            cmp_out[ck] = round(blended, decimals)

        adapted_series.append({
            "missionDay": day,
            "heartRateBpm": round(hr, 1),
            "systolicBp": round(sbp, 1),
            "hrvRmssdMs": round(rmssd, 1),
            "sleepHours": round(sleep_h, 2),
            "pvtReactionMs": round(pvt_ms, 1),
            "bmdLossPct": round(bmd_loss, 2),
            "aredSessionsWeek": int(base_pt["aredSessionsWeek"]),
            "visualAcuityShiftD": round(sans_shift, 2),
            "wbcCount10e9L": round(wbc, 2),
            "cumulativeDoseMsv": round(cum_dose, 2),
            "cmp": cmp_out,
        })

    return adapted_series


def adapt_all_environments() -> tuple[Dict[str, List[Dict[str, Any]]], Dict[str, Dict[str, List[Dict[str, Any]]]]]:
    """Load baseTelemetry.json and generate 30-day trajectories across all 3 environments."""
    repo_root = resolve_repo_root()
    base_path = repo_root / "src" / "data" / "baseTelemetry.json"
    if not base_path.exists():
        raise FileNotFoundError(f"Missing Stage 1 output {base_path}. Run scripts/generate_base_telemetry.py first.")

    with open(base_path, "r", encoding="utf-8") as f:
        base_telemetry: Dict[str, List[Dict[str, Any]]] = json.load(f)

    osd_csv_path = find_osd575_csv(repo_root)
    mission_days = np.arange(1, 31, dtype=float)
    flight_cmp = load_spaceflight_cmp_series(osd_csv_path, mission_days)

    env_telemetry: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for crew_id, base_series in base_telemetry.items():
        env_telemetry[crew_id] = {}
        for env in ENVIRONMENTS:
            env_telemetry[crew_id][env] = build_crew_environment_trajectory(
                crew_id=crew_id,
                env=env,
                base_series=base_series,
                flight_cmp=flight_cmp[crew_id],
            )

    return base_telemetry, env_telemetry


def verify_and_print_summary(
    base_telemetry: Dict[str, List[Dict[str, Any]]],
    env_telemetry: Dict[str, Dict[str, List[Dict[str, Any]]]],
) -> None:
    """Validate zero NaNs/nulls, verify clinical trajectories, and print verification table."""
    for crew_id, envs in env_telemetry.items():
        for env, series in envs.items():
            assert len(series) == 30, f"{crew_id} [{env}] expected 30 days"
            for pt in series:
                for k, v in pt.items():
                    if k == "cmp":
                        for ck, cv in v.items():
                            assert cv is not None and math.isfinite(float(cv)), f"NaN in {crew_id}.{env}.cmp.{ck}"
                    else:
                        assert v is not None and math.isfinite(float(v)), f"NaN in {crew_id}.{env}.{k}"

    # Verify required clinical outcomes at Day 30
    for env in ENVIRONMENTS:
        res_c1 = evaluate_crew_health(env_telemetry["crew-1"][env][-1], env)
        for sys_id, diag in res_c1["systems"].items():
            assert diag["status"] == "nominal" and diag["score"] >= 75, (
                f"crew-1 expected nominal in {env} [{sys_id}], got {diag}"
            )

    assert env_telemetry["crew-2"]["LEO_ISS"][-1]["visualAcuityShiftD"] >= 0.50
    assert env_telemetry["crew-2"]["MARS_TRANSIT"][-1]["visualAcuityShiftD"] >= 0.50
    assert env_telemetry["crew-2"]["LUNAR_SURFACE"][-1]["visualAcuityShiftD"] < 0.50

    assert env_telemetry["crew-3"]["LEO_ISS"][-1]["bmdLossPct"] > 3.0
    assert env_telemetry["crew-3"]["MARS_TRANSIT"][-1]["bmdLossPct"] > env_telemetry["crew-3"]["LEO_ISS"][-1]["bmdLossPct"]
    assert env_telemetry["crew-3"]["LUNAR_SURFACE"][-1]["bmdLossPct"] < 3.0

    c4_mars = env_telemetry["crew-4"]["MARS_TRANSIT"][-1]
    assert c4_mars["sleepHours"] < 5.0
    assert c4_mars["pvtReactionMs"] >= 500.0
    assert c4_mars["visualAcuityShiftD"] >= 1.50
    assert c4_mars["cumulativeDoseMsv"] >= 600.0

    header = (
        f"{'Crew':<8} | {'Env':<13} | {'HR':>5} | {'SBP':>5} | {'RMSSD':>5} | {'Sleep':>5} | "
        f"{'PVT':>5} | {'BMD%':>5} | {'SANS':>5} | {'Dose':>6} | {'WBC':>4} | "
        f"{'CV':>7} | {'SANS_S':>7} | {'MSK':>7} | {'BEH':>7} | {'RAD':>7} | {'Overall':>7}"
    )
    print("\n" + "=" * len(header))
    print("SPACEFLIGHT TELEMETRY & TRIAGE VERIFICATION SUMMARY (DAY 1 1G BASE vs. DAY 30 TRAJECTORIES)")
    print("=" * len(header))
    print(header)
    print("-" * len(header))

    for crew_id in ["crew-1", "crew-2", "crew-3", "crew-4"]:
        d1 = base_telemetry[crew_id][0]
        print(
            f"{crew_id:<8} | {'EARTH_1G (D1)':<13} | {d1['heartRateBpm']:>5.1f} | {d1['systolicBp']:>5.1f} | "
            f"{d1['hrvRmssdMs']:>5.1f} | {d1['sleepHours']:>5.2f} | {d1['pvtReactionMs']:>5.1f} | "
            f"{d1['bmdLossPct']:>5.2f} | {d1['visualAcuityShiftD']:>+5.2f} | {d1['cumulativeDoseMsv']:>6.2f} | "
            f"{d1['wbcCount10e9L']:>4.2f} | {'100/nom':>7} | {'100/nom':>7} | {'100/nom':>7} | "
            f"{'100/nom':>7} | {'100/nom':>7} | {'100/nom':>7}"
        )
        for env in ENVIRONMENTS:
            d30 = env_telemetry[crew_id][env][-1]
            ev = evaluate_crew_health(d30, env)
            s = ev["systems"]
            fmt = lambda sys_k: f"{s[sys_k]['score']}/{s[sys_k]['status'][:3]}"
            ov_status = score_to_status(ev["overallIndex"])[:3]
            print(
                f"{crew_id:<8} | {env:<13} | {d30['heartRateBpm']:>5.1f} | {d30['systolicBp']:>5.1f} | "
                f"{d30['hrvRmssdMs']:>5.1f} | {d30['sleepHours']:>5.2f} | {d30['pvtReactionMs']:>5.1f} | "
                f"{d30['bmdLossPct']:>5.2f} | {d30['visualAcuityShiftD']:>+5.2f} | {d30['cumulativeDoseMsv']:>6.2f} | "
                f"{d30['wbcCount10e9L']:>4.2f} | {fmt('cardiovascular'):>7} | {fmt('neuro_ocular'):>7} | "
                f"{fmt('musculoskeletal'):>7} | {fmt('behavioral_circadian'):>7} | {fmt('radiation_immune'):>7} | "
                f"{ev['overallIndex']}/{ov_status:>3}"
            )
        print("-" * len(header))


def main() -> None:
    repo_root = resolve_repo_root()
    out_path = repo_root / "src" / "data" / "envTelemetry.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    base_telemetry, env_telemetry = adapt_all_environments()
    verify_and_print_summary(base_telemetry, env_telemetry)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(env_telemetry, f, indent=2)

    print(f"\n[Stage 2] Generated and verified {out_path} (4 crew x 3 environments x 30 days).")


if __name__ == "__main__":
    main()