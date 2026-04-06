'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    GeoEmptyPanel,
    GeoKpiCard,
    GeoPremiumCard,
} from '../components/GeoPremium';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function formatDateTime(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

function evidenceAccent(level) {
    if (level === 'strong') return 'text-emerald-400';
    if (level === 'medium') return 'text-violet-400';
    return 'text-amber-400';
}

function evidenceDotColor(level) {
    if (level === 'strong') return 'bg-emerald-400';
    if (level === 'medium') return 'bg-violet-400';
    return 'bg-amber-400';
}

function evidenceToImportance(evidenceLevel) {
    if (evidenceLevel === 'strong') return 'high';
    if (evidenceLevel === 'medium') return 'medium';
    return 'low';
}

function importanceAccent(level) {
    if (level === 'high') return 'border-emerald-400/20 bg-emerald-400/[0.06]';
    if (level === 'medium') return 'border-violet-400/20 bg-violet-400/[0.06]';
    return 'border-white/[0.08] bg-white/[0.03]';
}

/* ── Run usefulness classification ── */

function classifyRunUsefulness(summary, lastRun) {
    if (!lastRun) {
        return { level: 'pending', label: 'En attente', tone: 'text-white/50', bg: 'border-white/10 bg-white/[0.04]', icon: '○' };
    }
    if (lastRun.status === 'running' || lastRun.status === 'pending') {
        return { level: 'running', label: 'En cours', tone: 'text-sky-300', bg: 'border-sky-400/20 bg-sky-400/[0.06]', icon: '◌' };
    }
    if (lastRun.status === 'failed') {
        return { level: 'failed', label: 'Échec', tone: 'text-red-300', bg: 'border-red-400/20 bg-red-400/[0.06]', icon: '✕' };
    }

    const docs = summary?.documents_count || 0;
    const clusters = summary?.clusters_count || 0;
    const opportunities = summary?.opportunities_count || 0;

    if (docs === 0) {
        return { level: 'empty', label: 'Vide', tone: 'text-amber-300', bg: 'border-amber-400/20 bg-amber-400/[0.06]', icon: '○' };
    }
    if (clusters <= 2 && opportunities === 0) {
        return { level: 'weak', label: 'Faible', tone: 'text-amber-300', bg: 'border-amber-400/20 bg-amber-400/[0.06]', icon: '◑' };
    }
    return { level: 'useful', label: 'Utile', tone: 'text-emerald-300', bg: 'border-emerald-400/20 bg-emerald-400/[0.06]', icon: '●' };
}

/* ── Seed quality classification ── */

function classifySeed(sd) {
    if (!sd) return 'unknown';
    if (sd.status === 'error') return 'error';
    if (sd.results === 0) return 'weak';
    if (sd.results >= 3) return 'strong';
    return 'moderate';
}

function seedDotColor(quality) {
    if (quality === 'strong') return 'bg-emerald-400';
    if (quality === 'moderate') return 'bg-violet-400';
    if (quality === 'weak') return 'bg-amber-400';
    if (quality === 'error') return 'bg-red-400';
    return 'bg-white/20';
}

function seedLabel(quality) {
    if (quality === 'strong') return 'Performant';
    if (quality === 'moderate') return 'Modéré';
    if (quality === 'weak') return 'Faible';
    if (quality === 'error') return 'Erreur';
    return 'Inconnu';
}

/* ── Empty run explanations ── */

function getEmptyRunExplanation(connection, summary, lastRun) {
    const status = connection?.status;
    const docs = summary?.documents_count || 0;
    const seeds = summary?.query_seeds || [];
    const seedDiags = lastRun?.run_context?.seed_diagnostics || [];

    // Not connected — must be checked first so it is not masked by !lastRun
    if (status === 'not_connected') {
        return {
            title: 'Intelligence communautaire non activée',
            description: 'Le connecteur de veille communautaire n\'est pas encore configuré pour ce client.',
            action: 'Activez le connecteur depuis le Suivi continu pour commencer la collecte.',
            severity: 'info',
        };
    }

    // No run yet
    if (!lastRun) {
        return {
            title: 'Première collecte en attente',
            description: 'Aucune collecte communautaire n\'a encore été exécutée. Le système analysera Reddit et d\'autres sources communautaires à partir des seeds configurés pour votre profil.',
            action: 'Lancez votre première collecte pour démarrer l\'intelligence communautaire.',
            severity: 'info',
        };
    }

    // Run failed
    if (lastRun.status === 'failed') {
        return {
            title: 'La dernière collecte a rencontré une erreur',
            description: lastRun.error_message || 'Une erreur technique a empêché la collecte de se terminer correctement.',
            action: 'Relancez la collecte. Si l\'erreur persiste, vérifiez la configuration du connecteur.',
            severity: 'error',
        };
    }

    // Run completed but zero documents
    if (docs === 0 && lastRun.status === 'completed') {
        const errorSeeds = seedDiags.filter((s) => s.status === 'error').length;
        const zeroSeeds = seedDiags.filter((s) => s.status === 'ok' && s.results === 0).length;

        if (errorSeeds > 0 && errorSeeds === seedDiags.length) {
            return {
                title: 'Tous les seeds ont rencontré des erreurs',
                description: `Les ${errorSeeds} seeds testés ont tous généré des erreurs de recherche. Cela peut indiquer un problème de configuration ou de disponibilité de la source.`,
                action: 'Vérifiez que les seeds sont adaptés au profil client et relancez.',
                severity: 'error',
            };
        }

        if (zeroSeeds > 0 || seeds.length > 0) {
            return {
                title: 'Collecte terminée — aucun résultat pertinent',
                description: `La collecte a testé ${seedDiags.length || seeds.length} seed(s) sans trouver de discussions pertinentes. Cela peut signifier un marché de niche, des seeds trop spécifiques, ou un volume communautaire naturellement faible pour ce profil.`,
                action: 'Ce n\'est pas un dysfonctionnement. Les prochaines collectes couvriront de nouvelles discussions. Envisagez d\'ajuster les seeds pour élargir le périmètre.',
                severity: 'neutral',
            };
        }

        return {
            title: 'Aucun document collecté',
            description: 'La collecte s\'est terminée sans trouver de contenu communautaire pertinent avec le périmètre actuel.',
            action: 'Vérifiez les seeds et la configuration du profil client.',
            severity: 'neutral',
        };
    }

    return null;
}

/* ── Async action helpers ── */

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
    return json;
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

/* ── Command Header ── */

function SocialCommandHeader({ client, summary, connection, runUsefulness }) {
    const reading = useMemo(() => {
        if (connection?.status === 'not_connected') return 'Connecteur non activé — aucune donnée communautaire.';
        if (!summary?.last_run) return 'En attente de la première collecte communautaire.';

        const parts = [];
        if (summary.documents_count > 0) parts.push(`${summary.documents_count} document${summary.documents_count > 1 ? 's' : ''}`);
        if (summary.clusters_count > 0) parts.push(`${summary.clusters_count} cluster${summary.clusters_count > 1 ? 's' : ''}`);
        if (summary.opportunities_count > 0) parts.push(`${summary.opportunities_count} opportunité${summary.opportunities_count > 1 ? 's' : ''}`);
        if (parts.length === 0) return 'Collecte exécutée — aucun signal pertinent détecté.';
        return parts.join(' · ');
    }, [summary, connection]);

    return (
        <div className="relative rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/30 before:to-transparent">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-lg font-bold tracking-[-0.02em] text-white/95">
                        Veille sociale
                    </h1>
                    <p className="text-[12px] text-white/40 mt-1 max-w-xl leading-snug">
                        Intelligence communautaire pour {client?.client_name || 'ce client'} — signaux, thèmes et opportunités.
                    </p>
                    {reading && (
                        <p className="text-[11px] text-white/55 mt-2 font-medium">{reading}</p>
                    )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${runUsefulness.bg} ${runUsefulness.tone}`}>
                        <span>{runUsefulness.icon}</span>
                        {runUsefulness.label}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-4 text-[10px]">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-white/50 font-medium">Observé</span>
                            <span className="text-white/25">— vu dans les communautés</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            <span className="text-white/50 font-medium">Dérivé</span>
                            <span className="text-white/25">— synthétisé par IA</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Run Usefulness Band ── */

function RunUsefulnessBand({ summary, runUsefulness, lastRun }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GeoKpiCard
                label="Documents"
                value={summary?.documents_count ?? 0}
                hint="Sources communautaires collectées"
                accent="blue"
            />
            <GeoKpiCard
                label="Clusters"
                value={summary?.clusters_count ?? 0}
                hint="Thèmes et patterns groupés"
                accent="violet"
            />
            <GeoKpiCard
                label="Opportunités"
                value={summary?.opportunities_count ?? 0}
                hint="Actions dérivées des preuves"
                accent="amber"
            />
            <GeoKpiCard
                label="Dernière collecte"
                value={lastRun ? formatDateTime(lastRun.started_at) : '—'}
                hint={lastRun ? `Statut : ${lastRun.status}` : 'Aucune collecte'}
                accent={runUsefulness.level === 'useful' ? 'emerald' : 'default'}
            />
        </div>
    );
}

/* ── Seed Intelligence ── */

function SeedIntelligence({ querySeeds, seedDiagnostics, siteContext }) {
    const diagnostics = seedDiagnostics || [];
    const seeds = querySeeds || [];
    const hasDiagnostics = diagnostics.length > 0;

    const seedStats = useMemo(() => {
        if (!hasDiagnostics) return null;
        const strong = diagnostics.filter((sd) => classifySeed(sd) === 'strong').length;
        const moderate = diagnostics.filter((sd) => classifySeed(sd) === 'moderate').length;
        const weak = diagnostics.filter((sd) => classifySeed(sd) === 'weak').length;
        const error = diagnostics.filter((sd) => classifySeed(sd) === 'error').length;
        return { strong, moderate, weak, error, total: diagnostics.length };
    }, [diagnostics, hasDiagnostics]);

    const businessLabel = siteContext?.business_type || 'non résolu';
    const cityLabel = siteContext?.city || 'localisation inconnue';

    return (
        <GeoPremiumCard className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <div className="text-sm font-semibold text-white/95">Seeds & requêtes</div>
                    <div className="text-[11px] text-white/35 mt-0.5">
                        Ce que le système recherche pour {businessLabel} à {cityLabel}
                    </div>
                </div>
                {seedStats && (
                    <div className="flex items-center gap-2 text-[10px] shrink-0">
                        {seedStats.strong > 0 && <span className="text-emerald-300">{seedStats.strong} performant{seedStats.strong > 1 ? 's' : ''}</span>}
                        {seedStats.weak > 0 && <span className="text-amber-300">{seedStats.weak} faible{seedStats.weak > 1 ? 's' : ''}</span>}
                        {seedStats.error > 0 && <span className="text-red-300">{seedStats.error} erreur{seedStats.error > 1 ? 's' : ''}</span>}
                    </div>
                )}
            </div>

            {seeds.length === 0 && !hasDiagnostics ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
                    <div className="text-[11px] text-white/40">
                        Aucun seed configuré. Les seeds sont générés automatiquement à partir du profil client lors de la première collecte.
                    </div>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {hasDiagnostics ? (
                        diagnostics.map((sd, i) => {
                            const quality = classifySeed(sd);
                            return (
                                <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${seedDotColor(quality)}`} />
                                    <span className="text-[12px] text-white/80 min-w-0 truncate flex-1">{sd.seed}</span>
                                    <span className={`text-[10px] font-semibold shrink-0 ${quality === 'strong' ? 'text-emerald-300' : quality === 'moderate' ? 'text-violet-300' : quality === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                                        {sd.status === 'ok' ? `${sd.results} résultat${sd.results !== 1 ? 's' : ''}` : 'erreur'}
                                    </span>
                                    <span className="text-[10px] text-white/30 shrink-0">{seedLabel(quality)}</span>
                                </div>
                            );
                        })
                    ) : (
                        seeds.map((seed, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                <span className="w-2 h-2 rounded-full shrink-0 bg-white/20" />
                                <span className="text-[12px] text-white/80 min-w-0 truncate flex-1">{seed}</span>
                                <span className="text-[10px] text-white/30 shrink-0">En attente de résultats</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </GeoPremiumCard>
    );
}

/* ── Signal Card (used for themes, complaints, questions) ── */

function SignalCard({ item }) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white/90 break-words">{item.label || item.title}</div>
                    {item.rationale && <div className="text-[11px] text-white/40 mt-1 leading-relaxed">{item.rationale}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {(item.count != null || item.mention_count != null) && (
                        <span className="text-[10px] font-semibold text-white/50 tabular-nums">
                            {item.count ?? item.mention_count}
                        </span>
                    )}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${evidenceDotColor(item.evidence_level)}`} />
                </div>
            </div>
            {item.subreddits?.length > 0 && (
                <div className="text-[10px] text-white/25 mt-1.5">{item.subreddits.map((s) => `r/${s}`).join(' · ')}</div>
            )}
            {item.example && (
                <a href={item.example} target="_blank" rel="noreferrer" className="inline-flex mt-2 text-[10px] font-semibold text-sky-300/70 hover:text-sky-200">
                    Voir la discussion →
                </a>
            )}
        </div>
    );
}

/* ── Signal List Section ── */

function SignalSection({ title, subtitle, items = [], emptyNote, maxItems = 8, columns = 1 }) {
    const [expanded, setExpanded] = useState(false);
    const displayed = expanded ? items : items.slice(0, maxItems);
    const hasMore = items.length > maxItems;

    if (items.length === 0 && !emptyNote) return null;

    return (
        <div>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                    <div className="text-[13px] font-semibold text-white/90">{title}</div>
                    {subtitle && <div className="text-[10px] text-white/30 mt-0.5">{subtitle}</div>}
                </div>
                {items.length > 0 && (
                    <span className={`text-[10px] font-semibold tabular-nums ${evidenceAccent(items[0]?.evidence_level)}`}>
                        {items.length} signal{items.length > 1 ? 'ux' : ''}
                    </span>
                )}
            </div>
            {items.length === 0 ? (
                <div className="text-[11px] text-white/25 italic">{emptyNote}</div>
            ) : (
                <>
                    <div className={`${columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-2' : 'space-y-2'}`}>
                        {displayed.map((item, i) => (
                            <SignalCard key={`${item.label || item.title || 'item'}-${i}`} item={item} />
                        ))}
                    </div>
                    {hasMore && (
                        <button type="button" onClick={() => setExpanded(!expanded)} className="mt-2 text-[10px] font-semibold text-white/35 hover:text-white/60 transition-colors">
                            {expanded ? 'Voir moins' : `+ ${items.length - maxItems} autres`}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Opportunity Card ── */

function OpportunityCard({ item }) {
    return (
        <div className={`rounded-xl border p-3 ${importanceAccent(evidenceToImportance(item.evidence_level))}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-semibold text-white/90 break-words">{item.title}</div>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${evidenceDotColor(item.evidence_level)}`} />
            </div>
            {item.rationale && <div className="text-[11px] text-white/40 mt-1 leading-relaxed">{item.rationale}</div>}
            {(item.mention_count != null && item.mention_count > 0) && (
                <div className="text-[10px] text-white/25 mt-1.5 tabular-nums">{item.mention_count} signal{item.mention_count > 1 ? 'ux' : ''} associé{item.mention_count > 1 ? 's' : ''}</div>
            )}
        </div>
    );
}

/* ── AI Briefing Panel ── */

function AiBriefingPanel({ clientId, hasData }) {
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);

    const generateBriefing = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/geo/client/${clientId}/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || 'Erreur génération');
            setBriefing(json.briefing);
            setMeta(json.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    return (
        <GeoPremiumCard className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <div className="text-sm font-semibold text-white/95">✦ Briefing opérateur</div>
                    <div className="text-[11px] text-white/35 mt-0.5">
                        Synthèse IA des signaux communautaires — générée par Mistral à partir des données collectées
                    </div>
                </div>
                <button
                    type="button"
                    className="geo-btn geo-btn-vio text-[10px] disabled:opacity-50"
                    disabled={loading}
                    onClick={generateBriefing}
                >
                    {loading ? 'Génération…' : briefing ? 'Régénérer' : '✦ Générer le briefing'}
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-[11px] text-red-200 mb-3">
                    {error}
                </div>
            )}

            {briefing ? (
                <div className="space-y-4">
                    {/* Headline */}
                    <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-4">
                        <div className="text-[13px] font-semibold text-white/90 leading-relaxed">{briefing.headline}</div>
                        {meta && (
                            <div className="text-[9px] text-white/20 mt-2">
                                {meta.provider} · {formatDateTime(meta.generated_at)} · {meta.latencyMs}ms
                            </div>
                        )}
                    </div>

                    {/* Key Findings */}
                    {briefing.key_findings?.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30 mb-2">Constats clés</div>
                            <div className="space-y-2">
                                {briefing.key_findings.map((f, i) => (
                                    <div key={i} className={`rounded-lg border p-3 ${importanceAccent(f.importance)}`}>
                                        <div className="text-[12px] font-semibold text-white/85">{f.finding}</div>
                                        <div className="text-[10px] text-white/35 mt-1">{f.evidence}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pain Points & Buying Signals — side by side */}
                    {(briefing.pain_points?.length > 0 || briefing.buying_signals?.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {briefing.pain_points?.length > 0 && (
                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-amber-300/60 mb-2">Irritants détectés</div>
                                    <ul className="space-y-1.5">
                                        {briefing.pain_points.map((p, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[11px] text-white/55">
                                                <span className="text-amber-400/50 shrink-0 mt-0.5">•</span>
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {briefing.buying_signals?.length > 0 && (
                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-300/60 mb-2">Signaux d&apos;achat</div>
                                    <ul className="space-y-1.5">
                                        {briefing.buying_signals.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[11px] text-white/55">
                                                <span className="text-emerald-400/50 shrink-0 mt-0.5">•</span>
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recommended Actions */}
                    {briefing.recommended_actions?.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30 mb-2">Actions recommandées</div>
                            <div className="space-y-2">
                                {briefing.recommended_actions.map((a, i) => (
                                    <div key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                                        <span className="text-[11px] font-bold text-violet-400/70 shrink-0 tabular-nums">{i + 1}.</span>
                                        <div className="min-w-0">
                                            <div className="text-[12px] font-semibold text-white/85">{a.action}</div>
                                            <div className="text-[10px] text-white/35 mt-0.5">{a.reason}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Seed Assessment & Run Explanation */}
                    {(briefing.seed_assessment || briefing.run_explanation) && (
                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3 text-[11px] text-white/35 leading-relaxed space-y-1">
                            {briefing.seed_assessment && <div><span className="text-white/50 font-medium">Seeds : </span>{briefing.seed_assessment}</div>}
                            {briefing.run_explanation && <div><span className="text-white/50 font-medium">Collecte : </span>{briefing.run_explanation}</div>}
                        </div>
                    )}
                </div>
            ) : !loading && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                    <div className="text-[11px] text-white/30">
                        Cliquez « Générer le briefing » pour obtenir une synthèse IA des signaux communautaires.
                    </div>
                </div>
            )}
        </GeoPremiumCard>
    );
}

/* ── Empty State Explainer ── */

function EmptyStateExplainer({ explanation, clientId, onLaunch, actionBusy, continuousLoading }) {
    if (!explanation) return null;

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const severityStyles = {
        error: 'border-red-400/15 bg-red-400/[0.04]',
        neutral: 'border-amber-400/15 bg-amber-400/[0.04]',
        info: 'border-white/[0.08] bg-white/[0.03]',
    };

    return (
        <GeoPremiumCard className="p-6">
            <div className="max-w-2xl mx-auto text-center">
                <div className="text-base font-semibold text-white/90 mb-2">{explanation.title}</div>
                <div className={`rounded-xl border p-4 mb-4 ${severityStyles[explanation.severity] || severityStyles.info}`}>
                    <div className="text-[12px] text-white/55 leading-relaxed">{explanation.description}</div>
                </div>
                <div className="text-[11px] text-white/40 mb-5">{explanation.action}</div>
                <div className="flex justify-center gap-2 flex-wrap">
                    <button
                        type="button"
                        className="geo-btn geo-btn-pri disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={actionBusy || continuousLoading}
                        onClick={onLaunch}
                    >
                        {actionBusy ? 'Lancement…' : 'Lancer la collecte'}
                    </button>
                    <Link href={`${baseHref}/continuous`} className="geo-btn geo-btn-ghost">
                        Suivi continu
                    </Link>
                </div>
            </div>
        </GeoPremiumCard>
    );
}

/* ── Collapsible Detail ── */

function CollapsibleDetail({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
                <span className="text-[11px] font-semibold text-white/50">{title}</span>
                <span className="text-[10px] text-white/25">{open ? '▲' : '▼'}</span>
            </button>
            {open && <div className="px-4 pb-4 border-t border-white/[0.04]">{children}</div>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Main View
   ═══════════════════════════════════════════════════════════════ */

export default function GeoSocialView() {
    const { client, clientId, loading, invalidateWorkspace } = useGeoClient();
    const { data, loading: sliceLoading, error } = useGeoWorkspaceSlice('social');
    const [actionPending, setActionPending] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [actionMessageTone, setActionMessageTone] = useState('success');
    const [actionError, setActionError] = useState(null);
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    /* ── Loading / Error states ── */

    if (loading || sliceLoading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
                <GeoEmptyPanel title="Intelligence communautaire indisponible" description="La tranche de données n'a pas pu être chargée. Cela ne signifie pas l'absence de discussions sur votre marque." />
            </div>
        );
    }

    /* ── Data extraction ── */

    const connection = data.connection || {};
    const summary = data.summary || {};
    const lastRun = summary.last_run || null;
    const siteCtx = summary.site_context || {};
    const hasData = (summary.documents_count > 0 || summary.total_discussions > 0);
    const runUsefulness = classifyRunUsefulness(summary, lastRun);
    const actionBusy = Boolean(actionPending);

    const seedDiagnostics = lastRun?.run_context?.seed_diagnostics || [];
    const querySeeds = summary.query_seeds || [];

    const emptyExplanation = !hasData ? getEmptyRunExplanation(connection, summary, lastRun) : null;

    /* ── Signals: merge & prioritize ── */

    const topSignals = useMemo(() => {
        const complaints = (data.topComplaints || []).map((c) => ({ ...c, type: 'complaint' }));
        const questions = (data.topQuestions || []).map((q) => ({ ...q, type: 'question' }));
        const themes = (data.topThemes || []).map((t) => ({ ...t, type: 'theme' }));
        return { complaints, questions, themes };
    }, [data]);

    const allOpportunities = useMemo(() => {
        return [
            ...(data.faqOpportunities || []).map((o) => ({ ...o, type: 'faq' })),
            ...(data.contentOpportunities || []).map((o) => ({ ...o, type: 'content' })),
            ...(data.differentiationAngles || []).map((o) => ({ ...o, type: 'differentiation' })),
        ];
    }, [data]);

    /* ── Action handlers ── */

    async function postContinuousAction(payload) {
        return parseJsonResponse(
            await fetch(`/api/admin/geo/client/${clientId}/continuous/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
        );
    }

    async function loadContinuousControls() {
        const json = await parseJsonResponse(
            await fetch(`/api/admin/geo/client/${clientId}/continuous?refresh=${Date.now()}`, {
                cache: 'no-store',
            })
        );
        const job = (json.jobs?.jobs || []).find((item) => item.job_type === 'community_sync') || null;
        const connector = (json.connectors?.connections || []).find((item) => item.provider === 'agent_reach') || null;
        const runs = json.jobs?.runs || [];
        return { job, connector, runs };
    }

    async function handleLaunchCollection() {
        setActionPending('launch_collection');
        setActionMessage(null);
        setActionMessageTone('success');
        setActionError(null);

        try {
            const { job, connector } = await loadContinuousControls();

            if (!job) {
                throw new Error('Le job community_sync est introuvable pour ce client. Ouvrez Suivi continu une fois puis réessayez.');
            }

            if (connector && !['configured', 'healthy', 'syncing'].includes(connector.status)) {
                await postContinuousAction({
                    action: 'connector_state',
                    provider: 'agent_reach',
                    status: 'configured',
                });
            }

            if (job.is_active !== true) {
                await postContinuousAction({
                    action: 'toggle_job',
                    jobId: job.id,
                    is_active: true,
                });
            }

            const queuedRunResponse = await postContinuousAction({ action: 'run_now', jobId: job.id });
            const queuedRunId = queuedRunResponse?.result?.id || null;

            await postContinuousAction({ action: 'worker_tick', maxRunsToExecute: 8 });

            const refreshed = await loadContinuousControls();
            const latestCommunityRun = queuedRunId
                ? (refreshed.runs || []).find((run) => run.id === queuedRunId)
                : (refreshed.runs || []).find((run) => run.job_type === 'community_sync') || null;

            const runSummary = latestCommunityRun?.result_summary || {};
            const documentsCollected = Number(runSummary.documents_collected || 0);

            if (latestCommunityRun?.status === 'failed') {
                setActionError(latestCommunityRun.error_message || 'La collecte a échoué.');
            } else if (documentsCollected === 0 && latestCommunityRun?.status === 'completed') {
                setActionMessage('Collecte terminée — aucun nouveau document pertinent trouvé avec les seeds actuels.');
                setActionMessageTone('warning');
            } else if (latestCommunityRun?.status === 'completed') {
                setActionMessage(`Collecte terminée : ${documentsCollected} document${documentsCollected > 1 ? 's' : ''} collecté${documentsCollected > 1 ? 's' : ''}.`);
                setActionMessageTone('success');
            } else {
                setActionMessage('Collecte lancée — les résultats apparaîtront après le traitement.');
                setActionMessageTone('success');
            }

            invalidateWorkspace();
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setActionPending(null);
        }
    }

    /* ── Render ── */

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
            {/* 1. Command Header */}
            <SocialCommandHeader
                client={client}
                summary={summary}
                connection={connection}
                runUsefulness={runUsefulness}
            />

            {/* 2. Run Usefulness Band */}
            {connection.status !== 'not_connected' && (
                <RunUsefulnessBand
                    summary={summary}
                    runUsefulness={runUsefulness}
                    lastRun={lastRun}
                />
            )}

            {/* Action messages */}
            {(actionMessage || actionError) && (
                <div className="space-y-2">
                    {actionMessage && (
                        <div className={`rounded-xl px-4 py-2.5 text-[11px] ${actionMessageTone === 'warning' ? 'border border-amber-400/20 bg-amber-400/[0.06] text-amber-100' : 'border border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200'}`}>
                            {actionMessage}
                        </div>
                    )}
                    {actionError && (
                        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2.5 text-[11px] text-red-200">
                            {actionError}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Empty state or content */}
            {!hasData ? (
                <>
                    {/* Empty state explanation */}
                    <EmptyStateExplainer
                        explanation={emptyExplanation}
                        clientId={clientId}
                        onLaunch={handleLaunchCollection}
                        actionBusy={actionBusy}
                        continuousLoading={false}
                    />

                    {/* Seed intelligence even when empty */}
                    <SeedIntelligence
                        querySeeds={querySeeds}
                        seedDiagnostics={seedDiagnostics}
                        siteContext={siteCtx}
                    />

                    {/* AI Briefing — available even for empty/weak runs */}
                    <AiBriefingPanel clientId={clientId} hasData={false} />
                </>
            ) : (
                <>
                    {/* 3. Seed Intelligence */}
                    <SeedIntelligence
                        querySeeds={querySeeds}
                        seedDiagnostics={seedDiagnostics}
                        siteContext={siteCtx}
                    />

                    {/* 4. Surfaced Themes & Signals */}
                    <GeoPremiumCard className="p-5">
                        <div className="mb-4">
                            <div className="text-sm font-semibold text-white/95">Signaux communautaires</div>
                            <div className="text-[11px] text-white/35 mt-0.5">
                                Thèmes, plaintes et questions observés dans les discussions collectées
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                            <SignalSection
                                title="Plaintes récurrentes"
                                subtitle="Irritants détectés dans les discussions"
                                items={topSignals.complaints}
                                emptyNote="Aucune plainte récurrente détectée."
                                maxItems={5}
                            />
                            <SignalSection
                                title="Questions fréquentes"
                                subtitle="Patterns de questions observés"
                                items={topSignals.questions}
                                emptyNote="Aucune question récurrente détectée."
                                maxItems={5}
                            />
                            <SignalSection
                                title="Thèmes de discussion"
                                subtitle="Sujets qui reviennent régulièrement"
                                items={topSignals.themes}
                                emptyNote="Aucun thème récurrent identifié."
                                maxItems={5}
                            />
                        </div>
                    </GeoPremiumCard>

                    {/* 5. Opportunities */}
                    {allOpportunities.length > 0 && (
                        <GeoPremiumCard className="p-5">
                            <div className="mb-4">
                                <div className="text-sm font-semibold text-white/95">Opportunités d&apos;action</div>
                                <div className="text-[11px] text-white/35 mt-0.5">
                                    Pistes dérivées des signaux communautaires — FAQ, contenu et différenciation
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {allOpportunities.map((opp, i) => (
                                    <OpportunityCard key={`opp-${opp.title || i}`} item={opp} />
                                ))}
                            </div>
                        </GeoPremiumCard>
                    )}

                    {/* 6. AI Briefing */}
                    <AiBriefingPanel clientId={clientId} hasData={true} />

                    {/* 7. Secondary detail — collapsible */}
                    <div className="space-y-2">
                        {/* Source communities */}
                        {(data.sourceBuckets?.length > 0 || data.communityLanguage?.length > 0 || data.competitorComplaints?.length > 0) && (
                            <CollapsibleDetail title="Détail : communautés source, langage et concurrents">
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pt-3">
                                    <SignalSection
                                        title="Communautés source"
                                        subtitle="Volume par communauté"
                                        items={(data.sourceBuckets || []).map((b) => ({ ...b, label: b.source }))}
                                        emptyNote="Aucune communauté source."
                                        maxItems={6}
                                    />
                                    <SignalSection
                                        title="Langage communautaire"
                                        subtitle="Expressions et termes distinctifs"
                                        items={data.communityLanguage || []}
                                        emptyNote="Aucun pattern de langage."
                                        maxItems={6}
                                    />
                                    <SignalSection
                                        title="Plaintes concurrentielles"
                                        subtitle="Angles de différenciation"
                                        items={data.competitorComplaints || []}
                                        emptyNote="Aucune plainte concurrentielle."
                                        maxItems={6}
                                    />
                                </div>
                            </CollapsibleDetail>
                        )}

                        {/* Collection details */}
                        {lastRun && (
                            <CollapsibleDetail title="Détail : dernière collecte">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mb-1">Date</div>
                                        <div className="text-[12px] text-white/70">{formatDateTime(lastRun.started_at)}</div>
                                    </div>
                                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mb-1">Statut</div>
                                        <div className={`text-[12px] font-semibold ${runUsefulness.tone}`}>{lastRun.status}</div>
                                    </div>
                                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/25 mb-1">Documents</div>
                                        <div className="text-[12px] text-white/70">
                                            {lastRun.documents_collected ?? 0} collectés · {lastRun.documents_persisted ?? 0} persistés
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleDetail>
                        )}
                    </div>

                    {/* Quick action bar */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="geo-btn geo-btn-pri disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={actionBusy}
                                onClick={handleLaunchCollection}
                            >
                                {actionPending === 'launch_collection' ? 'Lancement…' : 'Relancer la collecte'}
                            </button>
                            <Link href={`${baseHref}/continuous`} className="geo-btn geo-btn-ghost">
                                Suivi continu
                            </Link>
                            <Link href={`${baseHref}/runs`} className="geo-btn geo-btn-ghost">
                                Historique runs
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
