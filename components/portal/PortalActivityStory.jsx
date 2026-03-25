'use client';

import { motion } from 'framer-motion';

function fmtDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
}

function fmtTime(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function activityGlyph(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('audit')) return '◈';
    if (t.includes('prompt') || t.includes('requete') || t.includes('analyse')) return '◇';
    if (t.includes('publi') || t.includes('profil')) return '▣';
    return '▪';
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.012] px-8 py-12 text-center">
            <div className="text-[14px] text-white/30">
                Les premières interventions apparaîtront ici dès qu'elles seront enregistrées.
            </div>
        </div>
    );
}

export default function PortalActivityStory({ items = [] }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0e] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:p-10"
        >
            <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#5b73ff]/15 to-transparent" />

            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8fff]/60">
                Journal de mandat
            </div>
            <h2 className="mb-8 text-xl font-bold tracking-[-0.03em] text-white">Travaux réalisés</h2>

            {items.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-[#5b73ff]/25 via-white/[0.05] to-transparent" />

                    <div>
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -14 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
                                className="group relative pb-7 pl-10 last:pb-0"
                            >
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-1.5 flex h-[23px] w-[23px] items-center justify-center">
                                    <div className="h-2.5 w-2.5 rounded-full border-2 border-[#5b73ff]/30 bg-[#0b0b0e] transition-colors duration-300 group-hover:border-[#5b73ff]/70 group-hover:bg-[#5b73ff]/15" />
                                </div>

                                <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 transition-all duration-300 hover:border-white/[0.09] hover:bg-white/[0.025]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span className="text-xs text-[#5b73ff]/40">
                                                    {activityGlyph(item.title)}
                                                </span>
                                                <span className="text-[14px] font-semibold text-white">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <p className="text-[13px] leading-[1.65] text-white/40">
                                                {item.description}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-[12px] font-medium text-white/25">
                                                {fmtDate(item.created_at)}
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-white/15">
                                                {fmtTime(item.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.section>
    );
}
