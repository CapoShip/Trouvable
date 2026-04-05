'use client';

import { collectAllBlocks, computePageStats, extractLlmsTxtStatus, extractCrawlerStatus, getScoreTone, getScoreBg, Pill } from './audit-helpers';

function SubScoreBar({ label, value, max = 25 }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const tone = pct >= 70 ? 'bg-emerald-400' : pct >= 45 ? 'bg-amber-400' : 'bg-red-400';
    const glow = pct >= 70 ? 'shadow-[0_0_6px_rgba(52,211,153,0.3)]' : pct >= 45 ? 'shadow-[0_0_6px_rgba(251,191,36,0.25)]' : 'shadow-[0_0_6px_rgba(248,113,113,0.2)]';
    return (
        <div className="flex items-center gap-2">
            <span className="w-[80px] shrink-0 text-[11px] text-white/55 font-medium">{label}</span>
            <div className="relative h-[6px] flex-1 rounded-full bg-white/[0.08]">
                <div className={`absolute inset-y-0 left-0 rounded-full ${tone} ${glow}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`w-[32px] text-right text-[10px] font-semibold tabular-nums ${pct >= 70 ? 'text-emerald-300/80' : pct >= 45 ? 'text-amber-300/80' : 'text-red-300/80'}`}>{value}/{max}</span>
        </div>
    );
}

function CompactBlockCard({ block, accent }) {
    const score = block.citability_score ?? 0;
    const sub = block.sub_scores || {};
    const heading = block.heading || 'Sans titre';
    const sample = block.text_sample || '';
    const isStrong = accent === 'strong';
    const borderClass = isStrong
        ? 'bg-gradient-to-r from-emerald-500/[0.10] via-emerald-500/[0.04] to-transparent border-emerald-400/30'
        : 'bg-gradient-to-r from-red-500/[0.10] via-red-500/[0.04] to-transparent border-red-400/30';
    const scorePill = isStrong
        ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30'
        : score >= 30 ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' : 'bg-red-400/15 text-red-300 border-red-400/30';

    return (
        <div className={`rounded-xl border p-4 ${borderClass}`}>
            <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-white/95 truncate">{heading}</span>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${scorePill}`}>
                    {score}
                </span>
            </div>
            {sample && <p className="mt-2 text-[12px] leading-relaxed text-white/55 line-clamp-2">{sample}</p>}
            <div className="mt-3 space-y-1.5">
                <SubScoreBar label="Spécificité" value={sub.specificity ?? 0} />
                <SubScoreBar label="Autonomie" value={sub.self_containment ?? 0} />
                <SubScoreBar label="Densité rép." value={sub.answer_density ?? 0} />
                <SubScoreBar label="Densité fact." value={sub.factual_density ?? 0} />
            </div>
        </div>
    );
}

function StatusIndicator({ label, ok }) {
    return (
        <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${ok ? 'bg-emerald-400/[0.06] border border-emerald-400/15' : 'bg-amber-400/[0.06] border border-amber-400/15'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]'}`} />
            <span className={`text-[11px] font-medium ${ok ? 'text-emerald-300/80' : 'text-amber-300/80'}`}>{label}</span>
        </div>
    );
}

export default function AuditCitabilitySection({ audit }) {
    if (!audit) return null;

    const allBlocks = collectAllBlocks(audit);
    const stats = computePageStats(audit);
    const llmsStatus = extractLlmsTxtStatus(audit);
    const crawlerStatus = extractCrawlerStatus(audit);

    const strongBlocks = allBlocks.filter((b) => b.citability_score >= 60).sort((a, b) => b.citability_score - a.citability_score);
    const weakBlocks = allBlocks.filter((b) => b.citability_score < 30).sort((a, b) => a.citability_score - b.citability_score);

    const hasData = allBlocks.length > 0 || llmsStatus || crawlerStatus;
    if (!hasData) return null;

    return (
        <div className="cmd-surface p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-base font-bold text-white/95">Citabilité &amp; extractabilité</div>
                    <div className="mt-0.5 text-[11px] text-white/45">Potentiel de citation par les moteurs IA</div>
                </div>
                {stats.avgScore != null && (
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className={`text-3xl font-extrabold tabular-nums ${getScoreTone(stats.avgScore)}`}>{stats.avgScore}</span>
                            <span className="text-sm text-white/30">/100</span>
                        </div>
                        <div className="text-[11px] font-medium text-white/45 mt-0.5">Score moyen</div>
                        <div className="mt-1.5 h-1.5 w-20 rounded-full bg-white/[0.08] overflow-hidden ml-auto">
                            <div className={`h-full rounded-full ${stats.avgScore >= 60 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]' : stats.avgScore >= 40 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.3)]'}`} style={{ width: `${stats.avgScore}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Compact stats + status indicators */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
                {stats.totalBlocks > 0 && (
                    <>
                        <StatChip label="Pages" value={stats.totalPages} />
                        <StatChip label="Blocs" value={stats.totalBlocks} />
                        <StatChip label="Citables" value={stats.highBlocks} accent="emerald" />
                        <StatChip label="À réécrire" value={stats.lowBlocks} accent="red" />
                    </>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {crawlerStatus && <StatusIndicator label={crawlerStatus.ok ? 'Crawlers OK' : 'Crawlers bloqués'} ok={crawlerStatus.ok} />}
                    {llmsStatus && <StatusIndicator label={llmsStatus.found ? 'llms.txt OK' : 'llms.txt manquant'} ok={llmsStatus.found} />}
                </div>
            </div>

            {/* Strong + Weak blocks side by side */}
            {(strongBlocks.length > 0 || weakBlocks.length > 0) && (
                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {strongBlocks.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-300">Blocs prêts à être cités</span>
                                <Pill label={`${strongBlocks.length}`} tone="bg-emerald-400/10 text-emerald-300 border-emerald-400/20" />
                            </div>
                            <div className="space-y-2">
                                {strongBlocks.slice(0, 3).map((block) => (
                                    <CompactBlockCard key={block.block_id || `${block.page_url}-${block.heading}`} block={block} accent="strong" />
                                ))}
                                {strongBlocks.length > 3 && (
                                    <p className="text-[10px] text-white/30">+ {strongBlocks.length - 3} bloc{strongBlocks.length - 3 > 1 ? 's' : ''} supplémentaire{strongBlocks.length - 3 > 1 ? 's' : ''}</p>
                                )}
                            </div>
                        </div>
                    )}
                    {weakBlocks.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-xs font-bold text-red-300">Blocs à améliorer</span>
                                <Pill label={`${weakBlocks.length}`} tone="bg-red-400/10 text-red-300 border-red-400/20" />
                            </div>
                            <div className="space-y-2">
                                {weakBlocks.slice(0, 3).map((block) => (
                                    <CompactBlockCard key={block.block_id || `${block.page_url}-${block.heading}`} block={block} accent="weak" />
                                ))}
                                {weakBlocks.length > 3 && (
                                    <p className="text-[10px] text-white/30">+ {weakBlocks.length - 3} bloc{weakBlocks.length - 3 > 1 ? 's' : ''} supplémentaire{weakBlocks.length - 3 > 1 ? 's' : ''}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {allBlocks.length === 0 && (
                <p className="mt-3 text-xs text-white/40">Aucun bloc analysé — le site n&apos;expose pas assez de contenu structuré sous des titres clairs.</p>
            )}
        </div>
    );
}

function StatChip({ label, value, accent }) {
    const accentClass = accent === 'emerald' ? 'text-emerald-300' : accent === 'red' ? 'text-red-300' : 'text-white/90';
    const bgClass = accent === 'emerald'
        ? 'bg-emerald-400/[0.07] border-emerald-400/20'
        : accent === 'red'
            ? 'bg-red-400/[0.07] border-red-400/20'
            : 'bg-white/[0.05] border-white/[0.10]';
    return (
        <div className={`rounded-lg px-3.5 py-2 border ${bgClass}`}>
            <span className={`text-lg font-bold tabular-nums ${accentClass}`}>{value}</span>
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/45">{label}</div>
        </div>
    );
}
