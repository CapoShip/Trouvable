'use client';

import Link from 'next/link';

import { GeoEmptyPanel, GeoProvenancePill } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

function formatDateTime(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

function timeSince(value) {
    if (!value) return null;
    const diff = Date.now() - new Date(value).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "< 1 h";
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} j`;
}

function HealthIndicator({ status, label }) {
    const styles = {
        ok: 'bg-emerald-400/12 border-emerald-400/25 text-emerald-200',
        warning: 'bg-amber-400/12 border-amber-400/25 text-amber-200',
        critical: 'bg-red-400/12 border-red-400/25 text-red-200',
        idle: 'bg-white/[0.04] border-white/10 text-white/45',
    };
    const dots = {
        ok: 'bg-emerald-400',
        warning: 'bg-amber-400',
        critical: 'bg-red-400',
        idle: 'bg-white/30',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${styles[status] || styles.idle}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.idle}`} />
            {label}
        </span>
    );
}

function GlobalStatusBanner({ level, label, detail }) {
    const map = {
        critical: 'border-red-500/35 bg-red-500/[0.08]',
        attention: 'border-amber-500/30 bg-amber-500/[0.06]',
        watch: 'border-white/[0.12] bg-white/[0.03]',
        healthy: 'border-emerald-500/25 bg-emerald-500/[0.05]',
    };
    return (
        <div className={`rounded-lg border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${map[level] || map.watch}`}>
            <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">État global</div>
                <div className="text-[15px] font-bold text-white/95 mt-0.5">{label}</div>
                {detail && <div className="text-[11px] text-white/45 mt-1 max-w-2xl leading-snug">{detail}</div>}
            </div>
        </div>
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
        : freshnessHours > 24 ? 'warning'
        : 'ok';

    const parseStatus = !hasRuns ? 'idle'
        : parseFr > 15 ? 'critical'
        : parseFr > 5 ? 'warning'
        : 'ok';

    return (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[10px] font-bold text-white/35 uppercase tracking-[0.1em]">Moteur</div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/[0.06] text-[11px]">
                <div>
                    <span className="text-white/30">Dernier run</span>
                    <div className="text-white/75 font-medium">{timeSince(workspace?.latestRunAt) || '—'}</div>
                </div>
                <div>
                    <span className="text-white/30">Dernier audit</span>
                    <div className="text-white/75 font-medium">{timeSince(workspace?.latestAuditAt) || '—'}</div>
                </div>
                <div>
                    <span className="text-white/30">Prompts actifs / couverture</span>
                    <div className="text-white/75 font-medium">
                        {visibility?.promptCoverage
                            ? `${visibility.promptCoverage.active ?? visibility.promptCoverage.total} · ${visibility.promptCoverage.withTargetFound}/${visibility.promptCoverage.total} cible`
                            : '—'}
                    </div>
                </div>
                <div>
                    <span className="text-white/30">Confiance parse (moy.)</span>
                    <div className={`font-medium ${(kpis?.avgParseConfidence ?? 1) < 0.6 ? 'text-amber-300' : 'text-white/75'}`}>
                        {kpis?.avgParseConfidence != null ? `${Math.round(Number(kpis.avgParseConfidence) * 100)}%` : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionColumn({ title, tone, items, empty }) {
    const border = {
        now: 'border-red-500/20',
        next: 'border-amber-500/15',
        watch: 'border-white/[0.08]',
    };
    return (
        <div className={`rounded-lg border ${border[tone] || border.watch} bg-black/20 min-h-[140px] flex flex-col`}>
            <div className="px-3 py-2 border-b border-white/[0.06]">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">{title}</div>
            </div>
            <div className="p-2 flex-1 space-y-1.5">
                {!items?.length && (
                    <div className="text-[11px] text-white/25 px-2 py-4 text-center leading-relaxed">{empty}</div>
                )}
                {items?.map((item, i) => (
                    <Link
                        key={`${item.href}-${i}`}
                        href={item.href}
                        className="block rounded-md px-2.5 py-2 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-colors group"
                    >
                        <div className="text-[11px] font-semibold text-white/85 group-hover:text-white leading-snug">{item.title}</div>
                        {item.desc && <div className="text-[10px] text-white/35 mt-0.5 line-clamp-2">{item.desc}</div>}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function buildActionCenter({
    baseHref,
    criticalWarnings,
    activeWarnings,
    opportunities,
    noRunsYet,
    lowSampleSize,
    kpis,
    visibility,
    openOppCount,
}) {
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
            now.push({
                title: o.title,
                desc: o.description,
                href: `${baseHref}/opportunities`,
            });
        });

    if (noRunsYet && (visibility?.promptCoverage?.total ?? 0) > 0) {
        now.push({
            title: 'Aucune exécution enregistrée',
            desc: 'Le moteur n’a pas encore produit de signal pour ce client.',
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
            title: 'Faible volume d’exécutions',
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
            title: `Taux d’échec parse ${kpis.parseFailureRate}%`,
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
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement du hub opérateur…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel
                    title="Vue d'ensemble indisponible"
                    description="La synthèse opérateur n'est pas disponible pour ce client."
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
    let globalLabel = 'Client stable';
    let globalDetail = 'Pas de signal bloquant immédiat. Continuer la surveillance habituelle.';

    if (criticalWarnings.length > 0) {
        globalLevel = 'critical';
        globalLabel = 'Intervention requise';
        globalDetail = criticalWarnings.map((w) => w.message).join(' · ');
    } else if (noRunsYet && (visibility?.promptCoverage?.total ?? 0) > 0) {
        globalLevel = 'attention';
        globalLabel = 'Moteur à l’arrêt';
        globalDetail = 'Des prompts sont suivis mais aucune exécution n’a alimenté les signaux.';
    } else if (activeWarnings.length > 0 || lowSampleSize) {
        globalLevel = 'attention';
        globalLabel = 'Attention opérateur';
        globalDetail = lowSampleSize
            ? 'Volume d’exécutions faible — croiser avec les guardrails.'
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
        <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-lg font-bold tracking-[-0.02em] text-white/95">{client?.client_name || 'Client'}</div>
                    <div className="text-[11px] text-white/35 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{client?.business_type || 'Entreprise'}</span>
                        {client?.website_url && (
                            <>
                                <span className="text-white/15">·</span>
                                <a
                                    href={client.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#a78bfa] hover:underline truncate max-w-[240px]"
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
                    <Link href={`${baseHref}/opportunities`} className="geo-btn geo-btn-pri text-[11px] py-1.5 px-3">
                        File d’actions
                    </Link>
                    <Link href={`${baseHref}/runs`} className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3">
                        Superviser l’exécution
                    </Link>
                </div>
            </div>

            <GlobalStatusBanner level={globalLevel} label={globalLabel} detail={globalDetail} />

            <EngineHealthStrip kpis={kpis} workspace={workspace} visibility={visibility} />

            {(criticalWarnings.length > 0 || activeWarnings.length > 0) && (
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                        Alertes &amp; anomalies
                    </div>
                    <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                        {criticalWarnings.map((w) => (
                            <div key={w.code} className="flex gap-2 text-[11px] text-red-200/80">
                                <span className="w-1 rounded-full bg-red-400 shrink-0 mt-1.5" />
                                {w.message}
                            </div>
                        ))}
                        {activeWarnings.map((w) => (
                            <div key={w.code} className="flex gap-2 text-[11px] text-amber-200/70">
                                <span className="w-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                                {w.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="text-[10px] font-bold text-white/35 uppercase tracking-[0.1em] mb-2">Action center</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ActionColumn
                        tone="now"
                        title="Maintenant"
                        items={actionBuckets.now}
                        empty="Rien de critique dans la file automatique. Vérifier les runs si doute."
                    />
                    <ActionColumn
                        tone="next"
                        title="Ensuite"
                        items={actionBuckets.next}
                        empty="Pas d’action secondaire détectée."
                    />
                    <ActionColumn
                        tone="watch"
                        title="À surveiller"
                        items={actionBuckets.watch}
                        empty="Signaux stables sur cette fenêtre."
                    />
                </div>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <div className="text-[10px] font-bold text-white/35 uppercase tracking-[0.1em] mb-3">Résumé audit &amp; exécution</div>
                <div className="flex flex-wrap gap-4 items-stretch">
                    <Link href={`${baseHref}/audit`} className="flex-1 min-w-[120px] rounded-md border border-white/[0.08] bg-black/30 px-3 py-2.5 hover:border-white/15 transition-colors">
                        <div className="text-[10px] text-white/30 uppercase font-bold">SEO</div>
                        <div className="text-2xl font-bold text-emerald-300 mt-0.5">{seoScore ?? '—'}</div>
                        <div className="text-[10px] text-white/25 mt-1">{formatDateTime(visibility?.lastAuditAt)}</div>
                    </Link>
                    <Link href={`${baseHref}/audit`} className="flex-1 min-w-[120px] rounded-md border border-white/[0.08] bg-black/30 px-3 py-2.5 hover:border-white/15 transition-colors">
                        <div className="text-[10px] text-white/30 uppercase font-bold">GEO</div>
                        <div className="text-2xl font-bold text-violet-300 mt-0.5">{geoScore ?? '—'}</div>
                        <div className="text-[10px] text-white/25 mt-1">Dernier audit</div>
                    </Link>
                    <Link href={`${baseHref}/runs`} className="flex-1 min-w-[140px] rounded-md border border-white/[0.08] bg-black/30 px-3 py-2.5 hover:border-white/15 transition-colors">
                        <div className="text-[10px] text-white/30 uppercase font-bold">Runs terminés</div>
                        <div className="text-2xl font-bold text-white/90 mt-0.5">{kpis?.completedRunsTotal ?? 0}</div>
                        <div className="text-[10px] text-white/25 mt-1">{formatDateTime(visibility?.lastGeoRunAt)}</div>
                    </Link>
                    <div className="flex-1 min-w-[140px] rounded-md border border-white/[0.08] bg-black/20 px-3 py-2.5">
                        <div className="text-[10px] text-white/30 uppercase font-bold">File actions</div>
                        <div className="text-2xl font-bold text-amber-200/90 mt-0.5">{openOppCount}</div>
                        <Link href={`${baseHref}/opportunities`} className="text-[10px] text-[#7b8fff] hover:underline mt-1 inline-block">
                            Ouvrir →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="text-[10px] font-bold text-white/35 uppercase tracking-[0.1em]">Signaux clés</div>
                    <Link href={`${baseHref}/signals`} className="text-[10px] font-semibold text-[#7b8fff] hover:underline">
                        Signaux détaillés →
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                    <div>
                        <div className="text-white/30">Visibilité proxy</div>
                        <div className="text-white/85 font-semibold mt-0.5">
                            {kpis?.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '—'}
                            <span className="text-white/35 font-normal ml-1">
                                ({kpis?.visibilityProxyReliability || 'n/a'})
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="text-white/30">Couverture citations</div>
                        <div className="text-white/85 font-semibold mt-0.5">
                            {kpis?.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : '—'}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="text-white/30">Top source</div>
                        <div className="text-white/75 font-medium mt-0.5 truncate">{sources?.topHosts?.[0]?.host || '—'}</div>
                    </div>
                    <div className="min-w-0">
                        <div className="text-white/30">Concurrent dominant</div>
                        <div className="text-white/75 font-medium mt-0.5 truncate">{competitors?.topCompetitors?.[0]?.name || '—'}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`${baseHref}/runs`} className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.04]">
                    Exécution
                </Link>
                <Link href={`${baseHref}/signals`} className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.04]">
                    Signaux
                </Link>
                <Link href={`${baseHref}/opportunities`} className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.04]">
                    Actions
                </Link>
                <Link href={`${baseHref}/prompts`} className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-white/[0.1] text-white/45 hover:text-white hover:bg-white/[0.04]">
                    Prompts suivis
                </Link>
                <Link href={`${baseHref}/settings`} className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-white/[0.1] text-white/45 hover:text-white hover:bg-white/[0.04]">
                    Paramètres
                </Link>
            </div>

            {recentActivity?.length > 0 && (
                <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-3">
                    <div className="text-[10px] font-bold text-white/35 uppercase tracking-[0.1em] mb-2">Activité récente</div>
                    <div className="space-y-2">
                        {recentActivity.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-3 text-[11px] border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                                <div className="min-w-0">
                                    <div className="font-medium text-white/75 truncate">{item.title}</div>
                                    <div className="text-white/30 line-clamp-1">{item.description}</div>
                                </div>
                                <div className="text-[10px] text-white/25 shrink-0">{formatDateTime(item.created_at)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
