'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

function formatDate(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString('fr-CA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return null;
    }
}

function freshnessConfig(freshness) {
    if (freshness === 'recent')
        return { label: 'Audit à jour', dot: 'bg-emerald-400', dotPing: 'bg-emerald-400' };
    if (freshness === 'outdated')
        return { label: 'Audit à rafraîchir', dot: 'bg-amber-400', dotPing: 'bg-amber-400' };
    return { label: "En attente d'audit", dot: 'bg-white/40', dotPing: 'bg-white/30' };
}

const heroTransition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] };

export default function PortalMandateHero({ client, visibility, completeness, membershipsCount = 1 }) {
    const freshness = freshnessConfig(visibility.audit_freshness);
    const lastAuditFormatted = formatDate(visibility.last_audit_at);

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
            className="relative overflow-hidden rounded-[32px] border border-white/[0.07] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)] md:p-10 lg:p-12"
            style={{
                background:
                    'radial-gradient(ellipse at 15% 0%, rgba(91,115,255,0.14), transparent 50%), ' +
                    'radial-gradient(ellipse at 85% 100%, rgba(167,139,250,0.08), transparent 45%), ' +
                    'linear-gradient(180deg, #0f1016 0%, #0a0a0d 50%, #08080a 100%)',
            }}
        >
            {/* Ambient depth layers */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#5b73ff]/[0.06] blur-[140px]" />
                <div className="absolute -bottom-24 -right-24 h-[320px] w-[320px] rounded-full bg-[#a78bfa]/[0.04] blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.025),transparent_35%,transparent_65%,rgba(255,255,255,0.012))]" />
            </div>

            {/* Top accent hairline */}
            <div className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-[#5b73ff]/35 to-transparent" />

            <div className="relative">
                {/* Mandate badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...heroTransition, delay: 0.12 }}
                    className="mb-7"
                >
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/[0.06] px-4 py-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5b73ff] opacity-35" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5b73ff]" />
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7b8fff]">
                            Mandat en cours
                        </span>
                    </div>
                </motion.div>

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    {/* Identity + narrative */}
                    <div className="max-w-2xl flex-1">
                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...heroTransition, delay: 0.22 }}
                            className="text-[clamp(30px,4.8vw,52px)] font-black leading-[1.05] tracking-[-0.045em] text-white"
                        >
                            {client.client_name}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...heroTransition, delay: 0.32 }}
                            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-white/45"
                        >
                            <span>{client.business_type || 'Entreprise locale'}</span>
                            {client.website_url && (
                                <>
                                    <span className="text-white/15">·</span>
                                    <a
                                        href={client.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#7b8fff]/70 transition-colors hover:text-[#7b8fff]"
                                    >
                                        {client.website_url.replace(/^https?:\/\//, '')}
                                    </a>
                                </>
                            )}
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...heroTransition, delay: 0.42 }}
                            className="mt-6 max-w-xl text-[15px] leading-[1.72] text-white/50"
                        >
                            {client.short_description ||
                                "Votre dossier est activement suivi par l'équipe Trouvable. Retrouvez ci-dessous la synthèse complète de votre mandat et l'état de vos travaux."}
                        </motion.p>
                    </div>

                    {/* Status panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ ...heroTransition, delay: 0.38 }}
                        className="shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm lg:min-w-[290px]"
                    >
                        <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/25">
                            État du dossier
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-2.5 w-2.5 rounded-full ${freshness.dot}`} />
                                <span className="text-[14px] font-semibold text-white">{freshness.label}</span>
                            </div>

                            {lastAuditFormatted && (
                                <div className="text-[13px] text-white/35">
                                    Dernière revue · {lastAuditFormatted}
                                </div>
                            )}

                            <div className="my-1 h-px bg-white/[0.05]" />

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-[12px] text-white/35">Complétude profil</span>
                                    <span className="text-[13px] font-bold tabular-nums text-white">
                                        {completeness.percentage}%
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completeness.percentage}%` }}
                                        transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#5b73ff] to-[#7b8fff]"
                                    />
                                </div>
                                <div className="mt-1.5 text-[11px] text-white/20">
                                    {completeness.completedCount}/{completeness.totalCount} blocs validés
                                </div>
                            </div>
                        </div>

                        {membershipsCount > 1 && (
                            <Link
                                href="/portal"
                                className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-[13px] font-semibold text-white/55 transition-all hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                            >
                                Changer de dossier
                            </Link>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
