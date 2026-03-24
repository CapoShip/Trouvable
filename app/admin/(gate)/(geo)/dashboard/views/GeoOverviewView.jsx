'use client';

import Link from 'next/link';

import { AuditScoresLineChart, QueryRunsVisibilityChart } from '../components/GeoRealCharts';
import {
    GeoBarRow,
    GeoEmptyPanel,
    GeoKpiCard,
    GeoPremiumCard,
    GeoProvenancePill,
    GeoSectionTitle,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';
import { ADMIN_GEO_LABELS } from '@/lib/i18n/admin-fr';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function timeSince(value) {
    if (!value) return null;
    const diff = Date.now() - new Date(value).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Il y a moins d\u2019une heure';
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Il y a 1 jour';
    return `Il y a ${days} jours`;
}

function HealthIndicator({ status, label }) {
    const styles = {
        ok: 'bg-emerald-400/15 border-emerald-400/25 text-emerald-300',
        warning: 'bg-amber-400/15 border-amber-400/25 text-amber-300',
        critical: 'bg-red-400/15 border-red-400/25 text-red-300',
        idle: 'bg-white/[0.04] border-white/10 text-white/40',
    };
    const dots = {
        ok: 'bg-emerald-400',
        warning: 'bg-amber-400',
        critical: 'bg-red-400',
        idle: 'bg-white/30',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${styles[status] || styles.idle}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.idle}`} />
            {label}
        </span>
    );
}

function EngineHealthPanel({ kpis, workspace, visibility }) {
    const hasRuns = (kpis?.completedRunsTotal ?? 0) > 0;
    const failRate = hasRuns && kpis.failedRunsTotal > 0
        ? Math.round((kpis.failedRunsTotal / (kpis.completedRunsTotal + kpis.failedRunsTotal)) * 100)
        : 0;

    const engineStatus = !hasRuns ? 'idle'
        : failRate > 20 ? 'critical'
        : failRate > 5 ? 'warning'
        : 'ok';

    const parseStatus = !hasRuns ? 'idle'
        : (kpis.parseFailRate ?? 0) > 15 ? 'critical'
        : (kpis.parseFailRate ?? 0) > 5 ? 'warning'
        : 'ok';

    const freshnessHours = workspace?.latestRunAt
        ? Math.floor((Date.now() - new Date(workspace.latestRunAt).getTime()) / 3600000)
        : null;
    const freshnessStatus = freshnessHours === null ? 'idle'
        : freshnessHours > 72 ? 'critical'
        : freshnessHours > 24 ? 'warning'
        : 'ok';

    return (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-[11px] font-bold text-white/50 uppercase tracking-[0.08em]">Santé moteur</div>
                <div className="flex flex-wrap gap-1.5">
                    <HealthIndicator status={engineStatus} label={!hasRuns ? 'Inactif' : failRate > 0 ? `Échecs ${failRate}%` : 'Nominal'} />
                    <HealthIndicator status={parseStatus} label={!hasRuns ? 'N/A' : 'Parse'} />
                    <HealthIndicator status={freshnessStatus} label={freshnessHours !== null ? (freshnessHours < 1 ? 'Frais' : `${freshnessHours}h`) : 'N/A'} />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div>
                    <div className="text-white/30 mb-0.5">Dernière exécution</div>
                    <div className="text-white/70 font-medium">{timeSince(workspace?.latestRunAt) || 'Jamais'}</div>
                </div>
                <div>
                    <div className="text-white/30 mb-0.5">Dernier audit</div>
                    <div className="text-white/70 font-medium">{timeSince(workspace?.latestAuditAt) || 'Jamais'}</div>
                </div>
                <div>
                    <div className="text-white/30 mb-0.5">Taux échec runs</div>
                    <div className={`font-medium ${failRate > 10 ? 'text-red-300' : 'text-white/70'}`}>{hasRuns ? `${failRate}%` : '-'}</div>
                </div>
                <div>
                    <div className="text-white/30 mb-0.5">Couverture prompts</div>
                    <div className="text-white/70 font-medium">
                        {visibility?.promptCoverage ? `${visibility.promptCoverage.withTargetFound}/${visibility.promptCoverage.total}` : '-'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GeoOverviewView() {
    const { client, clientId, workspace, audit } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('overview');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement de la synthèse...</div>;
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

    const { kpis, visibility, sources, competitors, opportunities, recentActivity, provenance, recentAudits, recentQueryRuns, guardrails } = data;
    const noRunsYet = (kpis?.completedRunsTotal ?? 0) === 0;
    const lowSampleSize = (kpis?.completedRunsTotal ?? 0) > 0 && (kpis?.completedRunsTotal ?? 0) < 5;
    const activeWarnings = (guardrails || []).filter((g) => g.severity === 'warning');
    const criticalWarnings = (guardrails || []).filter((g) => g.severity === 'critical' || g.severity === 'error');

    const seoScore = audit?.seo_score ?? kpis?.seoScore;
    const geoScore = audit?.geo_score ?? kpis?.geoScore;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="text-lg font-bold tracking-[-0.02em] text-white/95">{client?.client_name || 'Client'}</div>
                        <div className="text-[12px] text-white/35 flex items-center gap-2 mt-0.5">
                            <span>{client?.business_type || 'Entreprise'}</span>
                            {client?.website_url && (
                                <>
                                    <span className="text-white/15">·</span>
                                    <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] hover:underline truncate max-w-[200px]">
                                        {client.website_url.replace(/^https?:\/\//, '')}
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {provenance?.observed && <GeoProvenancePill meta={provenance.observed} />}
                    {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri">
                        {ADMIN_GEO_LABELS.nav.opportunities}
                    </Link>
                </div>
            </div>

            {/* Critical alerts — top priority */}
            {criticalWarnings.length > 0 && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3 space-y-1">
                    <div className="text-[10px] font-bold text-red-300 uppercase tracking-[0.08em] mb-1">Alertes critiques</div>
                    {criticalWarnings.map((w) => (
                        <div key={w.code} className="text-[11px] text-red-200/70 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            {w.message}
                        </div>
                    ))}
                </div>
            )}

            {activeWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-1">
                    <div className="text-[10px] font-bold text-amber-300/70 uppercase tracking-[0.08em] mb-1">Avertissements</div>
                    {activeWarnings.map((w) => (
                        <div key={w.code} className="text-[11px] text-amber-200/60 flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            {w.message}
                        </div>
                    ))}
                </div>
            )}

            {lowSampleSize && activeWarnings.length === 0 && criticalWarnings.length === 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-[11px] text-amber-200/60">
                    Faible volume d&apos;exécutions ({kpis.completedRunsTotal}). Les métriques dérivées ne sont pas encore fiables.
                </div>
            )}

            {/* Engine health — absorbed from cockpit */}
            <EngineHealthPanel kpis={kpis} workspace={workspace} visibility={visibility} />

            {/* Core KPIs — decision metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Score SEO" value={seoScore} hint="Dernier audit observé" accent="emerald" />
                <GeoKpiCard label="Score GEO" value={geoScore} hint="Dernier audit observé" accent="violet" />
                <GeoKpiCard label="Prompts suivis" value={kpis.trackedPromptsTotal} hint="Total actifs" />
                <GeoKpiCard label="Runs terminés" value={kpis.completedRunsTotal} hint="Exécutions standard" accent="blue" />
                <GeoKpiCard label="Taux mention" value={kpis.mentionRatePercent != null ? `${kpis.mentionRatePercent}%` : null} hint="Détection cible sur dernier run" accent="violet" />
                <GeoKpiCard label="Couverture citations" value={kpis.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : null} hint="Runs avec source externe" accent="amber" />
                <GeoKpiCard label="Concurrents" value={kpis.competitorMentionsCount} hint="Confirmés uniquement" accent="amber" />
                <GeoKpiCard label="Opportunités" value={kpis.openOpportunitiesCount} hint="File ouverte" accent="emerald" />
            </div>

            {/* Visibility + Providers + Quick actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Proxy visibilité</div>
                            <p className="text-[11px] text-white/35">Basé sur les exécutions suivies uniquement.</p>
                        </div>
                        {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Visibilité</div>
                            <div className="text-3xl font-bold text-white mt-2">
                                {kpis.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '-'}
                            </div>
                            <div className="text-[10px] text-white/35 mt-2">
                                {kpis.visibilityProxyReliability === 'high' || kpis.visibilityProxyReliability === 'reliable'
                                    ? 'Fiable'
                                    : kpis.visibilityProxyReliability === 'medium' || kpis.visibilityProxyReliability === 'indicative'
                                        ? 'Indicatif'
                                        : kpis.visibilityProxyReliability === 'low' || kpis.visibilityProxyReliability === 'insufficient_data'
                                            ? 'Insuffisant'
                                            : 'N/A'}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Dernière exécution</div>
                            <div className="text-sm font-semibold text-white mt-2">{formatDateTime(visibility.lastGeoRunAt)}</div>
                            <div className="text-[10px] text-white/35 mt-2">{timeSince(visibility.lastGeoRunAt) || 'Jamais'}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[11px] font-bold text-white/35 uppercase tracking-[0.08em]">Couverture prompts</div>
                        <GeoBarRow label="Cible détectée" value={visibility.promptCoverage.withTargetFound} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-emerald-500/80" />
                        <GeoBarRow label="Sans cible" value={visibility.promptCoverage.withRunNoTarget} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-amber-500/80" />
                        <GeoBarRow label="Non exécuté" value={visibility.promptCoverage.noRunYet} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-white/35" />
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Providers et modèles</div>
                            <p className="text-[11px] text-white/35">Top par volume d'exécutions.</p>
                        </div>
                    </div>

                    {visibility.topProvidersModels?.length ? (
                        <div className="space-y-3">
                            {visibility.topProvidersModels.map((row) => (
                                <GeoBarRow
                                    key={`${row.provider}-${row.model}`}
                                    label={`${row.provider} · ${row.model}`}
                                    sub={`${row.targetRatePercent}% cible · ${row.sources} sources`}
                                    value={row.runs}
                                    max={Math.max(...visibility.topProvidersModels.map((item) => item.runs), 1)}
                                    color="bg-violet-500/80"
                                />
                            ))}
                        </div>
                    ) : (
                        <GeoEmptyPanel title="Aucune exécution" description="Lancez les prompts suivis pour alimenter la performance provider." />
                    )}
                </GeoPremiumCard>

                {/* Quick actions — absorbed from cockpit */}
                <GeoPremiumCard className="p-5">
                    <div className="text-sm font-semibold text-white/95 mb-3">Actions rapides</div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <Link href={`${baseHref}?view=audit`} className="geo-card p-3 text-center hover:border-white/20 transition-colors">
                            <div className="text-[22px] font-bold text-emerald-400">{seoScore ?? '-'}</div>
                            <div className="text-[9px] text-white/30 uppercase font-bold mt-0.5">SEO</div>
                        </Link>
                        <Link href={baseHref} className="geo-card p-3 text-center hover:border-white/20 transition-colors">
                            <div className="text-[22px] font-bold text-[#a78bfa]">{geoScore ?? '-'}</div>
                            <div className="text-[9px] text-white/30 uppercase font-bold mt-0.5">GEO</div>
                        </Link>
                        <Link href={`${baseHref}?view=runs`} className="geo-card p-3 text-center hover:border-white/20 transition-colors">
                            <div className="text-[22px] font-bold text-amber-400">{workspace?.completedRunCount ?? kpis.completedRunsTotal ?? 0}</div>
                            <div className="text-[9px] text-white/30 uppercase font-bold mt-0.5">Runs</div>
                        </Link>
                    </div>

                    <div className="space-y-1.5">
                        <Link href={`${baseHref}?view=runs`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all text-[11px] text-white/60 hover:text-white/90">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 10h3l2-4 3 8 2-4h6" /></svg>
                            Superviser les exécutions
                        </Link>
                        <Link href={`${baseHref}?view=prompts`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all text-[11px] text-white/60 hover:text-white/90">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 4h16M2 8h12M2 12h10M2 16h6" /></svg>
                            Gérer les prompts suivis
                        </Link>
                        <Link href={`${baseHref}?view=ameliorer`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all text-[11px] text-white/60 hover:text-white/90">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l5-5 4 4 8-12" /><path d="M14 5h5v5" /></svg>
                            Traiter les opportunités
                        </Link>
                        <Link href={`/admin/clients/${clientId}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all text-[11px] text-white/60 hover:text-white/90">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" /></svg>
                            Fiche client complète
                        </Link>
                    </div>
                </GeoPremiumCard>
            </div>

            {/* Charts or empty state */}
            {noRunsYet ? (
                <GeoEmptyPanel
                    title="Aucune exécution pour le moment"
                    description="Lancez les prompts suivis pour générer les indicateurs de visibilité, citations et concurrents."
                >
                    <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-pri">
                        Lancer les exécutions suivies
                    </Link>
                </GeoEmptyPanel>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <AuditScoresLineChart recentAudits={recentAudits || []} />
                    <QueryRunsVisibilityChart recentQueryRuns={recentQueryRuns || []} />
                </div>
            )}

            {/* Bottom panels — citations, competitors, opportunities */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Citations</div>
                            <p className="text-[11px] text-white/35">Top domaines source observés.</p>
                        </div>
                        <Link href={`${baseHref}?view=citations`} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Détails →</Link>
                    </div>

                    {sources.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel title="Aucune exécution" description="Exécutez les prompts suivis." />
                    ) : sources.summary.totalSourceMentions === 0 ? (
                        <GeoEmptyPanel title="Aucune citation" description="Aucune source extraite." />
                    ) : (
                        <div className="space-y-3">
                            {sources.topHosts.map((item) => (
                                <GeoBarRow key={item.host} label={item.host} value={item.count} max={Math.max(...sources.topHosts.map((row) => row.count), 1)} color="bg-fuchsia-500/75" />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Concurrents confirmés</div>
                            <p className="text-[11px] text-white/35">Mentions confirmées uniquement.</p>
                        </div>
                        <Link href={`${baseHref}?view=competitors`} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Détails →</Link>
                    </div>

                    {competitors.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel title="Aucune exécution" description="Exécutez les prompts suivis." />
                    ) : competitors.summary.competitorMentions === 0 ? (
                        <GeoEmptyPanel
                            title="Aucun concurrent confirmé"
                            description={competitors.summary.genericNonTargetMentions > 0
                                ? `${competitors.summary.genericNonTargetMentions} mention(s) génériques. Ajoutez des concurrents dans le profil.`
                                : 'Ajoutez des concurrents connus dans le profil client.'}
                        />
                    ) : (
                        <div className="space-y-3">
                            {competitors.topCompetitors.map((item) => (
                                <GeoBarRow key={item.name} label={item.name} value={item.count} max={Math.max(...competitors.topCompetitors.map((row) => row.count), 1)} color="bg-amber-500/75" />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Opportunités</div>
                            <p className="text-[11px] text-white/35">File opérateur prioritaire.</p>
                        </div>
                        <Link href={`${baseHref}?view=ameliorer`} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Détails →</Link>
                    </div>

                    {opportunities.summary.open === 0 ? (
                        <GeoEmptyPanel title="Aucune opportunité ouverte" description="Les actions apparaîtront après audit ou analyse." />
                    ) : (
                        <div className="space-y-2">
                            {opportunities.openItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[12px] font-semibold text-white/90 truncate">{item.title}</div>
                                        <GeoProvenancePill meta={item.provenance} />
                                    </div>
                                    <div className="text-[11px] text-white/40 mt-1 line-clamp-1">{item.description}</div>
                                </div>
                            ))}
                            {opportunities.summary.open > 3 && (
                                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost w-full justify-center">
                                    Voir les {opportunities.summary.open} opportunités
                                </Link>
                            )}
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            {/* Recent activity */}
            {recentActivity?.length > 0 && (
                <GeoPremiumCard className="p-5">
                    <div className="text-sm font-semibold text-white/95 mb-3">Activité récente</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {recentActivity.slice(0, 6).map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[12px] font-semibold text-white/80 truncate">{item.title}</div>
                                    <div className="text-[10px] text-white/25 shrink-0">{formatDateTime(item.created_at)}</div>
                                </div>
                                <div className="text-[11px] text-white/40 mt-1 line-clamp-1">{item.description}</div>
                            </div>
                        ))}
                    </div>
                </GeoPremiumCard>
            )}
        </div>
    );
}
