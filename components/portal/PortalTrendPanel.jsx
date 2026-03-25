'use client';

import { motion } from 'framer-motion';

function deltaDisplay(delta, unit) {
    if (delta == null) return { text: '—', cls: 'text-white/20', narrative: '' };
    const suffix = unit === 'percent' ? ' pt' : '';
    if (delta > 0) return { text: `+${delta}${suffix}`, cls: 'text-emerald-400', narrative: 'en hausse' };
    if (delta < 0) return { text: `${delta}${suffix}`, cls: 'text-red-400/75', narrative: 'en recul' };
    return { text: `stable`, cls: 'text-white/30', narrative: 'stable' };
}

function valueStr(latest, unit) {
    if (latest == null) return '—';
    return unit === 'percent' ? `${latest}%` : `${latest}`;
}

function MiniSparkline({ delta, color }) {
    const points = delta > 0
        ? 'M0,16 C4,15 8,13 12,10 16,8 20,6 24,5 28,3 32,2'
        : delta < 0
            ? 'M0,3 C4,4 8,6 12,8 16,11 20,13 24,14 28,15 32,16'
            : 'M0,9 C8,9 16,10 24,9 32,9';

    return (
        <svg width="36" height="18" viewBox="0 0 36 18" fill="none" className="opacity-60">
            <path
                d={points}
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
            />
            <defs>
                <linearGradient id={`fill-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`${points} L32,18 L0,18 Z`}
                fill={`url(#fill-${color})`}
            />
        </svg>
    );
}

function deriveTrendNarrative(metrics) {
    const withDelta = metrics.filter(m => m.delta != null);
    if (withDelta.length === 0) return null;

    const up = withDelta.filter(m => m.delta > 0);
    const down = withDelta.filter(m => m.delta < 0);

    if (up.length > 0 && down.length === 0) {
        return `Tous les indicateurs suivis sont en progression sur les 30 derniers jours. Le dossier évolue dans la bonne direction.`;
    }
    if (down.length > 0 && up.length === 0) {
        return `Certains indicateurs affichent un recul. L'équipe a identifié ces points d'attention et travaille sur les actions correctives.`;
    }
    if (up.length > down.length) {
        return `La tendance générale reste positive, avec ${up.length} indicateur${up.length > 1 ? 's' : ''} en hausse. ${down.length > 0 ? `${down.length} point${down.length > 1 ? 's' : ''} d'attention identifié${down.length > 1 ? 's' : ''}.` : ''}`;
    }
    return `Évolution mixte sur la période : ${up.length} indicateur${up.length > 1 ? 's' : ''} en hausse, ${down.length} en recul. L'analyse détaillée est en cours.`;
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-white/[0.05] bg-white/[0.01] px-8 py-14 text-center">
            <div className="text-[14px] text-white/25">
                Les premières tendances apparaîtront après plusieurs cycles de mesure.
            </div>
        </div>
    );
}

const ease = [0.16, 1, 0.3, 1];

export default function PortalTrendPanel({ trendSummary }) {
    const metrics = trendSummary?.metrics || [];
    const coverage = trendSummary?.coverage || {};
    const narrative = deriveTrendNarrative(metrics);

    return (
        <motion.section
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.05] bg-[#0a0a0d] shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
        >
            <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent" />

            {/* Header */}
            <div className="px-8 pb-0 pt-8 md:px-10 md:pt-10">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]/45">
                            Évolution
                        </div>
                        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-white">Tendances du mandat</h2>
                    </div>
                    {coverage.points > 0 && (
                        <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5 text-[11px] tabular-nums text-white/22">
                            {coverage.points} mesures · {coverage.startDate || '—'} → {coverage.endDate || '—'}
                        </div>
                    )}
                </div>

                {/* Narrative synthesis */}
                {narrative && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mb-8 border-l-2 border-white/[0.05] pl-5"
                    >
                        <p className="max-w-2xl text-[14px] leading-[1.72] text-white/35">{narrative}</p>
                    </motion.div>
                )}
            </div>

            {metrics.length === 0 ? (
                <div className="px-8 pb-8 md:px-10 md:pb-10">
                    <EmptyState />
                </div>
            ) : (
                <div className="border-t border-white/[0.03]">
                    <div className="grid divide-y divide-white/[0.03] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
                        {metrics.map((metric, i) => {
                            const d = deltaDisplay(metric.delta, metric.unit);
                            const sparkColor = metric.delta > 0 ? '#34d399' : metric.delta < 0 ? '#f87171' : '#ffffff';

                            return (
                                <motion.div
                                    key={metric.key}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-30px' }}
                                    transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
                                    className="group relative px-7 py-6 transition-colors duration-300 hover:bg-white/[0.01]"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/22">
                                            {metric.label}
                                        </span>
                                        <MiniSparkline delta={metric.delta} color={sparkColor} />
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="text-[28px] font-black tabular-nums tracking-[-0.03em] text-white">
                                            {valueStr(metric.latest, metric.unit)}
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className={`text-[14px] font-bold tabular-nums ${d.cls}`}>{d.text}</span>
                                            {metric.delta != null && (
                                                <span className="text-[10px] text-white/15">sur 30 jours</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subtle progress fill at bottom */}
                                    {metric.latest != null && metric.unit === 'percent' && (
                                        <div className="mt-4 h-[2px] overflow-hidden rounded-full bg-white/[0.025]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${Math.min(metric.latest, 100)}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.5 + i * 0.1, duration: 1.2, ease }}
                                                className="h-full rounded-full"
                                                style={{
                                                    background: `linear-gradient(90deg, ${sparkColor}40, ${sparkColor}15)`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.section>
    );
}
