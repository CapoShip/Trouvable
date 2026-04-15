'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { GeoEmptyPanel, GeoPremiumCard, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

/* ─── Helpers ─── */

function threatLevel(count, topCount) {
    if (!topCount || !count) return 'low';
    const ratio = count / topCount;
    if (ratio >= 0.6) return 'high';
    if (ratio >= 0.25) return 'medium';
    return 'low';
}

const THREAT_COLORS = {
    high: { dot: 'bg-red-400', text: 'text-red-300' },
    medium: { dot: 'bg-amber-400', text: 'text-amber-300' },
    low: { dot: 'bg-white/20', text: 'text-white/30' },
};

/* ─── Sub-Components ─── */

function SubstitutionAlert({ count, baseHref }) {
    if (!count || count <= 0) return null;

    return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <div className="min-w-0">
                <div className="text-[12px] font-semibold text-red-300">
                    {count} run{count > 1 ? 's' : ''} avec substitution concurrentielle
                </div>
                <p className="text-[10px] text-red-200/50 mt-0.5 max-w-lg">
                    Un concurrent est recommandé mais la cible est absente, avec un risque de substitution directe.
                </p>
                <Link href={`${baseHref}/opportunities`} className="inline-flex items-center gap-1 text-[10px] text-red-300/70 hover:text-red-200 mt-1.5 transition-colors">
                    Voir les opportunités →
                </Link>
            </div>
        </div>
    );
}

function ConfirmedCompetitorsList({ competitors, topCount }) {
    if (!competitors?.length) return null;

    return (
        <GeoPremiumCard className="p-5">
            <div className="mb-4">
                <div className="text-sm font-semibold text-white/95">Concurrents confirmés</div>
                <p className="text-[11px] text-white/35 mt-0.5">
                    Entités identifiées comme concurrents dans les réponses IA : recommandation, comparaison ou alternative directe.
                </p>
            </div>
            <div className="space-y-1">
                {competitors.map((item, i) => {
                    const level = threatLevel(item.count, topCount);
                    const colors = THREAT_COLORS[level];
                    return (
                        <div key={item.name} className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                            <span className="text-[10px] text-white/25 w-4 text-right tabular-nums font-mono shrink-0">{i + 1}</span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                            <span className="text-[12px] text-white/80 flex-1 truncate">{item.name}</span>
                            <span className={`text-[11px] font-bold tabular-nums shrink-0 ${colors.text}`}>
                                {item.count} mention{item.count > 1 ? 's' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </GeoPremiumCard>
    );
}

function CompetitorPrompts({ promptsWithCompetitors }) {
    if (!promptsWithCompetitors?.length) return null;

    return (
        <GeoPremiumCard className="p-5">
            <div className="mb-4">
                <div className="text-sm font-semibold text-white/95">Prompts exposant des concurrents</div>
                <p className="text-[11px] text-white/35 mt-0.5">Prompts où des concurrents apparaissent le plus souvent.</p>
            </div>
            <div className="space-y-1.5">
                {promptsWithCompetitors.map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${item.recommended_competitors > 0 ? 'bg-red-400' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-white/85 leading-snug">{item.query_text}</div>
                            <div className="text-[10px] text-white/30 mt-0.5">
                                {item.competitor_mentions} mention{item.competitor_mentions > 1 ? 's' : ''}
                                {item.recommended_competitors > 0 && (
                                    <span className="text-red-300/70"> · {item.recommended_competitors} recommandé{item.recommended_competitors > 1 ? 's' : ''}</span>
                                )}
                                {' · '}{item.category}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </GeoPremiumCard>
    );
}

/* ─── Main Component ─── */

export default function GeoCompetitorsView({ sharedData }) {
    const { client, clientId } = useGeoClient();
    const ownSlice = useGeoWorkspaceSlice('competitors');
    const data = sharedData || ownSlice.data;
    const loading = !sharedData && ownSlice.loading;
    const error = !sharedData && ownSlice.error;

    const topCount = useMemo(() => {
        if (!data?.topCompetitors?.length) return 1;
        return Math.max(...data.topCompetitors.map((c) => c.count), 1);
    }, [data]);

    if (loading) return <div className="py-8 text-center text-white/25 text-sm animate-pulse">Chargement des concurrents…</div>;
    if (error) return <div className="py-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return null;

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noConfirmed = data.summary.competitorMentions === 0;
    const hasGenericOnly = noConfirmed && data.summary.genericNonTargetMentions > 0;
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';

    return (
        <div className="space-y-4">
            <GeoSectionTitle
                title="Concurrents"
                subtitle={`Paysage concurrentiel observé pour ${client?.client_name || 'ce client'}. Seuls les concurrents confirmés sont affichés.`}
            />

            {data.summary.sampleSizeWarning && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-[11px] text-amber-200/60">
                    {data.summary.sampleSizeWarning}
                </div>
            )}

            <SubstitutionAlert count={data.summary.runsWithoutTargetButCompetitor} baseHref={geoBase} />

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.noRuns.title} description={data.emptyState.noRuns.description} />
            ) : noConfirmed ? (
                <div className="space-y-3">
                    {hasGenericOnly && data.genericMentions?.length > 0 && (
                        <GeoPremiumCard className="p-4">
                            <div className="text-[11px] font-semibold text-amber-200/80 mb-2">Mentions non confirmées</div>
                            <p className="text-[10px] text-white/40 leading-relaxed mb-3 max-w-lg">
                                Des noms hors cible apparaissent dans les réponses, mais aucun n'atteint le seuil « concurrent confirmé » (recommandation, comparaison ou profil concurrent explicite).
                            </p>
                            <div className="space-y-1">
                                {data.genericMentions.slice(0, 5).map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-[11px] py-1">
                                        <span className="text-white/45">{item.name}</span>
                                        <span className="text-white/25 tabular-nums">{item.count}×</span>
                                    </div>
                                ))}
                            </div>
                        </GeoPremiumCard>
                    )}
                    <GeoEmptyPanel
                        title={data.emptyState.noCompetitors.title}
                        description={data.emptyState.noCompetitors.description}
                    >
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Link href={`${geoBase}/prompts`} className="geo-btn geo-btn-pri">Prompts & comparaisons</Link>
                            <Link href={`${geoBase}/runs`} className="geo-btn geo-btn-ghost">Voir les runs</Link>
                        </div>
                    </GeoEmptyPanel>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <ConfirmedCompetitorsList competitors={data.topCompetitors} topCount={topCount} />
                    <CompetitorPrompts promptsWithCompetitors={data.promptsWithCompetitors} />
                </div>
            )}
        </div>
    );
}
