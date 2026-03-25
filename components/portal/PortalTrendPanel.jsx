'use client';

import { motion } from 'framer-motion';
import PremiumSparkline from '@/components/ui/PremiumSparkline';

function deltaDisplay(delta, unit) {
    if (delta == null) return { text: '—', cls: 'text-white/20' };
    const suffix = unit === 'percent' ? ' pt' : '';
    if (delta > 0) return { text: `+${delta}${suffix}`, cls: 'text-emerald-400' };
    if (delta < 0) return { text: `${delta}${suffix}`, cls: 'text-red-400/75' };
    return { text: `stable`, cls: 'text-white/30' };
}

function valueStr(latest, unit) {
    if (latest == null) return '—';
    return unit === 'percent' ? `${latest}%` : `${latest}`;
}

function deriveTrendNarrative(metrics) {
    const withDelta = metrics.filter((m) => m.delta != null);
    if (withDelta.length === 0) return null;

    const up = withDelta.filter((m) => m.delta > 0);
    const down = withDelta.filter((m) => m.delta < 0);

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

function TrendDualChart({ sparklines = {} }) {
    const seo = sparklines.seo_score || [];
    const geo = sparklines.geo_score || [];
    const hasSeo = seo.filter((v) => v != null).length >= 2;
    const hasGeo = geo.filter((v) => v != null).length >= 2;

    if (!hasSeo && !hasGeo) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mx-8 mb-6 rounded-xl border border-white/[0.04] bg-white/[0.008] p-5 md:mx-10"
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/20">
                    Évolution SEO & GEO
                </span>
                <div className="flex gap-3">
                    {hasSeo && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.06em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
                            <span className="text-emerald-400/60">SEO</span>
                        </span>
                    )}
                    {hasGeo && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.06em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#7b8fff]" style={{ boxShadow: '0 0 6px #7b8fff' }} />
                            <span className="text-[#7b8fff]/60">GEO</span>
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-center gap-4">
                {hasSeo && (
                    <PremiumSparkline data={seo} color="#34d399" width={180} height={48} strokeWidth={2} />
                )}
                {hasGeo && (
                    <PremiumSparkline data={geo} color="#7b8fff" width={180} height={48} strokeWidth={2} />
                )}
            </div>
        </motion.div>
    );
}

const ease = [0.16, 1, 0.3, 1];

export default function PortalTrendPanel({ trendSummary }) {
    const metrics = trendSummary?.metrics || [];
    const coverage = trendSummary?.coverage || {};
    const sparklines = trendSummary?.sparklines || {};
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

            {/* Dual SEO/GEO trend chart */}
            <TrendDualChart sparklines={sparklines} />

            {metrics.length === 0 ? (
                <div className="px-8 pb-8 md:px-10 md:pb-10">
                    <EmptyState />
                </div>
            ) : (
                <div className="border-t border-white/[0.03]">
                    <div className="grid divide-y divide-white/[0.03] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
                        {metrics.map((metric, i) => {
                            const d = deltaDisplay(metric.delta, metric.unit);
                            const sparkColor = metric.delta > 0 ? '#34d399' : metric.delta < 0 ? '#f87171' : '#94a3b8';
                            const sparkData = sparklines[metric.key] || [];
                            const hasSparkData = sparkData.filter((v) => v != null).length >= 2;

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
                                        {hasSparkData ? (
                                            <PremiumSparkline
                                                data={sparkData}
                                                color={sparkColor}
                                                width={56}
                                                height={22}
                                                strokeWidth={1.5}
                                                showEndDot={false}
                                            />
                                        ) : (
                                            <div className="h-[22px] w-[56px]" />
                                        )}
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="text-[28px] font-black tabular-nums tracking-[-0.03em] text-white">
                                            {valueStr(metric.latest, metric.unit)}
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className={`text-[14px] font-bold tabular-nums ${d.cls}`}>
                                                {d.text}
                                            </span>
                                            {metric.delta != null && (
                                                <span className="text-[10px] text-white/15">sur 30 jours</span>
                                            )}
                                        </div>
                                    </div>

                                    {metric.latest != null && metric.unit === 'percent' && (
                                        <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.025]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${Math.min(metric.latest, 100)}%` }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.5 + i * 0.1, duration: 1.2, ease }}
                                                className="h-full rounded-full"
                                                style={{
                                                    background: `linear-gradient(90deg, ${sparkColor}55, ${sparkColor}18)`,
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
