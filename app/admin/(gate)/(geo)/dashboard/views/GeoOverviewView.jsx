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

function formatDateTime(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

export default function GeoOverviewView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('overview');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel
                    title="Workspace indisponible"
                    description="La synthese operateur n'a pas pu etre chargee pour ce client."
                />
            </div>
        );
    }

    const { kpis, visibility, sources, competitors, opportunities, recentActivity, provenance, recentAudits, recentQueryRuns } = data;
    const noRunsYet = (kpis?.completedRunsTotal ?? 0) === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title={client?.client_name || 'Overview'}
                subtitle="Synthese operateur du client. Les scores d'audit sont observes. Les taux, couvertures et aggregations sont derives des runs stockes."
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={provenance.observed} />
                        <GeoProvenancePill meta={provenance.derived} />
                        <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri">
                            Opportunity center
                        </Link>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="SEO score" value={kpis.seoScore} hint="Observed · latest audit" accent="emerald" />
                <GeoKpiCard label="GEO score" value={kpis.geoScore} hint="Observed · latest audit" accent="violet" />
                <GeoKpiCard label="Tracked prompts" value={kpis.trackedPromptsTotal} hint="Derived from stored prompts" />
                <GeoKpiCard label="Completed runs" value={kpis.completedRunsTotal} hint="Observed runs with completed status" accent="blue" />
                <GeoKpiCard label="Mention rate" value={kpis.mentionRatePercent != null ? `${kpis.mentionRatePercent}%` : null} hint="Derived from latest run per prompt" accent="violet" />
                <GeoKpiCard label="Citation coverage" value={kpis.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : null} hint="Derived from observed source mentions" accent="amber" />
                <GeoKpiCard label="Competitor mentions" value={kpis.competitorMentionsCount} hint="Derived from tracked-run observations" accent="amber" />
                <GeoKpiCard label="Open opportunities" value={kpis.openOpportunitiesCount} hint="Observed queue status" accent="emerald" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Visibility snapshot</div>
                            <p className="text-[11px] text-white/35">
                                Tracked-run truth only. This is not universal market truth.
                            </p>
                        </div>
                        <GeoProvenancePill meta={provenance.derived} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Visibility proxy</div>
                            <div className="text-3xl font-bold text-white mt-2">
                                {kpis.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : '—'}
                            </div>
                            <div className="text-[10px] text-white/35 mt-2">Derived from completed tracked runs.</div>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Last run</div>
                            <div className="text-sm font-semibold text-white mt-2">{formatDateTime(visibility.lastGeoRunAt)}</div>
                            <div className="text-[10px] text-white/35 mt-2">Most recent observed run timestamp.</div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="text-[11px] font-bold text-white/35 uppercase tracking-[0.08em]">Prompt coverage</div>
                        <GeoBarRow label="Target found on latest run" value={visibility.promptCoverage.withTargetFound} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-emerald-500/80" />
                        <GeoBarRow label="Latest run without target" value={visibility.promptCoverage.withRunNoTarget} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-amber-500/80" />
                        <GeoBarRow label="No run yet" value={visibility.promptCoverage.noRunYet} max={Math.max(visibility.promptCoverage.total, 1)} color="bg-white/35" />
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Providers and models</div>
                            <p className="text-[11px] text-white/35">Top provider/model pairs by completed run volume.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.derived} />
                    </div>

                    {visibility.topProvidersModels?.length ? (
                        <div className="space-y-3">
                            {visibility.topProvidersModels.map((row) => (
                                <GeoBarRow
                                    key={`${row.provider}-${row.model}`}
                                    label={`${row.provider} · ${row.model}`}
                                    sub={`${row.targetRatePercent}% target found · ${row.sources} source mentions`}
                                    value={row.runs}
                                    max={Math.max(...visibility.topProvidersModels.map((item) => item.runs), 1)}
                                    color="bg-violet-500/80"
                                />
                            ))}
                        </div>
                    ) : (
                        <GeoEmptyPanel
                            title="No runs yet"
                            description="Run tracked prompts first. Provider and model performance is derived only from completed observed runs."
                        />
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Recent safe activity</div>
                            <p className="text-[11px] text-white/35">Completed audits and allowlisted operator actions only.</p>
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
                            title="No recent safe activity yet"
                            description="Completed audits, tracked-run refreshes, and safe publication changes will appear here once they happen."
                        />
                    )}
                </GeoPremiumCard>
            </div>

            {noRunsYet ? (
                <GeoEmptyPanel
                    title="No runs yet"
                    description="Run the tracked prompts first. Overview metrics for visibility, citations, and competitors are generated from observed stored runs."
                >
                    <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-pri">
                        Launch tracked runs
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
                            <div className="text-sm font-semibold text-white/95">Observed citations</div>
                            <p className="text-[11px] text-white/35">Top source hosts captured from stored runs.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observed} />
                    </div>

                    {sources.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="No runs yet"
                            description="Execute tracked prompts first. Citation coverage is based only on observed stored runs."
                        />
                    ) : sources.summary.totalSourceMentions === 0 ? (
                        <GeoEmptyPanel
                            title="No observed citations yet"
                            description="Completed runs exist, but no source mentions have been captured from those responses yet."
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
                            <div className="text-sm font-semibold text-white/95">Tracked-run competitors</div>
                            <p className="text-[11px] text-white/35">Observed competitor and non-target mentions only.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.observed} />
                    </div>

                    {competitors.summary.totalCompletedRuns === 0 ? (
                        <GeoEmptyPanel
                            title="No runs yet"
                            description="Execute tracked prompts first. Competitor visibility is based only on stored tracked-run observations."
                        />
                    ) : competitors.summary.competitorMentions + competitors.summary.genericNonTargetMentions === 0 ? (
                        <GeoEmptyPanel
                            title="No competitor observations yet"
                            description="Completed runs exist, but no competitor or non-target business mentions have been captured yet."
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
                            <div className="text-sm font-semibold text-white/95">Open opportunities</div>
                            <p className="text-[11px] text-white/35">Current operator queue from observed and inferred inputs.</p>
                        </div>
                        <GeoProvenancePill meta={provenance.derived} />
                    </div>

                    {opportunities.summary.open === 0 ? (
                        <GeoEmptyPanel
                            title="No open opportunities"
                            description="Open work items appear here after audits or tracked-run analysis create actionable opportunities."
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
