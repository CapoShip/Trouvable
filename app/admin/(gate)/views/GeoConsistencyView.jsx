'use client';

import { GeoEmptyPanel, GeoSectionTitle } from '../components/GeoPremium';
import {
    GeoChipList,
    GeoFoundationPanel,
    GeoFoundationStatCard,
    GeoReliabilityLegend,
    GeoStatusBadge
} from '../components/GeoFoundationPrimitives';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

function LoadingState() {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Analyse de la cohérence" description="Comparaison des fondamentaux du dossier partagé avec les sources structurées observées." />
        </div>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title={title} description={description} />
        </div>
    );
}

function DimensionCard({ dimension }) {
    const isError = ['incohérent', 'écart', 'écart notable', 'manquant', 'indisponible'].includes(dimension.status);
    const borderColor = isError ? 'border-red-400/15' : 'border-white/[0.08]';
    const bgColor = isError ? 'bg-red-400/5' : 'bg-black/18';

    return (
        <div className={`rounded-[24px] border ${borderColor} ${bgColor} p-5 flex flex-col h-full`}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="text-sm font-semibold text-white/90">{dimension.label}</div>
                <GeoStatusBadge status={dimension.status} />
                <ReliabilityPill value={dimension.reliability} />
            </div>

            <div className="space-y-4 flex-1">
                {dimension.contradictions && dimension.contradictions.length > 0 && (
                    <div className="rounded-2xl border border-red-400/15 bg-red-400/10 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-red-100/80 mb-2">Contradictions</div>
                        <ul className="space-y-1.5">
                            {dimension.contradictions.map((c, i) => (
                                <li key={i} className="text-[12px] leading-relaxed text-red-100/90 flex gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>{c}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {dimension.gaps && dimension.gaps.length > 0 && (
                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-100/80 mb-2">Lacunes</div>
                        <ul className="space-y-1.5">
                            {dimension.gaps.map((g, i) => (
                                <li key={i} className="text-[12px] leading-relaxed text-amber-100/90 flex gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>{g}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {dimension.alignedSignals && dimension.alignedSignals.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Signaux alignés</div>
                        <GeoChipList items={dimension.alignedSignals} tone="success" />
                    </div>
                )}

                {dimension.unalignedSignals && dimension.unalignedSignals.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Éléments canoniques sans match</div>
                        <GeoChipList items={dimension.unalignedSignals} tone="warning" />
                    </div>
                )}
                
                {dimension.missingFromSchema && dimension.missingFromSchema.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Profils absents du schema</div>
                        <GeoChipList items={dimension.missingFromSchema} tone="error" />
                    </div>
                )}
                
                {dimension.unexpectedInSchema && dimension.unexpectedInSchema.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Profils imprévus (sameAs)</div>
                        <GeoChipList items={dimension.unexpectedInSchema} tone="warning" />
                    </div>
                )}

            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/56">
                <span className="font-semibold text-white/40 uppercase tracking-[0.05em] text-[9px] block mb-1">Preuve</span>
                {dimension.evidence}
            </div>
        </div>
    );
}

function RecommendationCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/72">{item.explanation}</p>
        </div>
    );
}

export default function GeoConsistencyView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('consistency');

    if (loading) return <LoadingState />;
    if (error) return <EmptyState title="Cohérence indisponible" description={error} />;
    if (data?.emptyState) return <EmptyState title={data.emptyState.title} description={data.emptyState.description} />;
    if (!data) return <EmptyState title="Indisponible" description="L'évaluation de la cohérence n'a pas pu être chargée." />;

    const { summary, dimensions, recommendations, freshness } = data;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Cohérence marque"
                subtitle={`Évaluation de l'alignement entre le dossier partagé de ${client?.client_name || 'ce mandat'} et les signaux structurés locaux.`}
                action={<GeoReliabilityLegend />}
            />

            <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-white/74">
                Cette surface compare honnêtement les socles du <strong className="text-white/88">dossier partagé</strong> avec les éléments <strong className="text-white/88">effectivement extraits</strong> par le dernier audit (JSON-LD, contenu des pages crawlées). Elle ne simule pas la cohérence sur des sources inaccessibles.
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <GeoFoundationStatCard
                    label="État global"
                    value={summary.globalState}
                    detail="Synthèse calculée depuis l'ensemble des dimensions observables."
                    reliability={summary.reliability}
                    status={summary.globalState.includes('divergence') || summary.globalState.includes('faible') ? 'absent' : 'couvert'}
                    accent={summary.globalState.includes('divergence') ? 'red' : summary.globalState.includes('faible') ? 'amber' : 'emerald'}
                />
                <GeoFoundationStatCard
                    label="Contradictions critiques"
                    value={summary.criticalCount}
                    detail="Frictions constatées altérant l'ancrage local sémantique."
                    reliability={summary.criticalCount > 0 ? 'calculated' : 'measured'}
                    status={summary.criticalCount > 0 ? 'absent' : 'couvert'}
                    accent={summary.criticalCount > 0 ? 'amber' : 'emerald'}
                />
                <GeoFoundationStatCard
                    label="Fraîcheur de la base"
                    value={freshness.audit.value}
                    detail={freshness.audit.detail}
                    reliability={freshness.audit.reliability}
                    accent="violet"
                />
            </div>

            <GeoSectionTitle
                title="Dimensions étudiées"
                subtitle="Projection déterministe de la cohérence NAP, sémantique d'offre et zones d'intervention."
            />
            
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {dimensions.map(dim => (
                    <DimensionCard key={dim.key} dimension={dim} />
                ))}
            </div>

            <GeoSectionTitle
                title="Recommandations opérateur"
                subtitle="Angles d'harmonisation fondés sur le diagnostic déterministe."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                {recommendations.map(rec => (
                    <RecommendationCard key={rec.title} item={rec} />
                ))}
            </div>
        </div>
    );
}
