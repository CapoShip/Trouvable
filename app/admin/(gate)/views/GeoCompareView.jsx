'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoSectionTitle } from '../components/GeoPremium';
import {
    applyPromptMode,
    applyTrackedPromptSelection,
    buildClientPromptPrefill,
    defaultGeoCompareForm,
} from '@/lib/llm-comparison/geo-compare-form';
import { buildComparisonViewModel } from '@/lib/llm-comparison/geo-insights';

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

export default function GeoCompareView({ linkedClientId = null, linkedClientName = null }) {
    const isClientLinkedMode = Boolean(linkedClientId);
    const [form, setForm] = useState(defaultGeoCompareForm({
        clientLinked: isClientLinkedMode,
    }));
    const [clients, setClients] = useState([]);
    const [clientContext, setClientContext] = useState(null);
    const [trackedPrompts, setTrackedPrompts] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingClientContext, setLoadingClientContext] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const activeClientId = isClientLinkedMode ? linkedClientId : (form.client_id || '');
    const hasTrackedPrompts = trackedPrompts.length > 0;

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

    async function loadClientWorkspace(clientId) {
        if (!clientId) {
            setClientContext(null);
            setTrackedPrompts([]);
            if (!isClientLinkedMode) {
                setForm({
                    ...defaultGeoCompareForm({ clientLinked: false }),
                    client_id: '',
                });
            }
            return;
        }
        setLoadingClientContext(true);
        try {
            const [clientResponse, promptsResponse] = await Promise.all([
                fetch(`/api/admin/geo/client/${clientId}`, { cache: 'no-store' }),
                fetch(`/api/admin/geo/client/${clientId}/prompts`, { cache: 'no-store' }),
            ]);
            const clientJson = await parseJsonResponse(clientResponse);
            const promptsJson = await parseJsonResponse(promptsResponse);
            const context = normalizeClientContext(clientJson);
            const prompts = Array.isArray(promptsJson?.prompts)
                ? promptsJson.prompts.filter((item) => item?.is_active !== false)
                : [];
            setClientContext(context);
            setTrackedPrompts(prompts);
            const prefillPrompt = buildClientPromptPrefill({
                clientName: context.targetName || linkedClientName || '',
                domain: context.targetDomain,
                competitors: context.competitors || [],
                trackedPromptText: prompts[0]?.query_text || '',
            });
            setForm((current) => ({
                ...defaultGeoCompareForm({
                    clientLinked: true,
                    defaultUrl: context.targetDomain || '',
                }),
                client_id: clientId,
                prompt_mode: prompts.length > 0 ? 'tracked' : 'free',
                tracked_query_id: prompts[0]?.id || '',
                prompt: prefillPrompt,
                source_type: 'url',
                url: context.targetDomain || '',
                text: current.text || '',
            }));
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoadingClientContext(false);
        }
    }

    async function handleClientSelect(clientId) {
        setForm((current) => ({ ...current, client_id: clientId }));
        await loadClientWorkspace(clientId);
    }

    useEffect(() => {
        if (linkedClientId) {
            loadClientWorkspace(linkedClientId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linkedClientId]);

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

    function selectTrackedPrompt(promptId) {
        const selected = trackedPrompts.find((item) => item.id === promptId);
        setForm((current) => applyTrackedPromptSelection(current, selected));
    }

    function handlePromptModeSwitch(mode) {
        setForm((current) => {
            const next = applyPromptMode(current, mode);
            if (mode === 'tracked' && hasTrackedPrompts) {
                const selected = trackedPrompts.find((item) => item.id === (next.tracked_query_id || trackedPrompts[0]?.id));
                return applyTrackedPromptSelection(next, selected || trackedPrompts[0]);
            }
            return next;
        });
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1650px] mx-auto">
            <GeoSectionTitle
                title="GEO Compare"
                subtitle={isClientLinkedMode
                    ? 'Mode client: calibration GEO contextualisée (prompts suivis, domaine, concurrents).'
                    : 'Mode global: comparaison libre des providers pour qualification rapide de prompts.'}
            />

            <GeoPremiumCard className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                            <div className="text-[11px] font-semibold text-white/70">Contexte opérateur</div>
                            {!isClientLinkedMode && (
                                <>
                                    <button type="button" className="geo-btn geo-btn-ghost w-full justify-center" onClick={loadClientsIfNeeded}>
                                        {loadingClients ? 'Chargement clients...' : 'Charger les clients'}
                                    </button>
                                    <select className="geo-inp" value={form.client_id || ''} onChange={(event) => handleClientSelect(event.target.value)}>
                                        <option value="">Mode global libre</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.client_name}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}
                            <div className="text-[10px] text-white/45 leading-relaxed">
                                Mode: <span className="text-white/75">{activeClientId ? 'Client lié' : 'Global libre'}</span><br />
                                Client: <span className="text-white/75">{clientContext?.targetName || linkedClientName || 'aucun'}</span><br />
                                Domaine: <span className="text-white/75">{clientContext?.targetDomain || '-'}</span><br />
                                Concurrents connus: <span className="text-white/75">{clientContext?.competitors?.length || 0}</span><br />
                                Prompts suivis actifs: <span className="text-white/75">{trackedPrompts.length}</span>
                            </div>
                            {loadingClientContext && <div className="text-[10px] text-white/35">Chargement contexte client...</div>}
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                            <div className="text-[11px] font-semibold text-white/70">Lancement</div>
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
                            <button type="submit" className="geo-btn geo-btn-pri w-full justify-center" disabled={running}>
                                {running ? 'Comparaison en cours...' : 'Lancer GEO Compare'}
                            </button>
                            <div className="text-[10px] text-white/40">
                                Objectif: comparer la robustesse du prompt actif (marque, citations, concurrents) entre providers.
                            </div>
                            {activeClientId && (
                                <div className="flex items-center gap-2">
                                    {!isClientLinkedMode && (
                                        <>
                                            <Link href={`/admin/clients/${activeClientId}/geo-compare`} className="text-[10px] text-[#7b8fff] hover:underline">
                                                Ouvrir en mode client lié
                                            </Link>
                                            <span className="text-white/20">·</span>
                                        </>
                                    )}
                                    <Link href={`/admin/clients/${activeClientId}/prompts`} className="text-[10px] text-[#7b8fff] hover:underline">Prompts client</Link>
                                    <span className="text-white/20">·</span>
                                    <Link href={`/admin/clients/${activeClientId}/runs`} className="text-[10px] text-[#7b8fff] hover:underline">Runs client</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                        <div className="text-[11px] font-semibold text-white/70">Prompt</div>
                        {activeClientId && hasTrackedPrompts && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <button type="button" className={`geo-btn ${form.prompt_mode === 'tracked' ? 'geo-btn-pri' : 'geo-btn-ghost'} justify-center`} onClick={() => handlePromptModeSwitch('tracked')}>
                                    Prompts suivis du client
                                </button>
                                <button type="button" className={`geo-btn ${form.prompt_mode === 'free' ? 'geo-btn-pri' : 'geo-btn-ghost'} justify-center`} onClick={() => handlePromptModeSwitch('free')}>
                                    Prompt libre
                                </button>
                            </div>
                        )}
                        {activeClientId && !hasTrackedPrompts && (
                            <div className="text-[10px] text-amber-200/85 rounded-md border border-amber-400/25 bg-amber-400/[0.06] px-2 py-1.5">
                                Aucun prompt suivi actif pour ce client: utilisez un prompt libre ou créez-en dans Prompts.
                            </div>
                        )}
                        {activeClientId && form.prompt_mode === 'tracked' && hasTrackedPrompts && (
                            <select className="geo-inp" value={form.tracked_query_id || trackedPrompts[0]?.id || ''} onChange={(event) => selectTrackedPrompt(event.target.value)}>
                                {trackedPrompts.map((item) => (
                                    <option key={item.id} value={item.id}>{item.query_text}</option>
                                ))}
                            </select>
                        )}
                        {activeClientId && form.prompt_mode === 'tracked' && hasTrackedPrompts && (
                            <div className="text-[10px] text-white/40">
                                Le prompt suivi sélectionné alimente automatiquement le prompt actif pour la comparaison.
                            </div>
                        )}
                        <textarea
                            className="geo-inp min-h-[100px]"
                            placeholder="Prompt GEO actif"
                            value={form.prompt}
                            onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
                            required
                        />
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                        <div className="text-[11px] font-semibold text-white/70">Source</div>
                        <button type="button" className={`geo-btn ${form.source_type === 'url' ? 'geo-btn-pri' : 'geo-btn-ghost'} justify-center`} onClick={() => setForm((current) => ({ ...current, source_type: 'url' }))}>
                            URL (principal)
                        </button>
                        <input className="geo-inp" placeholder="https://..." value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} required={form.source_type === 'url'} />
                        {activeClientId && (
                            <div className="text-[10px] text-white/35">
                                En mode client, la source normale est l URL du site client ou d une page précise.
                            </div>
                        )}
                        <button
                            type="button"
                            className="geo-btn geo-btn-ghost justify-center"
                            onClick={() => setForm((current) => {
                                const nextOpen = !current.advanced_text_open;
                                return {
                                    ...current,
                                    advanced_text_open: nextOpen,
                                    // Prevent hidden required text source when expert panel is collapsed.
                                    source_type: nextOpen ? current.source_type : 'url',
                                };
                            })}
                        >
                            {form.advanced_text_open ? 'Masquer le mode expert (texte brut)' : 'Afficher le mode expert (texte brut)'}
                        </button>
                        {form.advanced_text_open && (
                            <>
                                <button type="button" className={`geo-btn ${form.source_type === 'text' ? 'geo-btn-pri' : 'geo-btn-ghost'} justify-center`} onClick={() => setForm((current) => ({ ...current, source_type: 'text' }))}>
                                    Utiliser texte brut
                                </button>
                                <div className="text-[10px] text-white/40">
                                    Mode expert: utile pour tester un extrait éditorial non publié ou une variante de contenu.
                                </div>
                                <textarea className="geo-inp min-h-[140px]" placeholder="Collez le texte source à analyser..." value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} required={form.source_type === 'text'} />
                            </>
                        )}
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
