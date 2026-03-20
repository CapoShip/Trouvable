function fmt(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

export default function ClientHistorySection({ audits = [], queryRuns = [] }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">Derniers audits</h2>
                {audits.length === 0 ? (
                    <p className="text-sm text-white/30">Aucun audit enregistré.</p>
                ) : (
                    <ul className="space-y-2 text-sm">
                        {audits.map((a) => (
                            <li key={a.id} className="border-b border-white/10 pb-2 last:border-0">
                                <div className="text-white/70">{fmt(a.created_at)}</div>
                                <div className="text-xs text-white/40">
                                    {a.scan_status || '—'}
                                    {a.seo_score != null && ` · SEO ${a.seo_score}`}
                                    {a.geo_score != null && ` · GEO ${a.geo_score}`}
                                </div>
                                {a.error_message && <div className="text-xs text-amber-400/90 mt-1">{a.error_message}</div>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">Derniers GEO query runs</h2>
                {queryRuns.length === 0 ? (
                    <p className="text-sm text-white/30">Aucun run.</p>
                ) : (
                    <ul className="space-y-2 text-sm">
                        {queryRuns.map((r) => (
                            <li key={r.id} className="border-b border-white/10 pb-2 last:border-0">
                                <div className="text-white/80 truncate">{r.query_text || '—'}</div>
                                <div className="text-xs text-white/40">
                                    {fmt(r.created_at)} · {r.status || '—'} · {r.provider || '—'}
                                    {r.target_found ? ' · marque détectée (proxy)' : ''}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
