'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { COMMAND_EASE } from '../motion';

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function sanitizeSvgId(value) {
    return String(value || 'chart').replace(/[^a-zA-Z0-9_-]/g, '');
}

function getCurvePath(points) {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    return points.reduce((path, point, index, collection) => {
        if (index === 0) return `M ${point.x},${point.y}`;

        const previous = collection[index - 1];
        const controlX = previous.x + (point.x - previous.x) / 2;
        return `${path} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
    }, '');
}

function getAreaPath(points, baseline) {
    if (points.length < 2) return '';

    const first = points[0];
    const last = points[points.length - 1];
    return `${getCurvePath(points)} L ${last.x},${baseline} L ${first.x},${baseline} Z`;
}

function buildSegments(values, xForIndex, yForValue) {
    const segments = [];
    let currentSegment = [];

    values.forEach((value, index) => {
        if (!isFiniteNumber(value)) {
            if (currentSegment.length) segments.push(currentSegment);
            currentSegment = [];
            return;
        }

        currentSegment.push({
            index,
            value,
            x: xForIndex(index),
            y: yForValue(value),
        });
    });

    if (currentSegment.length) segments.push(currentSegment);

    return segments;
}

function buildTickValues(min, max, steps = 4) {
    if (!isFiniteNumber(min) || !isFiniteNumber(max)) return [0, 50, 100];
    if (max === min) return [min];

    return Array.from({ length: steps + 1 }, (_, index) => min + ((max - min) / steps) * index);
}

function buildVisibleLabelIndices(length, maxLabels = 5) {
    if (length <= 0) return [];
    if (length <= maxLabels) return Array.from({ length }, (_, index) => index);

    const indexes = new Set([0, length - 1]);
    const intervals = maxLabels - 1;

    for (let step = 1; step < intervals; step += 1) {
        indexes.add(Math.round((step * (length - 1)) / intervals));
    }

    return Array.from(indexes).sort((left, right) => left - right);
}

function formatAxisValue(value) {
    if (!isFiniteNumber(value)) return 'n.d.';
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getLastFiniteValue(values = []) {
    for (let index = values.length - 1; index >= 0; index -= 1) {
        if (isFiniteNumber(values[index])) return values[index];
    }
    return null;
}

export default function CommandLineChart({
    labels = [],
    series = [],
    min = 0,
    max = 100,
    height = 296,
    valueFormatter = (value) => `${Math.round(value)}%`,
    primarySeriesId = null,
}) {
    const svgRef = useRef(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const reactId = useId();
    const chartId = useMemo(() => sanitizeSvgId(reactId), [reactId]);

    const width = 720;
    const pad = { top: 18, right: 18, bottom: 42, left: 48 };
    const innerWidth = width - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;
    const baseline = height - pad.bottom;

    const xForIndex = useCallback(
        (index) => pad.left + (labels.length <= 1 ? innerWidth / 2 : (index / (labels.length - 1)) * innerWidth),
        [innerWidth, labels.length, pad.left]
    );

    const yForValue = useCallback(
        (value) => pad.top + innerHeight - ((value - min) / (max - min || 1)) * innerHeight,
        [innerHeight, max, min, pad.top]
    );

    const normalizedSeries = useMemo(() => {
        return (series || [])
            .map((entry, index) => {
                const normalizedValues = Array.from({ length: labels.length }, (_, valueIndex) => entry?.values?.[valueIndex] ?? null);
                const segments = buildSegments(normalizedValues, xForIndex, yForValue);
                const hasRenderableSegment = segments.some((segment) => segment.length >= 1);

                if (!hasRenderableSegment) return null;

                return {
                    id: entry?.id || entry?.label || `series-${index}`,
                    label: entry?.label || `Série ${index + 1}`,
                    color: entry?.color || '#60a5fa',
                    values: normalizedValues,
                    segments,
                    latestValue: getLastFiniteValue(normalizedValues),
                };
            })
            .filter(Boolean);
    }, [labels.length, series, xForIndex, yForValue]);

    const resolvedPrimarySeriesId = useMemo(() => {
        if (!normalizedSeries.length) return null;
        if (primarySeriesId && normalizedSeries.some((entry) => entry.id === primarySeriesId)) {
            return primarySeriesId;
        }
        return normalizedSeries[0].id;
    }, [normalizedSeries, primarySeriesId]);

    const decoratedSeries = useMemo(() => {
        return normalizedSeries.map((entry) => ({
            ...entry,
            isPrimary: entry.id === resolvedPrimarySeriesId,
        }));
    }, [normalizedSeries, resolvedPrimarySeriesId]);

    const tickValues = useMemo(() => buildTickValues(min, max, 4), [max, min]);
    const visibleLabelIndexes = useMemo(() => buildVisibleLabelIndices(labels.length, 5), [labels.length]);

    const activeData = useMemo(() => {
        if (hoveredIndex === null) return [];

        return decoratedSeries.map((entry) => ({
            id: entry.id,
            label: entry.label,
            color: entry.color,
            isPrimary: entry.isPrimary,
            value: entry.values[hoveredIndex] ?? null,
        }));
    }, [decoratedSeries, hoveredIndex]);

    const handlePointerMove = useCallback(
        (event) => {
            if (!svgRef.current || labels.length === 0) return;

            const rect = svgRef.current.getBoundingClientRect();
            const localX = ((event.clientX - rect.left) / rect.width) * width;
            const progress = (localX - pad.left) / innerWidth;
            const index = Math.round(progress * (labels.length - 1));

            if (index >= 0 && index < labels.length) {
                setHoveredIndex(index);
                return;
            }

            setHoveredIndex(null);
        },
        [innerWidth, labels.length, pad.left]
    );

    if (!labels.length || !decoratedSeries.length) {
        return null;
    }

    const tooltipX = hoveredIndex === null ? null : xForIndex(hoveredIndex);
    const tooltipPlacement = tooltipX !== null && tooltipX > width * 0.66 ? 'right' : 'left';

    return (
        <div className="group relative h-full w-full select-none overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.06),transparent_34%)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0))]" />

            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full overflow-visible"
                preserveAspectRatio="none"
                aria-hidden="true"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoveredIndex(null)}
            >
                <defs>
                    <linearGradient id={`${chartId}-plot`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.005)" />
                    </linearGradient>
                    <clipPath id={`${chartId}-clip`}>
                        <rect x={pad.left} y={pad.top} width={innerWidth} height={innerHeight} rx="18" />
                    </clipPath>
                    {decoratedSeries.map((entry) => (
                        <linearGradient key={`${entry.id}-area`} id={`${chartId}-area-${sanitizeSvgId(entry.id)}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={entry.isPrimary ? '0.22' : '0.10'} />
                            <stop offset="65%" stopColor={entry.color} stopOpacity={entry.isPrimary ? '0.06' : '0.02'} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                </defs>

                <rect
                    x={pad.left}
                    y={pad.top}
                    width={innerWidth}
                    height={innerHeight}
                    rx="20"
                    fill={`url(#${chartId}-plot)`}
                    stroke="rgba(255,255,255,0.04)"
                />

                {tickValues.map((value) => {
                    const y = yForValue(value);
                    const isBaseline = Math.abs(value - min) < 0.0001;

                    return (
                        <g key={`tick-${value}`}>
                            <line
                                x1={pad.left}
                                x2={width - pad.right}
                                y1={y}
                                y2={y}
                                stroke={isBaseline ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.055)'}
                                strokeWidth={isBaseline ? '1.1' : '1'}
                            />
                            <text
                                x="4"
                                y={y + 4}
                                fontSize="10.5"
                                fontWeight="600"
                                fill={isBaseline ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'}
                                className="tabular-nums"
                            >
                                {formatAxisValue(value)}
                            </text>
                        </g>
                    );
                })}

                {visibleLabelIndexes.map((index) => (
                    <text
                        key={`label-${index}`}
                        x={xForIndex(index)}
                        y={height - 10}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="600"
                        fill="rgba(255,255,255,0.34)"
                    >
                        {labels[index]}
                    </text>
                ))}

                <g clipPath={`url(#${chartId}-clip)`}>
                    {decoratedSeries.map((entry) => (
                        <g key={entry.id}>
                            {entry.isPrimary
                                ? entry.segments.map((segment, segmentIndex) => {
                                      if (segment.length < 2) return null;

                                      return (
                                          <motion.path
                                              key={`${entry.id}-area-${segmentIndex}`}
                                              d={getAreaPath(segment, baseline)}
                                              fill={`url(#${chartId}-area-${sanitizeSvgId(entry.id)})`}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: hoveredIndex === null ? 1 : 0.92 }}
                                              transition={{ duration: 0.45, ease: COMMAND_EASE }}
                                          />
                                      );
                                  })
                                : null}

                            {entry.segments.map((segment, segmentIndex) => {
                                if (segment.length === 1) {
                                    return (
                                        <motion.circle
                                            key={`${entry.id}-point-${segmentIndex}`}
                                            cx={segment[0].x}
                                            cy={segment[0].y}
                                            r={entry.isPrimary ? 3.6 : 3}
                                            fill={entry.color}
                                            fillOpacity={entry.isPrimary ? 0.95 : 0.72}
                                            initial={{ opacity: 0, scale: 0.75 }}
                                            animate={{ opacity: hoveredIndex === null ? 1 : entry.isPrimary ? 0.92 : 0.64, scale: 1 }}
                                            transition={{ duration: 0.32, ease: COMMAND_EASE }}
                                        />
                                    );
                                }

                                const path = getCurvePath(segment);
                                const inactiveOpacity = hoveredIndex === null ? 1 : entry.isPrimary ? 0.96 : 0.68;

                                return (
                                    <g key={`${entry.id}-path-${segmentIndex}`}>
                                        <motion.path
                                            d={path}
                                            fill="none"
                                            stroke={entry.color}
                                            strokeWidth={entry.isPrimary ? 6 : 4}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: entry.isPrimary ? 0.16 : 0.08 }}
                                            transition={{ duration: 0.45, ease: COMMAND_EASE }}
                                        />
                                        <motion.path
                                            d={path}
                                            fill="none"
                                            stroke={entry.color}
                                            strokeWidth={entry.isPrimary ? 2.5 : 1.7}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: inactiveOpacity }}
                                            transition={{
                                                duration: entry.isPrimary ? 0.92 : 0.82,
                                                delay: segmentIndex * 0.04,
                                                ease: COMMAND_EASE,
                                            }}
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    ))}
                </g>

                <AnimatePresence>
                    {hoveredIndex !== null ? (
                        <motion.line
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18, ease: COMMAND_EASE }}
                            x1={xForIndex(hoveredIndex)}
                            x2={xForIndex(hoveredIndex)}
                            y1={pad.top}
                            y2={baseline}
                            stroke="rgba(255,255,255,0.16)"
                            strokeWidth="1"
                        />
                    ) : null}
                </AnimatePresence>

                <AnimatePresence>
                    {hoveredIndex !== null
                        ? activeData.map((entry) => {
                              if (!isFiniteNumber(entry.value)) return null;

                              const y = yForValue(entry.value);

                              return (
                                  <motion.g
                                      key={`marker-${entry.id}`}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{ duration: 0.18, ease: COMMAND_EASE }}
                                  >
                                      <circle
                                          cx={xForIndex(hoveredIndex)}
                                          cy={y}
                                          r={entry.isPrimary ? 8 : 6.5}
                                          fill={entry.color}
                                          fillOpacity={entry.isPrimary ? '0.16' : '0.11'}
                                      />
                                      <circle
                                          cx={xForIndex(hoveredIndex)}
                                          cy={y}
                                          r={entry.isPrimary ? 3.2 : 2.8}
                                          fill="#f8fafc"
                                          stroke={entry.color}
                                          strokeWidth={entry.isPrimary ? '2.4' : '2'}
                                      />
                                  </motion.g>
                              );
                          })
                        : null}
                </AnimatePresence>
            </svg>

            <AnimatePresence>
                {hoveredIndex !== null && tooltipX !== null ? (
                    <div
                        className="pointer-events-none absolute top-3 z-20"
                        style={{
                            left: `${(tooltipX / width) * 100}%`,
                            transform: tooltipPlacement === 'right'
                                ? 'translateX(calc(-100% - 16px))'
                                : 'translateX(16px)',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: COMMAND_EASE }}
                            className="w-[min(240px,calc(100vw-2rem))] rounded-[18px] border border-white/[0.1] bg-[#0b0f16]/86 px-3.5 py-3 shadow-[0_18px_36px_rgba(0,0,0,0.32)] backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between gap-6 border-b border-white/[0.08] pb-2">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/[0.42]">
                                    {labels[hoveredIndex]}
                                </span>
                                <span className="text-[10px] font-medium text-white/[0.3]">Observé</span>
                            </div>

                            <div className="mt-3 flex flex-col gap-2.5">
                                {activeData.map((entry) => (
                                    <div key={entry.id} className="flex items-center gap-3">
                                        <span
                                            className="h-[2px] w-5 rounded-full"
                                            style={{
                                                backgroundColor: entry.color,
                                                opacity: entry.isPrimary ? 1 : 0.72,
                                            }}
                                        />
                                        <span className="text-[12px] font-medium text-white/[0.68]">{entry.label}</span>
                                        <span
                                            className="ml-auto text-[13px] font-semibold tabular-nums"
                                            style={{
                                                color: isFiniteNumber(entry.value) ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)',
                                            }}
                                        >
                                            {isFiniteNumber(entry.value) ? valueFormatter(entry.value) : 'n.d.'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
