'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

import { GeoBarRow, GeoEmptyPanel, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { ADMIN_GEO_LABELS, parseStatusLabelFr, runStatusLabelFr } from '@/lib/i18n/admin-fr';
import {
    getRunDiagnostic,
    isRunFailureStatus,
    isRunProblematic,
    isRunSuccessStatus,
    needsRunOperatorReview,
    normalizeRunParseStatus,
} from '@/lib/operator-intelligence/run-lifecycle';
import {
    translateRunErrorMessage,
    translateRunSignalTier,
    translateZeroCitationReason,
    translateZeroCompetitorReason,
} from '@/lib/i18n/run-diagnostics-fr';

/* ─── Motion tokens ─── */

const EASE = [0.16, 1, 0.3, 1];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/* ─── Helpers ─── */

function formatDateTime(value) {
    if (!value) return 'n.d.';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return 'n.d.';
    }
}

function timeSince(value) {
    if (!value) return null;
    const diff = Date.now() - new Date(value).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
}

function statusPillClass(status) {
    const map = {
        completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        partial: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        partial_error: 'border-red-400/20 bg-red-400/10 text-red-300',
        running: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
        pending: 'border-zinc-400/20 bg-zinc-400/10 text-zinc-300',
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
    if (value == null || Number.isNaN(Number(value))) return 'n.d.';
    return `${Math.round(Number(value) * 100)}%`;
}

function confidenceColor(value) {
    if (value == null) return 'text-white/40';
    const pct = Math.round(Number(value) * 100);
    if (pct >= 70) return 'text-emerald-300';
    if (pct >= 40) return 'text-amber-300';
    return 'text-red-300';
}

function signalTierPillClass(tier) {
    if (tier === 'useful') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
    if (tier === 'low_yield') return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
    return 'border-white/10 bg-white/[0.04] text-white/45';
}

function capProvider(provider) {
    if (!provider) return 'n.d.';
    return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function strengthLabel(value) {
    if (!value) return null;
    const map = { strong: 'Fort', moderate: 'Modéré', weak: 'Faible' };
    return map[value] || value;
}

function resolveParseStatusLabel(status) {
    if (!status) return 'Analyse en attente';
    return parseStatusLabelFr(status);
}

function resolveRunDiagnosticUi(run = {}) {
    const diagnostic = getRunDiagnostic(run);
    if (!diagnostic) return null;

    return {
        ...diagnostic,
        message: diagnostic.kind === 'execution_failure'
            ? translateRunErrorMessage(diagnostic.message)
            : diagnostic.message,
    };
}

/* ─── Competitor classification ─── */

const THEMATIC_WORDS = new Set([
    // SEO / marketing
    'seo', 'sem', 'sea', 'smo', 'smm', 'cro', 'ux', 'ui',
    'audit', 'optimisation', 'optimization', 'référencement',
    'marketing', 'publicité', 'advertising', 'branding',
    'stratégie', 'strategy', 'communication', 'pr',
    'contenu', 'content', 'rédaction', 'copywriting',
    'conversion', 'acquisition', 'rétention', 'retention',
    'engagement', 'visibilité', 'visibility', 'notoriété',
    'analytics', 'tracking', 'reporting', 'monitoring',
    'surveillance', 'veille', 'benchmarking',
    // Tech / digital
    'web', 'mobile', 'digital', 'numérique', 'internet',
    'site', 'blog', 'page', 'landing', 'funnel',
    'application', 'app', 'logiciel', 'software',
    'outil', 'tool', 'plateforme', 'platform',
    'solution', 'service', 'produit', 'product',
    'api', 'saas', 'cloud', 'hosting', 'hébergement',
    'cms', 'crm', 'erp', 'database',
    // Business
    'entreprise', 'société', 'agence', 'agency', 'cabinet',
    'freelance', 'consultant', 'consultation', 'conseil',
    'formation', 'training', 'coaching', 'mentorat',
    'gestion', 'management', 'administration',
    'commerce', 'e-commerce', 'ecommerce', 'boutique', 'shop',
    'marketplace', 'marché',
    // Industry / concept
    'technologie', 'technology', 'innovation', 'recherche',
    'développement', 'development', 'design', 'création',
    'automatisation', 'automation', 'intelligence', 'artificielle', 'ia', 'ai',
    'data', 'données',
    // Performance / metrics
    'performance', 'croissance', 'growth', 'roi', 'kpi',
    'trafic', 'traffic', 'leads', 'ventes', 'sales',
    'revenus', 'revenue', 'résultats',
    // Social / content
    'social', 'médias', 'media', 'réseaux', 'networks',
    'influenceur', 'influencer', 'communauté', 'community',
    'newsletter', 'email', 'emailing', 'mailing',
    // Local / geo
    'local', 'localisation', 'géolocalisation', 'proximité',
    'quartier', 'ville', 'région', 'territoire',
    'annuaire', 'directory', 'listing', 'fiche',
    'avis', 'reviews', 'témoignages', 'réputation',
    'citation', 'citations', 'nap',
    // Actions / generic nouns
    'offre', 'offres', 'tarif', 'tarifs', 'prix',
    'devis', 'estimation', 'évaluation', 'comparaison',
    'analyse', 'diagnostic', 'test', 'testing',
    'amélioration', 'improvement', 'mise', 'jour', 'update',
]);

/** Patterns that identify a "name" as a descriptive phrase, not an entity. */
const NOISE_PATTERNS = [
    /^(le|la|les|un|une|des|du|de|l[''])\s/i,
    /^(the|a|an)\s/i,
    /\b(pour|avec|dans|sur|entre|chez|vers|sans|après|avant|depuis|contre|pendant|selon|sous)\b/i,
    /\b(et|ou|ni|mais|donc|car|puis|ainsi)\b/i,
    /^(optez|choisissez|utilisez|essayez|découvrez|testez|complétez|comparez|consultez|visitez|contactez|demandez|trouvez|regardez|vérifiez|pensez|considérez|préférez|évitez|passez|allez|faites|prenez|voyez|commencez|continuez|explorez|adoptez|intégrez|ajoutez|activez|sélectionnez|combinez|misez|profitez)\b/i,
    /^(try|use|check|visit|consider|explore|discover|compare|find|look|see|go|get|start|choose|select|opt|switch|combine)\b/i,
    /^[\d\s.,:;()\-–—]+$/,
    /^\d+\.\s/,
    /[*_#\[\]{}]/,
    /^\(.*\)$/,
];

/** Evidence-span signals that confirm competitive framing. */
const COMPETITOR_EVIDENCE_RX = /(concurrent|compétit|competitor|rival|alternative|versus|\bvs\b|comparé|comparaison|par rapport|en concurrence|face [àa]|challeng|devancer|surpass|l['']emporte)/i;

function classifyCompetitor(comp) {
    const raw = (comp.name || '').trim();
    const name = raw.toLowerCase();
    const words = name.split(/\s+/).filter(Boolean);
    const conf = comp.confidence != null ? Number(comp.confidence) : null;

    // L0 — empty / malformed
    if (!raw || words.length === 0 || raw.length < 2) return 'noise';

    // L1 — verified / alias-matched entities bypass noise detection
    if (conf !== null && conf >= 0.85) return 'confirmed';
    if (comp.mention_kind === 'verified' || comp.mention_kind === 'normalized') return 'confirmed';

    // L2 — noise rejection (before any signal-based promotion)
    if (words.length === 1 && THEMATIC_WORDS.has(name)) return 'noise';
    if (words.length >= 2 && words.length <= 5 && words.every((w) => THEMATIC_WORDS.has(w))) return 'noise';
    if (words.length >= 6) return 'noise';
    if (NOISE_PATTERNS.some((rx) => rx.test(raw))) return 'noise';
    if (words.length === 1 && name.length <= 2 && !comp.co_occurs_with_target && !comp.recommendation_strength) return 'noise';

    // L3 — hard confirmed (strong individual signals)
    if (comp.co_occurs_with_target) return 'confirmed';
    if (comp.recommendation_strength === 'strong') return 'confirmed';
    if (comp.mention_kind === 'recommended') return 'confirmed';

    // L4 — soft confirmed (signal accumulation ≥ 2)
    let signals = 0;
    if (conf !== null && conf >= 0.7) signals++;
    if (comp.recommendation_strength === 'medium') signals++;
    if (comp.first_position != null && Number(comp.first_position) <= 3) signals++;
    if (comp.evidence_span && COMPETITOR_EVIDENCE_RX.test(comp.evidence_span)) signals++;
    if (signals >= 2) return 'confirmed';

    // L5 — comparative
    return 'comparative';
}

/** Combined run+parse status → single dot color */
function combinedRunDot(run) {
    const parseStatus = normalizeRunParseStatus(run);
    if (isRunFailureStatus(run.status)) return 'bg-red-400';
    if (run.status === 'running') return 'bg-violet-400';
    if (run.status === 'pending') return 'bg-white/20';
    if (run.status === 'completed' && parseStatus === 'parsed_success') return 'bg-emerald-400';
    if (run.status === 'completed' && parseStatus === 'parsed_partial') return 'bg-amber-400';
    if (run.status === 'completed' && parseStatus === 'parsed_failed') return 'bg-red-400';
    if (run.status === 'partial' && parseStatus === 'parsed_failed') return 'bg-red-400';
    if (run.status === 'partial') return 'bg-amber-400';
    return 'bg-white/20';
}

const STATUS_FILTERS = [
    { id: 'all', label: 'Tous' },
    { id: 'needs_review', label: 'À traiter' },
    { id: 'failed', label: 'Échecs' },
    { id: 'completed', label: 'Terminés' },
    { id: 'running', label: 'En cours' },
    { id: 'problematic', label: 'Problématiques' },
];

/* ─── Sub-components ─── */

function HealthDot({ status }) {
    const colors = { ok: 'bg-emerald-400', attention: 'bg-amber-400', critical: 'bg-red-400', idle: 'bg-white/20' };
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors[status] || colors.idle} ${status === 'critical' ? 'cmd-health-dot' : ''}`} />;
}

function HealthIndicator({ status, label }) {
    const styles = {
        ok: 'bg-emerald-400/8 border-emerald-400/20 text-emerald-200/85',
        attention: 'bg-amber-400/8 border-amber-400/20 text-amber-200/85',
        critical: 'bg-red-400/8 border-red-400/20 text-red-200/85',
        idle: 'bg-white/[0.025] border-white/[0.06] text-white/35',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10px] font-semibold ${styles[status] || styles.idle}`}>
            <HealthDot status={status} />
            {label}
        </span>
    );
}

function MiniActivityChart({ runs }) {
    const now = Date.now();
    const msPerDay = 86400000;
    const days = 30;
    const buckets = new Array(days).fill(0);

    if (runs?.length) {
        for (const run of runs) {
            if (!run?.created_at) continue;
            const age = now - new Date(run.created_at).getTime();
            const dayIndex = Math.floor(age / msPerDay);
            if (dayIndex >= 0 && dayIndex < days) buckets[days - 1 - dayIndex]++;
        }
    }

    const max = Math.max(...buckets, 1);
    const hasActivity = buckets.some((v) => v > 0);
    const barW = 100 / days;
    const chartH = 48;

    return (
        <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
            <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em] mb-2.5">Activité · 30j</div>
            {!hasActivity ? (
                <div className="flex items-center justify-center h-12 text-[11px] text-white/20">Aucune exécution</div>
            ) : (
                <svg viewBox={`0 0 100 ${chartH}`} className="w-full" style={{ height: chartH }} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="run-bar-glow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5b73ff" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#5b73ff" stopOpacity="0.35" />
                        </linearGradient>
                    </defs>
                    {buckets.map((count, i) => {
                        const h = count === 0 ? 1 : Math.max(3, (count / max) * (chartH - 4));
                        return (
                            <rect
                                key={i}
                                x={i * barW + barW * 0.15}
                                y={chartH - h}
                                width={barW * 0.7}
                                height={h}
                                rx={1}
                                fill={count === 0 ? 'rgba(255,255,255,0.04)' : 'url(#run-bar-glow)'}
                            />
                        );
                    })}
                </svg>
            )}
        </motion.div>
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
            {open && <pre className={`geo-scrollbar text-[10px] text-white/50 whitespace-pre-wrap break-words px-2.5 pb-2.5 overflow-y-auto ${maxH}`}>{content}</pre>}
        </div>
    );
}

/* ─── Main View ─── */

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
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [clearPending, setClearPending] = useState(false);
    const [techOpen, setTechOpen] = useState(false);
    const [citationsOpen, setCitationsOpen] = useState(false);
    const [competitorsOpen, setCompetitorsOpen] = useState(false);

    const statusCounts = data?.summary?.statusCounts || { pending: 0, running: 0, completed: 0, partial: 0, partial_error: 0, failed: 0, cancelled: 0 };
    const parseCounts = data?.summary?.parseCounts || { parsed_success: 0, parsed_partial: 0, parsed_failed: 0 };
    const history = data?.history || [];
    const latestPerPrompt = data?.latestPerPrompt || [];

    /* ── Derived data ── */

    const filteredHistory = useMemo(() => {
        let runs = history;
        if (promptFilterId) runs = runs.filter((run) => run.tracked_query_id === promptFilterId);
        if (statusFilter === 'needs_review') runs = runs.filter(needsRunOperatorReview);
        else if (statusFilter === 'failed') runs = runs.filter((run) => isRunFailureStatus(run.status));
        else if (statusFilter === 'completed') runs = runs.filter((run) => isRunSuccessStatus(run.status));
        else if (statusFilter === 'running') runs = runs.filter((run) => run.status === 'running' || run.status === 'pending');
        else if (statusFilter === 'problematic') runs = runs.filter(isRunProblematic);
        return runs;
    }, [history, promptFilterId, statusFilter]);

    const historyRows = useMemo(() => filteredHistory.slice(0, 50), [filteredHistory]);

    const promptFilterLabel = useMemo(() => {
        if (!promptFilterId) return null;
        return latestPerPrompt.find((item) => item.id === promptFilterId)?.query_text || null;
    }, [latestPerPrompt, promptFilterId]);

    const problematicCount = useMemo(() => history.filter(isRunProblematic).length, [history]);
    const reviewCount = useMemo(() => history.filter(needsRunOperatorReview).length, [history]);
    const lowConfidenceCount = useMemo(
        () => history.filter((run) => isRunSuccessStatus(run.status) && run.parse_confidence != null && Number(run.parse_confidence) < 0.5).length,
        [history],
    );

    const latestSelectableRunId = historyRows[0]?.id || null;

    /* ── Execution health derivation ── */

    const totalRuns = data?.summary?.total || 0;
    const totalParseable = parseCounts.parsed_success + parseCounts.parsed_partial + parseCounts.parsed_failed;
    const parseFailureRate = totalParseable > 0 ? (parseCounts.parsed_failed / totalParseable) * 100 : 0;
    const failureRunCount = statusCounts.failed + statusCounts.partial_error;
    const successRunCount = statusCounts.completed + statusCounts.partial;
    const failedRate = totalRuns > 0 ? (failureRunCount / totalRuns) * 100 : 0;

    const executionHealth = useMemo(() => {
        if (history.length === 0) return 'idle';
        if (failureRunCount > 0 && (parseFailureRate > 15 || failedRate > 20)) return 'critical';
        if (failureRunCount > 0 || lowConfidenceCount > 0 || parseCounts.parsed_failed > 0) return 'attention';
        return 'ok';
    }, [history.length, failureRunCount, parseFailureRate, failedRate, lowConfidenceCount, parseCounts.parsed_failed]);

    const healthLabel = { ok: 'Moteur sain', attention: 'Attention requise', critical: 'Intervention requise', idle: 'Aucune exécution' };

    const latestRunDate = history[0]?.created_at || null;
    const freshnessLabel = timeSince(latestRunDate);

    const freshnessStatus = useMemo(() => {
        if (!latestRunDate) return 'idle';
        const hours = Math.floor((Date.now() - new Date(latestRunDate).getTime()) / 3600000);
        if (hours > 72) return 'critical';
        if (hours > 24) return 'attention';
        return 'ok';
    }, [latestRunDate]);

    const parseHealthStatus = useMemo(() => {
        if (totalParseable === 0) return 'idle';
        if (parseFailureRate > 15) return 'critical';
        if (parseFailureRate > 5 || parseCounts.parsed_partial > 0) return 'attention';
        return 'ok';
    }, [totalParseable, parseFailureRate, parseCounts.parsed_partial]);

    /* ── Provider·model quality stats ── */

    const providerStats = useMemo(() => {
        const map = new Map();
        for (const run of history) {
            const parseStatus = normalizeRunParseStatus(run);
            const key = `${capProvider(run.provider)} · ${run.model}`;
            if (!map.has(key)) map.set(key, { total: 0, completed: 0, failed: 0, parse_success: 0, parse_partial: 0, parse_failed: 0 });
            const entry = map.get(key);
            entry.total++;
            if (isRunSuccessStatus(run.status)) entry.completed++;
            if (isRunFailureStatus(run.status)) entry.failed++;
            if (parseStatus === 'parsed_success') entry.parse_success++;
            if (parseStatus === 'parsed_partial') entry.parse_partial++;
            if (parseStatus === 'parsed_failed') entry.parse_failed++;
        }
        return [...map.entries()]
            .map(([label, stats]) => ({
                label,
                ...stats,
                successRate: stats.total > 0 ? stats.completed / stats.total : 0,
                parseSuccessRate: (stats.parse_success + stats.parse_partial + stats.parse_failed) > 0
                    ? stats.parse_success / (stats.parse_success + stats.parse_partial + stats.parse_failed)
                    : 0,
            }))
            .sort((a, b) => b.total - a.total);
    }, [history]);

    /* ── Effects: auto-select run + load detail ── */

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

    /* ── Actions ── */

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
            setRunActionMessage(action === 'rerun' ? 'Exécution relancée.' : 'Réanalyse effectuée.');
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

    async function clearErrors() {
        if (!clientId) return;
        setClearPending(true);
        setRunActionError(null);
        setRunActionMessage(null);
        try {
            const response = await fetch(`/api/admin/geo/client/${clientId}/runs/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_errors' }),
            });
            const json = await parseJsonResponse(response);
            const n = json.deleted || 0;
            setRunActionMessage(`${n} exécution${n > 1 ? 's' : ''} problématique${n > 1 ? 's' : ''} effacée${n > 1 ? 's' : ''}.`);
            setSelectedRunId(null);
            setRunDetail(null);
            invalidateWorkspace();
        } catch (actionError) {
            setRunActionError(actionError.message);
        } finally {
            setClearPending(false);
            setClearConfirmOpen(false);
        }
    }

    /* ── Loading / Error / Empty ── */

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[#5b73ff] rounded-full geo-spin" />
                <div className="text-[12px] text-white/30 mt-3">Chargement des exécutions…</div>
            </div>
        );
    }
    if (error) return <div className="p-8 text-center text-red-300/70 text-sm">{error}</div>;
    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Exécutions indisponibles" description="Les observations d'exécutions n'ont pas pu être chargées." />
            </div>
        );
    }

    const noRunsYet = history.length === 0;
    const runsBaseHref = `/admin/clients/${clientId}/geo/runs`;

    /* ─── Render ─── */

    return (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            {/* ── 1. Command Header ── */}
            <motion.div variants={fadeUp}>
                <GeoSectionTitle
                    title="Supervision d'exécution"
                subtitle={`Priorisez les exécutions à relancer, réanalyser ou inspecter pour ${client?.client_name || 'ce client'}.`}
                    action={
                        <div className="flex flex-wrap gap-2 items-center">
                            <GeoProvenancePill meta={data.provenance.observation} />
                            {promptFilterId && (
                                <Link href={runsBaseHref} className="geo-btn geo-btn-ghost">Tous les prompts</Link>
                            )}
                        </div>
                    }
                />
            </motion.div>

            {/* Prompt filter indicator */}
            {promptFilterId && (
                <motion.div variants={fadeUp} className="cmd-surface px-4 py-3 text-[12px] text-white/60">
                    Filtre actif : <span className="font-semibold text-white/80">{promptFilterLabel || 'Prompt'}</span>
                </motion.div>
            )}

            {/* Action feedback */}
            {runActionMessage && (
                <motion.div variants={fadeUp} className="text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                    {runActionMessage}
                </motion.div>
            )}
            {runActionError && (
                <motion.div variants={fadeUp} className="text-[11px] text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {runActionError}
                </motion.div>
            )}

            {/* ── 2. Engine Health Band ── */}
            {!noRunsYet && (
                <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <HealthDot status={executionHealth} />
                            <div className="min-w-0">
                                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">Santé moteur</div>
                                <div className="text-[15px] font-bold text-white/95 mt-0.5 tracking-[-0.01em]">
                                    {healthLabel[executionHealth]}
                                </div>
                            </div>
                        </div>
                        {problematicCount > 0 && (
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-red-300/70">{problematicCount} problématique{problematicCount > 1 ? 's' : ''}</span>
                                {!clearConfirmOpen ? (
                                    <button
                                        type="button"
                                        onClick={() => setClearConfirmOpen(true)}
                                        className="text-[10px] font-medium text-red-300/60 hover:text-red-200 border border-red-400/20 hover:border-red-400/40 bg-red-400/5 hover:bg-red-400/10 rounded-md px-2 py-1 transition-all"
                                    >
                                        Effacer les erreurs
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-red-200/70">Confirmer ?</span>
                                        <button
                                            type="button"
                                            onClick={clearErrors}
                                            disabled={clearPending}
                                            className="text-[10px] font-semibold text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-50 rounded-md px-2 py-1 transition-all"
                                        >
                                            {clearPending ? 'Suppression…' : 'Oui, effacer'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClearConfirmOpen(false)}
                                            disabled={clearPending}
                                            className="text-[10px] text-white/40 hover:text-white/70 rounded-md px-2 py-1 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        <HealthIndicator status={freshnessStatus} label={`Fraîcheur ${freshnessLabel || 'n.d.'}`} />
                        <HealthIndicator status={parseHealthStatus} label={`Analyse ${parseCounts.parsed_failed > 0 ? parseCounts.parsed_failed + ' échec' : 'OK'}`} />
                        <HealthIndicator status={failureRunCount > 0 ? 'critical' : 'ok'} label={`Échecs ${failureRunCount}`} />
                        <HealthIndicator status={reviewCount > 0 ? 'attention' : 'ok'} label={`File ${reviewCount} à revoir`} />
                    </div>
                </motion.div>
            )}

            {/* ── 3. Core Metrics Strip ── */}
            {!noRunsYet && (
                <motion.div variants={fadeUp} className="cmd-surface px-5 py-3">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/25 font-bold uppercase tracking-[0.08em]">Total</span>
                            <span className="text-[13px] font-bold text-white/90 tabular-nums">{promptFilterId ? filteredHistory.length : totalRuns}</span>
                        </div>
                        <div className="w-px h-8 bg-white/[0.06]" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/25 font-bold uppercase tracking-[0.08em]">Terminés</span>
                            <span className="text-[13px] font-bold text-emerald-300/90 tabular-nums">{successRunCount}</span>
                        </div>
                        <div className="w-px h-8 bg-white/[0.06]" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/25 font-bold uppercase tracking-[0.08em]">Échecs</span>
                            <span className={`text-[13px] font-bold tabular-nums ${failureRunCount > 0 ? 'text-red-300' : 'text-white/90'}`}>
                                {failureRunCount}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-white/[0.06]" />
                        <div className="flex flex-col">
                                <span className="text-[10px] text-white/25 font-bold uppercase tracking-[0.08em]">Analyse OK</span>
                            <span className="text-[13px] font-bold text-white/90 tabular-nums">
                                {parseCounts.parsed_success}{totalParseable > 0 ? ` / ${totalParseable}` : ''}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── 4. Activity Sparkline ── */}
            {!noRunsYet && <MiniActivityChart runs={history} />}

            {/* ── Empty state ── */}
            {noRunsYet ? (
                <motion.div variants={fadeUp}>
                    <GeoEmptyPanel
                        title={data.emptyState.noRuns.title}
                        description={data.emptyState.noRuns.description}
                    >
                        <Link href={`/admin/clients/${clientId}/geo/prompts`} className="geo-btn geo-btn-pri">
                            {ADMIN_GEO_LABELS.actions.openPromptWorkspace}
                        </Link>
                    </GeoEmptyPanel>
                </motion.div>
            ) : (
                <>
                    {/* ── 5. Run Supervision + 6. Inspector ── */}
                    <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-3 items-start gap-4">
                        {/* ── History list ── */}
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
                                            {f.id === 'needs_review' && reviewCount > 0 && <span className="ml-1 text-red-300/90">{reviewCount}</span>}
                                            {f.id === 'failed' && failureRunCount > 0 && <span className="ml-1 text-red-300">{failureRunCount}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto geo-scrollbar">
                                {historyRows.length === 0 && (
                                    <div className="p-5 text-center text-[11px] text-white/30">Aucune exécution pour ce filtre.</div>
                                )}
                                {historyRows.map((run) => (
                                    <button
                                        key={run.id}
                                        type="button"
                                        onClick={() => setSelectedRunId(run.id)}
                                        className={`w-full text-left px-4 py-3 hover:bg-white/[0.02] transition-colors ${
                                            selectedRunId === run.id ? 'bg-white/[0.04] border-l-2 border-[#5b73ff]' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2 min-w-0 flex-1">
                                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${combinedRunDot(run)} ${run.status === 'running' ? 'cmd-health-dot' : ''}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[12px] font-medium text-white/85 truncate">{run.query_text}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 text-[10px] text-white/40">
                                                <span>{capProvider(run.provider)} · {run.model}</span>
                                                <span className="text-white/15">|</span>
                                                <span>{formatDateTime(run.created_at)}</span>
                                                <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${statusPillClass(run.status)}`}>
                                                    {runStatusLabelFr(run.status)}
                                                </span>
                                                <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${parsePillClass(run.parse_status)}`}>
                                                    {resolveParseStatusLabel(run.parse_status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 ml-[18px] text-[10px] text-white/35">
                                            <span className={run.target_found ? 'text-emerald-300/70' : 'text-white/30'}>
                                                Cible: {run.target_found ? `✓${run.target_position ? ` #${run.target_position}` : ''}` : '✗'}
                                            </span>
                                            <span>Mentions: {run.total_mentioned}</span>
                                            <span>Concurrents: {run.mention_counts?.competitors ?? 0}</span>
                                            {run.run_signal_tier && (
                                                <span className={`inline-flex rounded border px-1 py-0.5 text-[9px] font-semibold ${signalTierPillClass(run.run_signal_tier)}`}>
                                                    {translateRunSignalTier(run.run_signal_tier)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </GeoPremiumCard>

                        {/* ── Inspector panel ── */}
                        <GeoPremiumCard className="p-0 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
                                <div className="text-[12px] font-semibold text-white/80">Inspecteur</div>
                            </div>
                            <div className="p-4 max-h-[700px] overflow-y-auto geo-scrollbar">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-4 h-4 border-2 border-white/10 border-t-[#5b73ff] rounded-full geo-spin" />
                                        <span className="text-[11px] text-white/40 ml-2">Chargement…</span>
                                    </div>
                                ) : detailError ? (
                                    <div className="text-[11px] text-red-400">{detailError}</div>
                                ) : !runDetail?.run ? (
                        <GeoEmptyPanel title="Aucune sélection" description="Sélectionnez une exécution dans l'historique." />
                                ) : (
                                    <div className="space-y-3">
                                        {/* A. Header bar */}
                                        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-2">
                                            <div className="text-[13px] font-bold text-white/90 leading-snug">{runDetail.run.query_text}</div>
                                            <div className="text-[10px] text-white/40">
                                                {capProvider(runDetail.run.provider)} · {runDetail.run.model} · {formatDateTime(runDetail.run.created_at)}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${statusPillClass(runDetail.run.status)}`}>
                                                    {runStatusLabelFr(runDetail.run.status)}
                                                </span>
                                                <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${parsePillClass(runDetail.run.parse_status)}`}>
                                                    {resolveParseStatusLabel(runDetail.run.parse_status)}
                                                </span>
                                                {runDetail.diagnostics?.run_signal_tier && (
                                                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold ${signalTierPillClass(runDetail.diagnostics.run_signal_tier)}`}>
                                                        {translateRunSignalTier(runDetail.diagnostics.run_signal_tier)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button type="button" className="geo-btn geo-btn-pri flex-1 justify-center" disabled={Boolean(runActionPending)} onClick={() => triggerRunAction('rerun')}>
                                                    {runActionPending === 'rerun' ? 'Relance…' : ADMIN_GEO_LABELS.actions.rerun}
                                                </button>
                                                <button type="button" className="geo-btn geo-btn-ghost flex-1 justify-center" disabled={Boolean(runActionPending)} onClick={() => triggerRunAction('reparse')}>
                                                    {runActionPending === 'reparse' ? 'Reparse…' : ADMIN_GEO_LABELS.actions.reparse}
                                                </button>
                                            </div>
                                            {(() => {
                                                const runDiagnostic = resolveRunDiagnosticUi(runDetail.run);
                                                if (!runDiagnostic) return null;
                                                const isCritical = runDiagnostic.tone === 'critical';
                                                return (
                                                    <div className={`rounded-lg border px-2.5 py-2 text-[10px] ${isCritical ? 'border-red-400/20 bg-red-400/10 text-red-200/90' : 'border-amber-400/20 bg-amber-400/10 text-amber-100/90'}`}>
                                                        <div className={`font-semibold ${isCritical ? 'text-red-200' : 'text-amber-100'}`}>{runDiagnostic.title}</div>
                                                        <div className={`mt-1 ${isCritical ? 'text-red-100/85' : 'text-amber-50/85'}`}>{runDiagnostic.message}</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* B. Signal Summary 2×2 */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Cible</div>
                                                <div className={`text-[13px] font-bold mt-1 ${runDetail.run.target_found ? 'text-emerald-300' : 'text-white/50'}`}>
                                                    {runDetail.run.target_found ? `Détectée${runDetail.run.target_position ? ` #${runDetail.run.target_position}` : ''}` : 'Non détectée'}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Confiance d'analyse</div>
                                                <div className={`text-[13px] font-bold mt-1 ${confidenceColor(runDetail.run.parse_confidence)}`}>
                                                    {confidenceLabel(runDetail.run.parse_confidence)}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Signal</div>
                                                <div className="mt-1">
                                                    {runDetail.diagnostics?.run_signal_tier ? (
                                                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold ${signalTierPillClass(runDetail.diagnostics.run_signal_tier)}`}>
                                                            {translateRunSignalTier(runDetail.diagnostics.run_signal_tier)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[13px] font-bold text-white/40">n.d.</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                                <div className="text-[9px] uppercase tracking-[0.08em] text-white/25 font-bold">Latence</div>
                                                <div className="text-[13px] font-bold text-white mt-1">
                                                    {runDetail.run.latency_ms != null ? `${runDetail.run.latency_ms}ms` : 'n.d.'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* C. Technical depth — collapsed */}
                                        <div className="rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setTechOpen(!techOpen)}
                                                className="w-full flex items-center justify-between px-2.5 py-2 text-[10px] font-semibold text-white/50 hover:text-white/70 transition-colors"
                                            >
                                                Données techniques
                                                <svg className={`w-3 h-3 transition-transform ${techOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                                            </button>
                                            {techOpen && (
                                                <div className="px-2.5 pb-2.5 space-y-2">
                                                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-[10px] text-white/45 grid grid-cols-2 gap-y-1 gap-x-3">
                                                        <div>Mode : {runDetail.run.run_mode || 'standard'}</div>
                                                        <div>Web : {runDetail.run.web_enabled ? 'Connecté' : 'Non-grounded'}</div>
                                                        <div>Variante : {runDetail.run.engine_variant_label || runDetail.run.engine_variant || 'n.d.'}</div>
                                                        <div>Locale : {runDetail.run.locale || 'n.d.'}</div>
                                                        <div>Extraction : v{runDetail.run.extraction_version || 'n.d.'}</div>
                                                        <div>Retries : {runDetail.run.retry_count ?? 0}</div>
                                                        {runDetail.run.error_class && <div className="col-span-2 text-red-300/70">Erreur : {runDetail.run.error_class}</div>}
                                                    </div>
                                                    <RunDataSection title="Prompt envoyé" content={safeJson(runDetail.run.prompt_payload)} />
                                                    <RunDataSection title="Réponse brute" content={runDetail.run.raw_response_full || 'n.d.'} maxH="max-h-[180px]" />
                                                    <RunDataSection title="Réponse normalisée" content={safeJson(runDetail.run.normalized_response)} maxH="max-h-[180px]" />
                                                    <RunDataSection title="Réponse parsée" content={safeJson(runDetail.run.parsed_response)} maxH="max-h-[180px]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* D. Citations — collapsible */}
                                        <div className="rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
                                            <button type="button" onClick={() => setCitationsOpen(!citationsOpen)} className="w-full flex items-center justify-between px-2.5 py-2 text-[10px] font-semibold text-white/60 hover:text-white/80 transition-colors">
                                                <span>Citations ({runDetail.citations?.length || 0})</span>
                                                <svg className={`w-3 h-3 transition-transform ${citationsOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                                            </button>
                                            {citationsOpen && (
                                                <div className="px-2.5 pb-2.5">
                                                    {runDetail.citations?.length ? (
                                                        <div className="space-y-0.5">
                                                            {runDetail.citations.map((item, index) => (
                                                                <div key={`${item.host}-${index}`} className="flex items-center justify-between gap-2 py-0.5 text-[10px]">
                                                                    <span className="text-white/75 truncate flex-1">{item.host || 'n.d.'}</span>
                                                                    <span className={`shrink-0 font-semibold tabular-nums ${confidenceColor(item.confidence)}`}>
                                                                        {confidenceLabel(item.confidence)}
                                                                    </span>
                                                                    {item.source_type && (
                                                                        <span className="shrink-0 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-white/40">
                                                                            {item.source_type}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-white/30">
                                                            {translateZeroCitationReason(runDetail.diagnostics?.zero_citation_reason) || 'Aucune URL source extraite de la réponse.'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* E. Competitors — collapsible, classified */}
                                        {(() => {
                                            const allComps = runDetail.competitors || [];
                                            const classified = allComps.map((c) => ({ ...c, _tier: classifyCompetitor(c) }));
                                            const confirmed = classified.filter((c) => c._tier === 'confirmed');
                                            const comparative = classified.filter((c) => c._tier === 'comparative');
                                            const displayComps = [...confirmed, ...comparative];
                                            const noiseCount = classified.filter((c) => c._tier === 'noise').length;
                                            const headerParts = [];
                                            if (confirmed.length > 0) headerParts.push(`${confirmed.length} confirmé${confirmed.length > 1 ? 's' : ''}`);
                                            if (comparative.length > 0) headerParts.push(`${comparative.length} ref${comparative.length > 1 ? 's' : ''}`);
                                            const headerDetail = headerParts.length > 0 ? headerParts.join(' · ') : '0';
                                            return (
                                                <div className="rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
                                                    <button type="button" onClick={() => setCompetitorsOpen(!competitorsOpen)} className="w-full flex items-center justify-between px-2.5 py-2 text-[10px] font-semibold text-white/60 hover:text-white/80 transition-colors">
                                                        <span className="flex items-center gap-1.5">
                                                            Concurrents ({headerDetail})
                                                            {noiseCount > 0 && <span className="text-white/20">+{noiseCount} filtrés</span>}
                                                        </span>
                                                        <svg className={`w-3 h-3 transition-transform ${competitorsOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                                                    </button>
                                                    {competitorsOpen && (
                                                        <div className="px-2.5 pb-2.5">
                                                            {displayComps.length > 0 ? (
                                                                <div className="space-y-0.5">
                                                                    {displayComps.map((item, index) => (
                                                                        <div key={`${item.name}-${index}`} className={`flex items-center gap-2 py-0.5 text-[10px] ${item._tier === 'comparative' ? 'opacity-50' : ''}`}>
                                                                            <span className="text-white/75 truncate flex-1">{item.name || 'n.d.'}</span>
                                                                            <span className={`shrink-0 font-semibold tabular-nums ${confidenceColor(item.confidence)}`}>
                                                                                {confidenceLabel(item.confidence)}
                                                                            </span>
                                                                            {item.co_occurs_with_target && (
                                                                                <span className="shrink-0 rounded border border-emerald-400/20 bg-emerald-400/5 px-1.5 py-0.5 text-[9px] text-emerald-300/70">Co-cité</span>
                                                                            )}
                                                                            {strengthLabel(item.recommendation_strength) && (
                                                                                <span className="shrink-0 text-[9px] text-white/35">{strengthLabel(item.recommendation_strength)}</span>
                                                                            )}
                                                                            {item._tier === 'comparative' && (
                                                                                <span className="shrink-0 text-[9px] text-white/25 italic">ref</span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[10px] text-white/30">
                                                                    {translateZeroCompetitorReason(runDetail.diagnostics?.zero_competitor_reason) || 'Aucun concurrent confirmé.'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}


                                    </div>
                                )}
                            </div>
                        </GeoPremiumCard>
                    </motion.div>

                    {/* ── 7. Provider/Model Summary ── */}
                    {providerStats.length > 0 && (
                        <motion.div variants={fadeUp} className="cmd-surface px-5 py-4">
                            <div className="cmd-section-label mb-3">Providers · modèles</div>
                            <div className="space-y-3">
                                {providerStats.map((pm) => {
                                    const successPct = Math.round(pm.successRate * 100);
                                    const parsePct = Math.round(pm.parseSuccessRate * 100);
                                    return (
                                        <div key={pm.label} className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2 text-[11px]">
                                                <span className="text-white/80 truncate">{pm.label}</span>
                                                <div className="flex items-center gap-3 shrink-0 text-[10px] text-white/40 tabular-nums">
                                                    <span>{pm.total} exécutions</span>
                                                    <span className="text-emerald-300/60">{successPct}% ok</span>
                                                    <span className="text-white/30">analyse {parsePct}%</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 h-1.5">
                                                <div
                                                    className="h-full rounded-full bg-emerald-400/60"
                                                    style={{ width: `${successPct}%`, minWidth: successPct > 0 ? 2 : 0 }}
                                                />
                                                <div
                                                    className="h-full rounded-full bg-white/[0.06]"
                                                    style={{ width: `${100 - successPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );
}
