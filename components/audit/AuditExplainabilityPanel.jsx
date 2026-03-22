'use client';

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeIssue(issue, index) {
    if (typeof issue === 'string') {
        return {
            id: `issue-${index}`,
            title: issue,
            description: issue,
            priority: 'medium',
            category: 'seo',
            evidence_status: 'not_found',
            evidence_summary: '',
            recommended_fix: '',
            provenance: 'observed',
        };
    }

    return {
        id: `issue-${index}`,
        title: issue?.title || issue?.description || 'Problème',
        description: issue?.description || issue?.title || 'Problème',
        priority: issue?.priority || issue?.severity || 'medium',
        category: issue?.category || 'seo',
        evidence_status: issue?.evidence_status || 'not_found',
        evidence_summary: issue?.evidence_summary || '',
        recommended_fix: issue?.recommended_fix || '',
        provenance: issue?.provenance || 'observed',
    };
}

function normalizeStrength(strength, index) {
    if (typeof strength === 'string') {
        return {
            id: `strength-${index}`,
            title: strength,
            description: strength,
            evidence_summary: '',
            provenance: 'observed',
        };
    }

    return {
        id: `strength-${index}`,
        title: strength?.title || strength?.description || 'Point fort',
        description: strength?.description || strength?.title || 'Point fort',
        evidence_summary: strength?.evidence_summary || '',
        provenance: strength?.provenance || 'observed',
    };
}

function getPriorityTone(priority) {
    if (priority === 'high') return 'bg-red-400/10 text-red-300 border-red-400/20';
    if (priority === 'low') return 'bg-white/[0.05] text-white/55 border-white/10';
    return 'bg-amber-400/10 text-amber-200 border-amber-400/20';
}

function getProvenanceMeta(value) {
    if (value === 'derived') {
        return { label: 'Dérivé', tone: 'bg-violet-400/10 text-violet-300 border-violet-400/20' };
    }
    if (value === 'inferred') {
        return { label: 'Déduit', tone: 'bg-amber-400/10 text-amber-200 border-amber-400/20' };
    }
    return { label: 'Observé', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' };
}

function getEvidenceStatusMeta(value) {
    if (value === 'detected') return { label: 'Détecté', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' };
    if (value === 'weak_evidence') return { label: 'Preuve faible', tone: 'bg-amber-400/10 text-amber-200 border-amber-400/20' };
    if (value === 'not_applicable') return { label: 'Pertinence faible', tone: 'bg-white/[0.05] text-white/55 border-white/10' };
    return { label: 'Non trouvé', tone: 'bg-red-400/10 text-red-300 border-red-400/20' };
}

function Pill({ label, tone }) {
    return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${tone}`}>{label}</span>;
}

function ScoreCard({ dimension }) {
    const accent = dimension.score >= 80 ? 'text-emerald-300' : dimension.score >= 60 ? 'text-violet-300' : dimension.score >= 40 ? 'text-amber-200' : 'text-red-300';
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/35">{dimension.label}</div>
                    <div className={`mt-2 text-3xl font-extrabold tabular-nums ${accent}`}>{dimension.score}<span className="text-base text-white/25">/100</span></div>
                </div>
                <Pill label={dimension.applicability} tone="bg-white/[0.05] text-white/55 border-white/10" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/50">{dimension.summary}</p>
        </div>
    );
}

export default function AuditExplainabilityPanel({ audit, showPages = false, compact = false }) {
    const breakdown = audit?.geo_breakdown?.dimensions ? audit.geo_breakdown : audit?.seo_breakdown?.dimensions ? audit.seo_breakdown : null;
    const siteClassification = breakdown?.site_classification || null;
    const dimensions = toArray(breakdown?.dimensions);
    const aiAnalysis = audit?.geo_breakdown?.ai_analysis || null;
    const issues = toArray(audit?.issues).map(normalizeIssue);
    const strengths = toArray(audit?.strengths).map(normalizeStrength);
    const pages = showPages ? toArray(audit?.scanned_pages) : [];

    if (!audit) return null;

    return (
        <div className="space-y-4">
            {siteClassification && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/35">Profil de site détecté</div>
                            <div className="mt-1 text-lg font-semibold text-white/90">{siteClassification.label}</div>
                            <div className="mt-2 text-xs leading-relaxed text-white/45">
                                {toArray(siteClassification.reasons).length > 0
                                    ? toArray(siteClassification.reasons).map((reason) => reason.label).join(' | ')
                                    : 'Le type de site a été déduit à partir de la structure observée, du langage et des signaux schema.'}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Pill label={`Indice de confiance : ${siteClassification.confidence || 'faible'}`} tone="bg-white/[0.05] text-white/60 border-white/10" />
                            <Pill label="Observé + dérivé" tone="bg-violet-400/10 text-violet-300 border-violet-400/20" />
                        </div>
                    </div>
                    {toArray(siteClassification.evidence_summary).length > 0 && (
                        <div className="mt-3 text-[11px] text-white/40">
                            Preuves : {toArray(siteClassification.evidence_summary).join(', ')}
                        </div>
                    )}
                </div>
            )}

            {dimensions.length > 0 && (
                <div className={`grid gap-3 ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5'}`}>
                    {dimensions.map((dimension) => (
                        <ScoreCard key={dimension.key} dimension={dimension} />
                    ))}
                </div>
            )}

            {aiAnalysis && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/90">Couche de synthèse IA</div>
                        <Pill label={aiAnalysis.status === 'available' ? 'Généré' : 'Solution de repli'} tone={aiAnalysis.status === 'available' ? 'bg-amber-400/10 text-amber-200 border-amber-400/20' : 'bg-white/[0.05] text-white/55 border-white/10'} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{aiAnalysis.business_summary || 'Aucun résumé IA disponible.'}</p>
                    {aiAnalysis.geo_recommendability_rationale && (
                        <p className="mt-2 text-xs leading-relaxed text-white/45">{aiAnalysis.geo_recommendability_rationale}</p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/90">Problèmes prioritaires</div>
                        <Pill label={`${issues.length} problème(s)`} tone="bg-red-400/10 text-red-300 border-red-400/20" />
                    </div>
                    {issues.length === 0 ? (
                        <p className="mt-3 text-xs text-white/45">Aucun problème majeur n&apos;a été détecté lors de cet audit.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {issues.map((issue) => {
                                const evidenceStatus = getEvidenceStatusMeta(issue.evidence_status);
                                const provenance = getProvenanceMeta(issue.provenance);
                                return (
                                    <div key={issue.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-sm font-semibold text-white/90">{issue.title}</div>
                                            <Pill label={issue.priority} tone={getPriorityTone(issue.priority)} />
                                            <Pill label={issue.category} tone="bg-white/[0.05] text-white/55 border-white/10" />
                                            <Pill label={evidenceStatus.label} tone={evidenceStatus.tone} />
                                            <Pill label={provenance.label} tone={provenance.tone} />
                                        </div>
                                        <p className="mt-2 text-xs leading-relaxed text-white/55">{issue.description}</p>
                                        {issue.evidence_summary && (
                                            <p className="mt-2 text-[11px] leading-relaxed text-white/40">Preuves : {issue.evidence_summary}</p>
                                        )}
                                        {issue.recommended_fix && (
                                            <p className="mt-2 text-[11px] leading-relaxed text-white/45">Piste de résolution : {issue.recommended_fix}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/90">Scores d'opportunité</div>
                        <Pill label={`${strengths.length} opportunité(s)`} tone="bg-emerald-400/10 text-emerald-300 border-emerald-400/20" />
                    </div>
                    {strengths.length === 0 ? (
                        <p className="mt-3 text-xs text-white/45">Aucune opportunité majeure n&apos;a été détectée lors de cet audit.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {strengths.map((strength) => {
                                const provenance = getProvenanceMeta(strength.provenance);
                                return (
                                    <div key={strength.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-sm font-semibold text-white/90">{strength.title}</div>
                                            <Pill label={provenance.label} tone={provenance.tone} />
                                        </div>
                                        <p className="mt-2 text-xs leading-relaxed text-white/55">{strength.description}</p>
                                        {strength.evidence_summary && (
                                            <p className="mt-2 text-[11px] leading-relaxed text-white/40">Niveau de preuve : {strength.evidence_summary}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showPages && pages.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white/90">Pages analysées</div>
                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {pages.map((page, index) => (
                            <div key={`${page.url}-${index}`} className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={page.success ? 'Détecté' : 'Preuve faible'} tone={page.success ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' : 'bg-amber-400/10 text-amber-200 border-amber-400/20'} />
                                    <Pill label={page.page_type || 'inconnu'} tone="bg-white/[0.05] text-white/55 border-white/10" />
                                    <span className="text-[11px] text-white/35">{page.status_code || 'Err.'}</span>
                                </div>
                                <div className="mt-2 text-xs font-medium text-white/75 break-all">{page.url}</div>
                                {page.error_message && <div className="mt-2 text-[11px] text-red-300">{page.error_message}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
