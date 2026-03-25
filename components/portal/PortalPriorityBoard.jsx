'use client';

import { motion } from 'framer-motion';

const ACCENTS = ['#5b73ff', '#a78bfa', '#34d399'];

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.012] px-8 py-12 text-center">
            <div className="text-[14px] text-white/30">
                Les priorités seront définies lors du prochain cycle d'analyse.
            </div>
        </div>
    );
}

export default function PortalPriorityBoard({ priorities = [] }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0e] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:p-10"
        >
            <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#a78bfa]/15 to-transparent" />

            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8fff]/60">
                Plan d'action
            </div>
            <h2 className="mb-8 text-xl font-bold tracking-[-0.03em] text-white">Priorités actuelles</h2>

            {priorities.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    {priorities.map((priority, i) => {
                        const accent = ACCENTS[i % ACCENTS.length];
                        return (
                            <motion.div
                                key={`${priority.title}-${i}`}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: 0.08 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                                className="group relative rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.03]"
                            >
                                {/* Top accent hairline */}
                                <div
                                    className="absolute left-6 right-6 top-0 h-px"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${accent}35, transparent)`,
                                    }}
                                />

                                <div
                                    className="mb-4 font-mono text-[30px] font-black tracking-[-0.04em] opacity-[0.1]"
                                    style={{ color: accent }}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </div>

                                <div className="mb-2 text-[14px] font-bold tracking-[-0.01em] text-white">
                                    {priority.title}
                                </div>

                                <p className="text-[13px] leading-[1.65] text-white/38">
                                    {priority.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.section>
    );
}
