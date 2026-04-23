'use client';

import { GeoEmptyPanel, GeoSectionTitle } from '@/features/admin/dashboard/geo/components/GeoPremium';
import { GeoChipList, GeoFoundationPageShell, GeoFoundationPanel, GeoFoundationStatCard, GeoFoundationStickySubNav, GeoReliabilityLegend, GeoStatusBadge } from '@/features/admin/dashboard/geo/components/GeoFoundationPrimitives';
import { useGeoClient, useGeoWorkspaceSlice } from '@/features/admin/dashboard/shared/context/ClientContext';
import ReliabilityPill from '@/components/shared/metrics/ReliabilityPill';

function LoadingState() {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel
                title="Chargement de la préparation GEO"
                description="Lecture de la citabilité, de l’extractabilité et de la capacité de réponse à partir des preuves réellement disponibles."
            />
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

function EvidenceLayerGrid({ layers }) {
    return (
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
            {Object.values(layers).map((layer) => (
                <GeoFoundationPanel
                    key={layer.title}
                    title={layer.title}
                    subtitle={layer.description}
                    reliability={layer.reliability}
                >
                    <div className="space-y-2">
                        {layer.items.map((item) => (
                            <div
                                key={item}
                                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-white/74"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </GeoFoundationPanel>
            ))}
        </div>
    );
}

function BlockerCard({ item }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/90">{item.title}</div>
                <GeoStatusBadge status={item.status} />
                <ReliabilityPill value={item.reliability} />
            </div>
            <div className="mt-3 text-[12px] leading-relaxed text-white/68">{item.detail}</div>
        </div>
    );
}

function SummaryPanel({ data }) {
    return (
        <GeoFoundationPanel
            title={data.operatorSummary.title}
            subtitle={data.operatorSummary.description}
            reliability={data.operatorSummary.reliability}
            status={data.operatorSummary.globalStatus}
        >
            <div className="grid gap-3 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4 sm:p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Indice structurel</div>
                    <div className="mt-3 text-[34px] font-bold tracking-[-0.04em] text-violet-200">{data.summary.globalScore}%</div>
                    <div className="mt-2 text-[12px] font-medium text-white/62">{data.summary.globalSignalLabel}</div>
                    <div className="mt-4">
                        <GeoChipList items={data.operatorSummary.details} tone="neutral" />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {Object.values(data.freshness).map((item) => (
                        <div key={item.label} className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/34">{item.label}</div>
                                <ReliabilityPill value={item.reliability} />
                            </div>
                            <div className="mt-3 text-[24px] font-bold tracking-[-0.03em] text-white/92">{item.value}</div>
                            <div className="mt-2 text-[12px] leading-relaxed text-white/60">{item.detail}</div>
                        </div>
                    ))}
                </div>
            </div>
        </GeoFoundationPanel>
    );
}

function AiSummaryPanel({ summary }) {
    return (
        <GeoFoundationPanel
            title={summary ? 'Lecture IA persistée' : 'Lecture IA'}
            subtitle={
                summary
                    ? 'Synthèse issue du dernier audit IA, utilisée ici comme aide à l’interprétation et non comme preuve autonome.'
                    : 'Aucune synthèse IA de préparation n’est persistée pour ce mandat à ce stade.'
            }
            reliability={summary?.reliability || 'unavailable'}
        >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-[12px] leading-relaxed text-white/72">
                {summary?.text || 'La surface reste pilotée principalement par des signaux mesurés et des calculs déterministes.'}
            </div>
        </GeoFoundationPanel>
    );
}

function DimensionCard({ dimension }) {
    return (
        <GeoFoundationPanel
            title={dimension.label}
            subtitle={dimension.summary}
            reliability={dimension.reliability}
            status={dimension.status}
            className="h-full"
        >
            <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="rounded-[24px] border border-white/[0.08] bg-black/18 px-4 py-4 sm:min-w-[140px]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Score</div>
                    <div className="mt-3 text-[30px] font-bold tracking-[-0.04em] text-white/94">{dimension.scoreLabel}</div>
                    <div className="mt-2 text-[11px] font-medium text-white/56">{dimension.signalLabel}</div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Lecture opérateur</div>
                        <div className="mt-3 text-[12px] leading-relaxed text-white/72">{dimension.summary}</div>
                    </div>

                    {dimension.analysis ? (
                        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-100/80">{dimension.analysis.label}</div>
                                <ReliabilityPill value={dimension.analysis.reliability} />
                            </div>
                            <div className="mt-3 text-[12px] leading-relaxed text-white/76">{dimension.analysis.text}</div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="space-y-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Preuves observées</div>
                    {dimension.evidence.map((item) => (
                        <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-[12px] leading-relaxed text-white/72">
                            {item}
                        </div>
                    ))}
                </div>

                <div className="space-y-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Principaux manques</div>
                    {dimension.gaps.length > 0 ? dimension.gaps.map((item) => (
                        <div key={item} className="rounded-2xl border border-red-400/15 bg-red-400/10 px-3 py-3 text-[12px] leading-relaxed text-red-50/88">
                            {item}
                        </div>
                    )) : (
                        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-3 text-[12px] leading-relaxed text-emerald-100">
                            Aucun manque majeur ne ressort sur cette dimension dans la lecture actuelle.
                        </div>
                    )}
                </div>
            </div>
        </GeoFoundationPanel>
    );
}

function PageCard({ page }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{page.label}</div>
                <GeoStatusBadge status={page.status} />
                <ReliabilityPill value={page.reliability} />
            </div>
            <div className="mt-2 text-[11px] font-medium text-white/48">{page.pageTypeLabel} · {page.path}</div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
                <div className="text-[28px] font-bold tracking-[-0.04em] text-white/92">{page.scoreLabel}</div>
                <div className="pb-1 text-[11px] font-medium text-white/54">{page.signalLabel}</div>
            </div>
            <div className="mt-4">
                <GeoChipList items={page.evidence} tone={page.status === 'couvert' ? 'success' : page.status === 'absent' ? 'danger' : 'warning'} />
            </div>
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/62">
                {page.textSample}
            </div>
        </div>
    );
}

function PassageCard({ item, tone = 'neutral' }) {
    const shellClass = tone === 'danger'
        ? 'border-red-400/15 bg-red-400/10'
        : 'border-white/[0.08] bg-black/18';

    return (
        <div className={`rounded-[24px] border p-4 sm:p-5 ${shellClass}`}>
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.label}</div>
                {item.scoreLabel ? (
                    <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/68">
                        {item.scoreLabel}
                    </div>
                ) : null}
                <ReliabilityPill value={item.reliability} />
            </div>
            <div className="mt-2 text-[11px] font-medium text-white/48">{item.pageLabel} · {item.path}</div>
            <div className="mt-3 text-[12px] leading-relaxed text-white/70">{item.reason}</div>
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/60">
                {item.textSample}
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
            <p className="mt-3 text-[13px] leading-relaxed text-white/72">{item.description}</p>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/56">
                {item.evidence}
            </div>
        </div>
    );
}

export default function GeoReadinessView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('readiness');

    if (loading) return <LoadingState />;
    if (error) return <EmptyState title="Préparation GEO indisponible" description={error} />;
    if (data?.emptyState) return <EmptyState title={data.emptyState.title} description={data.emptyState.description} />;
    if (!data) return <EmptyState title="Préparation GEO indisponible" description="La lecture de préparation GEO n’a pas pu être chargée." />;

    const subNavItems = [
        { id: 'readiness-overview', label: 'Synthèse' },
        { id: 'readiness-layers', label: 'Couches de fiabilité' },
        { id: 'readiness-dimensions', label: 'Dimensions' },
        { id: 'readiness-pages', label: 'Pages' },
        { id: 'readiness-passages', label: 'Passages' },
        { id: 'readiness-recommendations', label: 'Recommandations' },
    ];

    return (
        <GeoFoundationPageShell className="flex flex-col gap-6" subNav={<GeoFoundationStickySubNav items={subNavItems} />}>
            <div id="readiness-overview" className="scroll-mt-24" />
            <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-violet-500/12 via-[#0b0c10] to-[#07080a] p-5 sm:p-7">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/70">GEO · Préparation</div>
                    <h1 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-white">Labo d’extractabilité</h1>
                    <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/55">
                        Mesure honnête de la préparation structurelle pour {client?.client_name || 'ce mandat'} — citation et appui réponse, sans promesse de visibilité IA réelle.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#090a0c] p-4 self-start">
                    <GeoReliabilityLegend />
                </div>
            </div>

            <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-white/74">
                Cette surface mesure une <strong className="text-white/88">préparation structurelle</strong> à être extraite, citée et réutilisée dans des réponses IA. Elle ne confirme ni visibilité IA réelle, ni part de voix, ni citation effectivement servie par un modèle.
            </div>

            {data.auditContext?.latestSignal ? (
                <GeoFoundationPanel
                    title="Dernier signal audit"
                    subtitle={data.auditContext.latestSignal.title}
                    reliability={data.auditContext.latestSignal.reliability}
                >
                    <div className="text-[12px] leading-relaxed text-white/72">
                        {data.auditContext.latestSignal.evidence || 'Aucune preuve détaillée persistée.'}
                    </div>
                </GeoFoundationPanel>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <GeoFoundationStatCard
                    label="Indice structurel"
                    value={`${data.summary.globalScore}%`}
                    detail="Synthèse déterministe des trois dimensions de préparation suivies ici."
                    reliability="calculated"
                    status={data.summary.globalStatus}
                    accent="violet"
                />
                <GeoFoundationStatCard
                    label="Pages analysées"
                    value={data.summary.pageCount}
                    detail="Pages résumées par le dernier audit exploitable."
                    reliability="measured"
                    accent="blue"
                />
                <GeoFoundationStatCard
                    label="Passages forts"
                    value={data.summary.highPassageCount}
                    detail="Passages à forte citabilité repérés dans l’échantillon."
                    reliability="calculated"
                    status={data.summary.highPassageCount > 0 ? 'couvert' : 'à confirmer'}
                    accent="emerald"
                />
                <GeoFoundationStatCard
                    label="Fraîcheur croisée"
                    value={data.summary.auditFreshness}
                    detail={`Audit ${data.summary.auditFreshness} · relecture ${data.summary.liveFreshness}`}
                    reliability="measured"
                    accent="amber"
                />
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
                <SummaryPanel data={data} />

                <div className="space-y-3">
                    <AiSummaryPanel summary={data.auditContext?.aiSummary} />

                    <GeoFoundationPanel
                        title="Blocages prioritaires"
                        subtitle="Ce qui freine le plus la préparation GEO dans les preuves actuellement disponibles."
                        reliability="calculated"
                    >
                        <div className="space-y-3">
                            {data.topBlockers.map((item) => <BlockerCard key={`${item.title}-${item.detail}`} item={item} />)}
                        </div>
                    </GeoFoundationPanel>
                </div>
            </div>

            <div id="readiness-layers" className="scroll-mt-24" />
            <GeoSectionTitle
                title="Couches de fiabilité"
                subtitle="Séparation explicite entre lecture mesurée, synthèse calculée, lecture IA éventuelle et limites encore non couvertes."
            />
            <EvidenceLayerGrid layers={data.evidenceLayers} />

            <div id="readiness-dimensions" className="scroll-mt-24" />
            <GeoSectionTitle
                title="Lecture par dimension"
                subtitle="Citabilité, extractabilité et capacité de réponse, avec preuve, niveau de fiabilité et principaux manques."
            />
            <div className="grid gap-3 xl:grid-cols-3">
                {data.dimensions.map((dimension) => <DimensionCard key={dimension.key} dimension={dimension} />)}
            </div>

            <div id="readiness-pages" className="scroll-mt-24" />
            <GeoSectionTitle
                title="Lecture par page"
                subtitle="Pages qui soutiennent déjà le mieux la préparation GEO, puis pages les plus faibles à renforcer en premier."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                <GeoFoundationPanel
                    title="Pages les plus solides"
                    subtitle="Lecture prudente des pages qui ressortent comme appui réponse ou citation dans l’échantillon."
                    reliability={data.pageGroups.stronger.length > 0 ? 'calculated' : 'unavailable'}
                >
                    {data.pageGroups.stronger.length > 0 ? (
                        <div className="space-y-3">
                            {data.pageGroups.stronger.map((page) => <PageCard key={page.id} page={page} />)}
                        </div>
                    ) : (
                        <div className="text-[12px] leading-relaxed text-white/40">Aucune page ne ressort encore nettement comme appui réponse dans la lecture actuelle.</div>
                    )}
                </GeoFoundationPanel>

                <GeoFoundationPanel
                    title="Pages à renforcer"
                    subtitle="Pages observées mais encore trop minces, trop ambiguës ou trop peu structurées."
                    reliability={data.pageGroups.weaker.length > 0 ? 'calculated' : 'unavailable'}
                >
                    {data.pageGroups.weaker.length > 0 ? (
                        <div className="space-y-3">
                            {data.pageGroups.weaker.map((page) => <PageCard key={page.id} page={page} />)}
                        </div>
                    ) : (
                        <div className="text-[12px] leading-relaxed text-white/40">Aucune page faible marquante n’a été isolée dans l’échantillon courant.</div>
                    )}
                </GeoFoundationPanel>
            </div>

            <div id="readiness-passages" className="scroll-mt-24" />
            <GeoSectionTitle
                title="Passages et éléments"
                subtitle="Passages forts puis passages faibles, uniquement lorsqu’ils peuvent être rattachés à une preuve observée."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                <GeoFoundationPanel
                    title="Passages forts"
                    subtitle="Extraits ou blocs qui soutiennent le mieux une citation ou une réponse concise."
                    reliability={data.passages.strong.length > 0 ? 'calculated' : 'unavailable'}
                >
                    {data.passages.strong.length > 0 ? (
                        <div className="space-y-3">
                            {data.passages.strong.map((item) => <PassageCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <div className="text-[12px] leading-relaxed text-white/40">Aucun passage fort n’a été retenu proprement dans les données actuelles.</div>
                    )}
                </GeoFoundationPanel>

                <GeoFoundationPanel
                    title="Passages faibles"
                    subtitle="Extraits encore trop ambigus, trop peu précis ou trop peu autoportants."
                    reliability={data.passages.weak.length > 0 ? 'calculated' : 'unavailable'}
                >
                    {data.passages.weak.length > 0 ? (
                        <div className="space-y-3">
                            {data.passages.weak.map((item) => <PassageCard key={item.id} item={item} tone="danger" />)}
                        </div>
                    ) : (
                        <div className="text-[12px] leading-relaxed text-white/40">Aucun passage faible spécifique n’a été isolé proprement dans la lecture actuelle.</div>
                    )}
                </GeoFoundationPanel>
            </div>

            <div id="readiness-recommendations" className="scroll-mt-24" />
            <GeoSectionTitle
                title="Recommandations opérateur"
                subtitle="Angles de correction priorisés, sans promesse de visibilité IA ni déclenchement d’une infra d’actions complète."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                {data.recommendations.map((item) => <RecommendationCard key={item.title} item={item} />)}
            </div>
        </GeoFoundationPageShell>
    );
}
