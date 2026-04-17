import { useCallback, useMemo, useRef, useState } from 'react';
import { COMMAND_COLORS } from '../tokens';

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function buildSegments(values, xForIndex, yForValue) {
    const segments = [];
    let current = [];

    values.forEach((value, index) => {
        if (!isFiniteNumber(value)) {
            if (current.length > 0) {
                segments.push(current);
                current = [];
            }
            return;
        }

        current.push([xForIndex(index), yForValue(value)]);
    });

    if (current.length > 0) segments.push(current);
    return segments;
}

function toPath(points) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ');
}

export default function CommandLineChart({
    labels = [],
    series = [],
    min = 0,
    max = 100,
    height = 240,
}) {
    const svgRef = useRef(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    if (!labels.length || !series.length) return null;

    const width = 640;
    const pad = { top: 20, right: 16, bottom: 42, left: 16 };
    const innerWidth = width - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;

    const xForIndex = useCallback((index) => pad.left + (labels.length <= 1 ? innerWidth / 2 : (index / (labels.length - 1)) * innerWidth), [innerWidth, labels.length, pad.left]);
    const yForValue = useCallback((value) => pad.top + innerHeight - ((value - min) / (max - min || 1)) * innerHeight, [innerHeight, max, min, pad.top]);

    const gridValues = [min, Math.round((min + max) / 2), max];

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * width;
        
        // Find closest index
        const relativeX = x - pad.left;
        const progress = relativeX / innerWidth;
        const index = Math.round(progress * (labels.length - 1));
        
        if (index >= 0 && index < labels.length) {
            setHoveredIndex(index);
        } else {
            setHoveredIndex(null);
        }
    };

    const activeLabel = hoveredIndex !== null ? labels[hoveredIndex] : null;
    const activeData = useMemo(() => {
        if (hoveredIndex === null) return [];
        return series.map(s => ({
            label: s.label,
            color: s.color,
            value: s.values[hoveredIndex]
        })).filter(d => isFiniteNumber(d.value));
    }, [hoveredIndex, series]);

    return (
        <div className="group relative h-full w-full select-none" onMouseLeave={() => setHoveredIndex(null)}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full cursor-crosshair"
                preserveAspectRatio="none"
                aria-hidden="true"
                onMouseMove={handleMouseMove}
            >
                <defs>
                    <linearGradient id="command-chart-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    {series.map((s, i) => (
                        <filter key={`glow-${i}`} id={`glow-${i}`}>
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    ))}
                </defs>

                {/* Grid Lines */}
                {gridValues.map((value) => (
                    <g key={value}>
                        <line
                            x1={pad.left}
                            x2={width - pad.right}
                            y1={yForValue(value)}
                            y2={yForValue(value)}
                            stroke="rgba(255,255,255,0.06)"
                            strokeDasharray="4 8"
                        />
                        <text x={width - pad.right} y={yForValue(value) - 6} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.24)">
                            {value}
                        </text>
                    </g>
                ))}

                {/* Vertical Cursor */}
                {hoveredIndex !== null && (
                    <line
                        x1={xForIndex(hoveredIndex)}
                        x2={xForIndex(hoveredIndex)}
                        y1={pad.top}
                        y2={height - pad.bottom}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                )}

                {/* Lines */}
                {series.map((entry, seriesIndex) => {
                    const segments = buildSegments(entry.values || [], xForIndex, yForValue);
                    const lastPoint = [...segments].reverse().find((segment) => segment.length > 0)?.at(-1) || null;

                    return (
                        <g key={entry.id || entry.label}>
                            {segments.map((segment, segmentIndex) => (
                                <path
                                    key={`${entry.id || entry.label}-${segmentIndex}`}
                                    d={toPath(segment)}
                                    fill="none"
                                    stroke={entry.color || COMMAND_COLORS.info}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all duration-300"
                                    style={{ 
                                        opacity: hoveredIndex === null ? 1 : 0.4,
                                        filter: hoveredIndex === null ? `url(#glow-${seriesIndex})` : 'none'
                                    }}
                                />
                            ))}
                            {lastPoint && hoveredIndex === null && (
                                <circle
                                    cx={lastPoint[0]}
                                    cy={lastPoint[1]}
                                    r="4.5"
                                    fill={entry.color || COMMAND_COLORS.info}
                                    stroke="rgba(9,11,16,0.95)"
                                    strokeWidth="2"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Hover Markers */}
                {hoveredIndex !== null && activeData.map((d, i) => (
                    <g key={`marker-${i}`}>
                        <circle
                            cx={xForIndex(hoveredIndex)}
                            cy={yForValue(d.value)}
                            r="6"
                            fill={d.color}
                            stroke="rgba(9,11,16,0.95)"
                            strokeWidth="3"
                        />
                        <circle
                            cx={xForIndex(hoveredIndex)}
                            cy={yForValue(d.value)}
                            r="12"
                            fill={d.color}
                            fillOpacity="0.15"
                        />
                    </g>
                ))}

                {/* X Axis Labels */}
                {labels.map((label, index) => {
                    const show = index === 0 || index === labels.length - 1 || index === Math.floor(labels.length / 2);
                    if (!show) return null;
                    return (
                        <text
                            key={`${label}-${index}`}
                            x={xForIndex(index)}
                            y={height - 12}
                            textAnchor="middle"
                            fontSize="10"
                            fill="rgba(255,255,255,0.34)"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && (
                <div 
                    className="pointer-events-none absolute z-10 flex flex-col gap-2 rounded-xl border border-white/[0.12] bg-[#0d1017]/95 p-3 shadow-2xl backdrop-blur-md"
                    style={{
                        left: `${(xForIndex(hoveredIndex) / width) * 100}%`,
                        top: '12px',
                        transform: hoveredIndex > labels.length / 2 ? 'translateX(calc(-100% - 16px))' : 'translateX(16px)'
                    }}
                >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{activeLabel}</div>
                    <div className="flex flex-col gap-1.5">
                        {activeData.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[12px] font-medium text-white/70">{d.label}</span>
                                <span className="ml-auto text-[13px] font-bold text-white">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

