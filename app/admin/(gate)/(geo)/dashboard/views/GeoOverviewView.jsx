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

    const { kpis, visibility, sources, competitors, opportunities, recentActivity, provenance, recentAudits, recentQueryRuns, guardrails } = data;
    const noRunsYet = (kpis?.completedRunsTotal ?? 0) === 0;
    const lowSampleSize = (kpis?.completedRunsTotal ?? 0) > 0 && (kpis?.completedRunsTotal ?? 0) < 5;
    const activeWarnings = (guardrails || []).filter((g) => g.severity === 'warning');

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title={`${ADMIN_GEO_LABELS.nav.overview} - ${client?.client_name || 'Client'}`}
                subtitle="Synthèse opérateur: scores observés, tendances dérivées, et priorités actionnables à partir des exécutions stockées."
                action={(
                    <div className="flex flex-wrap gap-2">
                        {provenance?.observed && <GeoProvenancePill meta={provenance.observed} />}
                        {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
                        <Link href={`${baseHref}?view=améliorer`} className="geo-btn geo-btn-pri">
                            {ADMIN_GEO_LABELS.nav.opportunities}
                        </Link>
                    </div>
                )}
            />

            {activeWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
                    {activeWarnings.map((w) => (
                        <div key={w.code} className="text-[11px] text-amber-200/70">{w.message}</div>
                    ))}
                </div>
            )}

            {lowSampleSize && activeWarnings.length === 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/70">
                    Faible volume d&apos;exécutions ({kpis.completedRunsTotal}). Les métriques dérivées ne sont pas encore fiables.
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Score SEO" value={kpis.seoScore} hint="Observé — dimension technique du dernier audit" accent="emerald" />
                <GeoKpiCard label="Score GEO" value={kpis.geoScore} hint="Observé — dimension locale du dernier audit" accent="violet" />
                <GeoKpiCard label="Prompts suivis" value={kpis.trackedPromptsTotal} hint="Nombre total de prompts suivis" />
                <GeoKpiCard label="Exécutions terminées" value={kpis.completedRunsTotal} hint="Exécutions standard terminées" accent="blue" />
                <GeoKpiCard label="Taux de mention" value={kpis.mentionRatePercent != null ? `${kpis.mentionRatePercent}%` : null} hint="Dérivé — % de prompts dont le dernier run détecte la cible" accent="violet" />
                <GeoKpiCard label="Couverture citations" value={kpis.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : null} hint="Dérivé — % de runs avec au moins une source externe" accent="amber" />
                <GeoKpiCard label="Concurrents confirmés" value={kpis.competitorMentionsCount} hint="Dérivé — mentions de concurrents confirmés uniquement" accent="amber" />
                <GeoKpiCard label="Opportunités ouvertes" value={kpis.openOpportunitiesCount} hint="Observé — file d'opportunités" accent="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Instantané visibilité</div>
                            <p className="text-[11px] text-white/35">
                                Proxy basé sur les exécutions suivies uniquement, pas une mesure universelle de marché.
                            </p>
                        </div>
                        {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Proxy visibilité</div>
                            <div className="text-3xl font-bold text-white mt-2">
                                {kpis.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '-'}
                            </div>
                            <div className="text-[10px] text-white/35 mt-2">
                                {kpis.visibilityProxyReliability === 'high' || kpis.visibilityProxyReliability === 'reliable'
                                    ? 'Fiable — basé sur un volume suffisant.'
                                    : kpis.visibilityProxyReliability === 'medium' || kpis.visibilityProxyReliability === 'indicative'
                                        ? 'Indicatif — volume encore faible.'
                                        : kpis.visibilityProxyReliability === 'low' || kpis.visibilityProxyReliability === 'insufficient_data'
                                            ? 'Données insuffisantes — à confirmer.'
                                            : 'Aucune donnée.'}
                            </div>
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
                        {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
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
                        {provenance?.observed && <GeoProvenancePill meta={provenance.observed} />}
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
                            <p className="text-[11px] text-white/35">Top domaines source captés depuis les exécutions stockées.</p>
                        </div>
                        {provenance?.observed && <GeoProvenancePill meta={provenance.observed} />}
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
                            <div className="text-sm font-semibold text-white/95">Concurrents confirmés</div>
                            <p className="text-[11px] text-white/35">Concurrents confirmés uniquement — les mentions génériques sont séparées.</p>
                        </div>
                        {provenance?.observed && <GeoProvenancePill meta={provenance.observed} />}
                    </div>

                    {competitors.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune exécution"
                            description="Exécutez les prompts suivis pour alimenter la couche concurrentielle."
                        />
                    ) : competitors.summary.competitorMentions === 0 ? (
                        <GeoEmptyPanel
                            title="Aucun concurrent confirmé"
                            description={competitors.summary.genericNonTargetMentions > 0
                                ? `${competitors.summary.genericNonTargetMentions} mention(s) génériques détectée(s). Ajoutez des concurrents connus dans le profil.`
                                : 'Aucun concurrent détecté. Ajoutez des concurrents connus dans le profil client.'}
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
                            <p className="text-[11px] text-white/35">File opérateur issue des signaux observés et inférés.</p>
                        </div>
                        {provenance?.derived && <GeoProvenancePill meta={provenance.derived} />}
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

