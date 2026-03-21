'use client';

import Link from 'next/link';

export default function ClientTrackedQueries({ clientId, initialQueries = [] }) {
    const total = initialQueries.length;
    const active = initialQueries.filter((item) => item.is_active).length;

    return (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white mb-1">Tracked prompts</h2>
                    <p className="text-sm text-white/40 mb-4">
                        La gestion complete des prompts et de leur performance vit maintenant dans le workspace GEO.
                    </p>
                </div>
                <Link href={`/admin/dashboard/${clientId}?view=prompts`} className="geo-btn geo-btn-pri">
                    Ouvrir le workspace prompts
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Total</div>
                    <div className="text-3xl font-bold text-white mt-2">{total}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Actifs</div>
                    <div className="text-3xl font-bold text-emerald-400 mt-2">{active}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Inactifs</div>
                    <div className="text-3xl font-bold text-white mt-2">{Math.max(total - active, 0)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Role</div>
                    <div className="text-sm font-semibold text-white mt-3">Summary only</div>
                </div>
            </div>

            {total === 0 ? (
                <p className="text-sm text-white/35 italic">
                    Aucun tracked prompt. Ajoutez vos premiers prompts depuis le workspace GEO pour generer des runs observes.
                </p>
            ) : (
                <ul className="space-y-2">
                    {initialQueries.slice(0, 6).map((query) => (
                        <li key={query.id} className="flex flex-wrap items-center gap-3 justify-between bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm">
                            <div className="min-w-0 flex-1">
                                <div className="text-white/90 font-medium truncate">{query.query_text}</div>
                                <div className="text-xs text-white/35">
                                    {query.locale || '—'} · {query.category || query.query_type || '—'} · {query.is_active ? 'active' : 'inactive'}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
