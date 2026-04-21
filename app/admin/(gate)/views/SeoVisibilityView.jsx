'use client';

import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateLabel,
    formatDateTimeLabel,
    formatNumber,
    formatPercent,
    formatPosition,
    SeoActionLink,
    SeoEmptyState,
    SeoLoadingState,
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
        <div className="min-w-0 rounded-[24px] border border-white/[0.08] bg-black/24 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/92">{source.label}</div>
                    <div className="mt-1 text-[12px] text-white/50 truncate">{source.detail}</div>
                </div>
                <SeoStatusBadge status={source.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Dernière date</div>
                    <div className="mt-1.5 text-sm font-medium text-white/85">{formatDateLabel(source.lastObservedDate)}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Dernière synchro</div>
                    <div className="mt-1.5 text-sm font-medium text-white/85">{formatDateTimeLabel(source.lastSyncedAt)}</div>
                </div>
            </div>
        </div>
    );
}

function MetricChip({ label, value }) {
    return (
        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">{label}</div>
            <div className="mt-1.5 text-sm font-medium text-white/88 truncate">{value}</div>
        </div>
    );
}

function positionTone(position) {
    const pos = Number(position);
    if (!Number.isFinite(pos)) return { cell: 'bg-white/[0.08]', label: 'n.d.' };
    if (pos <= 3) return { cell: 'bg-emerald-400/85', label: 'Top 3' };
    if (pos <= 10) return { cell: 'bg-emerald-400/55', label: 'Top 10' };
    if (pos <= 20) return { cell: 'bg-amber-400/65', label: 'Top 20' };
    if (pos <= 50) return { cell: 'bg-amber-400/35', label: 'Top 50' };
    return { cell: 'bg-rose-400/55', label: '50+' };
}

function PositionHeatmap({ rows }) {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const buckets = [
        { key: 'top3', label: 'Top 3', color: 'bg-emerald-400/85' },
        { key: 'top10', label: 'Top 10', color: 'bg-emerald-400/55' },
        { key: 'top20', label: 'Top 20', color: 'bg-amber-400/65' },
        { key: 'top50', label: 'Top 50', color: 'bg-amber-400/35' },
        { key: 'beyond', label: '50+', color: 'bg-rose-400/55' },
    ];
    const counts = { top3: 0, top10: 0, top20: 0, top50: 0, beyond: 0 };
    rows.forEach((row) => {
        const pos = Number(row.position);
        if (!Number.isFinite(pos)) return;
        if (pos <= 3) counts.top3 += 1;
        else if (pos <= 10) counts.top10 += 1;
        else if (pos <= 20) counts.top20 += 1;
        else if (pos <= 50) counts.top50 += 1;
        else counts.beyond += 1;
    });

    return (
        <div className="mb-4 rounded-2xl border border-white/[0.07] bg-black/25 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <span>Distribution des positions</span>
                <span className="text-white/30">{rows.length} requêtes</span>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
                {buckets.map((bucket) => {
                    const pct = (counts[bucket.key] / rows.length) * 100;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={bucket.key}
                            className={`h-full transition-all ${bucket.color}`}
                            style={{ width: `${pct}%` }}
                            title={`${bucket.label} · ${counts[bucket.key]}`}
                        />
                    );
                })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
                {buckets.map((bucket) => (
                    <div key={bucket.key} className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${bucket.color}`} />
                        <span className="text-white/50">{bucket.label}</span>
                        <span className="font-semibold tabular-nums text-white/80">{counts[bucket.key]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QueryRow({ row }) {
    const tone = positionTone(row.position);
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="break-words text-sm font-semibold leading-relaxed text-white/92">{row.query}</div>
                <span className={`shrink-0 rounded-full border border-white/[0.1] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/85 ${tone.cell}`}>
                    {tone.label}
                </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        <div className="rounded-[24px] border border-white/[0.08] bg-black/22 p-4 sm:p-5">
            {pageLabel ? (
                <a
                    href={pageLabel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-semibold leading-relaxed text-white/90 transition-colors hover:text-sky-100"
                >
                    {pageLabel}
                </a>
            ) : (
                <div className="break-all text-sm font-semibold leading-relaxed text-white/92">Page non renseignée</div>
            )}

            <div className={`mt-4 grid gap-2 ${ga4 ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
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
        return <SeoLoadingState title="Chargement de la visibilité SEO…" description="Assemblage des signaux Search Console, du complément GA4 et des regroupements utiles pour la lecture opérateur." />;
    }

    if (error) {
        return (
            <div className="mx-auto max-w-[1200px] p-8">
                <SeoEmptyState
                    title="Visibilité SEO indisponible"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/health`}>Voir la santé SEO</SeoActionLink>}
                />
            </div>
        );
    }

    const isEmpty = !data || data.emptyState;

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#010409]">
            <div className="relative overflow-hidden border-b border-cyan-500/10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,rgba(34,211,238,0.12),transparent_55%)]" />
                <div className="relative mx-auto grid max-w-[1900px] gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.65fr)] md:px-10 md:py-14">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/90">
                            SEO Ops · organique
                        </div>
                        <h1 className="mt-5 text-[clamp(1.85rem,3.6vw,2.65rem)] font-semibold leading-tight tracking-[-0.05em] text-white">
                            Console · site
                        </h1>
                        <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/48">
                            Feuille de route inversée : on commence par la mesure et les connecteurs, puis les agrégats, puis le long format requêtes/pages — pour {client?.client_name || 'ce mandat'}.
                        </p>
                    </div>
                    <div className="flex flex-col justify-end gap-3 rounded-[28px] border border-white/[0.08] bg-black/40 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Actions transverses</div>
                        <div className="flex flex-wrap gap-2">
                            <SeoActionLink href={`${baseHref}/seo/health`} variant="secondary">Santé SEO</SeoActionLink>
                            <SeoActionLink href={`${baseHref}/seo/on-page`} variant="primary">On-page</SeoActionLink>
                        </div>
                        <p className="text-[11px] leading-relaxed text-white/38">
                            Search Console = vérité ; GA4 = recoupement fréquentation. Pas d’invention hors connecteurs.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1900px] space-y-10 px-4 py-10 md:px-10">
            <nav className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 border-b border-white/[0.06] bg-[#07080a]/90 py-3 backdrop-blur-md px-1">
                {[
                    { id: 'mesure', label: 'Mesure' },
                    { id: 'kpi', label: 'KPI' },
                    { id: 'requetes', label: 'Requêtes' },
                    { id: 'pages', label: 'Pages' },
                ].map((nav) => (
                    <a
                        key={nav.id}
                        href={`#seo-vis-${nav.id}`}
                        className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/55 transition-colors hover:border-sky-400/25 hover:text-white"
                    >
                        {nav.label}
                    </a>
                ))}
            </nav>

            <div id="seo-vis-mesure" className="scroll-mt-28">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Contexte de mesure
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <SeoPanel title="Fraîcheur et sources" subtitle="État des connecteurs et fraîcheur réellement observée." reliability="measured" tone="info">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <SourceCard source={data?.freshness?.gsc || { label: 'Search Console', status: 'unavailable' }} />
                        <SourceCard source={data?.freshness?.ga4 || { label: 'GA4', status: 'unavailable' }} />
                    </div>
                </SeoPanel>

                <SeoPanel title="Tendance 28 jours" subtitle="Comparaison du dernier bloc de 28 jours avec le bloc précédent." reliability="calculated" tone="default">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Clics</div>
                            <div className="mt-2 text-base font-semibold text-white/92 lg:text-lg">{formatSignedPercent(data?.comparison?.clicksDeltaPercent)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Impressions</div>
                            <div className="mt-2 text-base font-semibold text-white/92 lg:text-lg">{formatSignedPercent(data?.comparison?.impressionsDeltaPercent)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">CTR</div>
                            <div className="mt-2 text-base font-semibold text-white/92 lg:text-lg">{formatSignedPercent(data?.comparison?.ctrDeltaPercent)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Position</div>
                            <div className="mt-2 text-base font-semibold text-white/92 lg:text-lg">{formatSignedPosition(data?.comparison?.positionDelta)}</div>
                        </div>
                    </div>
                </SeoPanel>
            </div>

            {isEmpty ? (
                <SeoEmptyState
                    title={data?.emptyState?.title || 'Visibilité SEO indisponible'}
                    description={data?.emptyState?.description || 'Aucune donnée organique proprement exploitable n’a été trouvée pour cette surface.'}
                    action={<SeoActionLink href={`${baseHref}/dossier/connectors`}>Voir les connecteurs</SeoActionLink>}
                />
            ) : (
                <>
                    <div id="seo-vis-kpi" className="scroll-mt-28 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        KPI organiques
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
                        <div className="lg:col-span-6">
                            <SeoStatCard
                                label="Clics organiques"
                                value={formatNumber(data.summary.clicks)}
                                detail={formatSignedPercent(data.comparison.clicksDeltaPercent)}
                                reliability="calculated"
                                accent="emerald"
                                trend={{ points: data.trends.gsc, valueKey: 'clicks', color: 'emerald' }}
                            />
                        </div>
                        <div className="lg:col-span-6">
                            <SeoStatCard
                                label="Impressions"
                                value={formatNumber(data.summary.impressions)}
                                detail={formatSignedPercent(data.comparison.impressionsDeltaPercent)}
                                reliability="calculated"
                                accent="sky"
                                trend={{ points: data.trends.gsc, valueKey: 'impressions', color: 'sky' }}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <SeoStatCard
                                label="CTR moyen"
                                value={formatPercent(data.summary.ctr)}
                                detail={formatSignedPercent(data.comparison.ctrDeltaPercent)}
                                reliability="calculated"
                                accent="amber"
                                trend={{ points: data.trends.gsc, valueKey: 'ctr', color: 'amber' }}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <SeoStatCard
                                label="Position moyenne"
                                value={formatPosition(data.summary.position)}
                                detail={formatSignedPosition(data.comparison.positionDelta)}
                                reliability="calculated"
                                accent="slate"
                                trend={{ points: data.trends.gsc, valueKey: 'position', color: 'slate' }}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <SeoStatCard
                                label="Requêtes utiles"
                                value={formatNumber(data.summary.queryCount)}
                                detail="Requêtes distinctes observées sur la fenêtre courante"
                                reliability="calculated"
                                accent="emerald"
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <SeoStatCard
                                label="Pages visibles"
                                value={formatNumber(data.summary.pageCount)}
                                detail="Pages distinctes observées via Search Console"
                                reliability="calculated"
                                accent="sky"
                            />
                        </div>
                    </div>

                    <div id="seo-vis-requetes" className="scroll-mt-28 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Requêtes et segmentation
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <SeoPanel title="Requêtes en tête" subtitle="Top requêtes agrégées sur la fenêtre Search Console actuelle." reliability="calculated" tone="default">
                            {data.topQueries.length === 0 ? (
                                <SeoEmptyState title="Aucune requête exploitable" description="Les données Search Console ne contiennent pas encore de requêtes propres à afficher sur cette période." />
                            ) : (
                                <>
                                    <PositionHeatmap rows={data.topQueries} />
                                    <div className="space-y-3">
                                        {data.topQueries.map((row) => (
                                            <QueryRow key={row.query} row={row} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </SeoPanel>

                        <SeoPanel title="Marque vs hors marque" subtitle="Segmentation uniquement lorsqu’un signal marque est suffisamment discriminant." reliability={data.brandSplit?.reliability || 'unavailable'} tone={data.brandSplit?.status === 'available' ? 'success' : 'default'}>
                            {data.brandSplit?.status === 'available' ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                                        <div className="text-sm font-semibold text-white/92">Requêtes marque</div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <MetricChip label="Clics" value={formatNumber(data.brandSplit.brand.clicks)} />
                                            <MetricChip label="Impressions" value={formatNumber(data.brandSplit.brand.impressions)} />
                                            <MetricChip label="Requêtes" value={formatNumber(data.brandSplit.brand.queryCount)} />
                                            <MetricChip label="Part clics" value={formatPercent(data.brandSplit.clickShare, 0)} />
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                                        <div className="text-sm font-semibold text-white/92">Requêtes hors marque</div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
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

                    <div id="seo-vis-pages" className="scroll-mt-28 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Pages et recoupements
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
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
        </div>
    );
}