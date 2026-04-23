'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import {
    GeoBarRow,
    GeoEmptyPanel,
    GeoPremiumCard,
    GeoProvenancePill,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    return `${Math.round(value)}%`;
}

function reliabilityLabel(reliability) {
    if (reliability === 'high') return 'Fiabilité haute';
    if (reliability === 'medium') return 'Fiabilité moyenne';
    if (reliability === 'low') return 'Fiabilité basse';
    return 'Fiabilité indisponible';
}

function SpotlightStat({ label, value, footnote }) {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#090a0f] px-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</div>
            <div className="mt-3 text-[clamp(1.4rem,2.4vw,1.9rem)] font-semibold tabular-nums tracking-tight text-white">
                {value ?? '—'}
            </div>
            {footnote ? <div className="mt-2 text-[11px] text-white/40">{footnote}</div> : null}
        </div>
    );
}

export default function AgentVisibilityView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-visibility');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement…</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }
    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Visibilité AGENT indisponible" description="Aucune donnée n’a pu être chargée." />
            </div>
        );
    }

    if (data.emptyState) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200/70">Vue AGENT</div>
                <h1 className="text-2xl font-semibold text-white/95">Visibilité AGENT</h1>
                <GeoEmptyPanel title={data.emptyState.title} description={data.emptyState.description} />
            </div>
        );
    }

    const { kpis, promptCoverage, topModels, topCompetitors, topSources, links, provenance } = data;

    const maxCompetitorMentions = Math.max(1, ...(topCompetitors || []).map((c) => c.mention_count || 0));
    const maxSourceCitations = Math.max(1, ...(topSources || []).map((s) => s.citation_count || 0));
    const maxModelMentions = Math.max(1, ...(topModels || []).map((m) => m.total_mentions || 0));

    return (
        <div className="bg-[#03040a]">
            <div className="mx-auto max-w-[1700px] px-4 py-10 md:px-10">
                <section className="overflow-hidden rounded-[32px] border border-indigo-400/20 bg-[linear-gradient(125deg,#0b0e1a_0%,#05060d_45%,#0a0714_100%)]">
                    <div className="grid gap-10 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100/90">
                                <Sparkles className="h-3.5 w-3.5" />
                                Lecture LLM
                            </div>
                            <h1 className="mt-5 text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold tracking-[-0.05em] text-white">
                                Visibilité dans les réponses IA
                            </h1>
                            <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/48">
                                Mandat {client?.client_name || ''} : un bandeau horizontal pour les métriques clés, puis trois colonnes inégales (modèles, concurrents, sources).
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
                                    {reliabilityLabel(kpis.visibilityProxyReliability)}
                                </span>
                                <GeoProvenancePill meta={provenance.observed} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <SpotlightStat
                                label="Taux de mention"
                                value={formatPercent(kpis.mentionRatePercent)}
                                footnote="Réponses citant le mandat"
                            />
                            <SpotlightStat
                                label="Proxy visibilité"
                                value={formatPercent(kpis.visibilityProxyPercent)}
                                footnote="Agrégat des signaux"
                            />
                            <SpotlightStat
                                label="Couverture sources"
                                value={formatPercent(kpis.citationCoveragePercent)}
                                footnote="Réponses avec lien"
                            />
                            <SpotlightStat
                                label="Runs complétés"
                                value={kpis.completedRunsTotal}
                                footnote={`${kpis.trackedPromptsTotal} prompts suivis`}
                            />
                        </div>
                    </div>
                </section>

                <section className="mt-10 rounded-[28px] border border-white/[0.07] bg-[#07080e] p-6 md:p-8">
                    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Couverture des prompts</div>
                            <p className="mt-2 max-w-2xl text-[12px] text-white/45">
                                Tableau de segmentation : où en est la file de prompts suivis avant d’entrer dans le détail barres.
                            </p>
                        </div>
                        <Link href={links.prompts} className="text-[12px] font-semibold text-indigo-300 hover:text-white">
                            Gérer les requêtes →
                        </Link>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                            { t: 'Actifs', v: promptCoverage.active, tone: 'border-white/10' },
                            { t: 'Mandat cité', v: promptCoverage.withTargetFound, tone: 'border-emerald-400/25 bg-emerald-500/[0.06]' },
                            { t: 'Run sans cible', v: promptCoverage.withRunNoTarget, tone: 'border-amber-400/25 bg-amber-500/[0.05]' },
                            { t: 'Sans run', v: promptCoverage.noRunYet, tone: 'border-white/10' },
                        ].map((cell) => (
                            <div key={cell.t} className={`rounded-2xl border px-4 py-4 ${cell.tone}`}>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/38">{cell.t}</div>
                                <div className="mt-2 text-2xl font-bold tabular-nums text-white/92">{cell.v}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
                    <GeoPremiumCard className="border border-violet-400/15 bg-[#080818]/95 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm font-semibold text-white/95">Moteurs les plus actifs</div>
                            <Link href={links.models} className="text-[11px] font-semibold text-violet-300 hover:text-white">
                                Détails
                            </Link>
                        </div>
                        {(!topModels || topModels.length === 0) ? (
                            <div className="text-[12px] text-white/40">Aucun modèle à afficher.</div>
                        ) : (
                            <div className="space-y-3">
                                {topModels.map((model) => (
                                    <GeoBarRow
                                        key={`${model.provider}-${model.model}`}
                                        label={`${model.provider} · ${model.model}`}
                                        sub={`${model.total_runs} runs`}
                                        value={model.total_mentions || 0}
                                        max={maxModelMentions}
                                        color="bg-violet-500/80"
                                    />
                                ))}
                            </div>
                        )}
                    </GeoPremiumCard>

                    <GeoPremiumCard className="border border-amber-400/18 bg-[#120a06]/95 p-5">
                        <div className="mb-4 text-sm font-semibold text-white/95">Concurrents cités</div>
                        {(!topCompetitors || topCompetitors.length === 0) ? (
                            <div className="text-[12px] text-white/40">Aucun concurrent détecté.</div>
                        ) : (
                            <div className="space-y-3">
                                {topCompetitors.map((competitor) => (
                                    <GeoBarRow
                                        key={competitor.name}
                                        label={competitor.name}
                                        sub={`${competitor.mention_count} mentions`}
                                        value={competitor.mention_count}
                                        max={maxCompetitorMentions}
                                        color="bg-amber-400/75"
                                    />
                                ))}
                            </div>
                        )}
                    </GeoPremiumCard>

                    <GeoPremiumCard className="border border-sky-400/15 bg-[#060d14]/95 p-5">
                        <div className="mb-4 text-sm font-semibold text-white/95">Sources des moteurs</div>
                        {(!topSources || topSources.length === 0) ? (
                            <div className="text-[12px] text-white/40">Aucune source à afficher.</div>
                        ) : (
                            <div className="space-y-3">
                                {topSources.map((source) => (
                                    <GeoBarRow
                                        key={source.host}
                                        label={source.host}
                                        sub={`${source.citation_count} citations`}
                                        value={source.citation_count}
                                        max={maxSourceCitations}
                                        color="bg-sky-400/75"
                                    />
                                ))}
                            </div>
                        )}
                    </GeoPremiumCard>
                </section>

                <p className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-[11px] text-white/45 leading-relaxed">
                    Pour l’analyse requête par requête :{' '}
                    <Link href={`/admin/clients/${clientId}/geo/prompts`} className="font-semibold text-sky-300 hover:text-white">
                        GEO Ops › Requêtes
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
