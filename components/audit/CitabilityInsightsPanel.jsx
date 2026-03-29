'use client';

import { useCallback, useEffect, useState } from 'react';function toArray(v) {
    return Array.isArray(v) ? v : [];
}

function collectAllBlocks(audit) {
    const pageSummaries = toArray(audit?.extracted_data?.page_summaries);
    const blocks = [];
    for (const page of pageSummaries) {
        const topBlocks = toArray(page?.citability?.top_blocks);
        for (const block of topBlocks) {
            if (block && typeof block.citability_score === 'number') {
                blocks.push(block);
            }
        }
    }
    return blocks;
}

function extractLlmsTxtStatus(audit) {
    const issues = toArray(audit?.issues);
    const strengths = toArray(audit?.strengths);

    const llmsIssue = issues.find((i) =>
        String(i?.title || '').toLowerCase().includes('llms.txt')
    );
    const llmsStrength = strengths.find((s) =>
        String(s?.title || '').toLowerCase().includes('llms.txt')
    );

    if (llmsStrength) {
        return { found: true, valid: true, label: llmsStrength.title, detail: llmsStrength.evidence_summary || llmsStrength.description };
    }
    if (llmsIssue) {
        return { found: false, valid: false, label: llmsIssue.title, detail: llmsIssue.recommended_fix || llmsIssue.evidence_summary };
    }
    return null;
}

function extractCrawlerStatus(audit) {
    const issues = toArray(audit?.issues);
    const strengths = toArray(audit?.strengths);

    const crawlerIssue = issues.find((i) =>
        String(i?.title || '').toLowerCase().includes('ai crawler')
    );
    const crawlerStrength = strengths.find((s) =>
        String(s?.title || '').toLowerCase().includes('ai crawler')
    );

    if (crawlerStrength) {
        return { ok: true, label: crawlerStrength.title, detail: crawlerStrength.evidence_summary || crawlerStrength.description };
    }
    if (crawlerIssue) {
        return { ok: false, label: crawlerIssue.title, detail: crawlerIssue.evidence_summary || crawlerIssue.recommended_fix };
    }
    return null;
}

function getScoreTone(score) {
    if (score >= 60) return 'text-emerald-300';
    if (score >= 40) return 'text-amber-200';
    return 'text-red-300';
}

function getScoreBg(score) {
    if (score >= 60) return 'bg-emerald-400/10 border-emerald-400/20';
    if (score >= 40) return 'bg-amber-400/10 border-amber-400/20';
    return 'bg-red-400/10 border-red-400/20';
}

function SubScoreBar({ label, value, max = 25 }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const tone = pct >= 70 ? 'bg-emerald-400/60' : pct >= 45 ? 'bg-amber-400/60' : 'bg-red-400/50';

    return (
        <div className="flex items-center gap-2">
            <span className="w-[90px] shrink-0 text-[10px] text-white/40">{label}</span>
            <div className="relative h-[5px] flex-1 rounded-full bg-white/[0.06]">
                <div className={`absolute inset-y-0 left-0 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-[28px] text-right text-[10px] tabular-nums text-white/50">{value}/{max}</span>
        </div>
    );
}

function BlockCard({ block, accent = 'default' }) {
    const score = block.citability_score ?? 0;
    const sub = block.sub_scores || {};
    const heading = block.heading || 'Sans titre';
    const sample = block.text_sample || '';
    const pageUrl = block.page_url || '';
    const shortUrl = pageUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

    return (
        <div className={`rounded-xl border p-4 ${accent === 'strong' ? 'border-emerald-400/15 bg-emerald-400/[0.03]' : accent === 'weak' ? 'border-red-400/15 bg-red-400/[0.03]' : 'border-white/[0.08] bg-black/20'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white/90 truncate">{heading}</span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${getScoreBg(score)} ${getScoreTone(score)}`}>
                            {score}/100
                        </span>
                        {block.block_type && (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/50">
                                {block.block_type}
                            </span>
                        )}
                    </div>
                    {shortUrl && (
                        <div className="mt-1 text-[10px] text-white/30 truncate">{shortUrl}</div>
                    )}
                </div>
            </div>

            {sample && (
                <p className="mt-3 text-xs leading-relaxed text-white/55 line-clamp-3">{sample}</p>
            )}

            <div className="mt-3 space-y-1.5">
                <SubScoreBar label="Spécificité" value={sub.specificity ?? 0} />
                <SubScoreBar label="Autonomie" value={sub.self_containment ?? 0} />
                <SubScoreBar label="Densité rép." value={sub.answer_density ?? 0} />
                <SubScoreBar label="Densité fact." value={sub.factual_density ?? 0} />
            </div>

            {block.word_count != null && (
                <div className="mt-2 text-[10px] text-white/30">{block.word_count} mots</div>
            )}
        </div>
    );
}

function StatusCard({ icon, title, detail, ok }) {
    const toneClass = ok
        ? 'border-emerald-400/15 bg-emerald-400/[0.03]'
        : 'border-amber-400/15 bg-amber-400/[0.03]';
    const iconTone = ok ? 'text-emerald-400' : 'text-amber-300';

    return (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${toneClass}`}>
            <span className={`mt-0.5 text-base ${iconTone}`}>{icon}</span>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white/90">{title}</div>
                {detail && <p className="mt-1 text-xs leading-relaxed text-white/50">{detail}</p>}
            </div>
        </div>
    );
}

function computePageStats(audit) {
    const pageSummaries = toArray(audit?.extracted_data?.page_summaries);
    let totalPages = 0;
    let totalBlocks = 0;
    let highBlocks = 0;
    let lowBlocks = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    for (const page of pageSummaries) {
        const cit = page?.citability;
        if (!cit) continue;
        totalPages++;
        totalBlocks += cit.block_count || 0;
        highBlocks += cit.high_citability_count || 0;
        lowBlocks += cit.low_citability_count || 0;
        if (typeof cit.page_score === 'number') {
            scoreSum += cit.page_score;
            scoreCount++;
        }
    }

    return {
        totalPages,
        totalBlocks,
        highBlocks,
        lowBlocks,
        avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
    };
}

function LlmsTxtDraftSection({ clientId, llmsFound }) {
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const fetchDraft = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/remediation/suggestions/${clientId}?type=llms_txt_missing`);
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const json = await res.json();
            const suggestions = json.suggestions || [];
            const latest = suggestions.find((s) => s.ai_output && s.status === 'draft');
            setDraft(latest || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchDraft();
    }, [fetchDraft]);

    async function handleGenerate() {
        if (!clientId || generating) return;
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/remediation/generate/${clientId}`, { method: 'POST' });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `Erreur ${res.status}`);
            }
            await fetchDraft();
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    }

    function handleCopy() {
        if (!draft?.ai_output) return;
        navigator.clipboard.writeText(draft.ai_output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const statusLabel = llmsFound
        ? 'Présent sur le site'
        : draft?.ai_output
            ? 'Brouillon disponible'
            : 'Manquant — aucun brouillon';

    const statusCls = llmsFound
        ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10'
        : draft?.ai_output
            ? 'text-amber-300 border-amber-400/20 bg-amber-400/10'
            : 'text-red-300 border-red-400/20 bg-red-400/10';

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-white/90">llms.txt — Brouillon opérateur</div>
                    <div className="mt-1 text-[11px] text-white/40">
                        Fichier de description lisible par les LLM, généré via la chaîne de remédiation
                    </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCls}`}>
                    {statusLabel}
                </span>
            </div>

            {loading && (
                <div className="text-[11px] text-white/35 animate-pulse">Chargement du brouillon…</div>
            )}

            {error && (
                <div className="text-[11px] text-red-300 bg-red-400/[0.06] rounded-lg px-3 py-2">{error}</div>
            )}

            {!loading && draft?.ai_output && (
                <div className="space-y-2">
                    <div className="relative rounded-xl border border-white/[0.08] bg-black/30 p-4 max-h-[400px] overflow-y-auto">
                        <pre className="text-xs leading-relaxed text-white/70 whitespace-pre-wrap font-mono">{draft.ai_output}</pre>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] text-white/30">
                            Généré le {new Date(draft.created_at).toLocaleDateString('fr-CA')} — statut : {draft.status}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all"
                            >
                                {copied ? '✓ Copié' : 'Copier'}
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={generating}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all disabled:opacity-40"
                            >
                                {generating ? 'Régénération…' : 'Régénérer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !draft?.ai_output && !llmsFound && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
                    <div className="text-xs text-white/50">
                        Aucun brouillon llms.txt n&apos;a été généré pour ce client.
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--geo-violet-bd,#7c3aed33)] bg-[#7c3aed10] px-4 py-2 text-[11px] font-semibold text-[#a78bfa] hover:bg-[#7c3aed20] transition-all disabled:opacity-40"
                    >
                        {generating ? 'Génération…' : 'Générer le brouillon'}
                    </button>
                </div>
            )}

            {llmsFound && !draft?.ai_output && (
                <div className="text-[11px] text-emerald-300/60">
                    Le fichier llms.txt est déjà présent sur le site — aucun brouillon nécessaire.
                </div>
            )}
        </div>
    );
}

export default function CitabilityInsightsPanel({ audit, clientId }) {
    if (!audit) return null;

    const allBlocks = collectAllBlocks(audit);
    const strongBlocks = allBlocks
        .filter((b) => b.citability_score >= 60)
        .sort((a, b) => b.citability_score - a.citability_score);
    const weakBlocks = allBlocks
        .filter((b) => b.citability_score < 30)
        .sort((a, b) => a.citability_score - b.citability_score);

    const llmsStatus = extractLlmsTxtStatus(audit);
    const crawlerStatus = extractCrawlerStatus(audit);
    const stats = computePageStats(audit);

    const hasData = allBlocks.length > 0 || llmsStatus || crawlerStatus;
    if (!hasData) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-white/90">Intelligence citabilité</div>
                        <div className="mt-1 text-[11px] text-white/40">
                            Blocs de contenu analysés pour leur potentiel de citation par les LLM
                        </div>
                    </div>
                    {stats.avgScore != null && (
                        <div className="text-right">
                            <div className={`text-2xl font-extrabold tabular-nums ${getScoreTone(stats.avgScore)}`}>
                                {stats.avgScore}<span className="text-sm text-white/25">/100</span>
                            </div>
                            <div className="text-[10px] text-white/35">score moyen</div>
                        </div>
                    )}
                </div>

                {stats.totalBlocks > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase text-white/35">Pages</div>
                            <div className="text-lg font-bold tabular-nums text-white/80">{stats.totalPages}</div>
                        </div>
                        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase text-white/35">Blocs</div>
                            <div className="text-lg font-bold tabular-nums text-white/80">{stats.totalBlocks}</div>
                        </div>
                        <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.03] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase text-emerald-300/60">Citables</div>
                            <div className="text-lg font-bold tabular-nums text-emerald-300">{stats.highBlocks}</div>
                        </div>
                        <div className="rounded-lg border border-red-400/15 bg-red-400/[0.03] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase text-red-300/60">À réécrire</div>
                            <div className="text-lg font-bold tabular-nums text-red-300">{stats.lowBlocks}</div>
                        </div>
                    </div>
                )}
            </div>

            {(llmsStatus || crawlerStatus) && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {crawlerStatus && (
                        <StatusCard
                            icon={crawlerStatus.ok ? '✓' : '⚠'}
                            title={crawlerStatus.label}
                            detail={crawlerStatus.detail}
                            ok={crawlerStatus.ok}
                        />
                    )}
                    {llmsStatus && (
                        <StatusCard
                            icon={llmsStatus.found ? '✓' : '⚠'}
                            title={llmsStatus.label}
                            detail={llmsStatus.detail}
                            ok={llmsStatus.found}
                        />
                    )}
                </div>
            )}

            {clientId && (
                <LlmsTxtDraftSection clientId={clientId} llmsFound={llmsStatus?.found ?? false} />
            )}

            {strongBlocks.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/90">Blocs prêts à être cités</div>
                        <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                            {strongBlocks.length} bloc{strongBlocks.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/40">
                        Contenu suffisamment spécifique et autonome pour être extrait et cité par un LLM.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {strongBlocks.slice(0, 6).map((block) => (
                            <BlockCard key={block.block_id || `${block.page_url}-${block.heading}`} block={block} accent="strong" />
                        ))}
                    </div>
                    {strongBlocks.length > 6 && (
                        <div className="mt-3 text-[11px] text-white/35">
                            + {strongBlocks.length - 6} bloc{strongBlocks.length - 6 > 1 ? 's' : ''} supplémentaire{strongBlocks.length - 6 > 1 ? 's' : ''} non affiché{strongBlocks.length - 6 > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {weakBlocks.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/90">Blocs à améliorer</div>
                        <span className="inline-flex items-center rounded-full border border-red-400/20 bg-red-400/10 px-2 py-1 text-[10px] font-semibold text-red-300">
                            {weakBlocks.length} bloc{weakBlocks.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/40">
                        Blocs trop vagues ou dépendants du contexte pour être cités de manière fiable — candidats prioritaires pour réécriture.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {weakBlocks.slice(0, 6).map((block) => (
                            <BlockCard key={block.block_id || `${block.page_url}-${block.heading}`} block={block} accent="weak" />
                        ))}
                    </div>
                    {weakBlocks.length > 6 && (
                        <div className="mt-3 text-[11px] text-white/35">
                            + {weakBlocks.length - 6} bloc{weakBlocks.length - 6 > 1 ? 's' : ''} supplémentaire{weakBlocks.length - 6 > 1 ? 's' : ''} non affiché{weakBlocks.length - 6 > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {allBlocks.length === 0 && (llmsStatus || crawlerStatus) && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
                    <div className="text-sm font-semibold text-white/70">Aucun bloc de contenu analysé</div>
                    <p className="mt-2 text-xs text-white/40">
                        L&apos;audit n&apos;a pas extrait de blocs de contenu suffisants pour l&apos;analyse de citabilité.
                        Vérifiez que le site expose du contenu textuel structuré sous des titres clairs.
                    </p>
                </div>
            )}
        </div>
    );
}
