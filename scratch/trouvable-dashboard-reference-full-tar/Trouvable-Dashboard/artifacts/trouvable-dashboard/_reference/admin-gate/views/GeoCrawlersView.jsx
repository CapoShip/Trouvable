'use client';

import { useState } from 'react';

import { GeoEmptyPanel, GeoSectionTitle } from '../components/GeoPremium';
import { GeoChipList, GeoFoundationPanel, GeoFoundationStatCard, GeoReliabilityLegend, GeoStatusBadge } from '../components/GeoFoundationPrimitives';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

function LoadingState() {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Chargement des crawlers IA" description="Lecture des directives robots, des restrictions de homepage et de la fraîcheur des preuves." />
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
                            <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-white/74">
                                {item}
                            </div>
                        ))}
                    </div>
                </GeoFoundationPanel>
            ))}
        </div>
    );
}

function BotCard({ bot }) {
    return (
        <GeoFoundationPanel
            title={bot.name}
            subtitle={bot.service}
            reliability={bot.reliability}
            status={bot.operatorStatus}
            className="h-full"
        >
            <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Preuve</div>
                        <div className="mt-2 text-[12px] leading-relaxed text-white/76">{bot.evidence}</div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Impact probable</div>
                            <ReliabilityPill value={bot.impactReliability} />
                        </div>
                        <div className="mt-2 text-[12px] leading-relaxed text-white/76">{bot.impact}</div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Règle appliquée</div>
                        <div className="mt-2 text-[12px] text-white/76">{bot.ruleSource}</div>
                    </div>
                    {bot.crawlDelay ? (
                        <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/74">
                            Crawl-delay : {bot.crawlDelay}
                        </div>
                    ) : null}
                </div>

                {bot.disallow.length > 0 ? (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Patterns bloqués</div>
                        <GeoChipList items={bot.disallow} tone={bot.operatorStatus === 'bloqué' ? 'danger' : 'warning'} />
                    </div>
                ) : null}

                {bot.allow.length > 0 ? (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Patterns autorisés</div>
                        <GeoChipList items={bot.allow} tone="success" />
                    </div>
                ) : null}
            </div>
        </GeoFoundationPanel>
    );
}

function RuleList({ items, emptyLabel }) {
    if (!items.length) {
        return <div className="text-[12px] leading-relaxed text-white/38">{emptyLabel}</div>;
    }

    return (
        <div className="space-y-2.5">
            {items.map((item) => (
                <div key={`${item.label}-${item.detail}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[12px] font-semibold text-white/88">{item.label}</div>
                        <ReliabilityPill value={item.reliability} />
                    </div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/70">{item.detail}</div>
                </div>
            ))}
        </div>
    );
}

function RestrictionCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/90">{item.pattern}</div>
                <GeoStatusBadge status={item.severity === 'critical' ? 'bloqué' : 'ambigu'} />
                <ReliabilityPill value={item.reliability} />
            </div>
            <div className="mt-2 text-[12px] font-medium text-white/62">{item.scope}</div>
            <div className="mt-3 text-[12px] leading-relaxed text-white/74">{item.impact}</div>
            <div className="mt-3">
                <GeoChipList items={item.bots} tone={item.severity === 'critical' ? 'danger' : 'warning'} />
            </div>
        </div>
    );
}

function PageSignalRow({ item }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/88">{item.label}</div>
                <GeoStatusBadge status={item.operatorStatus} />
                <ReliabilityPill value={item.reliability} />
            </div>
            <div className="mt-3 text-[12px] leading-relaxed text-white/72">{item.evidence}</div>
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

export default function GeoCrawlersView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('crawlers');
    const [botIndex, setBotIndex] = useState(0);

    if (loading) return <LoadingState />;
    if (error) return <EmptyState title="Crawlers IA indisponibles" description={error} />;
    if (data?.emptyState) return <EmptyState title={data.emptyState.title} description={data.emptyState.description} />;
    if (!data) return <EmptyState title="Crawlers IA indisponibles" description="La lecture de fondation GEO n’a pas pu être chargée." />;

    const bots = data.botRows || [];
    const activeBot = bots[botIndex] || bots[0] || null;

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#1e1a26] text-white">
            <div className="border-b border-fuchsia-500/20 bg-[radial-gradient(ellipse_70%_80%_at_15%_0%,rgba(217,70,239,0.14),transparent)]">
                <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between md:px-10">
                    <div className="max-w-3xl space-y-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-200/70">geo.crawlers.split</div>
                        <h1 className="text-[clamp(1.55rem,3vw,2.15rem)] font-semibold tracking-[-0.045em]">Constellation crawlers</h1>
                        <p className="text-[14px] leading-relaxed text-white/48">
                            {client?.client_name ? (
                                <>Sélecteur latéral + panneau de détail : <span className="text-white/72">{client.client_name}</span> — on lit un bot à la fois en profondeur, puis les couches de preuve en dessous.</>
                            ) : (
                                <>Vue éclatée : liste des bots à gauche, fiche technique à droite.</>
                            )}
                        </p>
                    </div>
                    <GeoReliabilityLegend />
                </div>
            </div>

            <div className="mx-auto max-w-[1800px] px-4 py-8 md:px-10 space-y-8 pb-16">
            <div className="rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/[0.06] px-4 py-3 text-[12px] leading-relaxed text-white/74">
                Les statuts reflètent uniquement la preuve disponible : <strong className="text-white/88">autorisé</strong>, <strong className="text-white/88">bloqué</strong>, <strong className="text-white/88">ambigu</strong>, <strong className="text-white/88">à confirmer</strong>.
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <GeoFoundationStatCard
                    label="Bots bloqués"
                    value={data.summary.blockedCount}
                    detail="Blocage robots explicite observé."
                    reliability="measured"
                    status={data.summary.blockedCount > 0 ? 'bloqué' : 'autorisé'}
                    accent={data.summary.blockedCount > 0 ? 'amber' : 'emerald'}
                />
                <GeoFoundationStatCard
                    label="Bots ambigus"
                    value={data.summary.ambiguousCount}
                    detail="Règles partielles ou restrictives possibles."
                    reliability="calculated"
                    status={data.summary.ambiguousCount > 0 ? 'ambigu' : 'autorisé'}
                    accent="blue"
                />
                <GeoFoundationStatCard
                    label="À confirmer"
                    value={data.summary.confirmCount}
                    detail="Preuve insuffisante au chargement."
                    reliability={data.summary.confirmCount > 0 ? 'unavailable' : 'measured'}
                    status={data.summary.confirmCount > 0 ? 'à confirmer' : 'autorisé'}
                    accent="violet"
                />
                <GeoFoundationStatCard
                    label="Fraîcheur live"
                    value={data.summary.liveFreshness}
                    detail={`robots.txt ${data.summary.robotsStatus} · audit ${data.summary.auditFreshness}`}
                    reliability={data.summary.robotsReliability}
                    accent="emerald"
                />
            </div>

            {data.auditContext?.latestSignal ? (
                <GeoFoundationPanel
                    title="Dernier signal audit"
                    subtitle={data.auditContext.latestSignal.title}
                    reliability={data.auditContext.latestSignal.reliability}
                >
                    <div className="text-[12px] leading-relaxed text-white/72">{data.auditContext.latestSignal.evidence || 'Aucune preuve détaillée persistée.'}</div>
                </GeoFoundationPanel>
            ) : null}

            <GeoSectionTitle
                title="Sélecteur bot + fiche"
                subtitle="La grille de cartes est retirée : navigation par liste, inspection sur un seul bot à la fois."
            />
            <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start">
                <div className="rounded-[24px] border border-slate-400/15 bg-[#2a2436] p-3 max-h-[min(70vh,640px)] overflow-y-auto geo-scrollbar space-y-1">
                    {bots.map((bot, i) => (
                        <button
                            key={bot.name}
                            type="button"
                            onClick={() => setBotIndex(i)}
                            className={`flex w-full flex-col items-start rounded-2xl border px-3 py-3 text-left transition-colors ${
                                i === botIndex
                                    ? 'border-fuchsia-400/35 bg-fuchsia-500/10'
                                    : 'border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]'
                            }`}
                        >
                            <div className="flex w-full items-center justify-between gap-2">
                                <span className="text-[13px] font-semibold text-white/92">{bot.name}</span>
                                <GeoStatusBadge status={bot.operatorStatus} />
                            </div>
                            <span className="mt-1 text-[11px] text-white/40">{bot.service}</span>
                        </button>
                    ))}
                </div>
                <div className="min-w-0">
                    {activeBot ? <BotCard bot={activeBot} /> : (
                        <div className="rounded-[24px] border border-dashed border-white/[0.12] p-8 text-center text-[13px] text-white/40">
                            Aucun bot à afficher.
                        </div>
                    )}
                </div>
            </div>

            <GeoSectionTitle
                title="Couches de preuve"
                subtitle="Observation vs synthèse vs limites non couvertes."
            />
            <EvidenceLayerGrid layers={data.evidenceLayers} />

            <GeoSectionTitle
                title="Règles robots.txt"
                subtitle="Lecture opérateur des règles utiles, problématiques ou ambiguës sans extrapoler au-delà des directives observées."
            />
            <div className="grid gap-3 xl:grid-cols-3">
                <GeoFoundationPanel title="Règles utiles" reliability="measured">
                    <RuleList items={data.robotsRules.usefulRules} emptyLabel="Aucune règle positive notable n’a été relevée." />
                </GeoFoundationPanel>
                <GeoFoundationPanel title="Règles problématiques" reliability={data.robotsRules.problematicRules.length > 0 ? 'measured' : 'calculated'}>
                    <RuleList items={data.robotsRules.problematicRules} emptyLabel="Aucun blocage majeur observé dans les règles suivies ici." />
                </GeoFoundationPanel>
                <GeoFoundationPanel title="Ambiguïtés" reliability={data.robotsRules.ambiguousRules.length > 0 ? 'measured' : 'unavailable'}>
                    <RuleList items={data.robotsRules.ambiguousRules} emptyLabel="Aucune ambiguïté marquante n’a été relevée dans la lecture actuelle." />
                </GeoFoundationPanel>
            </div>

            <GeoSectionTitle
                title="Restrictions pages / patterns"
                subtitle="Patterns robots groupés et signaux de homepage quand le repo peut les lire honnêtement."
            />
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <GeoFoundationPanel
                    title="Patterns restreints"
                    subtitle="Familles de pages bloquées ou partiellement restreintes pour les bots suivis."
                    reliability={data.restrictionRows.length > 0 ? 'measured' : 'unavailable'}
                >
                    {data.restrictionRows.length > 0 ? (
                        <div className="space-y-3">
                            {data.restrictionRows.map((item) => <RestrictionCard key={`${item.pattern}-${item.scope}`} item={item} />)}
                        </div>
                    ) : (
                        <div className="text-[12px] leading-relaxed text-white/38">Aucun pattern restreint n’a été regroupé sur les bots affichés.</div>
                    )}
                </GeoFoundationPanel>

                <GeoFoundationPanel
                    title="Restrictions de homepage"
                    subtitle="Lecture ciblée de la page d’entrée pour `X-Robots-Tag` et `meta robots`."
                >
                    <div className="space-y-3">
                        {data.pageSignals.map((item) => <PageSignalRow key={item.label} item={item} />)}
                    </div>
                </GeoFoundationPanel>
            </div>

            <GeoSectionTitle
                title="Recommandations opérateur"
                subtitle="Angles de correction déterministes, sans surpromesse sur la couverture IA réelle."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                {data.recommendations.map((item) => <RecommendationCard key={item.title} item={item} />)}
            </div>
            </div>
        </div>
    );
}
