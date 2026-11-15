import React from 'react';

interface SparklineProps {
    values: number[];
    color?: string;
    label: string;
    unit: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ values, color = '#38bdf8', label, unit }) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values
    .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * 220;
        const y = 45 - ((v - min) / range) * 35;
        return `${x},${y}`;
    })
    .join(' ');

    const latest = values[values.length - 1];

    return (
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
        <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold text-slate-100">
        {latest} {unit}
        </span>
        </div>
        <svg viewBox="0 0 220 50" className="w-full h-12 overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" points={points} />
        </svg>
        </div>
    );
};
