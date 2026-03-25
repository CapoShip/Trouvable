'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { GeoEmptyPanel, GeoProvenancePill } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

const EASE = [0.16, 1, 0.3, 1];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

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

function GlobalStatusBanner({ level, label, detail }) {
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
            className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${map[level] || map.watch}`}
        >
            <div className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dots[level] || dots.watch} ${level === 'critical' ? 'cmd-health-dot' : ''}`} />
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">État global du mandat</div>
                    <div className="text-[15px] font-bold text-white/95 mt-0.5 tracking-[-0.01em]">{label}</div>
                    {detail && <div className="text-[11px] text-white/40 mt-1 max-w-2xl leading-snug">{detail}</div>}
                </div>
            </div>
        </motion.div>
    );
}

function EngineHealthStrip({ kpis, workspace, visibility }) {
    const hasRuns = (kpis?.completedRunsTotal ?? 0) > 0;
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

    return (
        <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em]">Moteur d&apos;exécution</div>
                <div className="flex flex-wrap gap-1.5">
                    <HealthIndicator
                        status={executionStatus}
                        label={!hasRuns ? 'Inactif' : freshnessHours != null ? `Fraîcheur ${timeSince(workspace.latestRunAt)}` : 'Run'}
                    />
                    <HealthIndicator
                        status={parseStatus}
                        label={!hasRuns ? 'Parse n/a' : `Parse ${parseFr}% échec`}
                    />
                    <HealthIndicator
                        status={!hasRuns ? 'idle' : (kpis?.mentionRatePercent ?? 0) < 30 ? 'warning' : 'ok'}
                        label={!hasRuns ? 'Mention n/a' : `Mention ${kpis?.mentionRatePercent ?? '—'}%`}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/[0.05] text-[11px]">
                <div>
                    <span className="text-white/25 text-[10px]">Dernier run</span>
                    <div className="text-white/70 font-semibold mt-0.5">{timeSince(workspace?.latestRunAt) || '—'}</div>
                </div>
                <div>
                    <span className="text-white/25 text-[10px]">Dernier audit</span>
                    <div className="text-white/70 font-semibold mt-0.5">{timeSince(workspace?.latestAuditAt) || '—'}</div>
                </div>
                <div>
                    <span className="text-white/25 text-[10px]">Prompts actifs / couverture</span>
                    <div className="text-white/70 font-semibold mt-0.5">
                        {visibility?.promptCoverage
                            ? `${visibility.promptCoverage.active ?? visibility.promptCoverage.total} · ${visibility.promptCoverage.withTargetFound}/${visibility.promptCoverage.total} cible`
                            : '—'}
                    </div>
                </div>
                <div>
                    <span className="text-white/25 text-[10px]">Confiance parse (moy.)</span>
                    <div className={`font-semibold mt-0.5 ${(kpis?.avgParseConfidence ?? 1) < 0.6 ? 'text-amber-300/80' : 'text-white/70'}`}>
                        {kpis?.avgParseConfidence != null ? `${Math.round(Number(kpis.avgParseConfidence) * 100)}%` : '—'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MissionKpiCard({ label, value, accent = 'default', href, sub }) {
    const accents = {
        default: 'text-white/90',
        emerald: 'text-emerald-300',
        violet: 'text-violet-300',
        amber: 'text-amber-300',
        blue: 'text-[#7b8fff]',
    };
    const Wrapper = href ? Link : 'div';
    const wrapperProps = href ? { href } : {};
    return (
        <Wrapper
            {...wrapperProps}
            className={`flex-1 min-w-[130px] cmd-surface px-4 py-3.5 ${href ? 'hover:border-white/[0.12] transition-all cursor-pointer' : ''}`}
        >
            <div className="text-[9px] text-white/25 uppercase font-bold tracking-[0.1em]">{label}</div>
            <div className={`text-[24px] font-bold tabular-nums mt-1 tracking-[-0.03em] ${accents[accent] || accents.default}`}>
                {value ?? '—'}
            </div>
            {sub && <div className="text-[10px] text-white/20 mt-1">{sub}</div>}
        </Wrapper>
    );
}

function ActionColumn({ title, tone, items, empty }) {
    const borders = {
        now: 'border-red-500/15 bg-gradient-to-b from-red-500/[0.03] to-transparent',
        next: 'border-amber-500/12 bg-gradient-to-b from-amber-500/[0.02] to-transparent',
        watch: 'border-white/[0.06] bg-white/[0.01]',
    };
    return (
        <motion.div variants={fadeUp} className={`rounded-xl border ${borders[tone] || borders.watch} min-h-[160px] flex flex-col overflow-hidden`}>
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

function buildActionCenter({ baseHref, criticalWarnings, activeWarnings, opportunities, noRunsYet, lowSampleSize, kpis, visibility, openOppCount }) {
    const now = [];
    const next = [];
    const watch = [];

    criticalWarnings.forEach((w) => {
        now.push({ title: w.message, desc: 'Guardrail critique — traiter en priorité.', href: `${baseHref}/runs` });
    });

    (opportunities?.openItems || [])
        .filter((o) => o.priority === 'high')
        .slice(0, 4)
        .forEach((o) => {
            now.push({ title: o.title, desc: o.description, href: `${baseHref}/opportunities` });
        });

    if (noRunsYet && (visibility?.promptCoverage?.total ?? 0) > 0) {
        now.push({
            title: 'Aucune exécution enregistrée',
            desc: "Le moteur n'a pas encore produit de signal pour ce mandat.",
            href: `${baseHref}/prompts`,
        });
    }

    activeWarnings.forEach((w) => {
        next.push({ title: w.message, desc: 'À planifier après les urgences.', href: `${baseHref}/audit` });
    });

    (opportunities?.openItems || [])
        .filter((o) => o.priority !== 'high')
        .slice(0, 5)
        .forEach((o) => {
            next.push({ title: o.title, desc: o.description, href: `${baseHref}/opportunities` });
        });

    if (openOppCount >= 8 && next.filter((x) => x.href?.includes('opportunities')).length < 2) {
        next.push({
            title: `${openOppCount} actions en file`,
            desc: 'Prioriser et traiter par lots.',
            href: `${baseHref}/opportunities`,
        });
    }

    if (lowSampleSize) {
        watch.push({
            title: "Faible volume d'exécutions",
            desc: 'Les métriques dérivées restent indicatives.',
            href: `${baseHref}/runs`,
        });
    }

    const rel = kpis?.visibilityProxyReliability;
    if (rel === 'low' || rel === 'insufficient_data') {
        watch.push({
            title: 'Signal visibilité fragile',
            desc: 'Renforcer les runs ou diversifier les prompts.',
            href: `${baseHref}/signals`,
        });
    }

    if ((kpis?.parseFailureRate ?? 0) > 5) {
        watch.push({
            title: `Taux d'échec parse ${kpis.parseFailureRate}%`,
            desc: 'Inspecter les runs récents.',
            href: `${baseHref}/runs`,
        });
    }

    if ((visibility?.promptCoverage?.noRunYet ?? 0) > 0 && hasRunsHelper(kpis)) {
        watch.push({
            title: `${visibility.promptCoverage.noRunYet} prompt(s) sans exécution`,
            desc: 'Couverture incomplète.',
            href: `${baseHref}/prompts`,
        });
    }

    return { now, next, watch };
}

function hasRunsHelper(kpis) {
    return (kpis?.completedRunsTotal ?? 0) > 0;
}

export default function GeoOverviewView() {
    const { client, clientId, workspace, audit } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('overview');
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[#5b73ff] rounded-full geo-spin" />
                <div className="text-[12px] text-white/30 mt-3">Chargement du hub opérateur…</div>
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

    const { kpis, visibility, sources, competitors, opportunities, recentActivity, provenance, guardrails } = data;
    const noRunsYet = (kpis?.completedRunsTotal ?? 0) === 0;
    const lowSampleSize = (kpis?.completedRunsTotal ?? 0) > 0 && (kpis?.completedRunsTotal ?? 0) < 5;
    const activeWarnings = (guardrails || []).filter((g) => g.severity === 'warning');
    const criticalWarnings = (guardrails || []).filter((g) => g.severity === 'critical' || g.severity === 'error');

    const seoScore = audit?.seo_score ?? kpis?.seoScore;
    const geoScore = audit?.geo_score ?? kpis?.geoScore;
    const openOppCount = opportunities?.summary?.open ?? 0;

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

    const actionBuckets = buildActionCenter({
        baseHref,
        criticalWarnings,
        activeWarnings,
        opportunities,
        noRunsYet,
        lowSampleSize,
        kpis,
        visibility,
        openOppCount,
    });

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="p-5 md:p-7 space-y-5 max-w-[1600px] mx-auto"
        >
            {/* Mission header */}
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
                </div>
                <div className="flex flex-wrap gap-2 items-center shrink-0">
                    {provenance?.observed && <GeoProvenancePill meta={provenance.observed} />}
                    {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
                    <Link href={`${baseHref}/opportunities`} className="geo-btn geo-btn-pri text-[11px] py-1.5 px-3.5">
                        File d&apos;actions
                    </Link>
                    <Link href={`${baseHref}/runs`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">
                        Superviser
                    </Link>
                </div>
            </motion.div>

            {/* Global status */}
            <GlobalStatusBanner level={globalLevel} label={globalLabel} detail={globalDetail} />

            {/* Engine health */}
            <EngineHealthStrip kpis={kpis} workspace={workspace} visibility={visibility} />

            {/* Alerts */}
            {(criticalWarnings.length > 0 || activeWarnings.length > 0) && (
                <motion.div variants={fadeUp} className="cmd-urgent-surface overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/[0.05]">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">Alertes &amp; anomalies</span>
                    </div>
                    <div className="p-3.5 space-y-2 max-h-[200px] overflow-y-auto">
                        {criticalWarnings.map((w) => (
                            <div key={w.code} className="flex gap-2.5 text-[11px] text-red-200/75">
                                <span className="w-1 rounded-full bg-red-400 shrink-0 mt-1.5" />
                                {w.message}
                            </div>
                        ))}
                        {activeWarnings.map((w) => (
                            <div key={w.code} className="flex gap-2.5 text-[11px] text-amber-200/65">
                                <span className="w-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                                {w.message}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Action center */}
            <div>
                <motion.div variants={fadeUp} className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-3">Centre de pilotage</motion.div>
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
            </div>

            {/* KPI summary */}
            <motion.div variants={fadeUp}>
                <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-3">Résumé audit &amp; exécution</div>
                <div className="flex flex-wrap gap-3">
                    <MissionKpiCard label="SEO" value={seoScore} accent="emerald" href={`${baseHref}/audit`} sub={formatDateTime(visibility?.lastAuditAt)} />
                    <MissionKpiCard label="GEO" value={geoScore} accent="violet" href={`${baseHref}/audit`} sub="Dernier audit" />
                    <MissionKpiCard label="Runs terminés" value={kpis?.completedRunsTotal ?? 0} accent="default" href={`${baseHref}/runs`} sub={formatDateTime(visibility?.lastGeoRunAt)} />
                    <MissionKpiCard label="File d'actions" value={openOppCount} accent="amber" href={`${baseHref}/opportunities`} />
                </div>
            </motion.div>

            {/* Key signals */}
            <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em]">Signaux clés</div>
                    <Link href={`${baseHref}/signals`} className="text-[10px] font-semibold text-[#7b8fff]/60 hover:text-[#7b8fff] transition-colors">
                        Détails →
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
                    <div>
                        <div className="text-white/25 text-[10px]">Visibilité proxy</div>
                        <div className="text-white/80 font-semibold mt-0.5">
                            {kpis?.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '—'}
                            <span className="text-white/25 font-normal ml-1 text-[10px]">
                                ({kpis?.visibilityProxyReliability || 'n/a'})
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="text-white/25 text-[10px]">Couverture citations</div>
                        <div className="text-white/80 font-semibold mt-0.5">
                            {kpis?.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : '—'}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="text-white/25 text-[10px]">Top source</div>
                        <div className="text-white/65 font-medium mt-0.5 truncate">{sources?.topHosts?.[0]?.host || '—'}</div>
                    </div>
                    <div className="min-w-0">
                        <div className="text-white/25 text-[10px]">Concurrent dominant</div>
                        <div className="text-white/65 font-medium mt-0.5 truncate">{competitors?.topCompetitors?.[0]?.name || '—'}</div>
                    </div>
                </div>
            </motion.div>

            {/* Quick nav */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-1">
                {[
                    { label: 'Exécution', href: `${baseHref}/runs` },
                    { label: 'Signaux', href: `${baseHref}/signals` },
                    { label: 'Actions', href: `${baseHref}/opportunities` },
                    { label: 'Prompts suivis', href: `${baseHref}/prompts`, muted: true },
                    { label: 'Paramètres', href: `${baseHref}/settings`, muted: true },
                ].map((nav) => (
                    <Link
                        key={nav.href}
                        href={nav.href}
                        className={`text-[11px] font-medium px-3.5 py-1.5 rounded-lg border border-white/[0.06] transition-all hover:bg-white/[0.03] hover:border-white/[0.12] hover:text-white ${nav.muted ? 'text-white/30' : 'text-white/50'}`}
                    >
                        {nav.label}
                    </Link>
                ))}
            </motion.div>

            {/* Recent activity */}
            {recentActivity?.length > 0 && (
                <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
                    <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-3">Activité récente</div>
                    <div className="space-y-2">
                        {recentActivity.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-3 text-[11px] border-b border-white/[0.03] pb-2.5 last:border-0 last:pb-0">
                                <div className="min-w-0">
                                    <div className="font-medium text-white/70 truncate">{item.title}</div>
                                    <div className="text-white/25 line-clamp-1 mt-0.5">{item.description}</div>
                                </div>
                                <div className="text-[10px] text-white/20 shrink-0 font-mono tabular-nums">{formatDateTime(item.created_at)}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
