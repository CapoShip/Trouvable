'use client';

import { motion } from 'framer-motion';

function deltaDisplay(delta, unit) {
    if (delta == null) return { text: '—', cls: 'text-white/25' };
    const suffix = unit === 'percent' ? '%' : '';
    if (delta > 0) return { text: `+${delta}${suffix}`, cls: 'text-emerald-400' };
    if (delta < 0) return { text: `${delta}${suffix}`, cls: 'text-red-400/80' };
    return { text: `=${delta}${suffix}`, cls: 'text-white/35' };
}

function valueStr(latest, unit) {
    if (latest == null) return '—';
    return unit === 'percent' ? `${latest}%` : `${latest}`;
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.012] px-8 py-12 text-center">
            <div className="text-[14px] text-white/30">
                Les premières tendances apparaîtront après plusieurs cycles de mesure.
            </div>
        </div>
    );
}

export default function PortalTrendPanel({ trendSummary }) {
    const metrics = trendSummary?.metrics || [];
    const coverage = trendSummary?.coverage || {};

    return (
        <motion.section
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0e] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:p-10"
        >
            <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/12 to-transparent" />

            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8fff]/60">
                        Évolution
                    </div>
                    <h2 className="text-xl font-bold tracking-[-0.03em] text-white">Tendances du mandat</h2>
                </div>
                {coverage.points > 0 && (
                    <div className="text-[11px] text-white/20">
                        {coverage.points} mesures · {coverage.startDate || '—'} → {coverage.endDate || '—'}
                    </div>
                )}
            </div>

            {metrics.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((metric, i) => {
                        const d = deltaDisplay(metric.delta, metric.unit);
                        return (
                            <motion.div
                                key={metric.key}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: i * 0.06, duration: 0.45, ease: 'easeOut' }}
                                className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 transition-colors duration-200 hover:border-white/[0.09] hover:bg-white/[0.025]"
                            >
                                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
                                    {metric.label}
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="text-[24px] font-black tabular-nums tracking-[-0.03em] text-white">
                                        {valueStr(metric.latest, metric.unit)}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-[13px] font-semibold ${d.cls}`}>{d.text}</span>
                                        {metric.delta != null && (
                                            <span className="text-[10px] text-white/15">30j</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.section>
    );
}
