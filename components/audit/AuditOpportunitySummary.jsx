'use client';

import { ProvenancePill } from '@/components/ui/ProvenancePill';
import { toArray, normalizeStrength, Pill } from './audit-helpers';

export default function AuditOpportunitySummary({ audit, maxVisible = 6 }) {
    const strengths = toArray(audit?.strengths).map(normalizeStrength);
    if (strengths.length === 0) return null;

    const grouped = {};
    for (const s of strengths) {
        const key = s.provenance || 'observed';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
    }

    const visible = strengths.slice(0, maxVisible);
    const remaining = strengths.length - visible.length;

    return (
        <div className="cmd-surface p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="text-base font-bold text-white/95">Opportunités détectées</div>
                <Pill label={`${strengths.length} opportunité${strengths.length !== 1 ? 's' : ''}`} tone="bg-emerald-400/10 text-emerald-300 border-emerald-400/20" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 xl:grid-cols-2">
                {visible.map((s, idx) => {
                    const isTopWin = idx < 2;
                    const cardClass = isTopWin
                        ? 'bg-gradient-to-r from-emerald-500/[0.08] to-transparent border-l-[3px] border-l-emerald-400/40 border-t border-r border-b border-t-white/[0.06] border-r-white/[0.06] border-b-white/[0.06]'
                        : 'border border-emerald-400/[0.10] bg-emerald-400/[0.03]';
                    return (
                        <div key={s.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${cardClass}`}>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`text-sm font-semibold ${isTopWin ? 'text-white/95' : 'text-white/90'}`}>{s.title}</span>
                                    <ProvenancePill value={s.provenance} />
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-white/55 line-clamp-2">{s.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {remaining > 0 && (
                <p className="mt-3 text-[11px] text-white/35">+ {remaining} opportunité{remaining > 1 ? 's' : ''} supplémentaire{remaining > 1 ? 's' : ''} — voir les détails complets ci-dessous.</p>
            )}
        </div>
    );
}
