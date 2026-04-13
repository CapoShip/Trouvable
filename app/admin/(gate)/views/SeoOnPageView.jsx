'use client';

import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateTimeLabel,
    getPanelToneFromStatus,
    SeoEmptyState,
    SeoPageHeader,
    SeoPanel,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

function BlockItem({ item }) {
    const content = (
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
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
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block hover:text-emerald-100">
            {content}
        </a>
    );
}

function SuggestionCard({ suggestion }) {
    return (
        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
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
        return <div className="p-5 text-sm text-white/55">Chargement de l’analyse on-page…</div>;
    }

    if (error) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <SeoEmptyState
                    title="Analyse on-page indisponible"
                    description={error}
                    action={<Link href={`${baseHref}/seo/health`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Voir la santé SEO</Link>}
                />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-5 p-4 md:p-6">
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Optimisation on-page"
                subtitle={`Lecture éditoriale déterministe du contenu audité pour ${client?.client_name || 'ce mandat'}, sans score inventé ni relecture “GEO bis”.`}
                actions={(
                    <>
                        <Link href={`${baseHref}/seo/visibility`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">
                            Visibilité SEO
                        </Link>
                        <Link href={`${baseHref}/seo/health`} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/16">
                            Santé SEO
                        </Link>
                    </>
                )}
            />

            {data?.emptyState ? (
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

                    <SeoPanel title="Référence d’audit" subtitle={`Audit actif: ${formatDateTimeLabel(data.auditMeta?.createdAt)}${data.auditMeta?.siteTypeLabel ? ` · ${data.auditMeta.siteTypeLabel}` : ''}`} reliability="measured" tone="info">
                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-[13px] leading-relaxed text-white/68">
                            {data.auditMeta?.sourceUrl || 'URL source indisponible dans le dernier audit.'}
                        </div>
                    </SeoPanel>

                    <div className="grid gap-4 xl:grid-cols-2">
                        {(data?.blocks || []).map((block) => (
                            <SeoPanel
                                key={block.id}
                                title={block.title}
                                subtitle={block.summary}
                                reliability={block.reliability}
                                tone={getPanelToneFromStatus(block.status)}
                                action={<SeoStatusBadge status={block.status} />}
                            >
                                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-[12px] leading-relaxed text-white/62">
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

                    <SeoPanel title="Suggestions d’amélioration" subtitle="Priorités déterministes, complétées par la lecture IA existante quand elle est réellement disponible." reliability="calculated" tone="default">
                        <div className="space-y-3">
                            {(data?.suggestions || []).map((suggestion) => (
                                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                            ))}
                        </div>
                    </SeoPanel>
                </>
            )}
        </div>
    );
}