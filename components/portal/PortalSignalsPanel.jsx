'use client';

import { motion } from 'framer-motion';

function fmtDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('fr-CA', { dateStyle: 'medium' });
    } catch {
        return '—';
    }
}

export default function PortalSignalsPanel({ prompts = [], sources = [] }) {
    const hasPrompts = prompts.length > 0;
    const hasSources = sources.length > 0;

    if (!hasPrompts && !hasSources) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
        >
            <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/20">
                Annexes stratégiques
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Tracked prompts */}
                {hasPrompts && (
                    <div className="rounded-[24px] border border-white/[0.05] bg-[#0a0a0d] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.32)]">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b8fff]/40">
                            Signaux suivis
                        </div>
                        <h3 className="mb-6 text-[16px] font-bold tracking-[-0.02em] text-white">
                            Requêtes de visibilité
                        </h3>

                        <div className="space-y-2.5">
                            {prompts.map((prompt, i) => (
                                <motion.div
                                    key={prompt.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                                    className="group rounded-xl border border-white/[0.035] bg-white/[0.012] p-4 transition-colors duration-200 hover:border-white/[0.08] hover:bg-white/[0.022]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[13px] font-semibold text-white/85">
                                                {prompt.query_text}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-[11px] text-white/25">
                                                <span className="uppercase tracking-[0.1em]">{prompt.category}</span>
                                                <span className="text-white/10">·</span>
                                                <span>{fmtDate(prompt.last_run_at)}</span>
                                            </div>
                                        </div>
                                        <div
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                prompt.target_found
                                                    ? 'border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300'
                                                    : 'border border-white/[0.05] bg-white/[0.025] text-white/30'
                                            }`}
                                        >
                                            {prompt.target_found
                                                ? prompt.target_position != null
                                                    ? `#${prompt.target_position}`
                                                    : 'Cité'
                                                : '—'}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top sources */}
                {hasSources && (
                    <div className="rounded-[24px] border border-white/[0.05] bg-[#0a0a0d] p-7 shadow-[0_16px_48px_rgba(0,0,0,0.32)]">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b8fff]/40">
                            Écosystème
                        </div>
                        <h3 className="mb-6 text-[16px] font-bold tracking-[-0.02em] text-white">
                            Sources citées
                        </h3>

                        <div className="space-y-2">
                            {sources.map((source, i) => (
                                <motion.div
                                    key={`${source.host}-${source.count}`}
                                    initial={{ opacity: 0, x: -8 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.04, duration: 0.35, ease: 'easeOut' }}
                                    className="flex items-center justify-between rounded-xl border border-white/[0.035] bg-white/[0.012] px-4 py-3.5 transition-colors duration-200 hover:border-white/[0.08] hover:bg-white/[0.022]"
                                >
                                    <div className="text-[13px] font-medium text-white/75">{source.host}</div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-1 overflow-hidden rounded-full bg-[#5b73ff]/15"
                                            style={{ width: `${Math.min(source.count * 14, 84)}px` }}
                                        >
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '100%' }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                                                className="h-full rounded-full bg-[#5b73ff]/50"
                                            />
                                        </div>
                                        <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-white/35">
                                            {source.count}×
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.section>
    );
}
