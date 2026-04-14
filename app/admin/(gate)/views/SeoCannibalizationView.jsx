'use client';

import Link from 'next/link';

import ReliabilityPill from '@/components/ui/ReliabilityPill';
import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateLabel,
    formatDateTimeLabel,
    formatNumber,
    formatPosition,
    SeoActionLink,
    SeoEmptyState,
    SeoLoadingState,
    SeoPageHeader,
    SeoPanel,
    SeoPageShell,
    SeoSectionNav,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';

const CONFIDENCE_TONE_CLASSES = {
    high: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    medium: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    low: 'border-white/10 bg-white/[0.05] text-white/60',
};

const ACTION_TONE_CLASSES = {
    Fusionner: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    Repositionner: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
    'Différencier': 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    'Conserver séparé': 'border-white/10 bg-white/[0.05] text-white/70',
};

function ConfidenceBadge({ tone, label }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${CONFIDENCE_TONE_CLASSES[tone] || CONFIDENCE_TONE_CLASSES.low}`}>
            {label}
        </span>
    );
}

function ActionBadge({ label }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${ACTION_TONE_CLASSES[label] || ACTION_TONE_CLASSES['Conserver séparé']}`}>
            {label}
        </span>
    );
}

function MetricChip({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">{label}</div>
            <div className="mt-1.5 text-sm font-medium text-white/88">{value}</div>
        </div>
    );
}

function PageConcernCard({ page }) {
    const metrics = page.fallbackMetrics;
    const hasMetrics = metrics && (Number(metrics.impressions) > 0 || Number(metrics.clicks) > 0 || metrics.position !== null);

    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{page.pageTypeLabel}</div>
                {hasMetrics ? <ReliabilityPill value="measured" /> : <ReliabilityPill value={page.pageType ? 'calculated' : 'unavailable'} />}
            </div>
            {page.url ? (
                <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-[12px] font-medium text-sky-100/80 transition-colors hover:text-sky-100"
                >
                    {page.label}
                </a>
            ) : (
                <div className="mt-2 text-[12px] font-medium text-white/86">{page.label}</div>
            )}
            <p className="mt-2 text-[12px] leading-relaxed text-white/60">{page.roleDetail}</p>

            {hasMetrics ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <MetricChip label="Clics" value={formatNumber(metrics.clicks)} />
                    <MetricChip label="Impressions" value={formatNumber(metrics.impressions)} />
                    <MetricChip label="Position" value={formatPosition(metrics.position)} />
                </div>
            ) : null}
        </div>
    );
}

function EvidenceTile({ title, data }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/90">{title}</div>
                <ReliabilityPill value={data.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/72">{data.text}</p>
            {data.detail ? <div className="mt-2 text-[12px] leading-relaxed text-white/45">{data.detail}</div> : null}

            {Array.isArray(data.querySamples) && data.querySamples.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {data.querySamples.map((sample, index) => (
                        <div key={`${sample.query}_${index}`} className="rounded-2xl border border-white/[0.08] bg-black/18 p-3">
                            <div className="text-[12px] font-medium text-white/86">{sample.query}</div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                <MetricChip label="Clics" value={formatNumber(sample.clicks)} />
                                <MetricChip label="Impressions" value={formatNumber(sample.impressions)} />
                                <MetricChip label="Type" value={sample.isBrandLike ? 'Marque' : 'Hors marque'} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {Array.isArray(data.signals) && data.signals.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {data.signals.map((signal) => (
                        <div key={signal} className="rounded-2xl border border-white/[0.08] bg-black/18 px-3 py-2 text-[12px] text-white/78">
                            {signal}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function ReliabilityLayerCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/66">{item.text}</p>
        </div>
    );
}

function MiniFreshnessCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white/92">{item.label}</div>
                <div className="flex items-center gap-2">
                    <SeoStatusBadge status={item.status} />
                    <ReliabilityPill value={item.reliability} />
                </div>
            </div>
            <div className="mt-4 text-xl font-semibold tracking-[-0.03em] text-white">{item.value}</div>
            <div className="mt-2 text-[12px] leading-relaxed text-white/56">{item.detail}</div>
            {'lastObservedDate' in item ? (
                <div className="mt-4 text-[11px] text-white/40">
                    Dernière date observée: {formatDateLabel(item.lastObservedDate)}
                    {item.lastSyncedAt ? ` · Dernière synchro: ${formatDateTimeLabel(item.lastSyncedAt)}` : ''}
                </div>
            ) : null}
        </div>
    );
}

function GroupCard({ group }) {
    return (
        <div className="rounded-[26px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{group.title}</div>
                <ReliabilityPill value={group.reliability} />
                <ConfidenceBadge tone={group.confidenceTone} label={group.confidenceLabel} />
            </div>

            <div className="mt-2 text-[12px] text-white/52">{group.conflictTypeLabel}</div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/68">{group.summary}</p>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {group.pages.map((page) => (
                    <PageConcernCard key={page.key || page.label} page={page} />
                ))}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <EvidenceTile title="Mesurée" data={group.measured} />
                <EvidenceTile title="Calculée" data={group.calculated} />
                <EvidenceTile title="Analyse IA" data={group.ai} />
                <EvidenceTile title="Indisponible" data={group.unavailable} />
            </div>
        </div>
    );
}

function WinnerCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
                <ConfidenceBadge tone={item.confidenceLabel === 'Confiance élevée' ? 'high' : item.confidenceLabel === 'Confiance moyenne' ? 'medium' : 'low'} label={item.confidenceLabel} />
            </div>

            {item.page ? (
                <a
                    href={item.page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block break-all text-[13px] font-semibold text-sky-100/85 transition-colors hover:text-sky-100"
                >
                    {item.page.label}
                </a>
            ) : (
                <div className="mt-3 text-[13px] font-semibold text-white/70">Aucune page gagnante recommandable</div>
            )}

            <p className="mt-3 text-[13px] leading-relaxed text-white/66">{item.why}</p>
            <div className="mt-3 text-[12px] leading-relaxed text-white/44">{item.weakerNote}</div>
        </div>
    );
}

function ActionRecommendationCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
                <ActionBadge label={item.label} />
            </div>

            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/42">{item.confidenceLabel}</div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/66">{item.why}</p>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/56">
                {item.guardrail}
            </div>
        </div>
    );
}

function HookCard({ item }) {
    const body = (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/66">{item.description}</p>
            <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/78">
                {item.cta}
            </div>
        </div>
    );

    return item.href ? <Link href={item.href} className="block text-white">{body}</Link> : body;
}

export default function SeoCannibalizationView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useSeoWorkspaceSlice('cannibalization');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading) {
        return <SeoLoadingState title="Chargement de la cannibalisation SEO…" description="Assemblage des recouvrements Search Console, des similarités éditoriales et des limites de preuve réellement disponibles." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Cannibalisation SEO indisponible"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/content`}>Voir le contenu SEO</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    if (data?.emptyState) {
        return (
            <SeoPageShell>
                <SeoPageHeader
                    eyebrow="SEO Ops"
                    title="Cannibalisation SEO"
                    subtitle={`Surface opérateur pour repérer les recouvrements entre pages SEO de ${client?.client_name || 'ce mandat'} sans inventer de certitude quand les preuves manquent.`}
                    actions={(
                        <>
                            <SeoActionLink href={`${baseHref}/dossier/connectors`} variant="secondary">Connecteurs</SeoActionLink>
                            <SeoActionLink href={`${baseHref}/seo/content`} variant="primary">Contenu SEO</SeoActionLink>
                        </>
                    )}
                />
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            </SeoPageShell>
        );
    }

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Cannibalisation SEO"
                subtitle={`Surface opérateur pour repérer les recouvrements potentiels entre pages SEO de ${client?.client_name || 'ce mandat'}, sans surjouer la certitude quand les preuves restent partielles.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/content`} variant="secondary">Contenu SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/on-page`} variant="secondary">Optimisation on-page</SeoActionLink>
                    </>
                )}
            />

            <SeoSectionNav
                items={[
                    { id: 'overview', label: 'Vue d’ensemble' },
                    { id: 'groups', label: 'Groupes' },
                    { id: 'winners', label: 'Gagnantes' },
                    { id: 'actions', label: 'Actions' },
                    { id: 'hooks', label: 'Liens futurs' },
                ]}
            />

            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Synthèse de recouvrement
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(data?.summaryCards || []).map((card) => (
                    <SeoStatCard
                        key={card.id}
                        label={card.label}
                        value={card.value}
                        detail={card.detail}
                        reliability={card.reliability}
                        accent={card.accent}
                    />
                ))}
            </div>

            <SeoPanel id="overview" title="Vue d’ensemble cannibalisation" subtitle="Résumé opérateur, fraîcheur réelle des signaux et rappel explicite du cadre de vérité appliqué à cette page." reliability="calculated" tone="info">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-white/92">Résumé opérateur</div>
                                <ReliabilityPill value={data.operatorSummary.reliability} />
                            </div>
                            <p className="mt-3 text-[14px] leading-relaxed text-white/72">{data.operatorSummary.text}</p>
                            <div className="mt-3 text-[12px] leading-relaxed text-white/44">{data.operatorSummary.note}</div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <MiniFreshnessCard item={data.freshness.audit} />
                            <MiniFreshnessCard item={{
                                ...data.freshness.gsc,
                                value: data.freshness.gsc.lastObservedDate ? formatDateLabel(data.freshness.gsc.lastObservedDate) : 'Indisponible',
                            }} />
                            <MiniFreshnessCard item={data.freshness.measured} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/42">Cadre de vérité</div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {(data.reliabilityBreakdown || []).map((item) => (
                                <ReliabilityLayerCard key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                </div>
            </SeoPanel>

            <SeoPanel id="groups" title="Groupes de recouvrement" subtitle="Pages concernées, type de conflit, niveau de confiance et preuves disponibles sans mélange avec GEO." reliability={data.groups.length > 0 ? 'calculated' : 'unavailable'} tone={data.groups.length > 0 ? 'default' : 'warning'}>
                {data.groups.length > 0 ? (
                    <div className="space-y-3">
                        {data.groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                ) : (
                    <SeoEmptyState
                        title="Aucun recouvrement net observé"
                        description="Les données actuelles ne montrent ni requêtes partagées ni similarité structurelle assez nette pour ouvrir un groupe opérateur fiable."
                    />
                )}
            </SeoPanel>

            <SeoPanel id="winners" title="Page gagnante recommandée" subtitle="Lecture de la page qui paraît la plus solide pour porter l’intention principale dans chaque groupe." reliability={data.winnerRecommendations.length > 0 ? 'calculated' : 'unavailable'} tone={data.winnerRecommendations.length > 0 ? 'default' : 'warning'}>
                {data.winnerRecommendations.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {data.winnerRecommendations.map((item) => (
                            <WinnerCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <SeoEmptyState
                        title="Aucune page gagnante recommandable"
                        description="Sans groupe fiable ni hiérarchie de signal exploitable, cette section n’avance pas de page gagnante artificielle."
                    />
                )}
            </SeoPanel>

            <SeoPanel id="actions" title="Recommandation d’action" subtitle="Arbitrage opérateur déterministe entre fusion, repositionnement, différenciation ou maintien séparé." reliability={data.actionRecommendations.length > 0 ? 'calculated' : 'unavailable'} tone={data.actionRecommendations.length > 0 ? 'default' : 'warning'}>
                {data.actionRecommendations.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {data.actionRecommendations.map((item) => (
                            <ActionRecommendationCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <SeoEmptyState
                        title="Aucune action prioritaire nette"
                        description="La page n’affiche pas d’action tant que le signal ne dépasse pas le seuil minimum de confiance opérateur."
                    />
                )}
            </SeoPanel>

            <SeoPanel id="hooks" title="Liens vers actions futures" subtitle="Points de branchement existants vers les surfaces SEO déjà en place, sans surconstruire un moteur futuriste." reliability="calculated" tone="default">
                <div className="grid gap-4 lg:grid-cols-3">
                    {(data.actionHooks || []).map((item) => (
                        <HookCard key={item.id} item={item} />
                    ))}
                </div>
            </SeoPanel>
        </SeoPageShell>
    );
}