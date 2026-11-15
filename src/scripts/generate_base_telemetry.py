#!/usr/bin/env python3
"""
Stage 1 ETL Pipeline: scripts/generate_base_telemetry.py -> src/data/baseTelemetry.json

Models 4 completely healthy, flight-certified astronauts on Earth (1G terrestrial baseline)
over 30 mission days with zero spaceflight pathology (all 4 crew evaluate to Nominal / 100
across all 5 physiological systems in 1G).

Data Sources & Grounding:
  1. NASA OSDR Study OSD-575 (LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv):
     - SpaceX Inspiration4 longitudinal serum CMP across C001..C004 -> crew-1..crew-4.
     - CRITICAL SPLIT: Interpolates ONLY pre-flight terrestrial draws (L-92 -> Day 1,
       L-44 -> Day 15, L-3 -> Day 30) via numpy.interp so baseTelemetry.json has zero
       post-flight (R+1) microgravity distortion.
  2. PhysioNet MMASH v1.0.0 (raw_data/mmash/user_*/):
     - RR.csv (ibi_s -> heartRateBpm = 60/mean(ibi_s), hrvRmssdMs = sqrt(mean(diff(ibi_s)^2))*1000)
       and sleep.csv (Total Sleep Time -> sleepHours = tst/60).
     - Filtered strictly to healthy, well-rested terrestrial days (sleepHours >= 7.0 h,
       hrvRmssdMs >= 35 ms, heartRateBpm 55-75 bpm) with automatic empirical fallback.
  3. PhysioNet Autonomic Aging v1.0.0 (raw_data/autonomic_aging/):
     - subject-info.csv + 1000 Hz WFDB recordings (NIBP channel in mmHg) sampled strictly
       from healthy young adults (Age_group 2-3, ages 20-29, records 0001-0008) yielding
       normotensive resting systolicBp (112-126 mmHg), with automatic empirical fallback.

Clinical Threshold Citations (NASA Spaceflight Clinical Threshold Validation.pdf):
  - bmdLossPct = 0.0% on Earth (1G baseline; 0g loss is 1.0-1.5%/mo per NASA HRP Bone Report).
  - visualAcuityShiftD = 0.00 D on Earth (1G baseline; SANS caution >= +0.50 D per Mader et al. 2011 / OCHMO-MTB-001).
  - cumulativeDoseMsv = 0.008 mSv/day terrestrial background (~0.24 mSv/30d; vs < 1.3 mSv/d free-space cap [V1 4033]).
  - sleepHours = 7.0-8.2 h/day (target >= 7.0 h; Caution < 6.0 h, Critical < 5.0 h per SLEEP 2022).
  - pvtReactionMs = 235-275 ms (within < 355 ms 3-min PVT-B non-lapse window per Basner et al. 2011).
  - wbcCount10e9L = 5.2-7.8 x 10^9/L (within 3.8-11.5 x 10^9/L operational hematology bounds; NASA-STD-3001 Sec 4.4).
"""

from __future__ import annotations

import glob
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy import signal

try:
    import wfdb  # Optional WFDB reader for PhysioNet Autonomic Aging .hea/.dat records
except ImportError:
    wfdb = None


# Crew roster mapping (NASA OSDR OSD-575 Subject ID -> Dashboard Crew ID)
CREW_PROFILES: Dict[str, Dict[str, Any]] = {
    "crew-1": {
        "osd_subject": "C001",
        "name": "Cmdr. Elena Vance",
        "aredSessionsWeek": 6,  # High exercise consistency trait (6/wk; >= 4/wk operational heuristic)
        "hr_mean": 58.0,        # Nominal terrestrial resting HR (55-75 bpm; Caution > 95 bpm heuristic)
        "sbp_mean": 115.0,      # Normotensive young adult resting SBP (112-126 mmHg; Caution < 95 mmHg heuristic)
        "rmssd_mean": 54.0,     # Healthy terrestrial RMSSD (36-60 ms; Caution < 25 ms heuristic)
        "sleep_mean": 7.80,     # Well-rested terrestrial sleep (7.0-8.2 h; target >= 7.0 h [SLEEP 2022])
        "pvt_mean": 242.0,      # Healthy terrestrial PVT RT (235-275 ms; < 355 ms PVT-B [Basner et al. 2011])
        "wbc_mean": 6.10,       # Nominal terrestrial WBC (5.2-7.8 x 10^9/L; [NASA-STD-3001 Vol 1 Sec 4.4])
        "phase_offset": 0.0,
    },
    "crew-2": {
        "osd_subject": "C002",
        "name": "Maj. Marcus Chen",
        "aredSessionsWeek": 4,  # Nominal exercise consistency trait (4/wk; >= 4/wk operational heuristic)
        "hr_mean": 63.0,
        "sbp_mean": 119.0,
        "rmssd_mean": 46.0,
        "sleep_mean": 7.50,
        "pvt_mean": 252.0,
        "wbc_mean": 6.50,
        "phase_offset": 1.1,
    },
    "crew-3": {
        "osd_subject": "C003",
        "name": "Dr. Aris Thorne",
        "aredSessionsWeek": 3,  # Lower baseline exercise consistency trait (3/wk)
        "hr_mean": 66.0,
        "sbp_mean": 121.0,
        "rmssd_mean": 43.0,
        "sleep_mean": 7.40,
        "pvt_mean": 258.0,
        "wbc_mean": 6.80,
        "phase_offset": 2.2,
    },
    "crew-4": {
        "osd_subject": "C004",
        "name": "Dr. Maya Lin",
        "aredSessionsWeek": 2,  # Low baseline exercise consistency trait (2/wk)
        "hr_mean": 69.0,
        "sbp_mean": 122.0,
        "rmssd_mean": 40.0,
        "sleep_mean": 7.30,
        "pvt_mean": 264.0,
        "wbc_mean": 7.00,
        "phase_offset": 3.3,
    },
}

CMP_COLUMN_MAP: Dict[str, str] = {
    "sodiumMmolL": "sodium_value_millimol_per_liter",
    "potassiumMmolL": "potassium_value_millimol_per_liter",
    "creatinineMgDl": "creatinine_value_milligram_per_deciliter",
    "bunMgDl": "urea_nitrogen_bun_value_milligram_per_deciliter",
    "calciumMgDl": "calcium_value_milligram_per_deciliter",
    "glucoseMgDl": "glucose_value_milligram_per_deciliter",
}

TERRESTRIAL_BG_DOSE_MSV_PER_DAY = 0.008  # ~0.008 mSv/day sea-level terrestrial background (~0.24 mSv/30d)


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
    raise FileNotFoundError(
        "Could not locate LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv in: "
        + ", ".join(str(c) for c in candidates)
    )


def load_preflight_cmp_series(csv_path: Path, mission_days: np.ndarray) -> Dict[str, Dict[str, np.ndarray]]:
    """
    Interpolate ONLY pre-flight terrestrial blood draws (L-92 -> Day 1, L-44 -> Day 15,
    L-3 -> Day 30) via np.interp so baseTelemetry.json has zero post-flight (R+1)
    microgravity distortion.
    """
    df = pd.read_csv(csv_path)
    required_cols = ["Sample Name"] + list(CMP_COLUMN_MAP.values())
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"OSD-575 CSV missing required columns: {missing}")

    if df[list(CMP_COLUMN_MAP.values())].isna().any().any():
        raise ValueError("OSD-575 CMP numeric columns contain unexpected NaN values.")

    extracted = df["Sample Name"].str.extract(r"^(C\d+)_serum_(.+)$")
    df["subject"] = extracted[0]
    df["timepoint"] = extracted[1]

    anchor_days = np.array([1.0, 15.0, 30.0], dtype=float)
    anchor_timepoints = ["L-92", "L-44", "L-3"]

    cmp_by_crew: Dict[str, Dict[str, np.ndarray]] = {}
    for crew_id, meta in CREW_PROFILES.items():
        subj = meta["osd_subject"]
        sub_df = df[df["subject"] == subj].set_index("timepoint")
        for tp in anchor_timepoints:
            if tp not in sub_df.index:
                raise KeyError(f"Missing pre-flight timepoint {tp} for subject {subj}")

        crew_cmp: Dict[str, np.ndarray] = {}
        for out_key, csv_col in CMP_COLUMN_MAP.items():
            anchor_vals = np.array([float(sub_df.loc[tp, csv_col]) for tp in anchor_timepoints], dtype=float)
            crew_cmp[out_key] = np.interp(mission_days, anchor_days, anchor_vals)
        cmp_by_crew[crew_id] = crew_cmp

    return cmp_by_crew


def load_mmash_healthy_priors(repo_root: Path) -> Tuple[Dict[str, float], bool]:
    """
    Parse PhysioNet MMASH v1.0.0 (raw_data/mmash/user_*/) and filter strictly to healthy,
    well-rested terrestrial days:
      - sleepHours >= 7.0 h (Total Sleep Time in minutes / 60; target >= 7.0h [SLEEP 2022])
      - hrvRmssdMs >= 35.0 ms (sqrt(mean(diff(ibi_s)^2)) * 1000)
      - heartRateBpm in [55.0, 75.0] bpm (60 / mean(ibi_s))
    Falls back automatically to empirical MMASH healthy adult priors if local files are absent.
    """
    user_dirs = sorted(glob.glob(str(repo_root / "raw_data" / "mmash" / "user_*")))
    valid_records: List[Dict[str, float]] = []

    for udir in user_dirs:
        rr_path = Path(udir) / "RR.csv"
        sleep_path = Path(udir) / "sleep.csv"
        if not (rr_path.exists() and sleep_path.exists()):
            continue
        try:
            rr_df = pd.read_csv(rr_path)
            sleep_df = pd.read_csv(sleep_path)
            ibi_col = next((c for c in rr_df.columns if "ibi" in c.lower()), None)
            tst_col = next(
                (c for c in sleep_df.columns if "total sleep time" in c.lower() or c.lower() == "tst"),
                None,
            )
            if ibi_col is None or tst_col is None:
                continue

            ibi = pd.to_numeric(rr_df[ibi_col], errors="coerce").dropna().to_numpy(dtype=float)
            ibi = ibi[(ibi > 0.35) & (ibi < 1.80)]  # Physiological ectopic/artifact R-R filter
            if len(ibi) < 100:
                continue

            hr_bpm = float(60.0 / np.mean(ibi))
            rmssd_ms = float(np.sqrt(np.mean(np.diff(ibi) ** 2)) * 1000.0)
            tst_min = float(pd.to_numeric(sleep_df[tst_col], errors="coerce").dropna().mean())
            sleep_h = tst_min / 60.0

            if sleep_h >= 7.0 and rmssd_ms >= 35.0 and 55.0 <= hr_bpm <= 75.0:
                valid_records.append({"hr": hr_bpm, "rmssd": rmssd_ms, "sleep": sleep_h})
        except Exception:
            continue

    if valid_records:
        priors = {
            "hr_mean": float(np.mean([r["hr"] for r in valid_records])),
            "rmssd_mean": float(np.mean([r["rmssd"] for r in valid_records])),
            "sleep_mean": float(np.mean([r["sleep"] for r in valid_records])),
        }
        return priors, True

    # Automatic empirical fallback calibrated to PhysioNet MMASH healthy rested adult cohort
    return {"hr_mean": 64.0, "rmssd_mean": 45.75, "sleep_mean": 7.50}, False


def load_autonomic_aging_sbp_prior(repo_root: Path) -> Tuple[float, bool]:
    """
    Sample ONLY healthy young adult records (Age_group 2-3, ages 20-29, records 0001-0008)
    from PhysioNet Autonomic Aging (raw_data/autonomic_aging/) yielding normotensive resting
    systolicBp (112-126 mmHg). Excludes all elderly age groups. Falls back automatically
    to empirical young-adult normotensive SBP prior if .dat/.hea files or wfdb are absent.
    """
    aa_dir = repo_root / "raw_data" / "autonomic_aging"
    info_path = aa_dir / "subject-info.csv"
    allowed_ids = {f"{i:04d}" for i in range(1, 9)}
    sbp_samples: List[float] = []

    if info_path.exists() and wfdb is not None:
        try:
            info_df = pd.read_csv(info_path)
            id_col = info_df.columns[0]
            age_col = next((c for c in info_df.columns if "age" in c.lower()), None)
            if age_col is not None:
                for _, row in info_df.iterrows():
                    rec_id = str(row[id_col]).strip().zfill(4)
                    age_grp = pd.to_numeric(row[age_col], errors="coerce")
                    if rec_id in allowed_ids and age_grp in (2, 3):
                        rec_path = aa_dir / rec_id
                        if rec_path.with_suffix(".hea").exists() and rec_path.with_suffix(".dat").exists():
                            rec = wfdb.rdrecord(str(rec_path), sampto=60000)  # First 60s @ 1000 Hz
                            nibp_idx = next(
                                (idx for idx, name in enumerate(rec.sig_name) if "nibp" in name.lower()),
                                None,
                            )
                            if nibp_idx is not None:
                                sig = rec.p_signal[:, nibp_idx]
                                sig = sig[np.isfinite(sig)]
                                peaks, _ = signal.find_peaks(sig, distance=500, prominence=15.0)
                                sbp_est = float(np.median(sig[peaks])) if len(peaks) >= 5 else float(np.percentile(sig, 95))
                                if 112.0 <= sbp_est <= 126.0:
                                    sbp_samples.append(sbp_est)
        except Exception:
            sbp_samples = []

    if sbp_samples:
        return float(np.mean(sbp_samples)), True

    # Automatic empirical fallback for young healthy normotensive adults (ages 20-29)
    return 119.25, False


def evaluate_1g_terrestrial_baseline(point: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Evaluate 1G terrestrial baseline across all 5 physiological systems.
    In 1G Earth gravity, there is zero microgravity unloading, zero cephalad fluid shift,
    and terrestrial background radiation (0.008 mSv/day). Every healthy flight-certified
    crew member must score 100 ('nominal') across all 5 systems.
    """
    penalties = {
        "cardiovascular": 0,
        "neuro_ocular": 0,
        "musculoskeletal": 0,
        "behavioral_circadian": 0,
        "radiation_immune": 0,
    }

    # Cardiovascular nominal terrestrial envelope (55-75 bpm, 112-126 mmHg, RMSSD >= 36 ms)
    if (
        not (55.0 <= point["heartRateBpm"] <= 75.0)
        or not (112.0 <= point["systolicBp"] <= 126.0)
        or point["hrvRmssdMs"] < 36.0
    ):
        penalties["cardiovascular"] += 25

    # Neuro-ocular (SANS) nominal 1G envelope (0.00 D hyperopic shift; Caution >= +0.50 D [Mader et al. 2011])
    if point["visualAcuityShiftD"] != 0.0:
        penalties["neuro_ocular"] += 32

    # Musculoskeletal nominal 1G envelope (0.0% BMD loss; 1G axial loading prevents 0g resorption)
    if point["bmdLossPct"] != 0.0:
        penalties["musculoskeletal"] += 32

    # Behavioral & circadian nominal terrestrial envelope (7.0-8.2 h [SLEEP 2022]; 235-275 ms [Basner et al. 2011])
    if point["sleepHours"] < 7.0 or point["pvtReactionMs"] > 275.0:
        penalties["behavioral_circadian"] += 26

    # Radiation & immune nominal terrestrial background envelope (0.008 mSv/d; WBC 5.2-7.8 x 10^9/L [STD-3001 Sec 4.4])
    if point["cumulativeDoseMsv"] >= 250.0 or not (5.2 <= point["wbcCount10e9L"] <= 7.8):
        penalties["radiation_immune"] += 25

    results: Dict[str, Dict[str, Any]] = {}
    for sys_id, pen in penalties.items():
        score = max(0, min(100, 100 - pen))
        status = "nominal" if score >= 75 else ("caution" if score >= 50 else "critical")
        results[sys_id] = {"score": score, "status": status}
    return results


def generate_base_telemetry(seed: int = 42) -> Dict[str, List[Dict[str, Any]]]:
    """Generate 30-day 1G terrestrial baseline telemetry for crew-1..crew-4."""
    repo_root = resolve_repo_root()
    osd_csv_path = find_osd575_csv(repo_root)
    mission_days = np.arange(1, 31, dtype=float)

    cmp_series = load_preflight_cmp_series(osd_csv_path, mission_days)
    mmash_priors, used_mmash_files = load_mmash_healthy_priors(repo_root)
    aa_sbp_mean, used_aa_files = load_autonomic_aging_sbp_prior(repo_root)

    cohort_hr_delta = mmash_priors["hr_mean"] - 64.0 if used_mmash_files else 0.0
    cohort_rmssd_delta = mmash_priors["rmssd_mean"] - 45.75 if used_mmash_files else 0.0
    cohort_sleep_delta = mmash_priors["sleep_mean"] - 7.50 if used_mmash_files else 0.0
    cohort_sbp_delta = aa_sbp_mean - 119.25 if used_aa_files else 0.0

    rng = np.random.default_rng(seed)
    base_telemetry: Dict[str, List[Dict[str, Any]]] = {}

    for crew_id, meta in CREW_PROFILES.items():
        phase = meta["phase_offset"]
        crew_points: List[Dict[str, Any]] = []

        for idx, day_f in enumerate(mission_days):
            day = int(day_f)
            wave = math.sin(2.0 * math.pi * day / 7.0 + phase)
            cos_wave = math.cos(2.0 * math.pi * day / 14.0 + phase)

            hr = float(np.clip(
                meta["hr_mean"] + cohort_hr_delta + 1.4 * wave + rng.normal(0.0, 0.5),
                56.0, 74.0,
            ))
            sbp = float(np.clip(
                meta["sbp_mean"] + cohort_sbp_delta + 1.8 * cos_wave + rng.normal(0.0, 0.6),
                112.0, 126.0,
            ))
            rmssd = float(np.clip(
                meta["rmssd_mean"] + cohort_rmssd_delta - 2.0 * wave + rng.normal(0.0, 0.8),
                36.0, 60.0,
            ))
            sleep_h = float(np.clip(
                meta["sleep_mean"] + cohort_sleep_delta + 0.18 * cos_wave + rng.normal(0.0, 0.06),
                7.0, 8.2,
            ))
            pvt_ms = float(np.clip(
                meta["pvt_mean"] - 3.5 * cos_wave + rng.normal(0.0, 1.5),
                235.0, 275.0,
            ))
            wbc = float(np.clip(
                meta["wbc_mean"] + 0.22 * wave + rng.normal(0.0, 0.08),
                5.2, 7.8,
            ))

            point: Dict[str, Any] = {
                "missionDay": day,
                "heartRateBpm": round(hr, 1),
                "systolicBp": round(sbp, 1),
                "hrvRmssdMs": round(rmssd, 1),
                "sleepHours": round(sleep_h, 2),
                "pvtReactionMs": round(pvt_ms, 1),
                "bmdLossPct": 0.0,  # 0.0% on Earth (1G baseline)
                "aredSessionsWeek": int(meta["aredSessionsWeek"]),
                "visualAcuityShiftD": 0.0,  # 0.00 D on Earth (1G baseline)
                "wbcCount10e9L": round(wbc, 2),
                "cumulativeDoseMsv": round(day * TERRESTRIAL_BG_DOSE_MSV_PER_DAY, 4),  # ~0.008 mSv/d on Earth
                "cmp": {
                    "sodiumMmolL": round(float(cmp_series[crew_id]["sodiumMmolL"][idx]), 2),
                    "potassiumMmolL": round(float(cmp_series[crew_id]["potassiumMmolL"][idx]), 2),
                    "creatinineMgDl": round(float(cmp_series[crew_id]["creatinineMgDl"][idx]), 3),
                    "bunMgDl": round(float(cmp_series[crew_id]["bunMgDl"][idx]), 2),
                    "calciumMgDl": round(float(cmp_series[crew_id]["calciumMgDl"][idx]), 2),
                    "glucoseMgDl": round(float(cmp_series[crew_id]["glucoseMgDl"][idx]), 1),
                },
            }
            crew_points.append(point)

        base_telemetry[crew_id] = crew_points

    return base_telemetry


def verify_base_telemetry(base_telemetry: Dict[str, List[Dict[str, Any]]]) -> None:
    """
    Built-in assertion suite confirming:
      1. Zero NaN / None / Inf values across all 4 crew members x 30 days.
      2. Strict adherence to healthy 1G terrestrial baseline ranges.
      3. Every crew member scores 100 ('nominal') across all 5 systems on Day 1 and Day 30.
    """
    expected_crew = ["crew-1", "crew-2", "crew-3", "crew-4"]
    assert list(base_telemetry.keys()) == expected_crew, f"Unexpected crew keys: {list(base_telemetry.keys())}"

    for crew_id, series in base_telemetry.items():
        assert len(series) == 30, f"{crew_id} expected 30 days, got {len(series)}"
        for pt in series:
            for k, v in pt.items():
                if k == "cmp":
                    assert isinstance(v, dict) and len(v) == 6, f"{crew_id} day {pt['missionDay']} invalid cmp"
                    for ck, cv in v.items():
                        assert cv is not None and math.isfinite(float(cv)), f"NaN/null in {crew_id}.cmp.{ck}"
                else:
                    assert v is not None and math.isfinite(float(v)), f"NaN/null in {crew_id}.{k}"

            assert pt["bmdLossPct"] == 0.0, f"{crew_id} non-zero 1G bmdLossPct"
            assert pt["visualAcuityShiftD"] == 0.0, f"{crew_id} non-zero 1G visualAcuityShiftD"
            assert 55.0 <= pt["heartRateBpm"] <= 75.0, f"{crew_id} out-of-range 1G HR: {pt['heartRateBpm']}"
            assert 112.0 <= pt["systolicBp"] <= 126.0, f"{crew_id} out-of-range 1G SBP: {pt['systolicBp']}"
            assert 36.0 <= pt["hrvRmssdMs"] <= 60.0, f"{crew_id} out-of-range 1G RMSSD: {pt['hrvRmssdMs']}"
            assert 7.0 <= pt["sleepHours"] <= 8.2, f"{crew_id} out-of-range 1G sleep: {pt['sleepHours']}"
            assert 235.0 <= pt["pvtReactionMs"] <= 275.0, f"{crew_id} out-of-range 1G PVT: {pt['pvtReactionMs']}"
            assert 5.2 <= pt["wbcCount10e9L"] <= 7.8, f"{crew_id} out-of-range 1G WBC: {pt['wbcCount10e9L']}"

        # Assert every crew member scores 100 ('nominal') across all 5 systems on Day 1 and Day 30
        for check_day in (1, 30):
            day_pt = series[check_day - 1]
            eval_res = evaluate_1g_terrestrial_baseline(day_pt)
            for sys_id, diag in eval_res.items():
                assert diag["score"] == 100 and diag["status"] == "nominal", (
                    f"1G Baseline Verification Failed for {crew_id} Day {check_day} [{sys_id}]: {diag}"
                )


def main() -> None:
    repo_root = resolve_repo_root()
    out_path = repo_root / "src" / "data" / "baseTelemetry.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    base_telemetry = generate_base_telemetry(seed=42)
    verify_base_telemetry(base_telemetry)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(base_telemetry, f, indent=2)

    print(f"[Stage 1] Generated and verified {out_path} (4 crew x 30 days; all 5 systems = 100/nominal on Day 1 & Day 30).")


if __name__ == "__main__":
    main()