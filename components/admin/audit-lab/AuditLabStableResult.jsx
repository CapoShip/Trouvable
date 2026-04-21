'use client';

import AuditSiteProfile from '@/components/audit/AuditSiteProfile';
import AuditExecutiveSummary from '@/components/audit/AuditExecutiveSummary';
import AuditPriorityProblems from '@/components/audit/AuditPriorityProblems';
import AuditOpportunitySummary from '@/components/audit/AuditOpportunitySummary';
import AuditCitabilitySection from '@/components/audit/AuditCitabilitySection';

import { LabEmptyState, LabSectionHeader, LabStableSection } from './LabPrimitives';
import { getDimensions, getFinalStableScores, scoreToneClass } from './audit-lab-model';

function ScoreCard({ label, value, primary = false, subLabel }) {
    const toneClass = value != null ? scoreToneClass(value) : 'text-white/25';
    return (
        <div className={`flex flex-col items-center gap-1 rounded-xl px-5 py-3 ${
            primary
                ? 'bg-gradient-to-br from-violet-500/[0.14] to-violet-600/[0.04] border border-violet-400/25 shadow-[0_0_32px_rgba(139,92,246,0.15)]'
                : 'bg-white/[0.035] border border-white/[0.08]'
        }`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`font-['Plus_Jakarta_Sans',sans-serif] ${primary ? 'text-[44px] leading-none' : 'text-2xl'} font-extrabold tabular-nums ${primary ? 'text-white/95' : toneClass}`}>
                    {value != null ? value : '–'}
                </span>
                {value != null && <span className="text-[11px] text-white/30">/100</span>}
            </div>
            {subLabel && <span className="mt-0.5 text-[10px] text-white/40">{subLabel}</span>}
        </div>
    );
}

function DimensionRow({ dimension }) {
    const score = typeof dimension?.score === 'number' ? dimension.score : null;
    const toneClass = score != null ? scoreToneClass(score) : 'text-white/30';
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/85">{dimension.label || dimension.id}</div>
                {dimension.summary && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/45">{dimension.summary}</p>
                )}
            </div>
            <div className="shrink-0 text-right">
                <div className={`text-base font-extrabold tabular-nums ${toneClass}`}>
                    {score != null ? score : '—'}
                    <span className="text-[10px] text-white/25">/100</span>
                </div>
                {dimension.applicability && (
                    <div className="text-[9px] uppercase tracking-wider text-white/30">{dimension.applicability}</div>
                )}
            </div>
        </div>
    );
}

/**
 * Section A — canonical Trouvable product truth.
 *
 * Dominant hero with the SINGLE final Trouvable score (hybrid), plus the
 * existing polished audit components already used in the operator workspace.
 * Layer 1 raw and Layer 2 expert data are intentionally NOT rendered here —
 * they live in clearly-labeled diagnostic sections below.
 */
export default function AuditLabStableResult({ audit }) {
    if (!audit) {
        return (
            <LabStableSection>
                <LabSectionHeader
                    eyebrow="Section A · Vue d'ensemble"
                    title="Aucun audit enregistré pour ce mandat"
                    subtitle="Lancez un audit depuis la section précédente pour obtenir le score Trouvable, les priorités et les points forts."
                    variant="stable"
                />
                <LabEmptyState
                    title="En attente d'un premier audit"
                    description="Le score Trouvable, les problèmes prioritaires et les opportunités apparaîtront ici dès qu'un audit aura été exécuté."
                />
            </LabStableSection>
        );
    }

    const scores = getFinalStableScores(audit);
    const dimensions = getDimensions(audit);

    return (
        <LabStableSection>
            <LabSectionHeader
                eyebrow="Section A · Vue d'ensemble — vérité client"
                title="Score Trouvable final"
                subtitle="C'est le seul score à communiquer au client. Les scores SEO et GEO sont des composantes internes ; ils contribuent au score Trouvable sans le remplacer."
                variant="stable"
            />

            <div className="flex flex-wrap items-center justify-center gap-4">
                <ScoreCard
                    label="Score Trouvable"
                    value={scores.finalScore}
                    primary
                    subLabel="score officiel du mandat"
                />
                <div className="hidden sm:block h-12 w-px bg-white/[0.06]" />
                <ScoreCard label="SEO technique" value={scores.seoScore} subLabel="composante" />
                <ScoreCard label="GEO" value={scores.geoScore} subLabel="composante" />
            </div>

            {scores.llmStatus && (
                <p className="mt-3 text-center text-[11px] text-white/40">
                    Analyse IA : {scores.llmStatus === 'available' ? 'disponible' : scores.llmStatus === 'failed' ? 'dégradée' : scores.llmStatus}
                </p>
            )}

            {dimensions.length > 0 && (
                <div className="mt-5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.10em] text-white/40">Dimensions</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {dimensions.map((dim) => (
                            <DimensionRow key={dim.id || dim.label} dimension={dim} />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 space-y-5">
                <AuditSiteProfile audit={audit} />
                <AuditExecutiveSummary audit={audit} />
                <AuditPriorityProblems audit={audit} />
                <AuditOpportunitySummary audit={audit} />
                <AuditCitabilitySection audit={audit} />
            </div>
        </LabStableSection>
    );
}
