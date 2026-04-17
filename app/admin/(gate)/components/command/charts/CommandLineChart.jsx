import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COMMAND_COLORS } from '../tokens';

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Builds points for smooth cubic bezier curves
 */
function getCurvePath(points) {
    if (points.length < 2) return '';
    const d = points.reduce((path, point, i, a) => {
        if (i === 0) return `M ${point[0]},${point[1]}`;
        const prev = a[i - 1];
        const cpsX = prev[0] + (point[0] - prev[0]) / 2;
        return `${path} C ${cpsX},${prev[1]} ${cpsX},${point[1]} ${point[0]},${point[1]}`;
    }, '');
    return d;
}

function getAreaPath(points, height, padBottom) {
    if (points.length < 2) return '';
    const curve = getCurvePath(points);
    const last = points[points.length - 1];
    const first = points[0];
    const baseLine = height - padBottom;
    return `${curve} L ${last[0]},${baseLine} L ${first[0]},${baseLine} Z`;
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
    const pad = { top: 24, right: 16, bottom: 48, left: 16 };
    const innerWidth = width - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;

    const xForIndex = useCallback((index) => pad.left + (labels.length <= 1 ? innerWidth / 2 : (index / (labels.length - 1)) * innerWidth), [innerWidth, labels.length, pad.left]);
    const yForValue = useCallback((value) => pad.top + innerHeight - ((value - min) / (max - min || 1)) * innerHeight, [innerHeight, max, min, pad.top]);

    const gridValues = [min, Math.round((min + max) / 2), max];

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * width;
        const relativeX = x - pad.left;
        const progress = relativeX / innerWidth;
        const index = Math.round(progress * (labels.length - 1));
        
        if (index >= 0 && index < labels.length) {
            setHoveredIndex(index);
        } else {
            setHoveredIndex(null);
        }
    };

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
                className="h-full w-full cursor-crosshair overflow-visible"
                preserveAspectRatio="none"
                aria-hidden="true"
                onMouseMove={handleMouseMove}
            >
                <defs>
                    {series.map((s, i) => (
                        <g key={`defs-${i}`}>
                            <linearGradient id={`area-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                            </linearGradient>
                            <filter id={`glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </g>
                    ))}
                    <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.05)" />
                    </pattern>
                </defs>

                {/* Background Grid */}
                <rect width={width} height={height} fill="url(#dot-grid)" />

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
                        <text x={width - pad.right} y={yForValue(value) - 8} textAnchor="end" fontSize="10" fontWeight="600" fill="rgba(255,255,255,0.2)">
                            {value}
                        </text>
                    </g>
                ))}

                {/* Vertical Cursor */}
                <AnimatePresence>
                    {hoveredIndex !== null && (
                        <motion.line
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            x1={xForIndex(hoveredIndex)}
                            x2={xForIndex(hoveredIndex)}
                            y1={pad.top}
                            y2={height - pad.bottom}
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    )}
                </AnimatePresence>

                {/* Areas & Lines */}
                {series.map((entry, i) => {
                    const points = (entry.values || [])
                        .map((v, idx) => isFiniteNumber(v) ? [xForIndex(idx), yForValue(v)] : null)
                        .filter(Boolean);
                    
                    if (points.length < 2) return null;

                    const curve = getCurvePath(points);
                    const area = getAreaPath(points, height, pad.bottom);

                    return (
                        <g key={entry.id || entry.label}>
                            <motion.path
                                d={area}
                                fill={`url(#area-grad-${i})`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: hoveredIndex === null ? 1 : 0.4 }}
                                transition={{ duration: 0.6 }}
                            />
                            <motion.path
                                d={curve}
                                fill="none"
                                stroke={entry.color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter={`url(#glow-${i})`}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: hoveredIndex === null ? 1 : 0.3 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                            />
                        </g>
                    );
                })}

                {/* Hover Markers */}
                <AnimatePresence>
                    {hoveredIndex !== null && activeData.map((d, i) => (
                        <motion.g 
                            key={`marker-${i}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <circle
                                cx={xForIndex(hoveredIndex)}
                                cy={yForValue(d.value)}
                                r="10"
                                fill={d.color}
                                fillOpacity="0.2"
                            />
                            <motion.circle
                                cx={xForIndex(hoveredIndex)}
                                cy={yForValue(d.value)}
                                fill="white"
                                stroke={d.color}
                                strokeWidth="3"
                                initial={{ r: 4 }}
                                animate={{ r: [4, 6, 4] }}
                                transition={{ 
                                    r: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                                    scale: { duration: 0.2 }
                                }}
                            />
                        </motion.g>
                    ))}
                </AnimatePresence>

                {/* X Axis */}
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
                            fontWeight="600"
                            fill="rgba(255,255,255,0.25)"
                            className="uppercase tracking-widest"
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>

            {/* Premium Tooltip */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        className="pointer-events-none absolute z-20 flex flex-col gap-3 rounded-[20px] border border-white/[0.12] bg-[#0d1017]/80 p-4 shadow-[0_24px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl"
                        style={{
                            left: `${(xForIndex(hoveredIndex) / width) * 100}%`,
                            top: '12px',
                            transform: hoveredIndex > labels.length / 2 ? 'translateX(calc(-100% - 24px))' : 'translateX(24px)'
                        }}
                    >
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{labels[hoveredIndex]}</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {activeData.map((d, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.color, color: d.color }} />
                                    <span className="text-[12px] font-semibold text-white/60">{d.label}</span>
                                    <span className="ml-auto text-[14px] font-bold tabular-nums text-white">{d.value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


