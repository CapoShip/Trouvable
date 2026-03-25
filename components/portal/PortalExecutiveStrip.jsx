'use client';

import { motion } from 'framer-motion';

function deriveOverallState(visibility, completeness) {
    const seo = visibility.seo_score;
    const geo = visibility.geo_score;
    const avg = seo != null && geo != null ? Math.round((seo + geo) / 2) : (seo ?? geo ?? null);

    if (avg == null)
        return { label: "En cours d'évaluation", sub: 'Les premiers résultats sont en préparation', accent: 'text-white/55' };
    if (avg >= 75)
        return { label: 'Excellent', sub: `Score consolidé : ${avg}/100`, accent: 'text-emerald-400' };
    if (avg >= 50)
        return { label: 'En progression', sub: `Score consolidé : ${avg}/100`, accent: 'text-[#7b8fff]' };
    return { label: 'Chantier en cours', sub: `Score consolidé : ${avg}/100`, accent: 'text-amber-300' };
}

function deriveWorkState(items) {
    const count = items.length;
    if (count === 0) return { label: 'Aucune activité récente', sub: "En attente de la prochaine intervention", accent: 'text-white/55' };

    const latest = items[0];
    const dateStr = latest?.created_at
        ? new Date(latest.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
        : null;

    return {
        label: `${count} intervention${count > 1 ? 's' : ''} récente${count > 1 ? 's' : ''}`,
        sub: dateStr ? `Dernière action · ${dateStr}` : (latest?.title || ''),
        accent: 'text-white',
    };
}

function deriveTrendState(trendSummary) {
    const metrics = trendSummary?.metrics || [];
    const withDelta = metrics.filter((m) => m.delta != null);

    if (withDelta.length === 0)
        return { label: 'Données insuffisantes', sub: 'Les premières tendances apparaîtront prochainement', accent: 'text-white/55' };

    const up = withDelta.filter((m) => m.delta > 0).length;
    const down = withDelta.filter((m) => m.delta < 0).length;

    if (up > down)
        return { label: 'Tendance positive', sub: `${up} indicateur${up > 1 ? 's' : ''} en hausse sur 30 jours`, accent: 'text-emerald-400' };
    if (down > up)
        return { label: "Points d'attention", sub: `${down} indicateur${down > 1 ? 's' : ''} en recul sur 30 jours`, accent: 'text-amber-300' };
    return { label: 'Stabilité', sub: 'Les indicateurs sont stables sur 30 jours', accent: 'text-white/55' };
}

const TILES = [
    { key: 'state', title: 'État du mandat', glyph: '◆' },
    { key: 'work', title: 'Activité récente', glyph: '▸' },
    { key: 'trend', title: 'Évolution', glyph: '△' },
];

export default function PortalExecutiveStrip({ visibility, completeness, recentWorkItems, trendSummary }) {
    const states = {
        state: deriveOverallState(visibility, completeness),
        work: deriveWorkState(recentWorkItems),
        trend: deriveTrendState(trendSummary),
    };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TILES.map((tile, i) => {
                const data = states[tile.key];
                return (
                    <motion.div
                        key={tile.key}
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ delay: i * 0.09, duration: 0.55, ease: 'easeOut' }}
                        className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0b0e] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-white/[0.11] hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                    >
                        <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                        <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/25">
                            <span className="text-[#5b73ff]/50">{tile.glyph}</span>
                            {tile.title}
                        </div>

                        <div className={`mb-1.5 text-[17px] font-bold tracking-[-0.02em] ${data.accent}`}>
                            {data.label}
                        </div>

                        <div className="text-[13px] leading-relaxed text-white/35">{data.sub}</div>
                    </motion.div>
                );
            })}
        </div>
    );
}
