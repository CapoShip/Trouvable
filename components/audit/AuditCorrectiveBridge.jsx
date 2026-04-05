'use client';

import { useState, useCallback } from 'react';
import { toArray, normalizeIssue, getRemediationType, Pill, getPriorityTone } from './audit-helpers';

const REMEDIATION_LABELS = {
    missing_faq_for_intent: 'Générer des FAQ pour les intentions clés',
    weak_local_clarity: 'Clarifier la présence locale (NAP, adresse)',
    schema_missing_or_incoherent: 'Corriger les données structurées / JSON-LD',
    llms_txt_missing: 'Générer un brouillon llms.txt',
    ai_crawlers_blocked: 'Corriger l\u2019accès des crawlers IA',
};

export default function AuditCorrectiveBridge({ audit, clientId }) {
    if (!audit || !clientId) return null;

    const issues = toArray(audit?.issues).map(normalizeIssue);
    const eligibleIssues = issues
        .map((issue) => ({ ...issue, remediationType: getRemediationType(issue) }))
        .filter((issue) => issue.remediationType);

    if (eligibleIssues.length === 0) return null;

    // Deduplicate by remediation type
    const seen = new Set();
    const uniqueByType = eligibleIssues.filter((issue) => {
        if (seen.has(issue.remediationType)) return false;
        seen.add(issue.remediationType);
        return true;
    });

    return (
        <div className="geo-premium-card p-5">
            <div className="h-0.5 bg-gradient-to-r from-violet-500/30 via-violet-400/20 to-transparent mb-4 rounded-full" />
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-base font-bold text-white/95"><span className="text-violet-400">✦</span> Pont correctif IA</div>
                    <div className="mt-0.5 text-[11px] text-white/45">Génération de corrections ciblées via Mistral pour chaque problème éligible</div>
                </div>
                <Pill label={`${uniqueByType.length} correction${uniqueByType.length > 1 ? 's' : ''} possible${uniqueByType.length > 1 ? 's' : ''}`} tone="bg-violet-400/15 text-violet-200 border-violet-400/25" />
            </div>

            <div className="mt-4 space-y-2">
                {uniqueByType.map((issue) => (
                    <RemediationRow key={issue.id} issue={issue} clientId={clientId} />
                ))}
            </div>
        </div>
    );
}

function RemediationRow({ issue, clientId }) {
    const [state, setState] = useState('idle'); // idle | loading | done | error
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const generate = useCallback(async () => {
        setState('loading');
        setError(null);
        try {
            const res = await fetch(`/api/admin/remediation/generate/${encodeURIComponent(clientId)}?type=${encodeURIComponent(issue.remediationType)}`, {
                method: 'POST',
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `Erreur ${res.status}`);
            }
            const json = await res.json();
            // The API returns suggestions array or direct result
            const suggestion = json.suggestions?.[0] || json;
            setResult(suggestion.ai_output || suggestion.text || JSON.stringify(suggestion, null, 2));
            setState('done');
        } catch (err) {
            setError(err.message);
            setState('error');
        }
    }, [clientId, issue.remediationType]);

    const actionLabel = REMEDIATION_LABELS[issue.remediationType] || 'Générer correction';

    return (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-white/90">{issue.title}</span>
                        <Pill label={issue.priority} tone={getPriorityTone(issue.priority)} />
                    </div>
                    <p className="mt-1 text-[11px] text-white/40">{actionLabel}</p>
                </div>
                {state === 'idle' && (
                    <button
                        type="button"
                        onClick={generate}
                        className="geo-btn geo-btn-vio shrink-0 px-5 py-2 text-[11px]"
                    >
                        Générer
                    </button>
                )}
                {state === 'loading' && (
                    <span className="shrink-0 text-[10px] text-violet-300 animate-pulse">Génération…</span>
                )}
            </div>

            {state === 'error' && error && (
                <div className="mt-3 rounded-lg bg-red-400/[0.06] px-3 py-2 text-[11px] text-red-300">{error}</div>
            )}

            {state === 'done' && result && (
                <ResultBlock content={result} />
            )}
        </div>
    );
}

function ResultBlock({ content }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="mt-3 space-y-2">
            <div className="relative rounded-xl border border-white/[0.10] bg-[#0a0b0d] p-3 max-h-[200px] overflow-y-auto">
                <pre className="text-[11px] leading-relaxed text-white/65 whitespace-pre-wrap font-mono">{content}</pre>
            </div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/60 transition-all hover:bg-white/[0.08] hover:text-white/70"
                >
                    {copied ? '✓ Copié' : 'Copier'}
                </button>
            </div>
        </div>
    );
}
