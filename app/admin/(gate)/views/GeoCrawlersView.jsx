'use client';

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

    if (loading) return <LoadingState />;
    if (error) return <EmptyState title="Crawlers IA indisponibles" description={error} />;
    if (data?.emptyState) return <EmptyState title={data.emptyState.title} description={data.emptyState.description} />;
    if (!data) return <EmptyState title="Crawlers IA indisponibles" description="La lecture de fondation GEO n’a pas pu être chargée." />;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Crawlers IA"
                subtitle={`Lecture opérateur des accès bots sur ${client?.client_name || 'ce mandat'} à partir de robots.txt, de la homepage et du dernier audit disponible.`}
                action={<GeoReliabilityLegend />}
            />

            <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-white/74">
                Cette surface reste volontairement prudente. Les statuts affichent <strong className="text-white/88">autorisé</strong>, <strong className="text-white/88">bloqué</strong>, <strong className="text-white/88">ambigu</strong> ou <strong className="text-white/88">à confirmer</strong> selon la preuve réellement disponible, sans inventer une crawlabilité page par page que le repo ne peut pas démontrer proprement.
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <GeoFoundationStatCard
                    label="Bots bloqués"
                    value={data.summary.blockedCount}
                    detail="Bots suivis ici avec blocage robots explicite observé."
                    reliability="measured"
                    status={data.summary.blockedCount > 0 ? 'bloqué' : 'autorisé'}
                    accent={data.summary.blockedCount > 0 ? 'amber' : 'emerald'}
                />
                <GeoFoundationStatCard
                    label="Bots ambigus"
                    value={data.summary.ambiguousCount}
                    detail="Bots avec règles partielles ou patterns potentiellement restrictifs."
                    reliability="calculated"
                    status={data.summary.ambiguousCount > 0 ? 'ambigu' : 'autorisé'}
                    accent="blue"
                />
                <GeoFoundationStatCard
                    label="À confirmer"
                    value={data.summary.confirmCount}
                    detail="Bots sans preuve exploitable suffisante au chargement de cette page."
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

            <GeoSectionTitle
                title="Couches de preuve"
                subtitle="Séparation explicite entre lecture observée, synthèse déterministe et limites encore non couvertes."
            />
            <EvidenceLayerGrid layers={data.evidenceLayers} />

            <GeoSectionTitle
                title="État par bot"
                subtitle="Grille bot par bot sur les acteurs critiques et quelques crawlers secondaires suivis honnêtement par le repo."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                {data.botRows.map((bot) => <BotCard key={bot.name} bot={bot} />)}
            </div>

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
    );
}
