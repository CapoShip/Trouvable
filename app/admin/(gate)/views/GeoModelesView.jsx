'use client';

import { useMemo, useState } from 'react';

import { CumulativeModelVisibilityChart } from '../components/GeoRealCharts';
import { GeoEmptyPanel, GeoKpiCard, GeoModelAvatar, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
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

export default function GeoModèlesView() {
    const { clientId, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('models');
    const [benchmarkRunning, setBenchmarkRunning] = useState(false);
    const [benchmarkNotice, setBenchmarkNotice] = useState(null);
    const [benchmarkError, setBenchmarkError] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState(null);

    const variantsCatalog = data?.benchmark?.variantsCatalog || [];

    // Merge observed modelPerformance with all known engine variants + benchmark results
    const allModels = useMemo(() => {
        const observed = data?.modelPerformance || [];
        const variants = data?.benchmark?.variantsCatalog || [];
        const sessions = data?.benchmark?.sessions || [];

        // Index observed (production) data by provider+model
        const observedMap = new Map();
        for (const row of observed) {
            observedMap.set(`${row.provider}|||${row.model}`, row);
        }

        // Aggregate benchmark session results by provider+model
        const benchmarkMap = new Map();
        for (const session of sessions) {
            for (const row of session.rows || []) {
                const key = `${row.provider}|||${row.model}`;
                if (!benchmarkMap.has(key)) {
                    benchmarkMap.set(key, { runs: 0, targetFound: 0, sources: 0 });
                }
                const agg = benchmarkMap.get(key);
                agg.runs += row.attempts || 1;
                if (row.target_found) agg.targetFound += 1;
                agg.sources += row.citations || 0;
            }
        }

        const merged = [];
        const seen = new Set();

        // Add all known variants, enriched with observed + benchmark data
        for (const variant of variants) {
            const key = `${variant.provider}|||${variant.model}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const obs = observedMap.get(key);
            const bench = benchmarkMap.get(key);
            const totalRuns = (obs?.runs ?? 0) + (bench?.runs ?? 0);
            const totalTargetFound = (obs?.targetFound ?? 0) + (bench?.targetFound ?? 0);
            const totalSources = (obs?.sources ?? 0) + (bench?.sources ?? 0);

            merged.push({
                provider: variant.provider,
                model: variant.model,
                label: variant.label,
                runs: totalRuns,
                targetFound: totalTargetFound,
                targetRatePercent: totalRuns > 0 ? Math.round((totalTargetFound / totalRuns) * 100) : 0,
                sources: totalSources,
                hasData: !!(obs || bench),
                productionRuns: obs?.runs ?? 0,
                benchmarkRuns: bench?.runs ?? 0,
            });
        }

        // Add any observed models not in the variants catalog
        for (const row of observed) {
            const key = `${row.provider}|||${row.model}`;
            if (!seen.has(key)) {
                seen.add(key);
                const bench = benchmarkMap.get(key);
                const totalRuns = row.runs + (bench?.runs ?? 0);
                const totalTargetFound = row.targetFound + (bench?.targetFound ?? 0);
                merged.push({
                    ...row,
                    label: null,
                    runs: totalRuns,
                    targetFound: totalTargetFound,
                    targetRatePercent: totalRuns > 0 ? Math.round((totalTargetFound / totalRuns) * 100) : row.targetRatePercent,
                    sources: row.sources + (bench?.sources ?? 0),
                    hasData: true,
                    productionRuns: row.runs,
                    benchmarkRuns: bench?.runs ?? 0,
                });
            }
        }

        // Sort: models with data first (by runs desc), then untested
        return merged.sort((a, b) => {
            if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
            return b.runs - a.runs;
        });
    }, [data?.modelPerformance, data?.benchmark?.variantsCatalog, data?.benchmark?.sessions]);

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
            setBenchmarkNotice(`Test de variantes lancé. Session: ${json.benchmarkSessionId}`);
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
                <GeoEmptyPanel title="Modèles indisponibles" description="La liste des fournisseurs et modèles n'est pas disponible pour le moment." />
            </div>
        );
    }

    const noRuns = data.summary.totalRuns === 0;
    const benchmarkSessions = data.benchmark?.sessions || [];

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Fiabilité IA"
                subtitle="Quel modèle détecte le mieux votre marque — et quelle variante d'exécution est la plus fiable ?"
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observéd} />
                        <GeoProvenancePill meta={data.provenance.dérivéd} />
                    </div>
                )}
            />

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[11px] text-white/45 leading-relaxed">
                    Cette page concentre deux vues : la <strong className="text-white/65">performance observée par modèle</strong> sur vos runs réels, et le <strong className="text-white/65">test de variantes internes</strong> pour comparer vos moteurs d'exécution.
                    Pour l'historique complet des exécutions → <strong className="text-white/55">Exécution</strong>. Pour comparer un même prompt entre providers → <strong className="text-white/55">GEO Compare</strong>.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <GeoKpiCard label="Meilleur taux modèle" value={allModels[0]?.hasData ? `${allModels[0].targetRatePercent}%` : null} hint="Combiné production + benchmark" accent="emerald" />
                <GeoKpiCard label="Modèle le plus fiable" value={allModels[0]?.hasData ? `${allModels[0].provider} / ${allModels[0].label || allModels[0].model}` : null} hint="Meilleur taux de détection cible" accent="violet" />
                <GeoKpiCard label="Modèles testés" value={`${allModels.filter(m => m.hasData).length} / ${allModels.length}`} hint="Modèles avec données / total connu" accent="blue" />
            </div>

            <GeoSectionTitle
                title="Performance observée"
                subtitle="Classement des modèles par taux de détection — inclut les exécutions de production et les tests de variantes."
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {allModels.map((row, index) => (
                    <GeoPremiumCard
                        key={`${row.provider}-${row.model}-${index}`}
                        className={`p-5 bg-gradient-to-b ${row.hasData ? CARD_COLORS[index % CARD_COLORS.length] : 'from-white/[0.03] to-transparent'} ${row.hasData ? 'geo-premium-glow-violet' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <GeoModelAvatar label={row.provider} color={row.hasData ? 'bg-white/10' : 'bg-white/5'} />
                            {row.hasData ? (
                                <GeoProvenancePill meta={data.provenance.dérivéd} className="shrink-0" />
                            ) : (
                                <span className="text-[9px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">Non testé</span>
                            )}
                        </div>
                        <div className="text-[10px] text-white/40 uppercase font-bold">{row.provider}</div>
                        <div className="text-sm font-semibold text-white/95 truncate mb-3">{row.label || row.model}</div>
                        {row.hasData ? (
                            <>
                                <div className="text-3xl font-bold text-emerald-400/95 mb-1">{row.targetRatePercent}%</div>
                                <div className="text-[10px] text-white/35">Taux cible détectée</div>
                                <div className="mt-3 h-px bg-white/10" />
                                <div className="mt-2 text-[10px] text-white/40">
                                    {row.runs} runs · {row.sources} sources
                                    {row.productionRuns > 0 && row.benchmarkRuns > 0 && (
                                        <span className="block text-white/25 mt-0.5">{row.productionRuns} prod · {row.benchmarkRuns} bench</span>
                                    )}
                                    {row.productionRuns === 0 && row.benchmarkRuns > 0 && (
                                        <span className="block text-amber-400/40 mt-0.5">benchmark uniquement</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-white/15 mb-1">—</div>
                                <div className="text-[10px] text-white/25">Aucune exécution</div>
                                <div className="mt-3 h-px bg-white/5" />
                                <div className="mt-2 text-[10px] text-white/20">
                                    Lancez un test de variantes pour observer ce modèle
                                </div>
                            </>
                        )}
                    </GeoPremiumCard>
                ))}
            </div>

            {!noRuns && (
                <CumulativeModelVisibilityChart
                    recentQueryRuns={data.recentQueryRuns}
                    title="Tendance observée par modèle"
                    subtitle="Détection cible cumulée par jour sur les modèles réellement utilisés."
                />
            )}

            <GeoSectionTitle
                title="Test de variantes internes"
                subtitle="Comparez vos moteurs d'exécution (combinaisons prompt + modèle) pour identifier la variante la plus fiable. Ce test interne n'alimente pas l'historique officiel."
            />

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
                        {benchmarkRunning ? 'Test de variantes en cours...' : ADMIN_GEO_LABELS.actions.runBenchmark}
                    </button>
                </div>
                {benchmarkNotice ? <div className="text-sm text-emerald-300 mt-3">{benchmarkNotice}</div> : null}
                {benchmarkError ? <div className="text-sm text-red-400 mt-3">{benchmarkError}</div> : null}
            </GeoPremiumCard>

            <GeoPremiumCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                    <div className="text-sm font-semibold text-white/95">Sessions de variantes récentes</div>
                    <div className="text-[11px] text-white/35">Comparaison interne de variantes: provider, modèle, parse, latence, cible, citations et concurrents.</div>
                    <div className="text-[10px] text-amber-500/80 mt-1">Note : Ces essais internes n'alimentent pas l'historique officiel des citations ni des concurrents.</div>
                </div>
                {benchmarkSessions.length === 0 ? (
                    <div className="p-5">
                        <GeoEmptyPanel title="Aucune session de variantes" description="Lancez un test interne de variantes pour comparer les variantes disponibles." />
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


