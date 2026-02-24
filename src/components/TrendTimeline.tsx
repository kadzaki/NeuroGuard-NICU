import { useState, useMemo } from 'react';
import type { VitalSeries, Intervention } from '../data/types';

type FilterMode = 'all' | 'respiratory' | 'infection' | 'risk';

export default function TrendTimeline({ vitals, interventions }: { vitals: VitalSeries[]; interventions: Intervention[] }) {
    const [filter, setFilter] = useState<FilterMode>('all');
    const [showRiskOverlay, setShowRiskOverlay] = useState(false);

    const filteredVitals = useMemo(() => {
        switch (filter) {
            case 'respiratory': return vitals.filter(v => ['SpO₂', 'Heart Rate'].includes(v.label));
            case 'infection': return vitals.filter(v => ['CRP', 'WBC', 'Temperature'].includes(v.label));
            default: return vitals;
        }
    }, [vitals, filter]);

    // Calculate SVG dimensions
    const width = 800;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Get time range from first vital
    const allTimes = vitals[0]?.data.map(d => new Date(d.timestamp).getTime()) ?? [];
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const timeRange = maxTime - minTime || 1;

    function xScale(ts: string) {
        return padding.left + ((new Date(ts).getTime() - minTime) / timeRange) * chartW;
    }

    function buildPath(series: VitalSeries) {
        const vals = series.data.map(d => d.value);
        const minV = Math.min(...vals);
        const maxV = Math.max(...vals);
        const range = maxV - minV || 1;

        return series.data
            .map((d, i) => {
                const x = xScale(d.timestamp);
                const y = padding.top + chartH - ((d.value - minV) / range) * chartH;
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ');
    }

    // Time axis labels
    const numLabels = 6;
    const timeLabels = Array.from({ length: numLabels }, (_, i) => {
        const t = minTime + (i / (numLabels - 1)) * timeRange;
        return { x: padding.left + (i / (numLabels - 1)) * chartW, label: `Day ${Math.floor((t - minTime) / (24 * 60 * 60 * 1000)) + 1}` };
    });

    // Map interventions to x positions
    const interventionMarkers = interventions
        .filter(iv => {
            const t = new Date(iv.timestamp).getTime();
            return t >= minTime && t <= maxTime;
        })
        .map(iv => ({
            ...iv,
            x: xScale(iv.timestamp),
        }));

    return (
        <div className="trend-timeline">
            <div className="trend-timeline__controls">
                {([['all', 'All Data'], ['respiratory', 'Respiratory'], ['infection', 'Infection Markers']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        className={`btn btn--ghost ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key)}
                    >
                        {label}
                    </button>
                ))}
                <button
                    className={`btn btn--ghost ${showRiskOverlay ? 'active' : ''}`}
                    onClick={() => setShowRiskOverlay(!showRiskOverlay)}
                >
                    📈 Risk Overlay
                </button>
            </div>

            <div className="trend-timeline__chart-wrapper">
                <svg viewBox={`0 0 ${width} ${height}`} className="trend-timeline__svg">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                        <line
                            key={i}
                            x1={padding.left}
                            y1={padding.top + frac * chartH}
                            x2={padding.left + chartW}
                            y2={padding.top + frac * chartH}
                            stroke="rgba(148,163,184,0.08)"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Risk overlay zone */}
                    {showRiskOverlay && (
                        <>
                            <rect x={padding.left} y={padding.top} width={chartW} height={chartH * 0.3} fill="rgba(239,68,68,0.06)" rx="4" />
                            <rect x={padding.left} y={padding.top + chartH * 0.3} width={chartW} height={chartH * 0.3} fill="rgba(245,158,11,0.04)" rx="4" />
                            <text x={padding.left + 4} y={padding.top + 14} fill="var(--risk-high)" fontSize="9" opacity="0.7">High</text>
                            <text x={padding.left + 4} y={padding.top + chartH * 0.3 + 14} fill="var(--risk-moderate)" fontSize="9" opacity="0.7">Moderate</text>
                            <text x={padding.left + 4} y={padding.top + chartH * 0.6 + 14} fill="var(--risk-low)" fontSize="9" opacity="0.7">Low</text>
                        </>
                    )}

                    {/* Data lines */}
                    {filteredVitals.map((series, i) => (
                        <path
                            key={i}
                            d={buildPath(series)}
                            fill="none"
                            stroke={series.color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.85"
                        />
                    ))}

                    {/* Intervention markers */}
                    {interventionMarkers.map((iv, i) => (
                        <g key={i}>
                            <line x1={iv.x} y1={padding.top} x2={iv.x} y2={padding.top + chartH} stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
                            <text x={iv.x} y={padding.top - 4} textAnchor="middle" fontSize="12">{iv.icon}</text>
                        </g>
                    ))}

                    {/* Time axis */}
                    {timeLabels.map((tl, i) => (
                        <text key={i} x={tl.x} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                            {tl.label}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Legend */}
            <div className="trend-timeline__legend">
                {filteredVitals.map((series, i) => (
                    <span key={i} className="trend-timeline__legend-item">
                        <span className="trend-timeline__legend-dot" style={{ background: series.color }} />
                        {series.label} ({series.unit})
                    </span>
                ))}
                {interventionMarkers.length > 0 && (
                    <span className="trend-timeline__legend-item">
                        <span className="trend-timeline__legend-dot" style={{ background: 'var(--text-muted)' }} />
                        Interventions
                    </span>
                )}
            </div>
        </div>
    );
}
