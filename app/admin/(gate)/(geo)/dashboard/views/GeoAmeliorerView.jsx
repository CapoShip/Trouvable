'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useGeoClient } from '../../context/GeoClientContext';
import { GeoEmptyPanel, GeoSidePanel } from '../components/GeoPremium';

const PRI_ORDER = { high: 0, medium: 1, low: 2 };

export default function GeoAmeliorerView() {
    const { client, audit, clientId, loading, opportunities, mergeSuggestionsPending, metrics } = useGeoClient();
    const issues = audit?.issues || [];
    const geoScore = audit?.geo_score ?? metrics?.geoScore ?? null;
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    const circumference = 2 * Math.PI * 36;
    const dashOffset = geoScore != null ? circumference - (geoScore / 100) * circumference : circumference;

    const byPriority = useMemo(() => {
        const buckets = { high: [], medium: [], low: [], other: [] };
        for (const o of opportunities || []) {
            const p = o.priority && PRI_ORDER[o.priority] !== undefined ? o.priority : 'other';
            if (p === 'other') buckets.other.push(o);
            else buckets[p].push(o);
        }
        return buckets;
    }, [opportunities]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    const hasOpps = (opportunities || []).length > 0;

    return (
        <div className="p-5 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
                <div>
                    <div className="text-2xl font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Améliorer
                    </div>
                    <p className="text-[13px] text-white/40 mt-1 max-w-2xl">
                        Actions issues des opportunités en base et du dernier audit pour {client?.client_name || 'ce client'} — pas de score
                        potentiel inventé.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {byPriority.high.length > 0 && (
                        <span className="geo-pill-r text-[10px]">{byPriority.high.length} critique(s)</span>
                    )}
                    {clientId ? (
                        <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-pri text-sm">
                            Fiche client
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="geo-premium-card p-4 border-l-4 border-l-red-400/80 bg-red-500/[0.04]">
                            <div className="text-[10px] font-bold text-red-300/90 uppercase tracking-wider">Critiques</div>
                            <div className="text-3xl font-bold mt-1">{byPriority.high.length}</div>
                            <div className="text-[10px] text-white/35 mt-1">priority = high</div>
                        </div>
                        <div className="geo-premium-card p-4 border-l-4 border-l-amber-400/80 bg-amber-500/[0.04]">
                            <div className="text-[10px] font-bold text-amber-200/90 uppercase tracking-wider">Importantes</div>
                            <div className="text-3xl font-bold mt-1">{byPriority.medium.length}</div>
                            <div className="text-[10px] text-white/35 mt-1">priority = medium</div>
                        </div>
                        <div className="geo-premium-card p-4 border-l-4 border-l-emerald-400/70 bg-emerald-500/[0.04]">
                            <div className="text-[10px] font-bold text-emerald-300/90 uppercase tracking-wider">Quick wins</div>
                            <div className="text-3xl font-bold mt-1">{byPriority.low.length}</div>
                            <div className="text-[10px] text-white/35 mt-1">priority = low</div>
                        </div>
                    </div>

                    {!hasOpps ? (
                        <GeoEmptyPanel
                            title="Aucune opportunité ouverte"
                            description="Les opportunités sont créées côté produit / audit. Aucun score potentiel n’est affiché tant qu’il n’est pas calculé à partir de règles réelles."
                        >
                            <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-pri">
                                Vue audit
                            </Link>
                        </GeoEmptyPanel>
                    ) : (
                        <div className="space-y-6">
                            {['high', 'medium', 'low', 'other'].map((pri) => {
                                const list = byPriority[pri];
                                if (!list.length) return null;
                                const title =
                                    pri === 'high'
                                        ? 'Critiques'
                                        : pri === 'medium'
                                          ? 'Importantes'
                                          : pri === 'low'
                                            ? 'Quick wins'
                                            : 'Autres priorités';
                                const border =
                                    pri === 'high'
                                        ? 'border-red-400/40'
                                        : pri === 'medium'
                                          ? 'border-amber-400/40'
                                          : pri === 'low'
                                            ? 'border-emerald-400/40'
                                            : 'border-white/20';
                                return (
                                    <div key={pri}>
                                        <div className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-2">{title}</div>
                                        <div className="space-y-2">
                                            {list.map((o) => (
                                                <div key={o.id} className={`geo-card p-4 border ${border} bg-white/[0.02]`}>
                                                    <div className="flex flex-col md:flex-row md:items-start gap-3 justify-between">
                                                        <div>
                                                            <div className="font-semibold text-[var(--geo-t1)]">{o.title}</div>
                                                            <p className="text-xs text-[var(--geo-t2)] mt-1 leading-relaxed">{o.description}</p>
                                                            {o.category && (
                                                                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/45">
                                                                    {o.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-ghost text-xs py-1.5">
                                                                Audit
                                                            </Link>
                                                            <Link href={`${baseHref}?view=prompts`} className="geo-btn geo-btn-pri text-xs py-1.5">
                                                                Prompts
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {issues.length > 0 && (
                        <div>
                            <div className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-2">Issues structurées (dernier audit)</div>
                            <div className="space-y-2">
                                {issues.map((issue, i) => (
                                    <div key={i} className="geo-card p-4 border-l-4 border-l-[var(--geo-amber)]">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-[var(--geo-amber-bg)]">!</div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-[var(--geo-t1)] mb-1">
                                                    {typeof issue === 'object' ? issue.title || issue.description || 'Issue' : issue}
                                                </div>
                                                {typeof issue === 'object' && issue.description && (
                                                    <div className="text-[11px] text-[var(--geo-t2)] leading-relaxed">{issue.description}</div>
                                                )}
                                            </div>
                                            <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-pri text-xs py-1.5 px-3 shrink-0">
                                                Audit →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <GeoSidePanel title="Score GEO (audit)">
                        <div className="text-center mb-2">
                            <div className="relative w-[90px] h-[90px] mx-auto">
                                <svg width="90" height="90" viewBox="0 0 90 90">
                                    <circle cx="45" cy="45" r="36" fill="none" stroke="var(--geo-s3)" strokeWidth="10" />
                                    {geoScore != null && (
                                        <circle
                                            cx="45"
                                            cy="45"
                                            r="36"
                                            fill="none"
                                            stroke={geoScore >= 70 ? 'var(--geo-green)' : geoScore >= 50 ? '#f59e0b' : 'var(--geo-red)'}
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={dashOffset}
                                            transform="rotate(-90 45 45)"
                                        />
                                    )}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold">{geoScore != null ? geoScore : '—'}</span>
                                    <span className="text-[9px] text-[var(--geo-t3)]">GEO</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-white/35 text-center">Indicateur issu du dernier audit — pas une note temps réel des LLM.</p>
                    </GeoSidePanel>

                    <GeoSidePanel title="Merge en attente">
                        {(!mergeSuggestionsPending || mergeSuggestionsPending.length === 0) && (
                            <p className="text-xs text-white/35">Aucune suggestion pending.</p>
                        )}
                        {(mergeSuggestionsPending || []).slice(0, 6).map((s) => (
                            <div key={s.id} className="text-xs border-b border-white/[0.06] py-2 last:border-0">
                                <span className="font-mono text-violet-300/90">{s.field_name}</span>
                                <div className="text-white/45 mt-1 line-clamp-2">{s.suggested_value}</div>
                            </div>
                        ))}
                    </GeoSidePanel>

                    <GeoSidePanel title="Navigation">
                        <div className="space-y-2">
                            <Link
                                href={`${baseHref}?view=audit`}
                                className="flex items-center gap-2 px-3 py-2 rounded-[var(--geo-r)] bg-[var(--geo-s2)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] text-xs font-medium text-[var(--geo-t1)] transition-colors w-full"
                            >
                                Audit
                            </Link>
                            <Link
                                href={`${baseHref}?view=prompts`}
                                className="flex items-center gap-2 px-3 py-2 rounded-[var(--geo-r)] bg-[var(--geo-s2)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] text-xs font-medium text-[var(--geo-t1)] transition-colors w-full"
                            >
                                Prompts suivis
                            </Link>
                            <Link
                                href={`${baseHref}?view=cockpit`}
                                className="flex items-center gap-2 px-3 py-2 rounded-[var(--geo-r)] bg-[var(--geo-s2)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] text-xs font-medium text-[var(--geo-t1)] transition-colors w-full"
                            >
                                Cockpit
                            </Link>
                        </div>
                    </GeoSidePanel>
                </div>
            </div>
        </div>
    );
}
