import React, { useCallback, useEffect, useState } from 'react';
import { fetchLiveSpaceWeather, type SpaceWeatherFeed } from '../services/spaceWeather';
import type { CabinEnvironmentState, MissionEnvironment } from '../types/medical';

interface ContingencyBarProps {
    env: CabinEnvironmentState;
    onChangeEnv: (updater: (prev: CabinEnvironmentState) => CabinEnvironmentState) => void;
    cmoAvailable: boolean;
}

const ENV_OPTIONS: { id: MissionEnvironment; label: string; sub: string }[] = [
    { id: 'LEO_ISS', label: 'LEO / ISS', sub: '0g • Magnetosphere' },
{ id: 'LUNAR_SURFACE', label: 'Lunar Surface', sub: '1/6g • Artemis' },
{ id: 'MARS_TRANSIT', label: 'Mars Transit', sub: '0g • Deep-Space GCR' },
];

export const ContingencyBar: React.FC<ContingencyBarProps> = ({
    env,
    onChangeEnv,
    cmoAvailable,
}) => {
    const [liveFeed, setLiveFeed] = useState<SpaceWeatherFeed | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);
    const [stormSimActive, setStormSimActive] = useState(false);

    const syncSpaceWeather = useCallback(async () => {
        setLoadingWeather(true);
        try {
            const feed = await fetchLiveSpaceWeather();
            setLiveFeed(feed);
            setStormSimActive(false);
            onChangeEnv((prev) => ({
                ...prev,
                solarStormLevel: feed.stormLevel,
                activeSolarEventSummary: feed.headline,
            }));
        } finally {
            setLoadingWeather(false);
        }
    }, [onChangeEnv]);

    useEffect(() => {
        syncSpaceWeather();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStormOverride = (level: CabinEnvironmentState['solarStormLevel']) => {
        if (level === 'NONE' && liveFeed) {
            setStormSimActive(false);
            onChangeEnv((prev) => ({
                ...prev,
                solarStormLevel: liveFeed.stormLevel,
                activeSolarEventSummary: liveFeed.headline,
            }));
            return;
        }

        setStormSimActive(true);
        const summaryMap: Record<CabinEnvironmentState['solarStormLevel'], string> = {
            NONE: 'SIMULATION OVERRIDE: Quiet solar background enforced.',
            MINOR_FLR: 'SIMULATION OVERRIDE: M-Class Solar Flare — Elevated proton flux advisory.',
            MAJOR_SPE_CME:
            'SIMULATION OVERRIDE: X-Class SPE / CME Storm — Immediate polyethylene shelter protocol!',
        };
        onChangeEnv((prev) => ({
            ...prev,
            solarStormLevel: level,
            activeSolarEventSummary: summaryMap[level],
        }));
    };

    const applyCabinPreset = (co2Ppm: number, o2Percent: number) => {
        onChangeEnv((prev) => ({
            ...prev,
            co2Ppm,
            o2Percent,
        }));
    };

    const effectiveCmoIncapacitated = env.cmoIncapacitatedOverride || !cmoAvailable;

    return (
        <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-3">
        {/* Top Row: Mission Environment, Flight Day Scrubber & CMO Contingency Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mission Environment Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
        {ENV_OPTIONS.map((opt) => {
            const active = env.environment === opt.id;
            return (
                <button
                key={opt.id}
                type="button"
                onClick={() =>
                    onChangeEnv((prev) => ({
                        ...prev,
                        environment: opt.id,
                    }))
                }
                className={`px-3 py-1.5 rounded-md text-left transition-all ${
                    active
                    ? 'bg-sky-500/20 border border-sky-400/60 text-sky-200 shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                >
                <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                <div className="text-[10px] font-mono opacity-75">{opt.sub}</div>
                </button>
            );
        })}
        </div>

        {/* Flight Day Scrubber (1–30) */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex-1 min-w-[240px] max-w-[380px]">
        <div className="shrink-0">
        <div className="text-[10px] font-mono uppercase text-slate-400">Mission Timeline</div>
        <div className="text-xs font-mono font-bold text-sky-300">
        FD-{String(env.missionDay).padStart(2, '0')} / 30
        </div>
        </div>

        <button
        type="button"
        aria-label="Previous mission day"
        disabled={env.missionDay <= 1}
        onClick={() =>
            onChangeEnv((prev) => ({
                ...prev,
                missionDay: Math.max(1, prev.missionDay - 1),
            }))
        }
        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 disabled:opacity-40 hover:border-slate-500"
        >
        -1d
        </button>

        <input
        type="range"
        min={1}
        max={30}
        value={env.missionDay}
        aria-label="Mission Day Scrubber"
        onChange={(e) =>
            onChangeEnv((prev) => ({
                ...prev,
                missionDay: Number(e.target.value),
            }))
        }
        className="w-full accent-sky-400 cursor-pointer"
        />

        <button
        type="button"
        aria-label="Next mission day"
        disabled={env.missionDay >= 30}
        onClick={() =>
            onChangeEnv((prev) => ({
                ...prev,
                missionDay: Math.min(30, prev.missionDay + 1),
            }))
        }
        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 disabled:opacity-40 hover:border-slate-500"
        >
        +1d
        </button>
        </div>

        {/* CMO Incapacitated Contingency Override */}
        <button
        type="button"
        onClick={() =>
            onChangeEnv((prev) => ({
                ...prev,
                cmoIncapacitatedOverride: !prev.cmoIncapacitatedOverride,
            }))
        }
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-left transition-all ${
            effectiveCmoIncapacitated
            ? 'bg-rose-500/20 border-rose-500/70 text-rose-200 shadow-sm shadow-rose-950/50'
            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
        }`}
        >
        <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            effectiveCmoIncapacitated ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
        }`}
        />
        <div>
        <div className="text-xs font-bold tracking-wide uppercase">
        {effectiveCmoIncapacitated
            ? 'CMO Incapacitated: Contingency Active'
    : 'CMO Status: Nominal'}
    </div>
    <div className="text-[10px] font-mono opacity-80">
    {effectiveCmoIncapacitated
        ? 'Restricted CMO diagnostics unlocked for crew self-exam'
    : 'Toggle to simulate CMO incapacitation'}
    </div>
    </div>
    </button>
    </div>

    {/* Bottom Row: ECLSS Cabin Atmosphere + Live Space Weather Feed */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
    {/* Cabin CO2 & O2 Controls */}
    <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
    {/* CO2 Slider */}
    <div className="flex-1 min-w-[150px]">
    <div className="flex justify-between text-[11px] font-mono mb-1">
    <span className="text-slate-400">Cabin ppCO₂</span>
    <span className="font-bold text-slate-100">{env.co2Ppm} ppm</span>
    </div>
    <input
    type="range"
    min={1000}
    max={6800}
    step={100}
    value={env.co2Ppm}
    aria-label="Cabin CO2 ppm"
    onChange={(e) =>
        onChangeEnv((prev) => ({
            ...prev,
            co2Ppm: Number(e.target.value),
        }))
    }
    className="w-full accent-amber-400 cursor-pointer"
    />
    </div>

    {/* O2 Slider */}
    <div className="flex-1 min-w-[150px]">
    <div className="flex justify-between text-[11px] font-mono mb-1">
    <span className="text-slate-400">Cabin O₂</span>
    <span className="font-bold text-slate-100">{env.o2Percent.toFixed(1)}%</span>
    </div>
    <input
    type="range"
    min={16.0}
    max={23.0}
    step={0.1}
    value={env.o2Percent}
    aria-label="Cabin Oxygen percentage"
    onChange={(e) =>
        onChangeEnv((prev) => ({
            ...prev,
            o2Percent: Number(e.target.value),
        }))
    }
    className="w-full accent-sky-400 cursor-pointer"
    />
    </div>

    {/* ECLSS Quick Presets */}
    <div className="flex items-center gap-1 shrink-0">
    <button
    type="button"
    onClick={() => applyCabinPreset(2100, 20.9)}
    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-300"
    title="Nominal ISS/Orion ECLSS"
    >
    Nominal
    </button>
    <button
    type="button"
    onClick={() => applyCabinPreset(4800, 20.9)}
    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-amber-300"
    title="Simulate CDRA CO2 Scrubber Degradation"
    >
    CO₂ Fault
    </button>
    <button
    type="button"
    onClick={() => applyCabinPreset(2100, 16.8)}
    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-rose-300"
    title="Simulate Cabin Hypoxia"
    >
    Hypoxia
    </button>
    </div>
    </div>

    {/* Live Space Weather Badge + Storm Simulation Override */}
    <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
    <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 mb-0.5">
    <span
    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
        env.solarStormLevel === 'MAJOR_SPE_CME'
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
        : env.solarStormLevel === 'MINOR_FLR'
        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
    }`}
    >
    {stormSimActive
        ? 'SIM_OVERRIDE'
    : liveFeed?.source ?? 'SYNCING_SPACE_WX'}
    </span>
    {liveFeed && !stormSimActive && (
        <span className="text-[10px] font-mono text-slate-400">
        Kp {liveFeed.kpIndex} • {liveFeed.flareClass}
        </span>
    )}
    <button
    type="button"
    onClick={syncSpaceWeather}
    disabled={loadingWeather}
    className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline disabled:opacity-50"
    >
    {loadingWeather ? 'Syncing...' : 'Refresh Feed'}
    </button>
    </div>
    <p className="text-[11px] text-slate-300 truncate" title={env.activeSolarEventSummary}>
    {env.activeSolarEventSummary}
    </p>
    </div>

    {/* Storm Simulation Override Selector */}
    <div className="flex items-center gap-1 shrink-0">
    {(
        [
            { id: 'NONE', label: 'Quiet' },
      { id: 'MINOR_FLR', label: 'M-Flare' },
      { id: 'MAJOR_SPE_CME', label: 'X-SPE' },
        ] as const
    ).map((s) => {
        const active = env.solarStormLevel === s.id;
        return (
            <button
            key={s.id}
            type="button"
            onClick={() => handleStormOverride(s.id)}
            className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                active
                ? s.id === 'MAJOR_SPE_CME'
                ? 'bg-rose-500/25 border-rose-400 text-rose-200 font-bold'
                : s.id === 'MINOR_FLR'
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
                : 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            >
            {s.label}
            </button>
        );
    })}
    </div>
    </div>
    </div>
    </div>
    </header>
    );
};

export default ContingencyBar;
