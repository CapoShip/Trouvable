'use client';

import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateLabel,
    formatDateTimeLabel,
    formatNumber,
    formatPercent,
    formatPosition,
    getPanelToneFromStatus,
    SeoEmptyState,
    SeoPageHeader,
    SeoPanel,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';

function formatSignedPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Comparaison indisponible';

    const numeric = Number(value);
    const prefix = numeric > 0 ? '+' : '';
    return `${prefix}${numeric.toFixed(1)}% vs période précédente`;
}

function formatSignedPosition(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Comparaison indisponible';

    const numeric = Number(value);
    const prefix = numeric > 0 ? '+' : '';
    return `${prefix}${numeric.toFixed(1)} position vs période précédente`;
}

function SourceCard({ source }) {
    return (
        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-white/92">{source.label}</div>
                    <div className="mt-1 text-[11px] text-white/45">{source.detail}</div>
                </div>
                <SeoStatusBadge status={source.status} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Dernière date observée</div>
                    <div className="mt-1 text-sm font-medium text-white/85">{formatDateLabel(source.lastObservedDate)}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Dernière synchro</div>
                    <div className="mt-1 text-sm font-medium text-white/85">{formatDateTimeLabel(source.lastSyncedAt)}</div>
                </div>
            </div>
        </div>
    );
}

function MetricChip({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">{label}</div>
            <div className="mt-1 text-sm font-medium text-white/88">{value}</div>
        </div>
    );
}

function QueryRow({ row }) {
    return (
        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
            <div className="break-words text-sm font-semibold leading-relaxed text-white/92">{row.query}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetricChip label="Clics" value={formatNumber(row.clicks)} />
                <MetricChip label="Impressions" value={formatNumber(row.impressions)} />
                <MetricChip label="CTR" value={formatPercent(row.ctr)} />
                <MetricChip label="Position" value={formatPosition(row.position)} />
            </div>
        </div>
    );
}

function PageRow({ row, ga4 = false }) {
    const pageLabel = ga4 ? row.landing_page : row.page;

    return (
        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
            {pageLabel ? (
                <a
                    href={pageLabel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-semibold leading-relaxed text-white/92 hover:text-emerald-200"
                >
                    {pageLabel}
                </a>
            ) : (
                <div className="break-all text-sm font-semibold leading-relaxed text-white/92">Page non renseignée</div>
            )}

            <div className={`mt-3 grid gap-2 ${ga4 ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                <MetricChip label={ga4 ? 'Sessions' : 'Clics'} value={formatNumber(ga4 ? row.sessions : row.clicks)} />
                <MetricChip label={ga4 ? 'Utilisateurs' : 'Impressions'} value={formatNumber(ga4 ? row.users : row.impressions)} />
                {!ga4 ? <MetricChip label="CTR" value={formatPercent(row.ctr)} /> : null}
                {!ga4 ? <MetricChip label="Position" value={formatPosition(row.position)} /> : null}
            </div>
        </div>
    );
}

export default function SeoVisibilityView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('visibility');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading) {
        return <div className="p-5 text-sm text-white/55">Chargement de la visibilité SEO…</div>;
    }

    if (error) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <SeoEmptyState
                    title="Visibilité SEO indisponible"
                    description={error}
                    action={<Link href={`${baseHref}/seo/health`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Voir la santé SEO</Link>}
                />
            </div>
        );
    }

    const isEmpty = !data || data.emptyState;

    return (
        <div className="max-w-[1600px] mx-auto space-y-5 p-4 md:p-6">
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Visibilité SEO"
                subtitle={`Lecture organique centrée Search Console, avec GA4 utilisé comme complément site pour ${client?.client_name || 'ce mandat'}.`}
                actions={(
                    <>
                        <Link href={`${baseHref}/seo/health`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">
                            Santé SEO
                        </Link>
                        <Link href={`${baseHref}/seo/on-page`} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/16">
                            On-page
                        </Link>
                    </>
                )}
            />

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <SeoPanel title="Fraîcheur et sources" subtitle="État des connecteurs et fraîcheur réellement observée." reliability="measured" tone="info">
                    <div className="grid gap-3 lg:grid-cols-2">
                        <SourceCard source={data?.freshness?.gsc || { label: 'Search Console', status: 'unavailable' }} />
                        <SourceCard source={data?.freshness?.ga4 || { label: 'GA4', status: 'unavailable' }} />
                    </div>
                </SeoPanel>

                <SeoPanel title="Tendance 28 jours" subtitle="Comparaison du dernier bloc de 28 jours avec le bloc précédent." reliability="calculated" tone="default">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Clics</div>
                            <div className="mt-2 text-xl font-semibold text-white/92">{formatSignedPercent(data?.comparison?.clicksDeltaPercent)}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Impressions</div>
                            <div className="mt-2 text-xl font-semibold text-white/92">{formatSignedPercent(data?.comparison?.impressionsDeltaPercent)}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">CTR</div>
                            <div className="mt-2 text-xl font-semibold text-white/92">{formatSignedPercent(data?.comparison?.ctrDeltaPercent)}</div>
                        </div>
                        <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Position</div>
                            <div className="mt-2 text-xl font-semibold text-white/92">{formatSignedPosition(data?.comparison?.positionDelta)}</div>
                        </div>
                    </div>
                </SeoPanel>
            </div>

            {isEmpty ? (
                <SeoEmptyState
                    title={data?.emptyState?.title || 'Visibilité SEO indisponible'}
                    description={data?.emptyState?.description || 'Aucune donnée organique proprement exploitable n’a été trouvée pour cette surface.'}
                    action={<Link href={`${baseHref}/dossier/connectors`} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08]">Voir les connecteurs</Link>}
                />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <SeoStatCard
                            label="Clics organiques"
                            value={formatNumber(data.summary.clicks)}
                            detail={formatSignedPercent(data.comparison.clicksDeltaPercent)}
                            reliability="calculated"
                            accent="emerald"
                            trend={{ points: data.trends.gsc, valueKey: 'clicks', color: 'emerald' }}
                        />
                        <SeoStatCard
                            label="Impressions"
                            value={formatNumber(data.summary.impressions)}
                            detail={formatSignedPercent(data.comparison.impressionsDeltaPercent)}
                            reliability="calculated"
                            accent="sky"
                            trend={{ points: data.trends.gsc, valueKey: 'impressions', color: 'sky' }}
                        />
                        <SeoStatCard
                            label="CTR moyen"
                            value={formatPercent(data.summary.ctr)}
                            detail={formatSignedPercent(data.comparison.ctrDeltaPercent)}
                            reliability="calculated"
                            accent="amber"
                            trend={{ points: data.trends.gsc, valueKey: 'ctr', color: 'amber' }}
                        />
                        <SeoStatCard
                            label="Position moyenne"
                            value={formatPosition(data.summary.position)}
                            detail={formatSignedPosition(data.comparison.positionDelta)}
                            reliability="calculated"
                            accent="slate"
                            trend={{ points: data.trends.gsc, valueKey: 'position', color: 'slate' }}
                        />
                        <SeoStatCard
                            label="Requêtes utiles"
                            value={formatNumber(data.summary.queryCount)}
                            detail="Requêtes distinctes observées sur la fenêtre courante"
                            reliability="calculated"
                            accent="emerald"
                        />
                        <SeoStatCard
                            label="Pages visibles"
                            value={formatNumber(data.summary.pageCount)}
                            detail="Pages distinctes observées via Search Console"
                            reliability="calculated"
                            accent="sky"
                        />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                        <SeoPanel title="Requêtes en tête" subtitle="Top requêtes agrégées sur la fenêtre Search Console actuelle." reliability="calculated" tone="default">
                            {data.topQueries.length === 0 ? (
                                <SeoEmptyState title="Aucune requête exploitable" description="Les données Search Console ne contiennent pas encore de requêtes propres à afficher sur cette période." />
                            ) : (
                                <div className="space-y-3">
                                    {data.topQueries.map((row) => (
                                        <QueryRow key={row.query} row={row} />
                                    ))}
                                </div>
                            )}
                        </SeoPanel>

                        <SeoPanel title="Marque vs hors marque" subtitle="Segmentation uniquement lorsqu’un signal marque est suffisamment discriminant." reliability={data.brandSplit?.reliability || 'unavailable'} tone={data.brandSplit?.status === 'available' ? 'success' : 'default'}>
                            {data.brandSplit?.status === 'available' ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                                        <div className="text-sm font-semibold text-white/92">Requêtes marque</div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <MetricChip label="Clics" value={formatNumber(data.brandSplit.brand.clicks)} />
                                            <MetricChip label="Impressions" value={formatNumber(data.brandSplit.brand.impressions)} />
                                            <MetricChip label="Requêtes" value={formatNumber(data.brandSplit.brand.queryCount)} />
                                            <MetricChip label="Part clics" value={formatPercent(data.brandSplit.clickShare, 0)} />
                                        </div>
                                    </div>
                                    <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                                        <div className="text-sm font-semibold text-white/92">Requêtes hors marque</div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <MetricChip label="Clics" value={formatNumber(data.brandSplit.nonBrand.clicks)} />
                                            <MetricChip label="Impressions" value={formatNumber(data.brandSplit.nonBrand.impressions)} />
                                            <MetricChip label="Requêtes" value={formatNumber(data.brandSplit.nonBrand.queryCount)} />
                                            <MetricChip label="Part impressions" value={formatPercent(data.brandSplit.impressionShare, 0)} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <SeoEmptyState
                                    title="Segmentation marque indisponible"
                                    description={data.brandSplit?.reason || 'Le signal marque actuel n’est pas assez propre pour segmenter honnêtement les requêtes.'}
                                />
                            )}
                        </SeoPanel>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                        <SeoPanel title="Pages en tête" subtitle="Pages agrégées depuis Search Console, sans mélange avec les surfaces GEO." reliability="calculated" tone="default">
                            {data.topPages.length === 0 ? (
                                <SeoEmptyState title="Aucune page SEO exploitable" description="Les données Search Console ne remontent pas encore de pages distinctes sur cette fenêtre." />
                            ) : (
                                <div className="space-y-3">
                                    {data.topPages.map((row) => (
                                        <PageRow key={row.page} row={row} />
                                    ))}
                                </div>
                            )}
                        </SeoPanel>

                        <SeoPanel title="Complément site (GA4)" subtitle="Lecture site utile pour recouper la fréquentation, sans se substituer aux métriques Search Console." reliability={data.ga4Support?.reliability || 'unavailable'} tone="info">
                            {data.ga4LandingPages.length === 0 ? (
                                <SeoEmptyState title="Complément GA4 indisponible" description="Aucune page d’entrée GA4 n’a été synchronisée pour cette période." />
                            ) : (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <MetricChip label="Sessions" value={formatNumber(data.ga4Support.sessions)} />
                                        <MetricChip label="Utilisateurs" value={formatNumber(data.ga4Support.users)} />
                                    </div>
                                    <div className="space-y-3">
                                        {data.ga4LandingPages.map((row) => (
                                            <PageRow key={row.landing_page} row={row} ga4 />
                                        ))}
                                    </div>
                                </>
                            )}
                        </SeoPanel>
                    </div>
                </>
            )}
        </div>
    );
}