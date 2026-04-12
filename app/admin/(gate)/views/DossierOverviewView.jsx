'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { useGeoClient } from '../context/ClientContext';
import LifecycleBadge from '../clients/LifecycleBadge';
import ScoreRing from '@/components/ui/ScoreRing';

const EASE = [0.16, 1, 0.3, 1];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

/* ─── Helpers ─── */

function timeSince(value) {
    if (!value) return null;
    const diff = Date.now() - new Date(value).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
}

function formatDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString('fr-CA', { dateStyle: 'medium' }); }
    catch { return '—'; }
}

function FreshnessIndicator({ label, date }) {
    const ago = timeSince(date);
    const hours = date ? Math.floor((Date.now() - new Date(date).getTime()) / 3600000) : null;
    const status = hours === null ? 'idle'
        : hours > 72 ? 'critical'
        : hours > 24 ? 'warning' : 'ok';
    const colors = {
        ok: 'text-emerald-300/70',
        warning: 'text-amber-300/60',
        critical: 'text-red-300/60',
        idle: 'text-white/25',
    };
    const dotColors = {
        ok: 'bg-emerald-400',
        warning: 'bg-amber-400',
        critical: 'bg-red-400',
        idle: 'bg-white/20',
    };
    return (
        <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[status]}`} />
            <div className="min-w-0">
                <div className="text-[10px] text-white/25">{label}</div>
                <div className={`text-[11px] font-medium ${colors[status]}`}>
                    {ago ? `${ago} — ${formatDate(date)}` : 'Jamais'}
                </div>
            </div>
        </div>
    );
}

function ConnectorSummary({ workspace }) {
    const counts = {
        prompts: workspace?.activeTrackedPromptCount ?? 0,
        runs: workspace?.completedRunCount ?? 0,
        opps: workspace?.openOpportunityCount ?? 0,
    };
    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
                <div className="text-[18px] font-bold tabular-nums text-white/85">{counts.prompts}</div>
                <div className="text-[9px] text-white/25 font-bold uppercase tracking-[0.1em]">Prompts actifs</div>
            </div>
            <div className="text-center">
                <div className="text-[18px] font-bold tabular-nums text-white/85">{counts.runs}</div>
                <div className="text-[9px] text-white/25 font-bold uppercase tracking-[0.1em]">Runs terminés</div>
            </div>
            <div className="text-center">
                <div className="text-[18px] font-bold tabular-nums text-amber-300/85">{counts.opps}</div>
                <div className="text-[9px] text-white/25 font-bold uppercase tracking-[0.1em]">Actions ouvertes</div>
            </div>
        </div>
    );
}

function QuickLinkCard({ href, label, desc, accent = 'default' }) {
    const accents = {
        default: 'hover:border-white/[0.12]',
        seo: 'hover:border-emerald-500/20',
        geo: 'hover:border-violet-500/20',
        audit: 'hover:border-[#5b73ff]/20',
    };
    const iconColors = {
        default: 'text-white/30',
        seo: 'text-emerald-400/60',
        geo: 'text-violet-400/60',
        audit: 'text-[#7b8fff]/60',
    };
    return (
        <Link
            href={href}
            className={`cmd-surface px-4 py-3.5 flex items-center gap-3 transition-all cursor-pointer group ${accents[accent] || accents.default}`}
        >
            <div className={`shrink-0 ${iconColors[accent] || iconColors.default} group-hover:text-white/60 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </div>
            <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/75 group-hover:text-white transition-colors">{label}</div>
                {desc && <div className="text-[10px] text-white/25 mt-0.5">{desc}</div>}
            </div>
        </Link>
    );
}

/* ─── Main view ─── */

export default function DossierOverviewView() {
    const { client, clientId, workspace, audit, loading } = useGeoClient();
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[#5b73ff] rounded-full geo-spin" />
                <div className="text-[12px] text-white/30 mt-3">Chargement du dossier…</div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-8 text-center text-white/30 text-sm">
                Client introuvable.
            </div>
        );
    }

    const lifecycleStatus = client.lifecycle_status || 'prospect';
    const seoScore = audit?.seo_score ?? workspace?.seoScore ?? null;
    const geoScore = audit?.geo_score ?? workspace?.geoScore ?? null;
    const deterministicScore = audit?.deterministic_score ?? null;

    /* Freshness */
    const latestRunAt = workspace?.latestRunAt ?? null;
    const latestAuditAt = workspace?.latestAuditAt ?? audit?.created_at ?? null;
    const latestActivityAt = workspace?.latestActivityAt ?? null;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="p-5 md:p-7 space-y-4 max-w-[1600px] mx-auto"
        >
            {/* ── 1. Client identity & profile summary ── */}
            <motion.div variants={fadeUp} className="cmd-surface px-5 py-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-white/95">
                                {client.client_name || 'Mandat'}
                            </h1>
                            <LifecycleBadge status={lifecycleStatus} size="md" />
                        </div>
                        <div className="text-[11px] text-white/30 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {client.business_type && <span>{client.business_type}</span>}
                            {client.city && (
                                <>
                                    <span className="text-white/10">·</span>
                                    <span>{client.city}</span>
                                </>
                            )}
                            {client.website_url && (
                                <>
                                    <span className="text-white/10">·</span>
                                    <a
                                        href={client.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#7b8fff]/60 hover:text-[#7b8fff] hover:underline truncate max-w-[240px] transition-colors"
                                    >
                                        {client.website_url.replace(/^https?:\/\//, '')}
                                    </a>
                                </>
                            )}
                        </div>
                        {client.description && (
                            <div className="text-[11px] text-white/20 mt-1 max-w-xl line-clamp-2">{client.description}</div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center shrink-0">
                        <Link href={`${baseHref}/edit`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                            Modifier
                        </Link>
                        <Link href={`${baseHref}/portal`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                            Portail client
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* ── 2. Cross-domain KPI summary ── */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                {/* SEO Score — labeled truthfully as technical SEO dimension */}
                <Link
                    href={`${baseHref}/dossier/audit`}
                    className="flex-1 min-w-[140px] cmd-surface px-4 py-3.5 flex items-center gap-3 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    {seoScore != null ? (
                        <ScoreRing value={seoScore} color="#34d399" label="SEO" size={56} strokeWidth={4.5} />
                    ) : (
                        <div className="w-14 h-14 rounded-full border-2 border-white/[0.06] flex items-center justify-center text-[10px] text-white/20">SEO</div>
                    )}
                    <div>
                        <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">SEO technique</div>
                        <div className="text-[20px] font-bold tabular-nums text-emerald-300 tracking-[-0.03em] mt-0.5">
                            {seoScore ?? '—'}
                        </div>
                        <div className="text-[9px] text-white/15 mt-0.5">Dimension technical_seo</div>
                    </div>
                </Link>

                {/* GEO Score — labeled truthfully as local readiness dimension */}
                <Link
                    href={`${baseHref}/dossier/audit`}
                    className="flex-1 min-w-[140px] cmd-surface px-4 py-3.5 flex items-center gap-3 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    {geoScore != null ? (
                        <ScoreRing value={geoScore} color="#a78bfa" label="GEO" size={56} strokeWidth={4.5} />
                    ) : (
                        <div className="w-14 h-14 rounded-full border-2 border-white/[0.06] flex items-center justify-center text-[10px] text-white/20">GEO</div>
                    )}
                    <div>
                        <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">Aptitude locale</div>
                        <div className="text-[20px] font-bold tabular-nums text-violet-300 tracking-[-0.03em] mt-0.5">
                            {geoScore ?? '—'}
                        </div>
                        <div className="text-[9px] text-white/15 mt-0.5">Dimension local_readiness</div>
                    </div>
                </Link>

                {/* Deterministic composite score (if available) */}
                <Link
                    href={`${baseHref}/dossier/audit`}
                    className="flex-1 min-w-[140px] cmd-surface px-4 py-3.5 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">Score global</div>
                    <div className="text-[24px] font-bold tabular-nums text-[#7b8fff] mt-1 tracking-[-0.03em]">
                        {deterministicScore ?? '—'}
                    </div>
                    <div className="text-[9px] text-white/15 mt-0.5">Moyenne pondérée 5 dimensions</div>
                </Link>
            </motion.div>

            {/* ── 3. Workspace & connector summary ── */}
            <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
                <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-3">
                    Moteur de visibilité
                </div>
                <ConnectorSummary workspace={workspace} />
                {(workspace?.pendingMergeCount ?? 0) > 0 && (
                    <div className="mt-3 text-[10px] text-amber-300/60">
                        {workspace.pendingMergeCount} fusion(s) en attente de validation
                    </div>
                )}
            </motion.div>

            {/* ── 4. Activity & freshness summary ── */}
            <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
                <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-3">
                    Fraîcheur des données
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FreshnessIndicator label="Dernier run GEO" date={latestRunAt} />
                    <FreshnessIndicator label="Dernier audit" date={latestAuditAt} />
                    <FreshnessIndicator label="Dernière activité" date={latestActivityAt} />
                </div>
            </motion.div>

            {/* ── 5. Quick links into SEO Ops and GEO Ops ── */}
            <motion.div variants={fadeUp}>
                <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-2">
                    Accès rapide
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <QuickLinkCard
                        href={`${baseHref}/dossier/audit`}
                        label="Audit SEO / GEO"
                        desc="Scoring déterministe, problèmes, opportunités"
                        accent="audit"
                    />
                    <QuickLinkCard
                        href={`${baseHref}/seo/visibility`}
                        label="Visibilité organique"
                        desc="Trafic GA4, requêtes GSC"
                        accent="seo"
                    />
                    <QuickLinkCard
                        href={`${baseHref}/geo/runs`}
                        label="Exécution GEO"
                        desc="Runs, résultats, parse"
                        accent="geo"
                    />
                    <QuickLinkCard
                        href={`${baseHref}/geo/prompts`}
                        label="Prompts suivis"
                        desc="Couverture, mention rate"
                        accent="geo"
                    />
                    <QuickLinkCard
                        href={`${baseHref}/geo/opportunities`}
                        label="File d'actions"
                        desc={`${workspace?.openOpportunityCount ?? 0} actions ouvertes`}
                        accent="geo"
                    />
                    <QuickLinkCard
                        href={`${baseHref}/geo/signals`}
                        label="Signaux & citations"
                        desc="Sources, concurrents, fiabilité"
                        accent="geo"
                    />
                </div>
            </motion.div>

            {/* ── 6. Portal / settings / edit entry points ── */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-2">
                <Link href={`${baseHref}/portal`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                    Portail client →
                </Link>
                <Link href={`${baseHref}/dossier/settings`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                    Paramètres →
                </Link>
                <Link href={`${baseHref}/edit`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                    Modifier le profil →
                </Link>
            </motion.div>
        </motion.div>
    );
}
