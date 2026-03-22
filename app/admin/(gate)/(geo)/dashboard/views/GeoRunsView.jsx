'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';
import { ADMIN_GEO_LABELS, parseStatusLabelFr, runStatusLabelFr } from '@/lib/i18n/admin-fr';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function statusPillClass(status) {
    if (status === 'completed') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'running') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    if (status === 'pending') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    if (status === 'failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
    return 'border-white/10 bg-white/[0.03] text-white/50';
}

function parsePillClass(status) {
    if (status === 'parsed_success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'parsed_partial') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    if (status === 'parsed_failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
    return 'border-white/10 bg-white/[0.03] text-white/50';
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
    return json;
}

function safeJson(value) {
    if (value == null) return '{}';
    if (typeof value === 'string') {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return '{}';
    }
}

function confidenceLabel(value) {
    if (value == null || Number.isNaN(Number(value))) return '-';
    return `${Math.round(Number(value) * 100)}%`;
}

function translateDiagnostic(code) {
    if (!code) return null;
    const map = {
        'non_grounded_lane': 'Aucune donnée web (modèle non connecté ou pas de liens retournés)',
        'no_source_détectéd': 'Aucune source web détectée',
        'parser_low_confidence': 'Confiance du parseur trop basse',
        'no_competitor_détectéd': 'Aucun concurrent fiable détecté',
        'web_unavailable': "Accès web indisponible",
    };
    return map[code] || code;
}

export default function GeoRunsView() {
    const searchParams = useSearchParams();
    const promptFilterId = searchParams.get('prompt') || null;
    const { clientId, client, refreshToken, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('runs');
    const [selectedRunId, setSelectedRunId] = useState(null);
    const [runDetail, setRunDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [runActionPending, setRunActionPending] = useState(null);
    const [runActionMessage, setRunActionMessage] = useState(null);
    const [runActionError, setRunActionError] = useState(null);

    const statusCounts = data?.summary?.statusCounts || { pending: 0, running: 0, completed: 0, failed: 0 };
    const parseCounts = data?.summary?.parseCounts || { parsed_success: 0, parsed_partial: 0, parsed_failed: 0 };
    const history = data?.history || [];
    const latestPerPrompt = data?.latestPerPrompt || [];
    const topProvidersModels = data?.summary?.topProvidersModels || [];

    const filteredLatestPerPrompt = useMemo(() => {
        if (!promptFilterId) return latestPerPrompt;
        return latestPerPrompt.filter((item) => item.id === promptFilterId);
    }, [latestPerPrompt, promptFilterId]);

    const filteredHistory = useMemo(() => {
        if (!promptFilterId) return history;
        return history.filter((run) => run.tracked_query_id === promptFilterId);
    }, [history, promptFilterId]);

    const historyRows = useMemo(() => filteredHistory.slice(0, 40), [filteredHistory]);
    const promptFilterLabel = useMemo(() => {
        if (!promptFilterId) return null;
        return latestPerPrompt.find((item) => item.id === promptFilterId)?.query_text || null;
    }, [latestPerPrompt, promptFilterId]);

    const latestSelectableRunId = historyRows[0]?.id || null;

    useEffect(() => {
        setSelectedRunId((current) => {
            if (!latestSelectableRunId) return null;
            if (!current) return latestSelectableRunId;
            return historyRows.some((run) => run.id === current) ? current : latestSelectableRunId;
        });
    }, [historyRows, latestSelectableRunId]);

    useEffect(() => {
        if (!clientId || !selectedRunId) {
            setRunDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }

        const controller = new AbortController();
        const loadRunDetail = async () => {
            setDetailLoading(true);
            setDetailError(null);
            try {
                const response = await fetch(`/api/admin/geo/client/${clientId}/runs/${selectedRunId}?refresh=${refreshToken}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const json = await parseJsonResponse(response);
                setRunDetail(json);
            } catch (loadError) {
                if (loadError.name === 'AbortError') return;
                setDetailError(loadError.message);
            } finally {
                if (!controller.signal.aborted) setDetailLoading(false);
            }
        };

        loadRunDetail();
        return () => controller.abort();
    }, [clientId, refreshToken, selectedRunId]);

    async function triggerRunAction(action) {
        if (!clientId || !selectedRunId) return;
        setRunActionPending(action);
        setRunActionError(null);
        setRunActionMessage(null);
        try {
            const response = await fetch(`/api/admin/geo/client/${clientId}/runs/${selectedRunId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            await parseJsonResponse(response);
            setRunActionMessage(action === 'rerun' ? 'Exécution relancée avec succès.' : 'Reparse exécuté avec succès.');
            invalidateWorkspace();

            if (action === 'reparse') {
                const detailResponse = await fetch(`/api/admin/geo/client/${clientId}/runs/${selectedRunId}?refresh=${Date.now()}`, {
                    cache: 'no-store',
                });
                const detailJson = await parseJsonResponse(detailResponse);
                setRunDetail(detailJson);
            }
        } catch (actionError) {
            setRunActionError(actionError.message);
        } finally {
            setRunActionPending(null);
        }
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
                <GeoEmptyPanel title="Exécutions indisponibles" description="Les observations d'exécutions n'ont pas pu etre chargees." />
            </div>
        );
    }

    const noRunsYet = filteredHistory.length === 0;
    const runsBaseHref = `/admin/dashboard/${clientId}?view=runs`;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title={ADMIN_GEO_LABELS.nav.runHistory}
                subtitle={`Observations stockées pour ${client?.client_name || 'ce client'}. Chaque exécution'est inspectable avec prompt exact, brut complet, parse et extractions.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                        {promptFilterId ? (
                            <Link href={runsBaseHref} className="geo-btn geo-btn-ghost">
                                Tous les prompts
                            </Link>
                        ) : null}
                    </div>
                )}
            />

            {promptFilterId ? (
                <GeoPremiumCard className="p-4">
                    <div className="text-sm font-semibold text-white/90">Filtre prompt actif</div>
                    <div className="text-[12px] text-white/45 mt-1">
                        {promptFilterLabel || 'Prompt suivi'} - affichage limite aux exécutions de ce prompt.
                    </div>
                </GeoPremiumCard>
            ) : null}

            {runActionMessage ? <div className="text-sm text-emerald-300">{runActionMessage}</div> : null}
            {runActionError ? <div className="text-sm text-red-400">{runActionError}</div> : null}

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Total exécutions" value={promptFilterId ? filteredHistory.length : data.summary.total} hint="Exécutions observées" accent="blue" />
                <GeoKpiCard label="Terminées" value={statusCounts.completed} hint="Statut exécution" accent="emerald" />
                <GeoKpiCard label="En cours" value={statusCounts.running} hint="Statut exécution" accent="violet" />
                <GeoKpiCard label="En attente" value={statusCounts.pending} hint="Statut exécution" accent="amber" />
                <GeoKpiCard label="En échec" value={statusCounts.failed} hint="Statut exécution" accent="amber" />
                <GeoKpiCard label="Parse reussi" value={parseCounts.parsed_success} hint="Statut parse" accent="emerald" />
                <GeoKpiCard label="Parse partiel" value={parseCounts.parsed_partial} hint="Statut parse" accent="amber" />
                <GeoKpiCard label="Parse échec" value={parseCounts.parsed_failed} hint="Statut parse" accent="amber" />
            </div>

            {noRunsYet ? (
                <GeoEmptyPanel
                    title={promptFilterId ? 'Aucune exécution pour ce prompt' : data.emptyState.noRuns.title}
                    description={promptFilterId
                        ? "Lancez ce prompt suivi depuis la vue Prompts suivis pour alimenter l'historique."
                        : data.emptyState.noRuns.description}
                >
                    <Link href={`/admin/dashboard/${clientId}?view=prompts`} className="geo-btn geo-btn-pri">
                        {ADMIN_GEO_LABELS.actions.openPromptWorkspace}
                    </Link>
                </GeoEmptyPanel>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Dernière exécution par prompt</div>
                                    <div className="text-[11px] text-white/35">Vue rapide avant inspection détaillée.</div>
                                </div>
                                <GeoProvenancePill meta={data.provenance.summary} />
                            </div>
                            <div className="divide-y divide-white/[0.06]">
                                {filteredLatestPerPrompt.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedRunId(item.latest_run?.id || null)}
                                        className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white/90 truncate">{item.query_text}</div>
                                                <div className="text-[11px] text-white/35 mt-1">
                                                    {item.category} - {item.locale} - {item.is_active ? 'actif' : 'inactif'}
                                                </div>
                                            </div>
                                            {item.latest_run ? (
                                                <div className="text-[11px] text-white/45 shrink-0">
                                                    {item.latest_run.provider} - {item.latest_run.model} - {item.latest_run.target_found ? 'cible détectée' : 'cible absente'}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-white/35 shrink-0">Aucune exécution</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </GeoPremiumCard>

                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Principaux providers/modèles</div>
                                    <p className="text-[11px] text-white/35">Volume d'exécutions terminées uniquement.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.summary} />
                            </div>

                            <div className="space-y-2">
                                {topProvidersModels.length ? (
                                    topProvidersModels.map((item) => (
                                        <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-sm font-semibold text-white/90">{item.label}</div>
                                            <div className="text-[11px] text-white/45 mt-1">{item.count} exécutions terminées</div>
                                        </div>
                                    ))
                                ) : (
                                    <GeoEmptyPanel title="Aucun provider" description="Le volume provider/modèle apparaitra apres les premieres exécutions." />
                                )}
                            </div>
                        </GeoPremiumCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Historique des exécutions</div>
                                    <div className="text-[11px] text-white/35">Selectionnez une exécution pour ouvrir l'inspecteur complet.</div>
                                </div>
                                <GeoProvenancePill meta={data.provenance.observation} />
                            </div>
                            <div className="divide-y divide-white/[0.06] max-h-[760px] overflow-y-auto">
                                {historyRows.map((run) => (
                                    <button
                                        key={run.id}
                                        type="button"
                                        onClick={() => setSelectedRunId(run.id)}
                                        className={`w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors ${selectedRunId === run.id ? 'bg-white/[0.03]' : ''}`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white/90 truncate">{run.query_text}</div>
                                                <div className="text-[11px] text-white/35 mt-1">
                                                    {run.category} - {run.provider} - {run.model}
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-white/45 shrink-0">
                                                {runStatusLabelFr(run.status)} - {formatDateTime(run.created_at)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[11px] text-white/45">
                                            <div>Cible: {run.target_found ? `détectée${run.target_position ? ` (#${run.target_position})` : ''}` : 'absente'}</div>
                                            <div>Total mentions: {run.total_mentioned}</div>
                                            <div>Sources: {run.mention_counts.sources}</div>
                                            <div>Concurrents: {run.mention_counts.competitors + run.mention_counts.non_target}</div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                                            <span className={`inline-flex rounded-full border px-2 py-1 font-semibold uppercase tracking-[0.06em] ${statusPillClass(run.status)}`}>
                                                {runStatusLabelFr(run.status)}
                                            </span>
                                            <span className={`inline-flex rounded-full border px-2 py-1 font-semibold uppercase tracking-[0.06em] ${parsePillClass(run.parse_status)}`}>
                                                {parseStatusLabelFr(run.parse_status)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </GeoPremiumCard>

                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Inspecteur d'exécution</div>
                                    <p className="text-[11px] text-white/35">Prompt exact, réponse brute, parse, citations, concurrents et diagnostics.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.observation} />
                            </div>

                            {detailLoading ? (
                                <div className="text-sm text-white/45">Chargement du détail...</div>
                            ) : detailError ? (
                                <div className="text-sm text-red-400">{detailError}</div>
                            ) : !runDetail?.run ? (
                                <GeoEmptyPanel title="Aucune exécution selectionnee" description="Selectionnez une exécution dans l'historique." />
                            ) : (
                                <div className="space-y-4 max-h-[980px] overflow-y-auto pr-1">
                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                        <div className="text-sm font-semibold text-white/90">{runDetail.run.query_text}</div>
                                        <div className="text-[11px] text-white/45 mt-1">
                                            {runDetail.run.provider} - {runDetail.run.model} - {runStatusLabelFr(runDetail.run.status)}
                                        </div>
                                        <div className="text-[11px] text-white/45 mt-1">{formatDateTime(runDetail.run.created_at)}</div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-pri"
                                            disabled={Boolean(runActionPending)}
                                            onClick={() => triggerRunAction('rerun')}
                                        >
                                            {runActionPending === 'rerun' ? 'Relance...' : ADMIN_GEO_LABELS.actions.rerun}
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(runActionPending)}
                                            onClick={() => triggerRunAction('reparse')}
                                        >
                                            {runActionPending === 'reparse' ? 'Reparse...' : ADMIN_GEO_LABELS.actions.reparse}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Cible</div>
                                            <div className="text-sm font-semibold text-white mt-2">
                                                {runDetail.run.target_found ? `Detectee${runDetail.run.target_position ? ` en #${runDetail.run.target_position}` : ''}` : 'Non détectée'}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Confiance parse</div>
                                            <div className="text-sm font-semibold text-white mt-2">{confidenceLabel(runDetail.run.parse_confidence)}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Statut parse</div>
                                            <div className="text-sm font-semibold text-white mt-2">{parseStatusLabelFr(runDetail.run.parse_status)}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Latence</div>
                                            <div className="text-sm font-semibold text-white mt-2">{runDetail.run.latency_ms != null ? `${runDetail.run.latency_ms} ms` : '-'}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[11px] text-white/55 space-y-1">
                                        <div>Mode exécution: {runDetail.run.run_mode || 'standard'}</div>
                                        <div>Variante moteur: {runDetail.run.engine_variant_label || runDetail.run.engine_variant || '-'}</div>
                                        <div>Modèle exact: {runDetail.run.model || '-'}</div>
                                        <div>Internet / Web-enabled: {runDetail.run.web_enabled ? 'Oui (Connecte)' : 'Non (Non-grounded)'}</div>
                                        <div>Locale: {runDetail.run.locale || '-'}</div>
                                        <div>Version extraction: {runDetail.run.extraction_version || '-'}</div>
                                        <div>Classe erreur: {runDetail.run.error_class || '-'}</div>
                                        <div>Nombre de retries: {runDetail.run.retry_count ?? 0}</div>
                                    </div>

                                    {runDetail.diagnostics && (runDetail.diagnostics.zero_citation_reason || runDetail.diagnostics.zero_competitor_reason) ? (
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[11px] text-white/55 space-y-2">
                                            {runDetail.diagnostics.zero_citation_reason && (
                                                <div><span className="font-semibold text-white/70">Source/Citation:</span> {translateDiagnostic(runDetail.diagnostics.zero_citation_reason)}</div>
                                            )}
                                            {runDetail.diagnostics.zero_competitor_reason && (
                                                <div><span className="font-semibold text-white/70">Concurrents:</span> {translateDiagnostic(runDetail.diagnostics.zero_competitor_reason)}</div>
                                            )}
                                        </div>
                                    ) : null}

                                    {Array.isArray(runDetail.run.parse_warnings) && runDetail.run.parse_warnings.length > 0 ? (
                                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                                            <div className="text-[11px] font-semibold text-amber-200">Avertissements de parse</div>
                                            <ul className="mt-2 space-y-1 text-[11px] text-amber-100/80">
                                                {runDetail.run.parse_warnings.map((warning, index) => (
                                                    <li key={`${warning}-${index}`}>- {warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}

                                    <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
                                        <div className="text-[11px] font-semibold text-white/85 mb-2">Prompt exact envoye</div>
                                        <pre className="text-[11px] text-white/65 whitespace-pre-wrap break-words">{safeJson(runDetail.run.prompt_payload)}</pre>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
                                        <div className="text-[11px] font-semibold text-white/85 mb-2">Réponse brute complète</div>
                                        <pre className="text-[11px] text-white/65 whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto">{runDetail.run.raw_response_full || '-'}</pre>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
                                        <div className="text-[11px] font-semibold text-white/85 mb-2">Réponse normalisée</div>
                                        <pre className="text-[11px] text-white/65 whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto">{safeJson(runDetail.run.normalized_response)}</pre>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
                                        <div className="text-[11px] font-semibold text-white/85 mb-2">Réponse parsée</div>
                                        <pre className="text-[11px] text-white/65 whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto">{safeJson(runDetail.run.parsed_response)}</pre>
                                    </div>

                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                        <div className="text-[11px] font-semibold text-white/85 mb-2">Citations extraites ({runDetail.citations?.length || 0})</div>
                                        {runDetail.citations?.length ? (
                                            <div className="space-y-2">
                                                {runDetail.citations.map((item, index) => (
                                                    <div key={`${item.host}-${index}`} className="rounded-lg border border-white/[0.08] p-2 text-[11px] text-white/65">
                                                        <div className="font-semibold text-white/85">{item.host || '-'}</div>
                                                        <div>Type: {item.source_type || '-'}</div>
                                                        <div>Niveau: {item.mention_kind || '-'}</div>
                                                        <div>Verification: {item.vérifiéd_status || '-'}</div>
                                                        <div>Confiance: {confidenceLabel(item.confidence)}</div>
                                                        {item.evidence_span ? <div className="mt-1 text-white/55">Preuve: {item.evidence_span}</div> : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-white/45">{translateDiagnostic(runDetail.diagnostics?.zero_citation_reason) || 'Aucune citation extraite.'}</div>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                        <div className="text-[11px] font-semibold text-white/85 mb-2">Concurrents extraits ({runDetail.competitors?.length || 0})</div>
                                        {runDetail.competitors?.length ? (
                                            <div className="space-y-2">
                                                {runDetail.competitors.map((item, index) => (
                                                    <div key={`${item.name}-${index}`} className="rounded-lg border border-white/[0.08] p-2 text-[11px] text-white/65">
                                                        <div className="font-semibold text-white/85">{item.name || '-'}</div>
                                                        <div>Niveau: {item.mention_kind || '-'}</div>
                                                        <div>Force recommandation: {item.recommendation_strength || '-'}</div>
                                                        <div>Premiere position: {item.first_position ?? '-'}</div>
                                                        <div>Co-occurence cible: {item.co_occurs_with_target ? 'oui' : 'non'}</div>
                                                        <div>Confiance: {confidenceLabel(item.confidence)}</div>
                                                        {item.evidence_span ? <div className="mt-1 text-white/55">Preuve: {item.evidence_span}</div> : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-white/45">{translateDiagnostic(runDetail.diagnostics?.zero_competitor_reason) || 'Aucun concurrent extrait.'}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </GeoPremiumCard>
                    </div>
                </>
            )}
        </div>
    );
}



