'use client';

import Link from 'next/link';

import ReliabilityPill from '@/components/ui/ReliabilityPill';
import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import {
    SeoActionLink,
    formatDateLabel,
    formatDateTimeLabel,
    getPanelToneFromStatus,
    SeoEmptyState,
    SeoLoadingState,
    SeoPageHeader,
    SeoPanel,
    SeoPageShell,
    SeoSectionNav,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';

function SignalCard({ item }) {
    return (
        <div className="rounded-[26px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
            </div>

            {item.url ? (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-[12px] font-medium text-sky-100/80 transition-colors hover:text-sky-100"
                >
                    {item.label || item.url}
                </a>
            ) : null}

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Pourquoi</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/78">{item.why}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Preuve</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/78">{item.evidence}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Impact attendu</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/78">{item.impact}</div>
                </div>
            </div>

            <div className="mt-3 text-[11px] text-white/42">Source: {item.source}</div>
        </div>
    );
}

function ClusterCard({ cluster }) {
    return (
        <div className="rounded-[26px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{cluster.label}</div>
                <ReliabilityPill value={cluster.reliability} />
            </div>

            <div className="mt-2 text-[12px] text-white/52">
                {cluster.detectionLabel} · {cluster.detectionDetail}
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Preuve</div>
                <div className="mt-2 text-[12px] leading-relaxed text-white/78">{cluster.evidence}</div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Hub inférable</div>
                    {cluster.hubPage ? (
                        <a
                            href={cluster.hubPage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block break-all text-[12px] font-medium text-sky-100/80 transition-colors hover:text-sky-100"
                        >
                            {cluster.hubPage.label}
                        </a>
                    ) : (
                        <div className="mt-2 text-[12px] text-white/55">Aucun hub proprement inférable.</div>
                    )}
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Pages support</div>
                    {cluster.supportPages.length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {cluster.supportPages.map((page, index) => (
                                <a
                                    key={`${page.url || page.label || 'support'}_${index}`}
                                    href={page.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block break-all text-[12px] text-white/80 transition-colors hover:text-sky-100"
                                >
                                    {page.label}
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-[12px] text-white/55">Aucune page support supplémentaire observée.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PageRoleCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.role}</div>
                <ReliabilityPill value={item.reliability} />
            </div>
            {item.url ? (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-[12px] font-medium text-sky-100/80 transition-colors hover:text-sky-100"
                >
                    {item.label}
                </a>
            ) : (
                <div className="mt-2 text-[12px] font-medium text-white/88">{item.label}</div>
            )}
            <p className="mt-2 text-[12px] leading-relaxed text-white/62">{item.detail}</p>
            <div className="mt-3 text-[11px] text-white/42">{item.evidence}</div>
        </div>
    );
}

function ContentBacklogRelayCard({ id, title, count, description, href }) {
    return (
        <div id={id} className="scroll-mt-24 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white/92">{title}</div>
            <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">{count}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-white/58">{description}</p>
            <Link href={href} className="mt-3 inline-flex text-[11px] font-medium text-sky-100/80 transition-colors hover:text-sky-100">
                Ouvrir Opportunités SEO
            </Link>
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

function SectionBlock({ section, emptyTitle }) {
    if (section.status === 'unavailable') {
        return <SeoEmptyState title={emptyTitle} description={section.description} />;
    }

    if (!section.items.length) {
        return <SeoEmptyState title={emptyTitle} description={section.description} />;
    }

    return (
        <div className="space-y-3">
            {section.items.map((item) => (
                <SignalCard key={item.id} item={item} />
            ))}
        </div>
    );
}

export default function SeoContentView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useSeoWorkspaceSlice('content');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const summaryCards = (data?.summaryCards || []).map((card) => (
        card.id === 'priority_count'
            ? {
                ...card,
                label: 'Signaux éditoriaux',
                detail: 'Décrochages, manques structurels et relais backlog visibles',
            }
            : card
    ));
    const refreshCount = data?.refreshOpportunities?.items?.length || 0;
    const mergeCount = data?.mergeOpportunities?.items?.length || 0;

    if (loading) {
        return <SeoLoadingState title="Chargement du contenu SEO…" description="Assemblage de la couverture éditoriale, des priorités de retravail et des consolidations réellement observées." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Contenu SEO indisponible"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/on-page`}>Voir l’on-page</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Contenu SEO"
                subtitle={`Surface opérateur pour piloter couverture éditoriale, clusters, décrochages, pages manquantes et structure des hubs pour ${client?.client_name || 'ce mandat'}, à partir des signaux réellement persistés.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/on-page`} variant="secondary">Optimisation on-page</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/health`} variant="secondary">Santé SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/opportunities`} variant="primary">Opportunités SEO</SeoActionLink>
                    </>
                )}
            />

            <SeoSectionNav
                items={[
                    { id: 'overview', label: 'Vue d’ensemble' },
                    { id: 'clusters', label: 'Clusters' },
                    { id: 'decay', label: 'Décrochage' },
                    { id: 'missing', label: 'Pages manquantes' },
                ]}
            />

            {data?.emptyState ? (
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Synthèse de couverture
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {summaryCards.map((card) => (
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

                    <SeoPanel id="overview" title="Vue d’ensemble contenu" subtitle="Résumé opérateur, fraîcheur des signaux et structure éditoriale réellement visible." reliability="calculated" tone="info">
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
                                    <MiniFreshnessCard item={data.freshness.pageFreshness} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-white/92">Couverture éditoriale disponible</div>
                                        <ReliabilityPill value="calculated" />
                                    </div>
                                    <div className="mt-3 text-[13px] leading-relaxed text-white/66">{data.coverage.summary}</div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {data.coverage.roleSummary.map((item) => (
                                            <div key={item.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">{item.label}</div>
                                                <div className="mt-1 text-lg font-semibold text-white">{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-[11px] text-white/40">{data.coverage.evidence}</div>
                                </div>

                                <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-white/92">Relais backlog contenu</div>
                                        <ReliabilityPill value="calculated" />
                                    </div>
                                    <div className="mt-3 text-[13px] leading-relaxed text-white/66">
                                        Contenu SEO garde ici la preuve structurelle. Les retravails éditoriaux détaillés et les arbitrages de consolidation vivent dans Opportunités SEO.
                                    </div>
                                    {refreshCount > 0 || mergeCount > 0 ? (
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            {refreshCount > 0 ? (
                                                <ContentBacklogRelayCard
                                                    id="refresh"
                                                    title="Retravails éditoriaux"
                                                    count={`${refreshCount}`}
                                                    description={`${refreshCount} page(s) restent à arbitrer dans le backlog SEO central, à partir des faiblesses éditoriales observées ici.`}
                                                    href={`${baseHref}/seo/opportunities#refresh`}
                                                />
                                            ) : null}
                                            {mergeCount > 0 ? (
                                                <ContentBacklogRelayCard
                                                    id="merge"
                                                    title="Consolidations à arbitrer"
                                                    count={`${mergeCount}`}
                                                    description={`${mergeCount} rapprochement(s) ou fusion(s) demandent un arbitrage centralisé dans Opportunités SEO, avec la preuve de conflit gardée dans Cannibalisation SEO.`}
                                                    href={`${baseHref}/seo/opportunities#consolidation`}
                                                />
                                            ) : null}
                                        </div>
                                    ) : (
                                        <SeoEmptyState title="Aucun relais backlog dominant" description="Le dernier audit ne fait pas ressortir de retravail éditorial ou de consolidation prioritaire à basculer dans le backlog central." />
                                    )}
                                </div>
                            </div>
                        </div>
                    </SeoPanel>

                    <SeoPanel id="clusters" title="Clusters et hubs" subtitle="Groupements provisoires uniquement quand la structure observée permet une lecture propre." reliability={data.clusters.length > 0 ? 'calculated' : 'unavailable'} tone={data.clusters.length > 0 ? 'default' : 'warning'}>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3">
                                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/42">Clusters détectés</div>
                                {data.clusters.length > 0 ? (
                                    data.clusters.map((cluster) => (
                                        <ClusterCard key={cluster.id} cluster={cluster} />
                                    ))
                                ) : (
                                    <SeoEmptyState
                                        title="Aucun groupement proprement inférable"
                                        description="Le repo n’expose pas encore de clustering SEO dédié. Cette section ne montre que des groupements déterministes par structure ; aucun n’est assez net ici."
                                    />
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/42">Rôle des pages</div>
                                <div className="space-y-3">
                                    {data.pageRoles.map((item) => (
                                        <PageRoleCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SeoPanel>

                    <SeoPanel id="decay" title="Décrochage contenu" subtitle="Pages en recul mesurable sur Search Console quand la preuve existe." reliability={data.contentDecay.reliability} tone={getPanelToneFromStatus(data.contentDecay.status)} action={<SeoStatusBadge status={data.contentDecay.status} />}>
                        <SectionBlock section={data.contentDecay} emptyTitle={data.contentDecay.status === 'unavailable' ? 'Décrochage contenu indisponible' : 'Aucun décrochage majeur observé'} />
                    </SeoPanel>

                    <SeoPanel id="refresh" title="Opportunités de retravail" subtitle="Pages à retravailler selon les faiblesses éditoriales réellement observées." reliability={data.refreshOpportunities.reliability} tone={getPanelToneFromStatus(data.refreshOpportunities.status)} action={<SeoStatusBadge status={data.refreshOpportunities.status} />}>
                        <SectionBlock section={data.refreshOpportunities} emptyTitle="Aucune page à retravailler en priorité" />
                    </SeoPanel>

                    <SeoPanel id="missing" title="Pages manquantes et nouvelles pages" subtitle="Manques structurels inférés de manière déterministe depuis l’audit courant." reliability={data.missingPages.reliability} tone={getPanelToneFromStatus(data.missingPages.status)} action={<SeoStatusBadge status={data.missingPages.status} />}>
                        <SectionBlock section={data.missingPages} emptyTitle="Aucun manque structurel dominant" />
                    </SeoPanel>
                </>
            )}
        </SeoPageShell>
    );
}