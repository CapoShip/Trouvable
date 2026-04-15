'use client';

import { ProvenancePill } from '@/components/ui/ProvenancePill';
import { toArray, normalizeIssue, getPriorityTone, getEvidenceStatusMeta, Pill, getRemediationType } from './audit-helpers';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function AuditPriorityProblems({ audit, maxVisible = 5 }) {
    const issues = toArray(audit?.issues)
        .map(normalizeIssue)
        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

    const visible = issues.slice(0, maxVisible);
    const remaining = issues.length - visible.length;

    return (
        <div className="cmd-surface p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="text-base font-bold text-white/95">Problèmes prioritaires</div>
                <Pill label={`${issues.length} problème${issues.length !== 1 ? 's' : ''}`} tone="bg-red-400/10 text-red-300 border-red-400/20" />
            </div>

            {visible.length === 0 ? (
                <p className="mt-3 text-xs text-white/45">Aucun problème majeur détecté.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {visible.map((issue) => {
                        const evidenceMeta = getEvidenceStatusMeta(issue.evidence_status);
                        const hasRemediation = !!getRemediationType(issue);
                        const isHigh = issue.priority === 'high';
                        const isMedium = issue.priority === 'medium';
                        const cardClass = isHigh
                            ? 'bg-gradient-to-r from-red-500/[0.06] to-transparent border-l-[3px] border-l-red-400/60 border-t border-r border-b border-t-white/[0.06] border-r-white/[0.06] border-b-white/[0.06]'
                            : isMedium
                            ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border-l-[3px] border-l-amber-400/40 border-t border-r border-b border-t-white/[0.06] border-r-white/[0.06] border-b-white/[0.06]'
                            : 'border bg-white/[0.03] border-white/[0.06]';
                        return (
                            <div key={issue.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${cardClass}`}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-semibold text-white/90">{issue.title}</span>
                                        <Pill label={issue.priority} tone={getPriorityTone(issue.priority)} />
                                        <Pill label={issue.category} tone="bg-white/[0.05] text-white/55 border-white/10" />
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-white/55 line-clamp-2">{issue.description}</p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <span className={`text-[10px] ${evidenceMeta.tone.includes('emerald') ? 'text-emerald-300/60' : evidenceMeta.tone.includes('red') ? 'text-red-300/60' : 'text-white/35'}`}>{evidenceMeta.label}</span>
                                        {issue.provenance && <span className="text-[9px] text-white/25">·</span>}
                                        <ProvenancePill value={issue.provenance} />
                                    </div>
                                </div>
                                {hasRemediation && (
                                    <span className="mt-1 shrink-0 rounded-lg border border-violet-400/20 bg-gradient-to-r from-violet-400/15 to-violet-500/[0.05] px-2.5 py-1 text-[11px] font-semibold text-violet-300" title="Correction IA disponible via le pont correctif">
                                        IA
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {remaining > 0 && (
                <p className="mt-3 text-[11px] text-white/35">+ {remaining} problème{remaining > 1 ? 's' : ''} supplémentaire{remaining > 1 ? 's' : ''}, voir les détails complets ci-dessous.</p>
            )}
        </div>
    );
}
