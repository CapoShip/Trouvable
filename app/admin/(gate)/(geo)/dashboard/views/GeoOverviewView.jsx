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

export default function GeoOverviewView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('overview');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
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

    const { kpis, visibility, sources, competitors, opportunities, recentActivity, provenance, recentAudits, recentQueryRuns } = data;
    const noRunsYet = (kpis?.completedRunsTotal ?? 0) === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title={`${ADMIN_GEO_LABELS.nav.overview} - ${client?.client_name || 'Client'}`}
                subtitle="Synthèse opérateur: scores observés, tendances dérivées, et priorités actionnables à partir des exécutions stockées."
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={provenance.observéd} />
                        <GeoProvenancePill meta={provenance.dérivéd} />
                        <Link href={`${baseHref}?view=améliorer`} className="geo-btn geo-btn-pri">
                            {ADMIN_GEO_LABELS.nav.opportunities}
                        </Link>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Score SEO" value={kpis.seoScore} hint="Observé - dernier audit" accent="emerald" />
                <GeoKpiCard label="Score GEO" value={kpis.geoScore} hint="Observé - dernier audit" accent="violet" />
                <GeoKpiCard label="Prompts suivis" value={kpis.trackedPromptsTotal} hint="Dérivé des prompts stockés" />
                <GeoKpiCard label="Exécutions terminées" value={kpis.completedRunsTotal} hint="Exécutions observées terminées" accent="blue" />
                <GeoKpiCard label="Taux de mention" value={kpis.mentionRatePercent != null ? `${kpis.mentionRatePercent}%` : null} hint="Dérivé du dernier run par prompt" accent="violet" />
                <GeoKpiCard label="Couverture citations" value={kpis.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : null} hint="Dérivé des sources observées" accent="amber" />
                <GeoKpiCard label="Mentions concurrents" value={kpis.competitorMentionsCount} hint="Dérivé des exécutions observées" accent="amber" />
                <GeoKpiCard label="Opportunités ouvertes" value={kpis.openOpportunitiesCount} hint="État de file observé" accent="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Instantané visibilité</div>
                            <p className="text-[11px] text-white/35">
                                Vérité basée sur les exécutions suivies uniquement, pas une vérité universelle de marché.
                            </p>
                        </div>
                        <GeoProvenancePill meta={provenance.dérivéd} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Proxy visibilité</div>
                            <div className="text-3xl font-bold text-white mt-2">
                                {kpis.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '-'}
                            </div>
                            <div className="text-[10px] text-white/35 mt-2">Dérivé des exécutions terminées.</div>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Dernière exécution</div>
                            <div className="text-sm font-semibold text-white mt-2">{formatDateTime(visibility.lastGeoRunAt)}</div>
                            <div className="text-[10px] text-white/35 mt-2">Horodatage observé le plus récent.</div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="text-[11px] font-bold text-white/35 uppercase tracking-[0.08em]">Couverture prompts</div>
                        <GeoBarRow label="Cible détectée au dernier run" value={visibility.promptCoverage.withTargetFound} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-emerald-500/80" />
                        <GeoBarRow label="Dernier run sans cible" value={visibility.promptCoverage.withRunNoTarget} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-amber-500/80" />
                        <GeoBarRow label="Sans exécution" value={visibility.promptCoverage.noRunYet} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-white/35" />
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Providers et modèles</div>
                            <p className="text-[11px] text-white/35">Top couples provider/modèle par volume d'exécutions terminées.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.dérivéd} />
                    </div>

                    {visibility.topProvidersModels?.length ? (
                        <div className="space-y-3">
                            {visibility.topProvidersModels.map((row) => (
                                <GeoBarRow
                                    key={`${row.provider}-${row.model}`}
                                    label={`${row.provider} - ${row.model}`}
                                    sub={`${row.targetRatePercent}% cible détectée - ${row.sources} mentions source`}
                                    value={row.runs}
                                    max={Math.max(...visibility.topProvidersModels.map((item) => item.runs), 1)}
                                    color="bg-violet-500/80"
                                />
                            ))}
                        </div>
                    ) : (
                        <GeoEmptyPanel
                            title="Aucune exécution"
                            description="Lancez d'abord les prompts suivis pour alimenter la performance provider/modèle."
                        />
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Activité récente partageable</div>
                            <p className="text-[11px] text-white/35">Audits terminés et actions opérateur autorisées.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observéd} />
                    </div>

                    {recentActivity?.length ? (
                        <div className="space-y-2">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-white/90">{item.title}</div>
                                        <div className="text-[10px] text-white/35">{formatDateTime(item.created_at)}</div>
                                    </div>
                                    <div className="text-[11px] text-white/45 mt-1">{item.description}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <GeoEmptyPanel
                            title="Aucune activité récente"
                            description="Les audits termines, exécutions et changements publies apparaitront ici."
                        />
                    )}
                </GeoPremiumCard>
            </div>

            {noRunsYet ? (
                <GeoEmptyPanel
                    title="Aucune exécution pour le moment"
                    description="Lancez les prompts suivis pour générér les indicateurs de visibilité, citations et concurrents."
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Citations observées</div>
                            <p className="text-[11px] text-white/35">Top domaines source captes depuis les exécutions stockées.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observéd} />
                    </div>

                    {sources.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune exécution"
                            description="Executez les prompts suivis. La couverture citation depend uniquement des runs observés."
                        />
                    ) : sources.summary.totalSourceMentions === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune citation observée"
                            description="Des exécutions existent, mais aucune source n'a encore été extraite."
                        />
                    ) : (
                        <div className="space-y-3">
                            {sources.topHosts.map((item) => (
                                <GeoBarRow
                                    key={item.host}
                                    label={item.host}
                                    value={item.count}
                                    max={Math.max(...sources.topHosts.map((row) => row.count), 1)}
                                    color="bg-fuchsia-500/75"
                                />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Concurrents observés</div>
                            <p className="text-[11px] text-white/35">Mentions concurrentes et hors cible issues des runs observés'uniquement.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observéd} />
                    </div>

                    {competitors.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune exécution"
                            description="Executez les prompts suivis pour alimenter la couche concurrentielle observée."
                        />
                    ) : competitors.summary.competitorMentions + competitors.summary.genericNonTargetMentions === 0 ? (
                        <GeoEmptyPanel
                            title="Aucun concurrent observé"
                            description="Des exécutions existent, mais aucun concurrent fiable n'a été capture."
                        />
                    ) : (
                        <div className="space-y-3">
                            {competitors.topCompetitors.map((item) => (
                                <GeoBarRow
                                    key={item.name}
                                    label={item.name}
                                    value={item.count}
                                    max={Math.max(...competitors.topCompetitors.map((row) => row.count), 1)}
                                    color="bg-amber-500/75"
                                />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">{ADMIN_GEO_LABELS.nav.opportunities}</div>
                            <p className="text-[11px] text-white/35">File operateur issue des signaux observés'et inférés.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.dérivéd} />
                    </div>

                    {opportunities.summary.open === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune opportunité ouverte"
                            description="Les actions apparaitront apres audit ou analyse des exécutions suivies."
                        />
                    ) : (
                        <div className="space-y-2">
                            {opportunities.openItems.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-white/90">{item.title}</div>
                                        <GeoProvenancePill meta={item.provenance} />
                                    </div>
                                    <div className="text-[11px] text-white/45 mt-1">{item.description}</div>
                                </div>
                            ))}
                            <Link href={`${baseHref}?view=améliorer`} className="geo-btn geo-btn-ghost">
                                Voir toute la file
                            </Link>
                        </div>
                    )}
                </GeoPremiumCard>
            </div>
        </div>
    );
}

