'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateTimeLabel,
    getPanelToneFromStatus,
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
import ReliabilityPill from '@/components/ui/ReliabilityPill';

function formatSiteTypeLabel(label) {
    if (!label) return null;

    return String(label)
        .replace(/\bsoftware\b/gi, 'logiciel')
        .replace(/\bunknown\b/gi, 'indéterminé');
}

function BlockItem({ item }) {
    const content = (
        <div className="rounded-[22px] border border-white/[0.08] bg-black/18 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.label}</div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">
                    {item.context}
                </span>
            </div>
            <div className="mt-2 text-[12px] leading-relaxed text-white/68">{item.evidence}</div>
        </div>
    );

    if (!item.url) return content;

    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-white transition-colors hover:text-sky-100">
            {content}
        </a>
    );
}

function BacklogRelayCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
            </div>
            <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">{item.count}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/68">{item.description}</p>
        </div>
    );
}

export default function SeoOnPageView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('seo-on-page');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const backlogRelayItems = (data?.blocks || [])
        .filter((block) => block.status !== 'ok' && block.items.length > 0)
        .map((block) => ({
            id: block.id,
            title: block.title,
            count: `${block.items.length} page(s) concernée(s)`,
            description: block.suggestion || block.summary,
            reliability: block.reliability,
        }))
        .slice(0, 4);

    if (loading) {
        return <SeoLoadingState title="Chargement de l’analyse on-page…" description="Préparation de la lecture éditoriale déterministe et des faiblesses on-page réellement observées." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Analyse on-page indisponible"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/health`}>Voir la santé SEO</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Optimisation on-page"
                subtitle={`Lecture éditoriale déterministe du contenu audité pour ${client?.client_name || 'ce mandat'}, sans score inventé ni relecture “GEO bis”.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/visibility`} variant="secondary">Visibilité SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/opportunities`} variant="primary">Opportunités SEO</SeoActionLink>
                    </>
                )}
            />

            <SeoSectionNav
                items={[
                    { id: 'reference', label: 'Référence d’audit' },
                    { id: 'blocks', label: 'Blocs analysés' },
                    { id: 'backlog', label: 'Relais backlog' },
                ]}
            />

            {data?.emptyState ? (
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Synthèse éditoriale
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

                    <SeoPanel id="reference" title="Référence d’audit" subtitle={`Audit actif: ${formatDateTimeLabel(data.auditMeta?.createdAt)}${formatSiteTypeLabel(data.auditMeta?.siteTypeLabel) ? ` · ${formatSiteTypeLabel(data.auditMeta?.siteTypeLabel)}` : ''}`} reliability="measured" tone="info">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] leading-relaxed text-white/68">
                            {data.auditMeta?.sourceUrl || 'URL source indisponible dans le dernier audit.'}
                        </div>
                    </SeoPanel>

                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Blocs analysés
                    </div>

                    <div id="blocks" className="grid gap-4 xl:grid-cols-2">
                        {(data?.blocks || []).map((block) => (
                            <SeoPanel
                                key={block.id}
                                title={block.title}
                                subtitle={block.summary}
                                reliability={block.reliability}
                                tone={getPanelToneFromStatus(block.status)}
                                action={<SeoStatusBadge status={block.status} />}
                            >
                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[12px] leading-relaxed text-white/62">
                                    {block.detail}
                                </div>

                                {block.suggestion ? (
                                    <div className="rounded-2xl border border-emerald-400/14 bg-emerald-400/[0.06] p-4 text-[12px] leading-relaxed text-emerald-100/88">
                                        {block.suggestion}
                                    </div>
                                ) : null}

                                {block.items.length === 0 ? (
                                    <SeoEmptyState title="Aucun point prioritaire" description="Aucune page prioritaire ne ressort sur ce bloc dans l’échantillon audité." />
                                ) : (
                                    <div className="space-y-3">
                                        {block.items.map((item, index) => (
                                            <BlockItem key={`${block.id}_${index}`} item={item} />
                                        ))}
                                    </div>
                                )}
                            </SeoPanel>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Relais backlog SEO
                    </div>

                    <SeoPanel
                        id="backlog"
                        title="Relais vers Opportunités SEO"
                        subtitle="Cette page conserve la preuve page par page. Le backlog détaillé et la priorisation d’exécution vivent dans Opportunités SEO."
                        reliability="calculated"
                        tone="default"
                        action={<SeoActionLink href={`${baseHref}/seo/opportunities`} variant="primary" className="px-3.5 py-2 text-[11px]">Ouvrir Opportunités SEO</SeoActionLink>}
                    >
                        {backlogRelayItems.length > 0 ? (
                            <div className="grid gap-3 lg:grid-cols-2">
                                {backlogRelayItems.map((item) => (
                                    <BacklogRelayCard key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <SeoEmptyState
                                title="Aucun relais backlog dominant"
                                description="Les faiblesses on-page restent ici descriptives, sans ouvrir de backlog détaillé supplémentaire sur cette page."
                            />
                        )}
                    </SeoPanel>
                </>
            )}
        </SeoPageShell>
    );
}