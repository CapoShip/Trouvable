'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SourcesTimelineChart } from '../components/GeoRealCharts';
import { GeoEmptyPanel, GeoPremiumCard, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

/* ─── Helpers ─── */

function signalStrength(count, max) {
    if (!max || !count) return 'noise';
    const ratio = count / max;
    if (ratio >= 0.5) return 'strong';
    if (ratio >= 0.15) return 'moderate';
    return 'noise';
}

const SIGNAL_COLORS = {
    strong: 'text-emerald-300',
    moderate: 'text-amber-300',
    noise: 'text-white/30',
};

function SignalDot({ strength }) {
    const dotClass = strength === 'strong'
        ? 'bg-emerald-400'
        : strength === 'moderate'
            ? 'bg-amber-400'
            : 'bg-white/20';
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />;
}

/* ─── Sub-Components ─── */

function TopSourcesDomain({ topHosts, maxHostCount }) {
    const [showAll, setShowAll] = useState(false);
    const displayHosts = showAll ? topHosts : topHosts?.slice(0, 6);

    if (!topHosts?.length) return null;

    return (
        <GeoPremiumCard className="p-5">
            <div className="mb-4">
                <div className="text-sm font-semibold text-white/95">Domaines source</div>
                <p className="text-[11px] text-white/35 mt-0.5">Sources les plus fréquentes dans les réponses IA.</p>
            </div>
            <div className="space-y-2">
                {displayHosts.map((item, i) => {
                    const strength = signalStrength(item.count, maxHostCount);
                    return (
                        <div key={item.host} className="flex items-center gap-2.5">
                            <span className="text-[10px] text-white/25 w-4 text-right tabular-nums font-mono shrink-0">{i + 1}</span>
                            <SignalDot strength={strength} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[12px] text-white/80 truncate">{item.host}</span>
                                    <span className={`text-[11px] font-bold tabular-nums shrink-0 ${SIGNAL_COLORS[strength]}`}>{item.count}</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-1" role="progressbar" aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={maxHostCount} aria-label={`${item.host}: ${item.count}`}>
                                    <div
                                        className="h-full rounded-full bg-violet-500/60"
                                        style={{ width: `${Math.min(100, Math.round((item.count / maxHostCount) * 100))}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {topHosts.length > 6 && !showAll && (
                <button type="button" onClick={() => setShowAll(true)} className="geo-btn geo-btn-ghost w-full justify-center mt-3 text-[10px]">
                    Afficher les {topHosts.length} domaines
                </button>
            )}
        </GeoPremiumCard>
    );
}

function PromptCoverageList({ promptCoverage }) {
    if (!promptCoverage?.length) return null;

    const topCount = promptCoverage[0]?.count || 1;

    return (
        <GeoPremiumCard className="p-5">
            <div className="mb-4">
                <div className="text-sm font-semibold text-white/95">Couverture par prompt</div>
                <p className="text-[11px] text-white/35 mt-0.5">Prompts générant des citations utiles.</p>
            </div>
            <div className="space-y-1.5">
                {promptCoverage.map((item) => {
                    const strength = signalStrength(item.count, topCount);
                    return (
                        <div key={`${item.query_text}-${item.last_seen_at}`} className="flex items-start gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                            <SignalDot strength={strength} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium text-white/85 leading-snug">{item.query_text}</div>
                                <div className="text-[10px] text-white/30 mt-0.5">
                                    {item.count} source{item.count > 1 ? 's' : ''} · {item.category}
                                    {item.last_seen_at ? ` · ${new Date(item.last_seen_at).toLocaleDateString('fr-CA')}` : ''}
                                </div>
                            </div>
                            <span className={`text-[11px] font-bold tabular-nums shrink-0 ${SIGNAL_COLORS[strength]}`}>{item.count}</span>
                        </div>
                    );
                })}
            </div>
        </GeoPremiumCard>
    );
}

/* ─── Main Component ─── */

export default function GeoCitationsView({ sharedData }) {
    const { client, clientId } = useGeoClient();
    const ownSlice = useGeoWorkspaceSlice('citations');
    const data = sharedData || ownSlice.data;
    const loading = !sharedData && ownSlice.loading;
    const error = !sharedData && ownSlice.error;

    const maxHostCount = useMemo(() => {
        if (!data?.topHosts?.length) return 1;
        return Math.max(...data.topHosts.map((row) => row.count), 1);
    }, [data]);

    if (loading) return <div className="py-8 text-center text-white/25 text-sm animate-pulse">Chargement des sources…</div>;
    if (error) return <div className="py-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return null;

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noCitations = data.summary.totalSourceMentions === 0;
    const hasTimeline = data.timeline?.length >= 2;

    return (
        <div className="space-y-4">
            <GeoSectionTitle
                title="Sources & citations"
                subtitle={`Sources détectées dans les réponses IA pour ${client?.client_name || 'ce client'}.`}
            />

            {data.summary.sampleSizeWarning && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-[11px] text-amber-200/60">
                    {data.summary.sampleSizeWarning}
                </div>
            )}

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.noRuns.title} description={data.emptyState.noRuns.description} />
            ) : noCitations ? (
                <GeoEmptyPanel title={data.emptyState.noObservedCitations.title} description={data.emptyState.noObservedCitations.description}>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Link href={clientId ? `/admin/clients/${clientId}/geo/runs` : '/admin/clients'} className="geo-btn geo-btn-pri">
                            Inspecter les runs
                        </Link>
                        <Link href={clientId ? `/admin/clients/${clientId}/geo/prompts` : '/admin/clients'} className="geo-btn geo-btn-ghost">
                            Ajuster les prompts
                        </Link>
                    </div>
                </GeoEmptyPanel>
            ) : (
                <>
                    {/* Primary: Sources intelligence — domains + prompt coverage side by side */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <TopSourcesDomain topHosts={data.topHosts} maxHostCount={maxHostCount} />
                        <PromptCoverageList promptCoverage={data.promptCoverage} />
                    </div>

                    {/* Secondary: Timeline — only when useful, visually demoted */}
                    {hasTimeline && (
                        <details className="group">
                            <summary className="cursor-pointer text-[11px] font-semibold text-white/30 hover:text-white/50 transition-colors py-2 select-none">
                                Évolution temporelle des sources ▾
                            </summary>
                            <div className="mt-2">
                                <SourcesTimelineChart sourceMentionsTimeline={data.timeline} />
                            </div>
                        </details>
                    )}
                </>
            )}
        </div>
    );
}
