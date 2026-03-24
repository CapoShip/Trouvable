'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
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
    const map = {
        completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        running: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
        pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        failed: 'border-red-400/20 bg-red-400/10 text-red-300',
    };
    return map[status] || 'border-white/10 bg-white/[0.03] text-white/50';
}

function parsePillClass(status) {
    const map = {
        parsed_success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        parsed_partial: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        parsed_failed: 'border-red-400/20 bg-red-400/10 text-red-300',
    };
    return map[status] || 'border-white/10 bg-white/[0.03] text-white/50';
}

function isProblematic(run) {
    return run.status === 'failed' || run.parse_status === 'parsed_failed' || run.parse_status === 'parsed_partial';
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
    return json;
}

function safeJson(value) {
    if (value == null) return '{}';
    if (typeof value === 'string') {
        try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
    }
    try { return JSON.stringify(value, null, 2); } catch { return '{}'; }
}

function confidenceLabel(value) {
    if (value == null || Number.isNaN(Number(value))) return '-';
    return `${Math.round(Number(value) * 100)}%`;
}

function confidenceColor(value) {
    if (value == null) return 'text-white/40';
    const pct = Math.round(Number(value) * 100);
    if (pct >= 80) return 'text-emerald-300';
    if (pct >= 50) return 'text-amber-300';
    return 'text-red-300';
}

function translateDiagnostic(code) {
    if (!code) return null;
    const map = {
        'non_grounded_lane': 'Modèle non connecté / pas de liens',
        'no_source_détectéd': 'Aucune source web détectée',
        'parser_low_confidence': 'Confiance parseur trop basse',
        'no_competitor_détectéd': 'Aucun concurrent détecté',
        'web_unavailable': 'Accès web indisponible',
    };
    return map[code] || code;
}

const STATUS_FILTERS = [
    { id: 'all', label: 'Tous' },
    { id: 'failed', label: 'Échecs' },
    { id: 'completed', label: 'Terminés' },
    { id: 'running', label: 'En cours' },
    { id: 'problematic', label: 'Problématiques' },
];

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
    const [statusFilter, setStatusFilter] = useState('all');

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
        let runs = history;
        if (promptFilterId) runs = runs.filter((run) => run.tracked_query_id === promptFilterId);
        if (statusFilter === 'failed') runs = runs.filter((run) => run.status === 'failed');
        else if (statusFilter === 'completed') runs = runs.filter((run) => run.status === 'completed');
        else if (statusFilter === 'running') runs = runs.filter((run) => run.status === 'running');
        else if (statusFilter === 'problematic') runs = runs.filter(isProblematic);
        return runs;
    }, [history, promptFilterId, statusFilter]);

    const historyRows = useMemo(() => filteredHistory.slice(0, 50), [filteredHistory]);
    const promptFilterLabel = useMemo(() => {
        if (!promptFilterId) return null;
        return latestPerPrompt.find((item) => item.id === promptFilterId)?.query_text || null;
    }, [latestPerPrompt, promptFilterId]);

    const problematicCount = useMemo(() => history.filter(isProblematic).length, [history]);

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
            setRunActionMessage(action === 'rerun' ? 'Exécution relancée.' : 'Reparse effectué.');
            invalidateWorkspace();

            if (action === 'reparse') {
                const detailResponse = await fetch(`/api/admin/geo/client/${clientId}/runs/${selectedRunId}?refresh=${Date.now()}`, { cache: 'no-store' });
                const detailJson = await parseJsonResponse(detailResponse);
                setRunDetail(detailJson);
            }
        } catch (actionError) {
            setRunActionError(actionError.message);
        } finally {
            setRunActionPending(null);
        }
    }

    if (loading) return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement des exécutions...</div>;
    if (error) return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Exécutions indisponibles" description="Les observations d'exécutions n'ont pas pu être chargées." />
        </div>
    );

    const noRunsYet = history.length === 0;
    const runsBaseHref = `/admin/clients/${clientId}/runs`;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title={ADMIN_GEO_LABELS.nav.runHistory}
                subtitle={`Supervision des exécutions pour ${client?.client_name || 'ce client'}.`}
                action={(
                    <div className="flex flex-wrap gap-2 items-center">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        {promptFilterId && (
                            <Link href={runsBaseHref} className="geo-btn geo-btn-ghost">Tous les prompts</Link>
                        )}
                    </div>
                )}
            />

            {/* Problematic runs alert */}
            {problematicCount > 0 && statusFilter !== 'problematic' && (
                <button
                    type="button"
                    onClick={() => setStatusFilter('problematic')}
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 text-left hover:bg-red-500/[0.08] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[11px] font-semibold text-red-300">{problematicCount} exécution{problematicCount > 1 ? 's' : ''} problématique{problematicCount > 1 ? 's' : ''}</span>
                        <span className="text-[10px] text-red-300/50 ml-auto">Cliquer pour filtrer →</span>
                    </div>
                </button>
            )}

            {promptFilterId && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] text-white/60">
                    Filtre actif : <span className="font-semibold text-white/80">{promptFilterLabel || 'Prompt'}</span>
                </div>
            )}

            {runActionMessage && <div className="text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">{runActionMessage}</div>}
            {runActionError && <div className="text-[11px] text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{runActionError}</div>}

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Total" value={promptFilterId ? filteredHistory.length : data.summary.total} hint="Exécutions observées" accent="blue" />
                <GeoKpiCard label="Terminées" value={statusCounts.completed} accent="emerald" />
                <GeoKpiCard label="En cours" value={statusCounts.running} accent="violet" />
                <GeoKpiCard label="En attente" value={statusCounts.pending} accent="amber" />
                <GeoKpiCard label="Échecs" value={statusCounts.failed} accent={statusCounts.failed > 0 ? 'amber' : 'default'} />
                <GeoKpiCard label="Parse OK" value={parseCounts.parsed_success} accent="emerald" />
                <GeoKpiCard label="Parse partiel" value={parseCounts.parsed_partial} accent="amber" />
                <GeoKpiCard label="Parse échec" value={parseCounts.parsed_failed} accent={parseCounts.parsed_failed > 0 ? 'amber' : 'default'} />
            </div>

            {noRunsYet ? (
                <GeoEmptyPanel
                    title={data.emptyState.noRuns.title}
                    description={data.emptyState.noRuns.description}
                >
                    <Link href={`/admin/clients/${clientId}/prompts`} className="geo-btn geo-btn-pri">
                        {ADMIN_GEO_LABELS.actions.openPromptWorkspace}
                    </Link>
                </GeoEmptyPanel>
            ) : (
                <>
                    {/* Latest per prompt — compact */}
                    <GeoPremiumCard className="p-0 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20 flex items-center justify-between gap-3">
                            <div className="text-[12px] font-semibold text-white/80">Dernier run par prompt</div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>
                        <div className="divide-y divide-white/[0.04] max-h-[240px] overflow-y-auto">
                            {filteredLatestPerPrompt.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => item.latest_run?.id && setSelectedRunId(item.latest_run.id)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.02] transition-colors flex items-center gap-3"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.latest_run?.target_found ? 'bg-emerald-400' : item.latest_run ? 'bg-amber-400' : 'bg-white/20'}`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-medium text-white/80 truncate">{item.query_text}</div>
                                    </div>
                                    <div className="text-[10px] text-white/35 shrink-0">
                                        {item.latest_run ? `${item.latest_run.provider} · ${item.latest_run.model}` : 'Aucun run'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </GeoPremiumCard>

                    {/* Status filter + History + Inspector */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="text-[12px] font-semibold text-white/80">Historique</div>
                                    <div className="text-[10px] text-white/30">{filteredHistory.length} résultat{filteredHistory.length > 1 ? 's' : ''}</div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {STATUS_FILTERS.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setStatusFilter(f.id)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                                                statusFilter === f.id
                                                    ? 'bg-white/[0.08] text-white border border-white/15'
                                                    : 'text-white/35 hover:text-white/60 border border-transparent'
                                            }`}
                                        >
                                            {f.label}
                                            {f.id === 'failed' && statusCounts.failed > 0 && (
                                                <span className="ml-1 text-red-300">{statusCounts.failed}</span>
                                            )}
                                            {f.id === 'problematic' && problematicCount > 0 && (
                                                <span className="ml-1 text-amber-300">{problematicCount}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="divide-y divide-white/[0.04] max-h-[680px] overflow-y-auto">
                                {historyRows.length === 0 && (
                                    <div className="p-5 text-center text-[11px] text-white/30">Aucune exécution pour ce filtre.</div>
                                )}
                                {historyRows.map((run) => {
                                    const problem = isProblematic(run);
                                    return (
                                        <button
                                            key={run.id}
                                            type="button"
                                            onClick={() => setSelectedRunId(run.id)}
                                            className={`w-full text-left px-4 py-3 hover:bg-white/[0.02] transition-colors ${
                                                selectedRunId === run.id ? 'bg-white/[0.04] border-l-2 border-[#5b73ff]' : ''
                                            } ${problem ? 'border-l-2 border-red-400/40' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[12px] font-medium text-white/85 truncate">{run.query_text}</div>
                                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/40">
                                                        <span>{run.provider} · {run.model}</span>
                                                        <span className="text-white/15">|</span>
                                                        <span>{formatDateTime(run.created_at)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${statusPillClass(run.status)}`}>
                                                        {runStatusLabelFr(run.status)}
                                                    </span>
                                                    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${parsePillClass(run.parse_status)}`}>
                                                        {parseStatusLabelFr(run.parse_status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-white/35">
                                                <span className={run.target_found ? 'text-emerald-300/70' : 'text-white/30'}>
                                                    Cible: {run.target_found ? `✓${run.target_position ? ` #${run.target_position}` : ''}` : '✗'}
                                                </span>
                                                <span>Mentions: {run.total_mentioned}</span>
                                                <span>Sources: {run.mention_counts.sources}</span>
                                                <span>Concurrents: {run.mention_counts.competitors + run.mention_counts.non_target}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </GeoPremiumCard>

                        {/* Inspector panel */}
                        <GeoPremiumCard className="p-0 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
                                <div className="text-[12px] font-semibold text-white/80">Inspecteur</div>
                                <div className="text-[10px] text-white/30">Prompt, parse, diagnostics</div>
                            </div>

                            <div className="p-4">
                                {detailLoading ? (
                                    <div className="text-[11px] text-white/40 animate-pulse">Chargement...</div>
                                ) : detailError ? (
                                    <div className="text-[11px] text-red-400">{detailError}</div>
                                ) : !runDetail?.run ? (
                                    <GeoEmptyPanel title="Aucune sélection" description="Sélectionnez un run dans l'historique." />
                                ) : (
                                    <div className="space-y-3 max-h-[900px] overflow-y-auto pr-1">
                                        {/* Run header */}
                                        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[12px] font-semibold text-white/90">{runDetail.run.query_text}</div>
                                            <div className="text-[10px] text-white/40 mt-1">
                                                {runDetail.run.provider} · {runDetail.run.model} · {runStatusLabelFr(runDetail.run.status)} · {formatDateTime(runDetail.run.created_at)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button type="button" className="geo-btn geo-btn-pri flex-1 justify-center" disabled={Boolean(runActionPending)} onClick={() => triggerRunAction('rerun')}>
                                                {runActionPending === 'rerun' ? 'Relance...' : ADMIN_GEO_LABELS.actions.rerun}
                                            </button>
                                            <button type="button" className="geo-btn geo-btn-ghost flex-1 justify-center" disabled={Boolean(runActionPending)} onClick={() => triggerRunAction('reparse')}>
                                                {runActionPending === 'reparse' ? 'Reparse...' : ADMIN_GEO_LABELS.actions.reparse}
                                            </button>
                                        </div>

                                        {/* Key metrics */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Cible</div>
                                                <div className={`text-[13px] font-bold mt-1 ${runDetail.run.target_found ? 'text-emerald-300' : 'text-white/50'}`}>
                                                    {runDetail.run.target_found ? `Détectée${runDetail.run.target_position ? ` #${runDetail.run.target_position}` : ''}` : 'Non détectée'}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Confiance parse</div>
                                                <div className={`text-[13px] font-bold mt-1 ${confidenceColor(runDetail.run.parse_confidence)}`}>
                                                    {confidenceLabel(runDetail.run.parse_confidence)}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Parse</div>
                                                <div className="text-[13px] font-bold text-white mt-1">{parseStatusLabelFr(runDetail.run.parse_status)}</div>
                                            </div>
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Latence</div>
                                                <div className="text-[13px] font-bold text-white mt-1">{runDetail.run.latency_ms != null ? `${runDetail.run.latency_ms}ms` : '-'}</div>
                                            </div>
                                        </div>

                                        {/* Engine details */}
                                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-[10px] text-white/45 grid grid-cols-2 gap-y-1 gap-x-3">
                                            <div>Mode: {runDetail.run.run_mode || 'standard'}</div>
                                            <div>Web: {runDetail.run.web_enabled ? 'Connecté' : 'Non-grounded'}</div>
                                            <div>Variante: {runDetail.run.engine_variant_label || runDetail.run.engine_variant || '-'}</div>
                                            <div>Locale: {runDetail.run.locale || '-'}</div>
                                            <div>Extraction: v{runDetail.run.extraction_version || '-'}</div>
                                            <div>Retries: {runDetail.run.retry_count ?? 0}</div>
                                            {runDetail.run.error_class && <div className="col-span-2 text-red-300/70">Erreur: {runDetail.run.error_class}</div>}
                                        </div>

                                        {/* Diagnostics */}
                                        {runDetail.diagnostics && (runDetail.diagnostics.zero_citation_reason || runDetail.diagnostics.zero_competitor_reason) && (
                                            <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.04] p-2.5 text-[10px] space-y-1">
                                                {runDetail.diagnostics.zero_citation_reason && (
                                                    <div className="text-amber-200/70"><span className="font-semibold">Sources:</span> {translateDiagnostic(runDetail.diagnostics.zero_citation_reason)}</div>
                                                )}
                                                {runDetail.diagnostics.zero_competitor_reason && (
                                                    <div className="text-amber-200/70"><span className="font-semibold">Concurrents:</span> {translateDiagnostic(runDetail.diagnostics.zero_competitor_reason)}</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Parse warnings */}
                                        {Array.isArray(runDetail.run.parse_warnings) && runDetail.run.parse_warnings.length > 0 && (
                                            <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.04] p-2.5">
                                                <div className="text-[10px] font-semibold text-amber-200 mb-1">Avertissements parse ({runDetail.run.parse_warnings.length})</div>
                                                <ul className="space-y-0.5 text-[10px] text-amber-100/70">
                                                    {runDetail.run.parse_warnings.map((warning, index) => (
                                                        <li key={`${warning}-${index}`}>· {warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Raw data sections — collapsible */}
                                        <RunDataSection title="Prompt envoyé" content={safeJson(runDetail.run.prompt_payload)} />
                                        <RunDataSection title="Réponse brute" content={runDetail.run.raw_response_full || '-'} maxH="max-h-[180px]" />
                                        <RunDataSection title="Réponse normalisée" content={safeJson(runDetail.run.normalized_response)} maxH="max-h-[180px]" />
                                        <RunDataSection title="Réponse parsée" content={safeJson(runDetail.run.parsed_response)} maxH="max-h-[180px]" />

                                        {/* Extracted citations */}
                                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                            <div className="text-[10px] font-semibold text-white/70 mb-2">Citations ({runDetail.citations?.length || 0})</div>
                                            {runDetail.citations?.length ? (
                                                <div className="space-y-1.5">
                                                    {runDetail.citations.map((item, index) => (
                                                        <div key={`${item.host}-${index}`} className="rounded-md border border-white/[0.06] p-2 text-[10px] text-white/55">
                                                            <div className="font-semibold text-white/75">{item.host || '-'}</div>
                                                            <div className="flex gap-2 mt-0.5 text-[9px]">
                                                                <span>{item.source_type || '-'}</span>
                                                                <span>·</span>
                                                                <span>Confiance: {confidenceLabel(item.confidence)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-white/30">{translateDiagnostic(runDetail.diagnostics?.zero_citation_reason) || 'Aucune.'}</div>
                                            )}
                                        </div>

                                        {/* Extracted competitors */}
                                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                            <div className="text-[10px] font-semibold text-white/70 mb-2">Concurrents ({runDetail.competitors?.length || 0})</div>
                                            {runDetail.competitors?.length ? (
                                                <div className="space-y-1.5">
                                                    {runDetail.competitors.map((item, index) => (
                                                        <div key={`${item.name}-${index}`} className="rounded-md border border-white/[0.06] p-2 text-[10px] text-white/55">
                                                            <div className="font-semibold text-white/75">{item.name || '-'}</div>
                                                            <div className="flex gap-2 mt-0.5 text-[9px]">
                                                                <span>Force: {item.recommendation_strength || '-'}</span>
                                                                <span>·</span>
                                                                <span>Co-cible: {item.co_occurs_with_target ? 'oui' : 'non'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-white/30">{translateDiagnostic(runDetail.diagnostics?.zero_competitor_reason) || 'Aucun.'}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GeoPremiumCard>
                    </div>

                    {/* Providers summary */}
                    {topProvidersModels.length > 0 && (
                        <GeoPremiumCard className="p-4">
                            <div className="text-[12px] font-semibold text-white/80 mb-3">Providers / modèles — volume exécutions</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {topProvidersModels.map((item) => (
                                    <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                                        <div className="text-[18px] font-bold text-white/80">{item.count}</div>
                                        <div className="text-[10px] text-white/35 mt-0.5 truncate">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </GeoPremiumCard>
                    )}
                </>
            )}
        </div>
    );
}

function RunDataSection({ title, content, maxH = 'max-h-[160px]' }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
            <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-2.5 py-2 text-[10px] font-semibold text-white/60 hover:text-white/80 transition-colors">
                {title}
                <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
            </button>
            {open && (
                <pre className={`text-[10px] text-white/50 whitespace-pre-wrap break-words px-2.5 pb-2.5 ${maxH} overflow-y-auto`}>{content}</pre>
            )}
        </div>
    );
}
