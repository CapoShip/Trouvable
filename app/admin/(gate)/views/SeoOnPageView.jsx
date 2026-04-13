'use client';

import Link from 'next/link';

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

function SuggestionCard({ suggestion }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{suggestion.title}</div>
                <ReliabilityPill value={suggestion.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/68">{suggestion.description}</p>
        </div>
    );
}

export default function SeoOnPageView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('seo-on-page');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading) {
        return <SeoLoadingState title="Chargement de l’analyse on-page…" description="Préparation de la lecture éditoriale déterministe, des blocs prioritaires et des suggestions réellement disponibles." />;
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
                        <SeoActionLink href={`${baseHref}/seo/health`} variant="primary">Santé SEO</SeoActionLink>
                    </>
                )}
            />

            <SeoSectionNav
                items={[
                    { id: 'reference', label: 'Référence d’audit' },
                    { id: 'blocks', label: 'Blocs analysés' },
                    { id: 'suggestions', label: 'Suggestions' },
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

                    <SeoPanel id="reference" title="Référence d’audit" subtitle={`Audit actif: ${formatDateTimeLabel(data.auditMeta?.createdAt)}${data.auditMeta?.siteTypeLabel ? ` · ${data.auditMeta.siteTypeLabel}` : ''}`} reliability="measured" tone="info">
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
                        Recommandations opérateur
                    </div>

                    <SeoPanel id="suggestions" title="Suggestions d’amélioration" subtitle="Priorités déterministes, complétées par la lecture IA existante quand elle est réellement disponible." reliability="calculated" tone="default">
                        <div className="space-y-3">
                            {(data?.suggestions || []).map((suggestion) => (
                                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                            ))}
                        </div>
                    </SeoPanel>
                </>
            )}
        </SeoPageShell>
    );
}