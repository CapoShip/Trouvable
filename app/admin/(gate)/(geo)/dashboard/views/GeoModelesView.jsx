'use client';

import { useMemo, useState } from 'react';

import { CumulativeModelVisibilityChart } from '../components/GeoRealCharts';
import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoModelAvatar, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';
import { ADMIN_GEO_LABELS } from '@/lib/i18n/admin-fr';

const CARD_COLORS = [
    'from-emerald-500/20 to-transparent',
    'from-sky-500/20 to-transparent',
    'from-orange-500/20 to-transparent',
    'from-cyan-500/20 to-transparent',
    'from-violet-500/20 to-transparent',
];

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
    return json;
}

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function parseStatusPillClass(status) {
    if (status === 'parsed_success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'parsed_partial') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    if (status === 'parsed_failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
    return 'border-white/10 bg-white/[0.03] text-white/50';
}

export default function GeoModelesView() {
    const { clientId, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('models');
    const [benchmarkRunning, setBenchmarkRunning] = useState(false);
    const [benchmarkNotice, setBenchmarkNotice] = useState(null);
    const [benchmarkError, setBenchmarkError] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState(null);

    const variantsCatalog = data?.benchmark?.variantsCatalog || [];
    const selected = useMemo(() => {
        const defaults = variantsCatalog.map((item) => item.id);
        if (!selectedVariants) return defaults;
        const safe = selectedVariants.filter((id) => defaults.includes(id));
        return safe.length > 0 ? safe : defaults;
    }, [variantsCatalog, selectedVariants]);

    async function runBenchmark() {
        if (!clientId || benchmarkRunning) return;
        setBenchmarkRunning(true);
        setBenchmarkError(null);
        setBenchmarkNotice(null);
        try {
            const response = await fetch('/api/admin/queries/benchmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    variants: selected,
                }),
            });
            const json = await parseJsonResponse(response);
            setBenchmarkNotice(`Benchmark lance. Session: ${json.benchmarkSessionId}`);
            invalidateWorkspace();
        } catch (runError) {
            setBenchmarkError(runError.message);
        } finally {
            setBenchmarkRunning(false);
        }
    }

    function toggleVariant(id) {
        setSelectedVariants((current) => {
            const base = Array.isArray(current) ? current : variantsCatalog.map((item) => item.id);
            if (base.includes(id)) {
                const next = base.filter((item) => item !== id);
                return next.length > 0 ? next : base;
            }
            return [...base, id];
        });
    }

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Modeles indisponibles" description="La couche provider/modele n a pas pu etre chargee." />
            </div>
        );
    }

    const noRuns = data.summary.totalRuns === 0;
    const benchmarkSessions = data.benchmark?.sessions || [];

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Modeles IA"
                subtitle="Comparaison des providers et modeles reellement utilises dans les executions completes."
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observed} />
                        <GeoProvenancePill meta={data.provenance.derived} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Executions terminees" value={data.summary.totalRuns} hint="Runs observes termines" accent="blue" />
                <GeoKpiCard label="Providers" value={data.summary.totalProviders} hint="Derive de l historique runs" accent="violet" />
                <GeoKpiCard label="Meilleur taux modele" value={data.modelPerformance[0] ? `${data.modelPerformance[0].targetRatePercent}%` : null} hint="Derive des runs termines" accent="emerald" />
                <GeoKpiCard label="Provider principal" value={data.providerCounts[0]?.provider || null} hint="Provider le plus actif" accent="amber" />
            </div>

            {!noRuns ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {data.modelPerformance.slice(0, 5).map((row, index) => (
                            <GeoPremiumCard
                                key={`${row.provider}-${row.model}-${index}`}
                                className={`p-5 bg-gradient-to-b ${CARD_COLORS[index % CARD_COLORS.length]} geo-premium-glow-violet`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <GeoModelAvatar label={row.provider} color="bg-white/10" />
                                    <GeoProvenancePill meta={data.provenance.derived} className="shrink-0" />
                                </div>
                                <div className="text-[10px] text-white/40 uppercase font-bold">{row.provider}</div>
                                <div className="text-sm font-semibold text-white/95 truncate mb-3">{row.model}</div>
                                <div className="text-3xl font-bold text-emerald-400/95 mb-1">{row.targetRatePercent}%</div>
                                <div className="text-[10px] text-white/35">Taux cible detectee</div>
                                <div className="mt-3 h-px bg-white/10" />
                                <div className="mt-2 text-[10px] text-white/40">
                                    {row.runs} runs - {row.sources} sources
                                </div>
                            </GeoPremiumCard>
                        ))}
                    </div>

                    <CumulativeModelVisibilityChart
                        recentQueryRuns={data.recentQueryRuns}
                        title="Tendance observee par modele"
                        subtitle="Detection cible cumulÃ©e par jour sur les modeles reellement utilises."
                    />

                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Volume providers</div>
                                <p className="text-[11px] text-white/35">Nombre d executions terminees par provider.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.derived} />
                        </div>
                        <div className="space-y-3">
                            {data.providerCounts.map((item) => (
                                <GeoBarRow
                                    key={item.provider}
                                    label={item.provider}
                                    value={item.count}
                                    max={Math.max(...data.providerCounts.map((row) => row.count), 1)}
                                    color="bg-slate-500/70"
                                />
                            ))}
                        </div>
                    </GeoPremiumCard>
                </>
            ) : (
                <GeoEmptyPanel title={data.emptyState.title} description={data.emptyState.description} />
            )}

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                        <div className="text-sm font-semibold text-white/95">{ADMIN_GEO_LABELS.sections.benchmarkTitle}</div>
                        <p className="text-[11px] text-white/35">{ADMIN_GEO_LABELS.sections.benchmarkDisclaimer}</p>
                    </div>
                    <GeoProvenancePill meta={data.provenance.inferred} />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {variantsCatalog.map((variant) => {
                        const active = selected.includes(variant.id);
                        return (
                            <button
                                key={variant.id}
                                type="button"
                                onClick={() => toggleVariant(variant.id)}
                                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${active ? 'border-violet-400/40 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white/80'}`}
                            >
                                {variant.id}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" className="geo-btn geo-btn-pri" disabled={benchmarkRunning} onClick={runBenchmark}>
                        {benchmarkRunning ? 'Benchmark en cours...' : ADMIN_GEO_LABELS.actions.runBenchmark}
                    </button>
                </div>
                {benchmarkNotice ? <div className="text-sm text-emerald-300 mt-3">{benchmarkNotice}</div> : null}
                {benchmarkError ? <div className="text-sm text-red-400 mt-3">{benchmarkError}</div> : null}
            </GeoPremiumCard>

            <GeoPremiumCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                    <div className="text-sm font-semibold text-white/95">Sessions benchmark récentes</div>
                    <div className="text-[11px] text-white/35">Comparaison variantes: provider/modèle, parse, latence, cible, citations et concurrents.</div>
                    <div className="text-[10px] text-amber-500/80 mt-1">Note : Les exécutions de ce mode bac à sable n'affectent pas l'historique officiel des citations ni des concurrents.</div>
                </div>
                {benchmarkSessions.length === 0 ? (
                    <div className="p-5">
                        <GeoEmptyPanel title="Aucune session benchmark" description="Lancez un benchmark sandbox pour comparer les variantes disponibles." />
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        {benchmarkSessions.map((session) => (
                            <div key={session.id} className="px-5 py-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-white/90">Session {session.id.slice(0, 8)}</div>
                                    <div className="text-[11px] text-white/45">{session.status} - {formatDateTime(session.created_at)}</div>
                                </div>
                                <div className="text-[11px] text-white/45">Variantes: {(session.variants || []).join(', ') || '-'}</div>
                                <div className="space-y-2">
                                    {(session.rows || []).map((row) => (
                                        <div key={row.run_id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="text-[12px] font-semibold text-white/90">
                                                    {row.engine_variant}
                                                    {row.attempts > 1 && <span className="ml-2 text-[10px] text-white/40">({row.attempts} tentatives)</span>}
                                                </div>
                                                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${parseStatusPillClass(row.parse_status)}`}>
                                                    {row.parse_status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[11px] text-white/50">
                                                <div>{row.provider} / {row.model}</div>
                                                <div>Cible: {row.target_found ? `oui${row.target_position != null ? ` (#${row.target_position})` : ''}` : 'non'}</div>
                                                <div>Sources: {row.citations}</div>
                                                <div>Concurrents: {row.competitors}</div>
                                                <div>Latence: {row.latency_ms != null ? `${row.latency_ms} ms` : '-'}</div>
                                                <div>Confiance parse: {row.parse_confidence != null ? `${Math.round(row.parse_confidence * 100)}%` : '-'}</div>
                                                <div>Cout estime: {row.cost_estimate_usd != null ? `$${row.cost_estimate_usd}` : '-'}</div>
                                                <div>Erreur: {row.error_class || '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GeoPremiumCard>
        </div>
    );
}


