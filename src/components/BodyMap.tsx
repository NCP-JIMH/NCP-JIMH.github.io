// export interface SpaceWeatherFeed {
//     source: 'NASA_DONKI_LIVE' | 'NOAA_SWPC_LIVE' | 'CACHED_TELEMETRY';
//     stormLevel: 'NONE' | 'MINOR_FLR' | 'MAJOR_SPE_CME';
//     kpIndex: number;
//     flareClass: string;
//     headline: string;
// }
//
// export async function fetchLiveSpaceWeather(): Promise<SpaceWeatherFeed> {
//     const end = new Date().toISOString().split('T')[0];
//     const start = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
//
//     try {
//         // 1. Primary: NASA DONKI Solar Flares
//         const res = await fetch(
//             `https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`
//         );
//         if (!res.ok) throw new Error('DONKI rate-limited');
//         const flares = await res.json();
//         const latest = Array.isArray(flares) && flares.length > 0 ? flares[flares.length - 1] : null;
//         const classType: string = latest?.classType || 'B1.0';
//
//         if (classType.startsWith('X')) {
//             return {
//                 source: 'NASA_DONKI_LIVE',
//                 stormLevel: 'MAJOR_SPE_CME',
//                 kpIndex: 7,
//                 flareClass: classType,
//                 headline: `NASA DONKI Alert: Class ${classType} Solar Flare detected — Storm shelter protocol advised.`,
//             };
//         }
//         if (classType.startsWith('M')) {
//             return {
//                 source: 'NASA_DONKI_LIVE',
//                 stormLevel: 'MINOR_FLR',
//                 kpIndex: 5,
//                 flareClass: classType,
//                 headline: `NASA DONKI Advisory: Class ${classType} flare active — Monitor dosimetry.`,
//             };
//         }
//         return {
//             source: 'NASA_DONKI_LIVE',
//             stormLevel: 'NONE',
//             kpIndex: 2,
//             flareClass: classType,
//             headline: `NASA DONKI Nominal: Peak solar activity Class ${classType}.`,
//         };
//     } catch {
//         // 2. Zero-Auth Backup: NOAA SWPC Planetary K-Index
//         try {
//             const noaaRes = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');
//             const kpData = await noaaRes.json();
//             const latestKp = kpData[kpData.length - 1]?.kp_index ?? 2;
//             return {
//                 source: 'NOAA_SWPC_LIVE',
//                 stormLevel: latestKp >= 6 ? 'MAJOR_SPE_CME' : latestKp >= 4 ? 'MINOR_FLR' : 'NONE',
//                 kpIndex: latestKp,
//                 flareClass: 'NOAA-KP',
//                 headline: `NOAA SWPC Live Feed: Planetary K-Index at ${latestKp}.`,
//             };
//         } catch {
//             // 3. Offline Demo-Safe Fallback
//             return {
//                 source: 'CACHED_TELEMETRY',
//                 stormLevel: 'NONE',
//                 kpIndex: 2.3,
//                 flareClass: 'C1.4 (Cached)',
//                 headline: 'Offline Telemetry Mode: Baseline solar background (OSDR RadLab Seed).',
//             };
//         }
//     }
// }


import React from 'react';
import type { SystemDiagnostic, SystemId, TriageStatus } from '../types/medical';

interface BodyMapProps {
    systems: Record<SystemId, SystemDiagnostic>;
    selectedSystem: SystemId | null;
    onSelectSystem: (systemId: SystemId) => void;
    crewName?: string;
    missionDay?: number;
}

interface HotspotConfig {
    id: SystemId;
    label: string;
    shortCode: string;
    cx: number;
    cy: number;
    labelX: number;
    labelY: number;
    align: 'left' | 'right';
}

const HOTSPOTS: HotspotConfig[] = [
    {
        id: 'neuro_ocular',
        label: 'Neuro-Ocular / SANS',
        shortCode: 'SANS',
        cx: 180,
        cy: 56,
        labelX: 300,
        labelY: 48,
        align: 'right',
    },
{
    id: 'behavioral_circadian',
    label: 'Behavioral & Circadian',
    shortCode: 'CIRC',
    cx: 162,
    cy: 42,
    labelX: 60,
    labelY: 48,
    align: 'left',
},
{
    id: 'cardiovascular',
    label: 'Cardiovascular',
    shortCode: 'CARD',
    cx: 192,
    cy: 152,
    labelX: 300,
    labelY: 146,
    align: 'right',
},
{
    id: 'radiation_immune',
    label: 'Radiation & Immune',
    shortCode: 'RAD/IMM',
    cx: 168,
    cy: 196,
    labelX: 60,
    labelY: 204,
    align: 'left',
},
{
    id: 'musculoskeletal',
    label: 'Musculoskeletal',
    shortCode: 'MSK',
    cx: 204,
    cy: 342,
    labelX: 300,
    labelY: 342,
    align: 'right',
},
];

const STATUS_STYLE: Record<
TriageStatus,
{
    hex: string;
    ringClass: string;
    badgeBg: string;
    badgeText: string;
    borderClass: string;
    label: string;
}
> = {
    nominal: {
        hex: '#10b981',
        ringClass: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-300',
        borderClass: 'border-emerald-500/40',
        label: 'NOMINAL',
    },
    caution: {
        hex: '#f59e0b',
        ringClass: 'text-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-300',
        borderClass: 'border-amber-500/50',
        label: 'CAUTION',
    },
    critical: {
        hex: '#f43f5e',
        ringClass: 'text-rose-400',
        badgeBg: 'bg-rose-500/20',
        badgeText: 'text-rose-300',
        borderClass: 'border-rose-500/60',
        label: 'CRITICAL',
    },
    nodata: {
        hex: '#64748b',
        ringClass: 'text-slate-400',
        badgeBg: 'bg-slate-700/40',
        badgeText: 'text-slate-300',
        borderClass: 'border-slate-700',
        label: 'NO DATA',
    },
};

export const BodyMap: React.FC<BodyMapProps> = ({
    systems,
    selectedSystem,
    onSelectSystem,
    crewName,
    missionDay,
}) => {
    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Left: Interactive Anatomical SVG Telemetry Silhouette */}
        <div className="relative flex-1 min-h-[430px] bg-slate-950/90 border border-slate-800/90 rounded-lg overflow-hidden flex flex-col justify-between p-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
        <span className="uppercase tracking-wider text-sky-400 font-semibold">
        ANATOMICAL BIOTELEMETRY HUD
        </span>
        <span>
        {crewName ? `${crewName} • ` : ''}
        {missionDay !== undefined ? `FD-${String(missionDay).padStart(2, '0')}` : 'LIVE'}
        </span>
        </div>

        <svg
        viewBox="0 0 360 500"
        className="w-full h-[390px] max-w-[380px] mx-auto select-none"
        role="img"
        aria-label="Interactive astronaut physiological body map"
        >
        <defs>
        <pattern id="hud-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path
        d="M 20 0 L 0 0 0 20"
        fill="none"
        stroke="rgba(56, 189, 248, 0.07)"
        strokeWidth="0.75"
        />
        </pattern>
        <radialGradient id="body-glow" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.14)" />
        <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
        </radialGradient>
        </defs>

        {/* Background Telemetry Grid & Center Axis */}
        <rect x="0" y="0" width="360" height="500" fill="url(#hud-grid)" />
        <ellipse cx="180" cy="245" rx="120" ry="215" fill="url(#body-glow)" />
        <line
        x1="180"
        y1="14"
        x2="180"
        y2="486"
        stroke="rgba(148, 163, 184, 0.16)"
        strokeDasharray="3 4"
        strokeWidth="1"
        />

        {/* Human Aerospace Wireframe Silhouette */}
        <g
        fill="rgba(30, 41, 59, 0.55)"
        stroke="rgba(148, 163, 184, 0.45)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        >
        {/* Cranium & Neck */}
        <path d="M 180 22 C 161 22 150 36 151 55 C 152 70 160 81 169 85 L 169 98 L 191 98 L 191 85 C 200 81 208 70 209 55 C 210 36 199 22 180 22 Z" />
        {/* Torso, Shoulders & Arms */}
        <path d="M 169 98 L 132 108 C 119 112 112 124 109 140 L 94 218 C 92 229 90 245 94 256 C 97 262 104 261 106 253 L 118 205 L 128 148 L 134 222 L 138 265 L 222 265 L 226 222 L 232 148 L 242 205 L 254 253 C 256 261 263 262 266 256 C 270 245 268 229 266 218 L 251 140 C 248 124 241 112 228 108 L 191 98 Z" />
        {/* Pelvis & Lower Limbs */}
        <path d="M 138 265 L 143 356 L 147 446 L 142 468 C 141 474 146 478 154 478 L 165 478 C 169 478 171 473 170 466 L 169 362 L 177 292 L 183 292 L 191 362 L 190 466 C 189 473 191 478 195 478 L 206 478 C 214 478 219 474 218 468 L 213 446 L 217 356 L 222 265 Z" />
        </g>

        {/* Subtle Internal Organ & Skeletal Vector Overlays */}
        {/* Brain & Optic Chiasm */}
        <path
        d="M 163 45 C 163 32 197 32 197 45 C 197 56 189 62 180 62 C 171 62 163 56 163 45 Z"
        fill="none"
        stroke="rgba(56, 189, 248, 0.35)"
        strokeWidth="1.2"
        />
        <circle cx="171" cy="55" r="3" fill="rgba(56, 189, 248, 0.45)" />
        <circle cx="189" cy="55" r="3" fill="rgba(56, 189, 248, 0.45)" />

        {/* Cardiac Silhouette & Aortic Arch */}
        <path
        d="M 183 136 C 177 132 172 140 176 149 C 180 158 191 164 196 156 C 201 148 195 135 187 137 Z"
        fill="rgba(244, 63, 94, 0.16)"
        stroke="rgba(244, 63, 94, 0.45)"
        strokeWidth="1.2"
        />

        {/* Vertebral Column & Femoral Load Axes */}
        <line
        x1="180"
        y1="96"
        x2="180"
        y2="262"
        stroke="rgba(226, 232, 240, 0.25)"
        strokeWidth="3"
        strokeDasharray="4 3"
        />
        <line
        x1="158"
        y1="274"
        x2="156"
        y2="438"
        stroke="rgba(226, 232, 240, 0.25)"
        strokeWidth="2.5"
        />
        <line
        x1="202"
        y1="274"
        x2="204"
        y2="438"
        stroke="rgba(226, 232, 240, 0.25)"
        strokeWidth="2.5"
        />

        {/* Interactive Hotspots & Callout Leader Lines */}
        {HOTSPOTS.map((spot) => {
            const diag = systems[spot.id];
            const status: TriageStatus = diag?.status ?? 'nodata';
            const style = STATUS_STYLE[status];
            const isSelected = selectedSystem === spot.id;
            const isDegraded = status === 'caution' || status === 'critical';
            const elbowX = spot.align === 'right' ? spot.cx + 34 : spot.cx - 34;

            return (
                <g
                key={spot.id}
                onClick={() => onSelectSystem(spot.id)}
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${spot.label}: ${style.label}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSystem(spot.id);
                    }
                }}
                >
                {/* Leader Line */}
                <polyline
                points={`${spot.cx},${spot.cy} ${elbowX},${spot.labelY} ${spot.labelX},${spot.labelY}`}
                fill="none"
                stroke={style.hex}
                strokeOpacity={isSelected ? 0.95 : 0.55}
                strokeWidth={isSelected ? 1.75 : 1.1}
                />

                {/* Animated Pulse Ring on Degraded Systems */}
                {isDegraded && (
                    <circle
                    cx={spot.cx}
                    cy={spot.cy}
                    r="10"
                    fill="none"
                    stroke={style.hex}
                    strokeWidth="2"
                    >
                    <animate
                    attributeName="r"
                    from="8"
                    to="22"
                    dur={status === 'critical' ? '1.2s' : '2s'}
                    repeatCount="indefinite"
                    />
                    <animate
                    attributeName="opacity"
                    from="0.85"
                    to="0"
                    dur={status === 'critical' ? '1.2s' : '2s'}
                    repeatCount="indefinite"
                    />
                    </circle>
                )}

                {/* Selection Halo */}
                {isSelected && (
                    <circle
                    cx={spot.cx}
                    cy={spot.cy}
                    r="14"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    />
                )}

                {/* Core Hotspot Node */}
                <circle
                cx={spot.cx}
                cy={spot.cy}
                r="7.5"
                fill="#0f172a"
                stroke={style.hex}
                strokeWidth="2.5"
                />
                <circle cx={spot.cx} cy={spot.cy} r="3.2" fill={style.hex} />

                {/* Callout Tag */}
                <g
                transform={`translate(${
                    spot.align === 'right' ? spot.labelX - 48 : spot.labelX - 54
                }, ${spot.labelY - 14})`}
                >
                <rect
                width="102"
                height="26"
                rx="5"
                fill="#0f172a"
                fillOpacity="0.92"
                stroke={isSelected ? '#38bdf8' : style.hex}
                strokeOpacity={isSelected ? 1 : 0.65}
                strokeWidth={isSelected ? 1.5 : 1}
                />
                <text
                x="8"
                y="11"
                fill="#e2e8f0"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                >
                {spot.shortCode}
                </text>
                <text
                x="94"
                y="11"
                textAnchor="end"
                fill={style.hex}
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                >
                {diag?.score !== null && diag?.score !== undefined ? `${diag.score}%` : '--'}
                </text>
                <text
                x="8"
                y="21"
                fill={style.hex}
                fontSize="7.5"
                fontFamily="monospace"
                >
                {style.label}
                </text>
                </g>
                </g>
            );
        })}
        </svg>

        <div className="text-[11px] text-slate-400 text-center font-mono">
        Click any anatomical hotspot or system panel to open clinical telemetry & countermeasures
        </div>
        </div>

        {/* Right: Interactive 5-System Triage Readout List */}
        <div className="w-full lg:w-[320px] flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        Physiological Subsystems
        </span>
        <span className="text-[11px] font-mono text-slate-500">5 ACTIVE</span>
        </div>

        <div className="flex flex-col gap-2.5 flex-1 justify-center">
        {HOTSPOTS.map((spot) => {
            const diag = systems[spot.id];
            const status: TriageStatus = diag?.status ?? 'nodata';
            const style = STATUS_STYLE[status];
            const isSelected = selectedSystem === spot.id;
            const completedCount = diag?.countermeasures.filter((c) => c.completed).length ?? 0;
            const totalCount = diag?.countermeasures.length ?? 0;

            return (
                <button
                key={spot.id}
                type="button"
                onClick={() => onSelectSystem(spot.id)}
                className={`text-left w-full rounded-lg p-3 border transition-all bg-slate-950/75 hover:bg-slate-900 ${
                    isSelected
                    ? 'border-sky-400 ring-1 ring-sky-400/40'
            : `${style.borderClass} hover:border-slate-600`
                }`}
                >
                <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: style.hex }}
                />
                <span className="text-xs font-semibold text-slate-100 truncate">
                {spot.label}
                </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${style.badgeBg} ${style.badgeText}`}
                >
                {style.label}
                </span>
                <span className="text-xs font-mono font-bold text-slate-100 w-9 text-right">
                {diag?.score !== null && diag?.score !== undefined ? `${diag.score}` : 'N/A'}
                </span>
                </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">
                {diag?.primaryTrigger ?? 'Awaiting telemetry'}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>
                CMs: {completedCount}/{totalCount} active
                </span>
                <span className="text-sky-400">Inspect →</span>
                </div>
                </button>
            );
        })}
        </div>
        </div>
        </div>
    );
};

export default BodyMap;
