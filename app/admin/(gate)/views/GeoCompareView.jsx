'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { GeoBarRow, GeoEmptyPanel, GeoInlineMetric, GeoKpiCard, GeoPremiumCard } from '../components/GeoPremium';
import {
    applyPromptMode,
    applyTrackedPromptSelection,
    buildClientPromptPrefill,
    defaultGeoCompareForm,
} from '@/lib/llm-comparison/geo-compare-form';
import { buildComparisonViewModel } from '@/lib/llm-comparison/geo-insights';
import { getProviderMeta, normalizeModelLabel, signalTierLabel } from '@/lib/llm-comparison/provider-display';

/* ─── Helpers ─── */

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

function scoreColor(score) {
    const a = scoreAccent(score);
    if (a === 'emerald') return 'text-emerald-300';
    if (a === 'blue') return 'text-sky-300';
    if (a === 'amber') return 'text-amber-300';
    return 'text-red-300';
}

function scoreBarColor(ok, score) {
    if (!ok) return 'bg-red-500/50';
    const a = scoreAccent(score);
    if (a === 'emerald') return 'bg-emerald-500/70';
    if (a === 'blue') return 'bg-sky-500/70';
    if (a === 'amber') return 'bg-amber-500/70';
    return 'bg-red-500/60';
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

function sourceTypeLabel(t) {
    return t === 'review_platform' ? 'Avis'
        : t === 'social' ? 'Social'
        : t === 'directory' ? 'Annuaire'
        : t === 'forum' ? 'Forum'
        : t === 'encyclopedia' ? 'Encyclo.'
        : t === 'government' ? 'Gouv.'
        : t === 'client_own' ? 'Client'
        : t === 'editorial' ? 'Éditorial'
        : t || 'Autre';
}

/* ─── Sub-Components ─── */

function CompareCommandHeader({ isClientLinkedMode, clientContext, linkedClientName, running, onSubmit }) {
    return (
        <div className="relative rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/30 before:to-transparent">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-[-0.02em] text-white/95">GEO Compare</h1>
                    <p className="text-[13px] text-white/40 mt-0.5 max-w-xl">
                        {isClientLinkedMode
                            ? 'Comparaison inter-providers sur prompts suivis et contexte client.'
                            : 'Comparer un prompt sur 4 providers pour valider sa robustesse GEO.'}
                    </p>
                </div>
                <button type="button" className="geo-btn geo-btn-pri shrink-0" disabled={running} onClick={onSubmit}>
                    {running ? 'Comparaison en cours…' : 'Lancer la comparaison'}
                </button>
            </div>
            {clientContext && (
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
                    <span className="text-white/50">Client: <span className="text-white/80">{clientContext.targetName || linkedClientName || 'n.d.'}</span></span>
                    <span className="text-white/50">Domaine: <span className="text-white/80">{clientContext.targetDomain || 'n.d.'}</span></span>
                    <span className="text-white/50">Concurrents: <span className="text-white/80">{clientContext.competitors?.length || 0}</span></span>
                </div>
            )}
        </div>
    );
}

function CompareSetupSurface({
    form, setForm, isClientLinkedMode, activeClientId,
    clients, loadingClients, loadClientsIfNeeded,
    trackedPrompts, hasTrackedPrompts, loadingClientContext,
    handleClientSelect, handlePromptModeSwitch, selectTrackedPrompt,
}) {
    return (
        <GeoPremiumCard className="p-5">
            <div className="space-y-4">
                {/* Row 1: client selector + prompt */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
                    {/* Left: operator context */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25">Contexte</div>
                        {!isClientLinkedMode && (
                            <>
                                <button type="button" className="geo-btn geo-btn-ghost w-full justify-center text-[10px]" onClick={loadClientsIfNeeded}>
                                    {loadingClients ? 'Chargement…' : 'Charger les clients'}
                                </button>
                                <select className="geo-inp text-[12px]" value={form.client_id || ''} onChange={(event) => handleClientSelect(event.target.value)}>
                                    <option value="">Mode global libre</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>{client.client_name}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        {loadingClientContext && <div className="text-[10px] text-white/35">Chargement contexte…</div>}
                        {/* Source selector */}
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mt-2">Source</div>
                            <input
                                className="geo-inp text-[12px]"
                                placeholder="https://…"
                                value={form.url}
                                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value, source_type: 'url' }))}
                                required={form.source_type === 'url'}
                            />
                            <button
                                type="button"
                                className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
                                onClick={() => setForm((current) => {
                                    const nextOpen = !current.advanced_text_open;
                                    return { ...current, advanced_text_open: nextOpen, source_type: nextOpen ? current.source_type : 'url' };
                                })}
                            >
                                {form.advanced_text_open ? 'Masquer le texte brut' : '+ Mode expert (texte brut)'}
                            </button>
                            {form.advanced_text_open && (
                                <>
                                    <button type="button" className={`geo-btn ${form.source_type === 'text' ? 'geo-btn-pri' : 'geo-btn-ghost'} w-full justify-center text-[10px]`} onClick={() => setForm((current) => ({ ...current, source_type: 'text' }))}>
                                        Utiliser texte brut
                                    </button>
                                    <textarea className="geo-inp min-h-[80px] text-[11px]" placeholder="Collez le texte source…" value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} required={form.source_type === 'text'} />
                                </>
                            )}
                        </div>
                        {/* Timeout (demoted) */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/25 shrink-0">Timeout</span>
                            <input
                                className="geo-inp text-[11px] w-24"
                                type="number"
                                min={5000}
                                max={120000}
                                step={1000}
                                value={form.provider_timeout_ms}
                                onChange={(event) => setForm((current) => ({ ...current, provider_timeout_ms: event.target.value }))}
                            />
                            <span className="text-[10px] text-white/20">ms</span>
                        </div>
                    </div>

                    {/* Right: prompt area */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25">Prompt</div>
                            {activeClientId && hasTrackedPrompts && (
                                <div className="flex gap-1">
                                    <button type="button" className={`text-[10px] px-2 py-0.5 rounded ${form.prompt_mode === 'tracked' ? 'bg-white/10 text-white/80' : 'text-white/35 hover:text-white/55'} transition-colors`} onClick={() => handlePromptModeSwitch('tracked')}>
                                        Suivi
                                    </button>
                                    <button type="button" className={`text-[10px] px-2 py-0.5 rounded ${form.prompt_mode === 'free' ? 'bg-white/10 text-white/80' : 'text-white/35 hover:text-white/55'} transition-colors`} onClick={() => handlePromptModeSwitch('free')}>
                                        Libre
                                    </button>
                                </div>
                            )}
                        </div>
                        {activeClientId && !hasTrackedPrompts && (
                            <div className="text-[10px] text-amber-200/85 rounded-md border border-amber-400/25 bg-amber-400/[0.06] px-2 py-1.5">
                                Aucun prompt suivi actif. Utilisez un prompt libre.
                            </div>
                        )}
                        {activeClientId && form.prompt_mode === 'tracked' && hasTrackedPrompts && (
                            <select className="geo-inp text-[12px]" value={form.tracked_query_id || trackedPrompts[0]?.id || ''} onChange={(event) => selectTrackedPrompt(event.target.value)}>
                                {trackedPrompts.map((item) => (
                                    <option key={item.id} value={item.id}>{item.query_text}</option>
                                ))}
                            </select>
                        )}
                        <textarea
                            className="geo-inp min-h-[120px] text-[12px]"
                            placeholder="Prompt GEO actif…"
                            value={form.prompt}
                            onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
                            required
                        />
                    </div>
                </div>

                {/* Quick links */}
                {activeClientId && (
                    <div className="flex items-center gap-3 pt-1 border-t border-white/[0.04]">
                        {!isClientLinkedMode && (
                            <Link href={`/admin/clients/${activeClientId}/geo-compare`} className="text-[10px] text-[#7b8fff] hover:underline">
                                Mode client lié
                            </Link>
                        )}
                        <Link href={`/admin/clients/${activeClientId}/geo/prompts`} className="text-[10px] text-[#7b8fff] hover:underline">Prompts</Link>
                        <Link href={`/admin/clients/${activeClientId}/geo/runs`} className="text-[10px] text-[#7b8fff] hover:underline">Historique</Link>
                    </div>
                )}
            </div>
        </GeoPremiumCard>
    );
}

function VerdictBand({ viewModel }) {
    const { summary, results } = viewModel;
    const bestProvider = results.find((r) => r.provider === summary.best_overall_provider);
    const bestMeta = getProviderMeta(summary.best_overall_provider);
    const maxScore = Math.max(...results.map((r) => r.geo?.score || 0), 1);
    const weakCount = summary.weak_providers?.length || 0;

    return (
        <GeoPremiumCard className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mb-3">Verdict</div>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="text-[13px] text-white/50">Meilleur résultat</div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className={`text-lg font-bold ${bestMeta.accent}`}>
                                {bestMeta.label || 'n.d.'}
                            </span>
                            {bestProvider && (
                                <span className={`text-[13px] font-bold tabular-nums ${scoreColor(bestProvider.geo?.score)}`}>
                                    {bestProvider.geo?.score ?? 0}/75
                                </span>
                            )}
                        </div>
                        {bestProvider && (
                            <div className="text-[11px] text-white/40 mt-0.5">
                                {normalizeModelLabel(bestProvider.model)} · {bestProvider.geo?.citations_count || 0} citations · {bestProvider.geo?.competitors_count || 0} concurrents
                                {bestProvider.geo?.has_brand_mention && <span className="text-emerald-400 ml-1">· marque détectée</span>}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 text-[12px]">
                        <div className="text-center">
                            <div className="text-white/30 text-[10px]">OK</div>
                            <div className="text-emerald-300 font-bold">{summary.successful_count}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-white/30 text-[10px]">Faibles</div>
                            <div className={`font-bold ${weakCount > 0 ? 'text-amber-300' : 'text-white/40'}`}>{weakCount}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-white/30 text-[10px]">Erreurs</div>
                            <div className={`font-bold ${summary.error_count > 0 ? 'text-red-300' : 'text-white/40'}`}>{summary.error_count}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-white/30 text-[10px]">Marque</div>
                            <div className={`font-bold ${summary.providers_with_brand_mention.length > 0 ? 'text-violet-300' : 'text-white/40'}`}>
                                {summary.providers_with_brand_mention.length}/{results.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Score comparison bars */}
            <div className="px-5 py-3 space-y-2">
                {results.map((r) => {
                    const meta = getProviderMeta(r.provider);
                    const barColor = scoreBarColor(r.ok, r.geo?.score);
                    return (
                        <GeoBarRow
                            key={r.provider}
                            label={meta.label}
                            sub={normalizeModelLabel(r.model)}
                            value={r.ok ? (r.geo?.score ?? 0) : 0}
                            max={maxScore}
                            color={barColor}
                        />
                    );
                })}
            </div>
        </GeoPremiumCard>
    );
}

function ProviderResultCard({ provider }) {
    const meta = getProviderMeta(provider.provider);
    const score = provider.geo?.score ?? 0;
    const tier = provider.geo?.signal_tier;

    return (
        <GeoPremiumCard className="p-0 overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/90 border border-white/10 ${meta.color}`}>
                            {meta.initials}
                        </div>
                        <div>
                            <div className="text-[13px] font-semibold text-white/90">{meta.label}</div>
                            <div className="text-[10px] text-white/35">{normalizeModelLabel(provider.model)}</div>
                        </div>
                    </div>
                    <span className={statusClass(provider)}>
                        {provider.ok ? signalTierLabel(tier) : 'Échec'}
                    </span>
                </div>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3 flex-1">
                {provider.error ? (
                    <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-[11px] text-red-200/80">
                        <div className="font-semibold text-red-300 mb-0.5">{provider.error.class || 'Erreur'}</div>
                        {provider.error.message}
                    </div>
                ) : (
                    <>
                        {/* Key metrics */}
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] divide-y divide-white/[0.04]">
                            <GeoInlineMetric label="Score GEO" value={`${score}/75`} accent={scoreAccent(score)} />
                            <GeoInlineMetric label="Citations" value={provider.geo?.citations_count ?? 0} accent={provider.geo?.citations_count >= 2 ? 'emerald' : undefined} />
                            <GeoInlineMetric label="Concurrents" value={provider.geo?.competitors_count ?? 0} accent={provider.geo?.competitors_count >= 2 ? 'violet' : undefined} />
                            <GeoInlineMetric
                                label="Marque"
                                value={provider.geo?.has_brand_mention ? '✓ Détectée' : '✗ Absente'}
                                accent={provider.geo?.has_brand_mention ? 'emerald' : 'red'}
                            />
                            <GeoInlineMetric label="Latence" value={`${provider.latency_ms || 0} ms`} />
                        </div>

                        {/* Citations */}
                        {provider.geo?.citations?.length > 0 && (
                            <div className="space-y-1">
                                <div className="text-[10px] font-semibold text-white/40">Sources citées</div>
                                {provider.geo.citations.slice(0, 5).map((citation) => (
                                    <div key={citation.url} className="flex items-center justify-between gap-2 text-[10px]">
                                        <span className="text-white/55 truncate flex-1">{citation.host}</span>
                                        <span className="text-white/25 shrink-0">{sourceTypeLabel(citation.source_type)}</span>
                                    </div>
                                ))}
                                {provider.geo.citations.length > 5 && (
                                    <div className="text-[10px] text-white/20">+{provider.geo.citations.length - 5} autre{provider.geo.citations.length - 5 > 1 ? 's' : ''}</div>
                                )}
                            </div>
                        )}
                        {provider.geo?.citations_count === 0 && (
                            <div className="text-[10px] text-white/25">Aucune citation exploitable</div>
                        )}

                        {/* Competitors detected */}
                        {provider.geo?.competitors_detected?.length > 0 && (
                            <div className="space-y-1">
                                <div className="text-[10px] font-semibold text-white/40">Concurrents identifiés</div>
                                <div className="flex flex-wrap gap-1">
                                    {provider.geo.competitors_detected.slice(0, 6).map((c) => (
                                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/55">{c}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Response preview (collapsed by default) */}
                        <ResponsePreview content={provider.content} />
                    </>
                )}
            </div>
        </GeoPremiumCard>
    );
}

function ResponsePreview({ content }) {
    const [expanded, setExpanded] = useState(false);
    if (!content) return null;
    const preview = content.slice(0, 280);
    const hasMore = content.length > 280;

    return (
        <div className="pt-2 border-t border-white/[0.04]">
            <button
                type="button"
                className="text-[10px] text-white/30 hover:text-white/50 transition-colors mb-1"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? 'Masquer la réponse' : '+ Voir la réponse brute'}
            </button>
            {expanded && (
                <pre className="geo-scrollbar text-[10px] text-white/50 whitespace-pre-wrap max-h-[200px] overflow-y-auto leading-relaxed rounded-lg bg-black/20 p-2 border border-white/[0.04]">
                    {content}
                </pre>
            )}
            {!expanded && hasMore && (
                <div className="text-[10px] text-white/25 leading-relaxed line-clamp-2">{preview}…</div>
            )}
            {!expanded && !hasMore && (
                <div className="text-[10px] text-white/25 leading-relaxed line-clamp-2">{content}</div>
            )}
        </div>
    );
}

function ComparativeSynthesis({ viewModel }) {
    const { summary, results, hints } = viewModel;

    const citationLeader = getProviderMeta(summary.most_citations_provider);
    const competitorLeader = getProviderMeta(summary.most_competitors_provider);
    const bestOverall = getProviderMeta(summary.best_overall_provider);

    // Build a cross-provider citation comparison
    const allCitationTypes = new Map();
    for (const r of results) {
        if (!r.geo?.citations?.length) continue;
        for (const c of r.geo.citations) {
            if (!allCitationTypes.has(c.source_type)) allCitationTypes.set(c.source_type, new Set());
            allCitationTypes.get(c.source_type).add(r.provider);
        }
    }
    const citationTypeSummary = [...allCitationTypes.entries()]
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 5);

    return (
        <GeoPremiumCard className="p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mb-4">Synthèse comparative</div>

            {/* Verdict grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                    <div className="text-[10px] text-white/35 mb-1">Meilleur résultat global</div>
                    <div className={`text-[14px] font-bold ${bestOverall.accent}`}>{bestOverall.label || 'n.d.'}</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                    <div className="text-[10px] text-white/35 mb-1">Plus de citations</div>
                    <div className={`text-[14px] font-bold ${citationLeader.accent}`}>{citationLeader.label || 'n.d.'}</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                    <div className="text-[10px] text-white/35 mb-1">Plus de concurrents</div>
                    <div className={`text-[14px] font-bold ${competitorLeader.accent}`}>{competitorLeader.label || 'n.d.'}</div>
                </div>
            </div>

            {/* Brand detection */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] text-white/35">Marque détectée par:</span>
                {summary.providers_with_brand_mention.length > 0 ? (
                    summary.providers_with_brand_mention.map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">
                            {getProviderMeta(p).label}
                        </span>
                    ))
                ) : (
                    <span className="text-[10px] text-white/25">aucun provider</span>
                )}
            </div>

            {/* Weak providers */}
            {summary.weak_providers?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] text-white/35">Faibles / échoués:</span>
                    {summary.weak_providers.map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/10 border border-red-400/20 text-red-300">
                            {getProviderMeta(p).label}
                        </span>
                    ))}
                </div>
            )}

            {/* Citation type coverage comparison */}
            {citationTypeSummary.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="text-[10px] text-white/30 mb-2">Couverture sources par type</div>
                    <div className="space-y-1">
                        {citationTypeSummary.map(([type, providers]) => (
                            <div key={type} className="flex items-center justify-between gap-2 text-[10px]">
                                <span className="text-white/45">{sourceTypeLabel(type)}</span>
                                <span className="text-white/30">
                                    {[...providers].map((p) => getProviderMeta(p).short).join(', ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calibration hints */}
            {hints.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="text-[10px] text-white/30 mb-1.5">Calibration</div>
                    <ul className="space-y-1">
                        {hints.map((hint) => (
                            <li key={hint} className="text-[11px] text-white/45 leading-relaxed flex items-start gap-1.5">
                                <span className="text-white/20 shrink-0 mt-0.5">→</span>
                                {hint}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </GeoPremiumCard>
    );
}

/* ─── Main View ─── */

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
        if (event) event.preventDefault();
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
                ...(activeClientId ? { client_id: activeClientId } : {}),
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
            {/* 1 — Command header */}
            <form onSubmit={handleSubmit}>
                <CompareCommandHeader
                    isClientLinkedMode={isClientLinkedMode}
                    clientContext={clientContext}
                    linkedClientName={linkedClientName}
                    running={running}
                    onSubmit={() => handleSubmit()}
                />

                {/* 2 — Compare setup surface */}
                <div className="mt-5">
                    <CompareSetupSurface
                        form={form}
                        setForm={setForm}
                        isClientLinkedMode={isClientLinkedMode}
                        activeClientId={activeClientId}
                        clients={clients}
                        loadingClients={loadingClients}
                        loadClientsIfNeeded={loadClientsIfNeeded}
                        trackedPrompts={trackedPrompts}
                        hasTrackedPrompts={hasTrackedPrompts}
                        loadingClientContext={loadingClientContext}
                        handleClientSelect={handleClientSelect}
                        handlePromptModeSwitch={handlePromptModeSwitch}
                        selectTrackedPrompt={selectTrackedPrompt}
                    />
                </div>
            </form>

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 text-[12px] text-red-300">
                    {error}
                </div>
            )}

            {!viewModel ? (
                <GeoEmptyPanel title="Aucune comparaison" description="Configurez votre prompt et source, puis lancez la comparaison pour évaluer les providers." />
            ) : (
                <div className="space-y-5">
                    {/* 3 — Verdict band */}
                    <VerdictBand viewModel={viewModel} />

                    {/* Partial/full error alert */}
                    {(viewModel.has_partial_error || viewModel.has_full_error) && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <div className="text-[11px] text-amber-200/80">
                                {viewModel.has_full_error
                                    ? 'Aucun provider exploitable. Vérifiez les clés API, les timeouts et la connectivité.'
                                    : 'Succès partiel. Au moins un provider a échoué. Comparaison exploitable avec précaution.'}
                            </div>
                        </div>
                    )}

                    {/* 4 — Provider result grid */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mb-3">Résultats par provider</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {viewModel.results.map((provider) => (
                                <ProviderResultCard key={provider.provider} provider={provider} />
                            ))}
                        </div>
                    </div>

                    {/* 5 — Comparative synthesis */}
                    <ComparativeSynthesis viewModel={viewModel} />
                </div>
            )}
        </div>
    );
}
