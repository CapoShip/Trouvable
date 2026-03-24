'use client';

import { useMemo, useState } from 'react';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoSectionTitle } from '../components/GeoPremium';
import { buildComparisonViewModel } from '@/lib/llm-comparison/geo-insights';

const DEFAULT_FORM = {
    source_type: 'text',
    prompt: '',
    url: '',
    text: '',
    provider_timeout_ms: 30000,
    client_id: '',
};

function statusClass(result) {
    if (!result.ok) return 'geo-status-crit';
    if (result.geo?.signal_tier === 'useful') return 'geo-status-ok';
    if (result.geo?.signal_tier === 'weak') return 'geo-status-warn';
    return 'geo-status-idle';
}

function scoreAccent(score) {
    if (score >= 45) return 'emerald';
    if (score >= 30) return 'blue';
    if (score >= 15) return 'amber';
    return 'red';
}

function normalizeClientContext(clientPayload) {
    const client = clientPayload?.client || null;
    const businessDetails = client?.business_details || {};
    return {
        targetName: client?.client_name || '',
        targetDomain: client?.website_url || '',
        competitors: Array.isArray(businessDetails?.competitors) ? businessDetails.competitors : [],
    };
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error?.message || json?.error || `Erreur ${response.status}`);
    return json;
}

export default function GeoCompareView() {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [clients, setClients] = useState([]);
    const [clientContext, setClientContext] = useState(null);
    const [loadingClients, setLoadingClients] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const viewModel = useMemo(() => {
        if (!result) return null;
        return buildComparisonViewModel(result, clientContext || {});
    }, [result, clientContext]);

    async function loadClientsIfNeeded() {
        if (clients.length > 0 || loadingClients) return;
        setLoadingClients(true);
        try {
            const response = await fetch('/api/admin/geo/clients', { cache: 'no-store' });
            const json = await parseJsonResponse(response);
            setClients(Array.isArray(json.clients) ? json.clients : []);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoadingClients(false);
        }
    }

    async function handleClientSelect(clientId) {
        setForm((current) => ({ ...current, client_id: clientId }));
        if (!clientId) {
            setClientContext(null);
            return;
        }
        try {
            const response = await fetch(`/api/admin/geo/client/${clientId}`, { cache: 'no-store' });
            const json = await parseJsonResponse(response);
            const context = normalizeClientContext(json);
            setClientContext(context);
            setForm((current) => ({
                ...current,
                prompt: current.prompt || `Analyse GEO de la visibilité de ${context.targetName}`,
            }));
        } catch (loadError) {
            setError(loadError.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        setRunning(true);
        setResult(null);
        try {
            const payload = {
                source_type: form.source_type,
                prompt: form.prompt.trim(),
                provider_timeout_ms: Number(form.provider_timeout_ms) || 30000,
                ...(form.source_type === 'url'
                    ? { url: form.url.trim() }
                    : { text: form.text.trim() }),
            };

            const response = await fetch('/api/admin/llm-compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await parseJsonResponse(response);
            setResult(json);
        } catch (runError) {
            setError(runError.message);
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1650px] mx-auto">
            <GeoSectionTitle
                title="GEO Compare"
                subtitle="Calibrez vos prompts GEO en comparant Gemini, Groq et Mistral avec lecture opérateur (citations, concurrents, marque, exploitabilité)."
            />

            <GeoPremiumCard className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button type="button" className={`geo-btn ${form.source_type === 'text' ? 'geo-btn-pri' : 'geo-btn-ghost'} justify-center`} onClick={() => setForm((current) => ({ ...current, source_type: 'text' }))}>
                            Source texte
                        </button>
                        <button type="button" className={`geo-btn ${form.source_type === 'url' ? 'geo-btn-pri' : 'geo-btn-ghost'} justify-center`} onClick={() => setForm((current) => ({ ...current, source_type: 'url' }))}>
                            Source URL
                        </button>
                        <input
                            className="geo-inp"
                            type="number"
                            min={5000}
                            max={120000}
                            step={1000}
                            value={form.provider_timeout_ms}
                            onChange={(event) => setForm((current) => ({ ...current, provider_timeout_ms: event.target.value }))}
                            placeholder="Timeout provider (ms)"
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                        <textarea
                            className="geo-inp min-h-[100px]"
                            placeholder="Prompt GEO: ex. Quels acteurs sont recommandés à Montréal et avec quelles preuves/citations ?"
                            value={form.prompt}
                            onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
                            required
                        />
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                            <div className="text-[11px] font-semibold text-white/70">Contexte client (optionnel)</div>
                            <button type="button" className="geo-btn geo-btn-ghost w-full justify-center" onClick={loadClientsIfNeeded}>
                                {loadingClients ? 'Chargement clients...' : 'Charger les clients'}
                            </button>
                            <select
                                className="geo-inp"
                                value={form.client_id}
                                onChange={(event) => handleClientSelect(event.target.value)}
                            >
                                <option value="">Aucun client sélectionné</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.client_name}
                                    </option>
                                ))}
                            </select>
                            {clientContext && (
                                <div className="text-[10px] text-white/45 leading-relaxed">
                                    Cible: <span className="text-white/75">{clientContext.targetName || '-'}</span><br />
                                    Domaine: <span className="text-white/75">{clientContext.targetDomain || '-'}</span><br />
                                    Concurrents connus: <span className="text-white/75">{clientContext.competitors?.length || 0}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {form.source_type === 'url' ? (
                        <input
                            className="geo-inp"
                            placeholder="https://..."
                            value={form.url}
                            onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                            required
                        />
                    ) : (
                        <textarea
                            className="geo-inp min-h-[140px]"
                            placeholder="Collez le texte source à analyser..."
                            value={form.text}
                            onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                            required
                        />
                    )}

                    <div className="flex items-center gap-3">
                        <button type="submit" className="geo-btn geo-btn-pri" disabled={running}>
                            {running ? 'Comparaison en cours...' : 'Lancer GEO Compare'}
                        </button>
                        <div className="text-[11px] text-white/35">Execution parallèle providers avec gestion de succès partiel.</div>
                    </div>
                </form>
                {error && <div className="mt-3 text-[12px] text-red-300">{error}</div>}
            </GeoPremiumCard>

            {!viewModel ? (
                <GeoEmptyPanel title="Aucune comparaison" description="Lancez une comparaison pour visualiser les signaux GEO par provider." />
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <GeoKpiCard label="Providers OK" value={viewModel.summary.successful_count} />
                        <GeoKpiCard label="Providers en erreur" value={viewModel.summary.error_count} accent={viewModel.summary.error_count > 0 ? 'amber' : 'emerald'} />
                        <GeoKpiCard label="Meilleur score" value={viewModel.summary.best_overall_provider || '-'} accent="blue" />
                        <GeoKpiCard label="Mentions marque" value={viewModel.summary.providers_with_brand_mention.length} accent="violet" />
                    </div>

                    {(viewModel.has_partial_error || viewModel.has_full_error) && (
                        <GeoPremiumCard className="p-3 border border-amber-400/25 bg-amber-400/[0.05]">
                            <div className="text-[12px] text-amber-200">
                                {viewModel.has_partial_error
                                    ? 'Succès partiel: au moins un provider a échoué mais la comparaison reste exploitable.'
                                    : 'Aucun provider exploitable: vérifiez clés API, timeouts et connectivité.'}
                            </div>
                        </GeoPremiumCard>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        {viewModel.results.map((provider) => (
                            <GeoPremiumCard key={provider.provider} className="p-0 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/[0.06] bg-black/25">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[13px] font-semibold text-white/85">{provider.provider}</div>
                                        <span className={statusClass(provider)}>
                                            {provider.ok ? provider.geo.signal_tier : 'error'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-1">{provider.model || '-'}</div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
                                            <div className="text-white/35">Latence</div>
                                            <div className="text-white/80 font-semibold">{provider.latency_ms}ms</div>
                                        </div>
                                        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
                                            <div className="text-white/35">Score GEO</div>
                                            <div className={`font-semibold ${scoreAccent(provider.geo?.score) === 'emerald' ? 'text-emerald-300' : scoreAccent(provider.geo?.score) === 'blue' ? 'text-sky-300' : scoreAccent(provider.geo?.score) === 'amber' ? 'text-amber-300' : 'text-red-300'}`}>
                                                {provider.geo?.score ?? 0}
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
                                            <div className="text-white/35">Citations</div>
                                            <div className="text-white/80 font-semibold">{provider.geo?.citations_count ?? 0}</div>
                                        </div>
                                        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
                                            <div className="text-white/35">Concurrents</div>
                                            <div className="text-white/80 font-semibold">{provider.geo?.competitors_count ?? 0}</div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-white/40">
                                        Marque détectée: <span className={provider.geo?.has_brand_mention ? 'text-emerald-300' : 'text-white/60'}>{provider.geo?.has_brand_mention ? 'oui' : 'non'}</span>
                                    </div>

                                    {provider.error ? (
                                        <div className="rounded-md border border-red-400/25 bg-red-400/[0.06] p-2 text-[10px] text-red-200">
                                            {provider.error.class}: {provider.error.message}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="rounded-md border border-white/[0.08] bg-black/20 p-2">
                                                <div className="text-[10px] font-semibold text-white/60 mb-1">Réponse brute</div>
                                                <pre className="text-[10px] text-white/65 whitespace-pre-wrap max-h-[200px] overflow-y-auto">{provider.content || '-'}</pre>
                                            </div>
                                            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
                                                <div className="text-[10px] font-semibold text-white/60 mb-1">Citations détectées</div>
                                                {provider.geo?.citations?.length ? (
                                                    <div className="space-y-1">
                                                        {provider.geo.citations.slice(0, 6).map((citation) => (
                                                            <div key={citation.url} className="text-[10px] text-white/60 truncate">
                                                                {citation.host} · {citation.source_type}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-white/35">Aucune citation exploitable</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </GeoPremiumCard>
                        ))}
                    </div>

                    <GeoPremiumCard className="p-4">
                        <div className="text-[13px] font-semibold text-white/85 mb-2">Synthèse comparative</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 text-[11px]">
                            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">Plus de citations: <span className="text-white/80">{viewModel.summary.most_citations_provider || '-'}</span></div>
                            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">Plus de concurrents: <span className="text-white/80">{viewModel.summary.most_competitors_provider || '-'}</span></div>
                            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">Meilleur exploitable: <span className="text-white/80">{viewModel.summary.best_overall_provider || '-'}</span></div>
                            <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-2">Marque mentionnée: <span className="text-white/80">{viewModel.summary.providers_with_brand_mention.join(', ') || 'aucun'}</span></div>
                        </div>
                        {viewModel.hints.length > 0 && (
                            <ul className="mt-3 space-y-1 text-[11px] text-white/60">
                                {viewModel.hints.map((hint) => <li key={hint}>- {hint}</li>)}
                            </ul>
                        )}
                    </GeoPremiumCard>
                </>
            )}
        </div>
    );
}
