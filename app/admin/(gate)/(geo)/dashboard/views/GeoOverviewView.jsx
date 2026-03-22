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
                    title="Vue d ensemble indisponible"
                    description="La synthese operateur n a pas pu etre chargee pour ce client."
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
                subtitle="Synthese operateur: scores observes, tendances derivees, et priorites actionnables a partir des executions stockees."
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={provenance.observed} />
                        <GeoProvenancePill meta={provenance.derived} />
                        <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri">
                            {ADMIN_GEO_LABELS.nav.opportunities}
                        </Link>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Score SEO" value={kpis.seoScore} hint="Observe - dernier audit" accent="emerald" />
                <GeoKpiCard label="Score GEO" value={kpis.geoScore} hint="Observe - dernier audit" accent="violet" />
                <GeoKpiCard label="Prompts suivis" value={kpis.trackedPromptsTotal} hint="Derive des prompts stockes" />
                <GeoKpiCard label="Executions terminees" value={kpis.completedRunsTotal} hint="Executions observees terminees" accent="blue" />
                <GeoKpiCard label="Taux de mention" value={kpis.mentionRatePercent != null ? `${kpis.mentionRatePercent}%` : null} hint="Derive du dernier run par prompt" accent="violet" />
                <GeoKpiCard label="Couverture citations" value={kpis.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : null} hint="Derive des sources observees" accent="amber" />
                <GeoKpiCard label="Mentions concurrents" value={kpis.competitorMentionsCount} hint="Derive des executions observees" accent="amber" />
                <GeoKpiCard label="Opportunites ouvertes" value={kpis.openOpportunitiesCount} hint="Etat de file observe" accent="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Instantane visibilite</div>
                            <p className="text-[11px] text-white/35">
                                Verite basee sur les executions suivies uniquement, pas une verite universelle de marche.
                            </p>
                        </div>
                        <GeoProvenancePill meta={provenance.derived} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Proxy visibilite</div>
                            <div className="text-3xl font-bold text-white mt-2">
                                {kpis.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '-'}
                            </div>
                            <div className="text-[10px] text-white/35 mt-2">Derive des executions terminees.</div>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Derniere execution</div>
                            <div className="text-sm font-semibold text-white mt-2">{formatDateTime(visibility.lastGeoRunAt)}</div>
                            <div className="text-[10px] text-white/35 mt-2">Horodatage observe le plus recent.</div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="text-[11px] font-bold text-white/35 uppercase tracking-[0.08em]">Couverture prompts</div>
                        <GeoBarRow label="Cible detectee au dernier run" value={visibility.promptCoverage.withTargetFound} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-emerald-500/80" />
                        <GeoBarRow label="Dernier run sans cible" value={visibility.promptCoverage.withRunNoTarget} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-amber-500/80" />
                        <GeoBarRow label="Sans execution" value={visibility.promptCoverage.noRunYet} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-white/35" />
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Providers et modeles</div>
                            <p className="text-[11px] text-white/35">Top couples provider/modele par volume d executions terminees.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.derived} />
                    </div>

                    {visibility.topProvidersModels?.length ? (
                        <div className="space-y-3">
                            {visibility.topProvidersModels.map((row) => (
                                <GeoBarRow
                                    key={`${row.provider}-${row.model}`}
                                    label={`${row.provider} - ${row.model}`}
                                    sub={`${row.targetRatePercent}% cible detectee - ${row.sources} mentions source`}
                                    value={row.runs}
                                    max={Math.max(...visibility.topProvidersModels.map((item) => item.runs), 1)}
                                    color="bg-violet-500/80"
                                />
                            ))}
                        </div>
                    ) : (
                        <GeoEmptyPanel
                            title="Aucune execution"
                            description="Lancez d abord les prompts suivis pour alimenter la performance provider/modele."
                        />
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Activite recente partageable</div>
                            <p className="text-[11px] text-white/35">Audits termines et actions operateur autorisees.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observed} />
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
                            title="Aucune activite recente"
                            description="Les audits termines, executions et changements publies apparaitront ici."
                        />
                    )}
                </GeoPremiumCard>
            </div>

            {noRunsYet ? (
                <GeoEmptyPanel
                    title="Aucune execution pour le moment"
                    description="Lancez les prompts suivis pour generer les indicateurs de visibilite, citations et concurrents."
                >
                    <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-pri">
                        Lancer les executions suivies
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
                            <div className="text-sm font-semibold text-white/95">Citations observees</div>
                            <p className="text-[11px] text-white/35">Top domaines source captes depuis les executions stockees.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observed} />
                    </div>

                    {sources.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune execution"
                            description="Executez les prompts suivis. La couverture citation depend uniquement des runs observes."
                        />
                    ) : sources.summary.totalSourceMentions === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune citation observee"
                            description="Des executions existent, mais aucune source n a encore ete extraite."
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
                            <div className="text-sm font-semibold text-white/95">Concurrents observes</div>
                            <p className="text-[11px] text-white/35">Mentions concurrentes et hors cible issues des runs observes uniquement.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observed} />
                    </div>

                    {competitors.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune execution"
                            description="Executez les prompts suivis pour alimenter la couche concurrentielle observee."
                        />
                    ) : competitors.summary.competitorMentions + competitors.summary.genericNonTargetMentions === 0 ? (
                        <GeoEmptyPanel
                            title="Aucun concurrent observe"
                            description="Des executions existent, mais aucun concurrent fiable n a ete capture."
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
                            <p className="text-[11px] text-white/35">File operateur issue des signaux observes et inferes.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.derived} />
                    </div>

                    {opportunities.summary.open === 0 ? (
                        <GeoEmptyPanel
                            title="Aucune opportunite ouverte"
                            description="Les actions apparaitront apres audit ou analyse des executions suivies."
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
                            <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost">
                                Voir toute la file
                            </Link>
                        </div>
                    )}
                </GeoPremiumCard>
            </div>
        </div>
    );
}

