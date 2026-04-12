'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { GeoEmptyPanel } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import ScoreRing from '@/components/ui/ScoreRing';
import CoverageMeter from '@/components/ui/CoverageMeter';

const EASE = [0.16, 1, 0.3, 1];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

/* ─── Helpers ─── */

function formatDateTime(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return '—'; }
}

function timeSince(value) {
    if (!value) return null;
    const diff = Date.now() - new Date(value).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
}

function HealthDot({ status }) {
    const colors = {
        ok: 'bg-emerald-400',
        warning: 'bg-amber-400',
        critical: 'bg-red-400',
        idle: 'bg-white/20',
    };
    return (
        <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || colors.idle} ${status === 'critical' ? 'cmd-health-dot' : ''}`} />
    );
}

function HealthIndicator({ status, label }) {
    const styles = {
        ok: 'bg-emerald-400/8 border-emerald-400/20 text-emerald-200/85',
        warning: 'bg-amber-400/8 border-amber-400/20 text-amber-200/85',
        critical: 'bg-red-400/8 border-red-400/20 text-red-200/85',
        idle: 'bg-white/[0.025] border-white/[0.06] text-white/35',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10px] font-semibold ${styles[status] || styles.idle}`}>
            <HealthDot status={status} />
            {label}
        </span>
    );
}

function hasRunsHelper(kpis) {
    return (kpis?.completedRunsTotal ?? 0) > 0;
}

function buildActionCenter({ geoBase, dossierBase, criticalWarnings, activeWarnings, opportunities, noRunsYet, lowSampleSize, kpis, visibility, openOppCount }) {
    const now = [];
    const next = [];
    const watch = [];

    criticalWarnings.forEach((w) => {
        now.push({ title: w.message, desc: 'Guardrail critique — traiter en priorité.', href: `${geoBase}/runs` });
    });

    (opportunities?.openItems || [])
        .filter((o) => o.priority === 'high')
        .slice(0, 4)
        .forEach((o) => {
            now.push({ title: o.title, desc: o.description, href: `${geoBase}/opportunities` });
        });

    if (noRunsYet && (visibility?.promptCoverage?.total ?? 0) > 0) {
        now.push({
            title: 'Aucune exécution enregistrée',
            desc: "Le moteur n'a pas encore produit de signal pour ce mandat.",
            href: `${geoBase}/prompts`,
        });
    }

    activeWarnings.forEach((w) => {
        next.push({ title: w.message, desc: 'À planifier après les urgences.', href: `${dossierBase}/audit` });
    });

    (opportunities?.openItems || [])
        .filter((o) => o.priority !== 'high')
        .slice(0, 5)
        .forEach((o) => {
            next.push({ title: o.title, desc: o.description, href: `${geoBase}/opportunities` });
        });

    if (openOppCount >= 8 && next.filter((x) => x.href?.includes('opportunities')).length < 2) {
        next.push({
            title: `${openOppCount} actions en file`,
            desc: 'Prioriser et traiter par lots.',
            href: `${geoBase}/opportunities`,
        });
    }

    if (lowSampleSize) {
        watch.push({
            title: "Faible volume d'exécutions",
            desc: 'Les métriques dérivées restent indicatives.',
            href: `${geoBase}/runs`,
        });
    }

    const rel = kpis?.visibilityProxyReliability;
    if (rel === 'low' || rel === 'insufficient_data') {
        watch.push({
            title: 'Signal visibilité fragile',
            desc: 'Renforcer les runs ou diversifier les prompts.',
            href: `${geoBase}/signals`,
        });
    }

    if ((kpis?.parseFailureRate ?? 0) > 5) {
        watch.push({
            title: `Taux d'échec parse ${kpis.parseFailureRate}%`,
            desc: 'Inspecter les runs récents.',
            href: `${geoBase}/runs`,
        });
    }

    if ((visibility?.promptCoverage?.noRunYet ?? 0) > 0 && hasRunsHelper(kpis)) {
        watch.push({
            title: `${visibility.promptCoverage.noRunYet} prompt(s) sans exécution`,
            desc: 'Couverture incomplète.',
            href: `${geoBase}/prompts`,
        });
    }

    return { now, next, watch };
}

/* ─── Sub-components ─── */

function GlobalStatusBanner({ level, label, detail, healthPills }) {
    const map = {
        critical: 'border-red-500/25 bg-gradient-to-r from-red-500/[0.06] to-transparent',
        attention: 'border-amber-500/20 bg-gradient-to-r from-amber-500/[0.04] to-transparent',
        watch: 'border-white/[0.08] bg-white/[0.015]',
        healthy: 'border-emerald-500/18 bg-gradient-to-r from-emerald-500/[0.04] to-transparent',
    };
    const dots = {
        critical: 'bg-red-400',
        attention: 'bg-amber-400',
        watch: 'bg-white/30',
        healthy: 'bg-emerald-400',
    };
    return (
        <motion.div
            variants={fadeUp}
            className={`rounded-xl border px-5 py-4 ${map[level] || map.watch}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dots[level] || dots.watch} ${level === 'critical' ? 'cmd-health-dot' : ''}`} />
                    <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">État global du mandat</div>
                        <div className="text-[15px] font-bold text-white/95 mt-0.5 tracking-[-0.01em]">{label}</div>
                        {detail && <div className="text-[11px] text-white/40 mt-1 max-w-2xl leading-snug">{detail}</div>}
                    </div>
                </div>
            </div>
            {healthPills && (
                <div className="flex flex-wrap gap-1.5 mt-3 ml-5">
                    {healthPills}
                </div>
            )}
        </motion.div>
    );
}

function MiniActivityChart({ runs }) {
    const now = Date.now();
    const msPerDay = 86400000;
    const days = 30;

    const buckets = new Array(days).fill(0);
    if (runs?.length) {
        for (const run of runs) {
            if (!run?.created_at) continue;
            const age = now - new Date(run.created_at).getTime();
            const dayIndex = Math.floor(age / msPerDay);
            if (dayIndex >= 0 && dayIndex < days) {
                buckets[days - 1 - dayIndex]++;
            }
        }
    }

    const max = Math.max(...buckets, 1);
    const hasActivity = buckets.some((v) => v > 0);
    const barW = 100 / days;
    const chartH = 48;

    return (
        <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
            <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-2.5">
                Activité d&apos;exécution · 30j
            </div>
            {!hasActivity ? (
                <div className="flex items-center justify-center h-12 text-[11px] text-white/20">Aucun run</div>
            ) : (
                <svg viewBox={`0 0 100 ${chartH}`} className="w-full" style={{ height: chartH }} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="bar-glow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5b73ff" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#5b73ff" stopOpacity="0.35" />
                        </linearGradient>
                    </defs>
                    {buckets.map((count, i) => {
                        const h = count === 0 ? 1 : Math.max(3, (count / max) * (chartH - 4));
                        return (
                            <rect
                                key={i}
                                x={i * barW + barW * 0.15}
                                y={chartH - h}
                                width={barW * 0.7}
                                height={h}
                                rx={1}
                                fill={count === 0 ? 'rgba(255,255,255,0.04)' : 'url(#bar-glow)'}
                            />
                        );
                    })}
                </svg>
            )}
        </motion.div>
    );
}

function ActionColumn({ title, tone, items, empty }) {
    const borders = {
        now: 'border-red-500/15 bg-gradient-to-b from-red-500/[0.03] to-transparent',
        next: 'border-amber-500/12 bg-gradient-to-b from-amber-500/[0.02] to-transparent',
        watch: 'border-white/[0.06] bg-white/[0.01]',
    };
    return (
        <motion.div variants={fadeUp} className={`rounded-xl border ${borders[tone] || borders.watch} min-h-[140px] flex flex-col overflow-hidden`}>
            <div className="px-4 py-2.5 border-b border-white/[0.05]">
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">{title}</div>
            </div>
            <div className="p-2 flex-1 space-y-1">
                {!items?.length && (
                    <div className="text-[11px] text-white/20 px-3 py-6 text-center leading-relaxed">{empty}</div>
                )}
                {items?.map((item, i) => (
                    <Link
                        key={`${item.href}-${i}`}
                        href={item.href}
                        className="group block rounded-lg px-3 py-2.5 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all duration-200"
                    >
                        <div className="text-[11px] font-semibold text-white/80 group-hover:text-white leading-snug">{item.title}</div>
                        {item.desc && <div className="text-[10px] text-white/25 mt-0.5 line-clamp-2">{item.desc}</div>}
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}

/* ─── Main view ─── */

export default function GeoOverviewView() {
    const { client, clientId, workspace, audit } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('overview');
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[#5b73ff] rounded-full geo-spin" />
                <div className="text-[12px] text-white/30 mt-3">Chargement de la situation…</div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-300/70 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-5 md:p-7 max-w-[1600px] mx-auto">
                <GeoEmptyPanel
                    title="Situation indisponible"
                    description="La synthèse opérateur n'est pas disponible pour ce mandat."
                />
            </div>
        );
    }

    const { kpis, visibility, sources, competitors, opportunities, guardrails, recentQueryRuns } = data;
    const noRunsYet = (kpis?.completedRunsTotal ?? 0) === 0;
    const lowSampleSize = (kpis?.completedRunsTotal ?? 0) > 0 && (kpis?.completedRunsTotal ?? 0) < 5;
    const activeWarnings = (guardrails || []).filter((g) => g.severity === 'warning');
    const criticalWarnings = (guardrails || []).filter((g) => g.severity === 'critical' || g.severity === 'error');

    const seoScore = audit?.seo_score ?? kpis?.seoScore;
    const geoScore = audit?.geo_score ?? kpis?.geoScore;
    const openOppCount = opportunities?.summary?.open ?? 0;
    const mentionRate = kpis?.mentionRatePercent;

    /* ── Global status level ── */
    let globalLevel = 'healthy';
    let globalLabel = 'Mandat stable';
    let globalDetail = 'Pas de signal bloquant. Continuer la surveillance habituelle.';

    if (criticalWarnings.length > 0) {
        globalLevel = 'critical';
        globalLabel = 'Intervention requise';
        globalDetail = criticalWarnings.map((w) => w.message).join(' · ');
    } else if (noRunsYet && (visibility?.promptCoverage?.total ?? 0) > 0) {
        globalLevel = 'attention';
        globalLabel = "Moteur à l'arrêt";
        globalDetail = "Des prompts sont suivis mais aucune exécution n'a alimenté les signaux.";
    } else if (activeWarnings.length > 0 || lowSampleSize) {
        globalLevel = 'attention';
        globalLabel = 'Attention opérateur';
        globalDetail = lowSampleSize
            ? "Volume d'exécutions faible — croiser avec les guardrails."
            : activeWarnings.map((w) => w.message).slice(0, 2).join(' · ');
    } else if (
        (kpis?.visibilityProxyReliability === 'low' || kpis?.visibilityProxyReliability === 'insufficient_data')
        || (kpis?.parseFailureRate ?? 0) > 8
    ) {
        globalLevel = 'watch';
        globalLabel = 'À surveiller';
        globalDetail = 'Qualité de signal ou parse à surveiller sur les prochains runs.';
    }

    /* ── Health indicators for status band ── */
    const hasRuns = hasRunsHelper(kpis);
    const parseFr = kpis?.parseFailureRate ?? 0;
    const freshnessHours = workspace?.latestRunAt
        ? Math.floor((Date.now() - new Date(workspace.latestRunAt).getTime()) / 3600000)
        : null;
    const executionStatus = !hasRuns ? 'idle'
        : freshnessHours === null ? 'idle'
        : freshnessHours > 72 ? 'critical'
        : freshnessHours > 24 ? 'warning' : 'ok';
    const parseStatus = !hasRuns ? 'idle'
        : parseFr > 15 ? 'critical'
        : parseFr > 5 ? 'warning' : 'ok';
    const mentionStatus = !hasRuns ? 'idle' : (mentionRate ?? 0) < 30 ? 'warning' : 'ok';

    const healthPills = (
        <>
            <HealthIndicator
                status={executionStatus}
                label={!hasRuns ? 'Inactif' : freshnessHours != null ? `Fraîcheur ${timeSince(workspace.latestRunAt)}` : 'Run'}
            />
            <HealthIndicator
                status={parseStatus}
                label={!hasRuns ? 'Parse n/a' : `Parse ${parseFr}% échec`}
            />
            <HealthIndicator
                status={mentionStatus}
                label={!hasRuns ? 'Mention n/a' : `Mention ${mentionRate ?? '—'}%`}
            />
        </>
    );

    /* ── Action center ── */
    const actionBuckets = buildActionCenter({
        geoBase,
        dossierBase,
        criticalWarnings,
        activeWarnings,
        opportunities,
        noRunsYet,
        lowSampleSize,
        kpis,
        visibility,
        openOppCount,
    });

    /* ── Mention rate color ── */
    const mentionColor = mentionRate == null ? 'text-white/90'
        : mentionRate < 20 ? 'text-red-300'
        : mentionRate < 40 ? 'text-amber-300'
        : 'text-emerald-300';

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="p-5 md:p-7 space-y-3 max-w-[1600px] mx-auto"
        >
            {/* ── 1. Mission header ── */}
            <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-[22px] font-bold tracking-[-0.03em] text-white/95">
                        {client?.client_name || 'Mandat'}
                    </div>
                    <div className="text-[11px] text-white/30 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{client?.business_type || 'Entreprise'}</span>
                        {client?.website_url && (
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
                    <div className="text-[11px] text-white/20 mt-0.5">Synthèse opérateur — état du mandat</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center shrink-0">
                    <Link href={`${geoBase}/opportunities`} className="geo-btn geo-btn-pri text-[11px] py-1.5 px-3.5">
                        File d&apos;actions
                    </Link>
                    <Link href={`${geoBase}/runs`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                        Superviser
                    </Link>
                </div>
            </motion.div>

            {/* ── 2. Executive status band (with inline health pills) ── */}
            <GlobalStatusBanner level={globalLevel} label={globalLabel} detail={globalDetail} healthPills={healthPills} />

            {/* ── 3. KPI strip ── */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                {/* SEO Score */}
                <Link
                    href={`${dossierBase}/audit`}
                    className="flex-1 min-w-[140px] cmd-surface px-4 py-3.5 flex items-center gap-3 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    {seoScore != null ? (
                        <ScoreRing value={seoScore} color="#34d399" label="SEO" size={64} strokeWidth={5} />
                    ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-white/[0.06] flex items-center justify-center text-[10px] text-white/20">SEO</div>
                    )}
                    <div>
                        <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">Score SEO</div>
                        <div className="text-[20px] font-bold tabular-nums text-emerald-300 tracking-[-0.03em] mt-0.5">
                            {seoScore ?? '—'}
                        </div>
                    </div>
                </Link>

                {/* GEO Score */}
                <Link
                    href={`${dossierBase}/audit`}
                    className="flex-1 min-w-[140px] cmd-surface px-4 py-3.5 flex items-center gap-3 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    {geoScore != null ? (
                        <ScoreRing value={geoScore} color="#a78bfa" label="GEO" size={64} strokeWidth={5} />
                    ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-white/[0.06] flex items-center justify-center text-[10px] text-white/20">GEO</div>
                    )}
                    <div>
                        <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">Score GEO</div>
                        <div className="text-[20px] font-bold tabular-nums text-violet-300 tracking-[-0.03em] mt-0.5">
                            {geoScore ?? '—'}
                        </div>
                    </div>
                </Link>

                {/* Mention Rate */}
                <div className="flex-1 min-w-[130px] cmd-surface px-4 py-3.5">
                    <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">Mention</div>
                    <div className={`text-[24px] font-bold tabular-nums mt-1 tracking-[-0.03em] ${mentionColor}`}>
                        {mentionRate != null ? `${mentionRate}%` : '—'}
                    </div>
                    <div className="text-[10px] text-white/20 mt-0.5">Taux de détection</div>
                </div>

                {/* Runs Completed */}
                <Link
                    href={`${geoBase}/runs`}
                    className="flex-1 min-w-[130px] cmd-surface px-4 py-3.5 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">Runs terminés</div>
                    <div className="text-[24px] font-bold tabular-nums text-white/90 mt-1 tracking-[-0.03em]">
                        {kpis?.completedRunsTotal ?? 0}
                    </div>
                    <div className="text-[10px] text-white/20 mt-0.5">{timeSince(workspace?.latestRunAt) ? `Dernier : ${timeSince(workspace.latestRunAt)}` : '—'}</div>
                </Link>

                {/* Open Opportunities */}
                <Link
                    href={`${geoBase}/opportunities`}
                    className="flex-1 min-w-[130px] cmd-surface px-4 py-3.5 hover:border-white/[0.12] transition-all cursor-pointer"
                >
                    <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">File d&apos;actions</div>
                    <div className="text-[24px] font-bold tabular-nums text-amber-300 mt-1 tracking-[-0.03em]">
                        {openOppCount}
                    </div>
                    <div className="text-[10px] text-white/20 mt-0.5">Actions ouvertes</div>
                </Link>
            </motion.div>

            {/* ── 4. Execution timeline chart ── */}
            <MiniActivityChart runs={recentQueryRuns} />

            {/* ── 5. Action center ── */}
            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ActionColumn
                    tone="now"
                    title="Maintenant"
                    items={actionBuckets.now}
                    empty="Rien de critique. Vérifier les runs si doute."
                />
                <ActionColumn
                    tone="next"
                    title="Ensuite"
                    items={actionBuckets.next}
                    empty="Pas d'action secondaire détectée."
                />
                <ActionColumn
                    tone="watch"
                    title="Surveillance"
                    items={actionBuckets.watch}
                    empty="Signaux stables sur cette fenêtre."
                />
            </motion.div>

            {/* ── 6. Supporting signals ── */}
            <motion.div variants={fadeUp} className="cmd-surface px-5 py-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em]">Signaux &amp; couverture</div>
                    <Link href={`${geoBase}/signals`} className="text-[10px] font-semibold text-[#7b8fff]/60 hover:text-[#7b8fff] transition-colors">
                        Voir détails →
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Left: coverage meters */}
                    <div className="space-y-4">
                        <CoverageMeter label="Visibilité proxy" value={kpis?.visibilityProxyPercent} color="#5b73ff" />
                        <CoverageMeter label="Couverture citations" value={kpis?.citationCoveragePercent} color="#a78bfa" />
                    </div>
                    {/* Right: top source, top competitor, reliability */}
                    <div className="space-y-3 text-[11px]">
                        <div className="min-w-0">
                            <div className="text-white/25 text-[10px]">Top source</div>
                            <div className="text-white/65 font-medium mt-0.5 truncate">{sources?.topHosts?.[0]?.host || '—'}</div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-white/25 text-[10px]">Concurrent dominant</div>
                            <div className="text-white/65 font-medium mt-0.5 truncate">{competitors?.topCompetitors?.[0]?.name || '—'}</div>
                        </div>
                        {kpis?.visibilityProxyReliability && (
                            <div className="pt-1">
                                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em] ${
                                    kpis.visibilityProxyReliability === 'high'
                                        ? 'bg-emerald-400/8 border-emerald-400/18 text-emerald-200/70'
                                        : kpis.visibilityProxyReliability === 'medium'
                                            ? 'bg-amber-400/8 border-amber-400/18 text-amber-200/70'
                                            : 'bg-white/[0.03] border-white/[0.06] text-white/30'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        kpis.visibilityProxyReliability === 'high'
                                            ? 'bg-emerald-400'
                                            : kpis.visibilityProxyReliability === 'medium'
                                                ? 'bg-amber-400'
                                                : 'bg-white/20'
                                    }`} />
                                    Fiabilité : {kpis.visibilityProxyReliability}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}