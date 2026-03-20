'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useGeoClient } from '../../context/GeoClientContext';
import { GeoPremiumCard } from '../components/GeoPremium';

function fmtDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

export default function GeoPromptsView() {
    const { client, trackedQueries, lastRunByQuery, metrics, clientId, loading } = useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const stats = metrics?.trackedPromptStats;
    const list = trackedQueries || [];
    const [tab, setTab] = useState('all');

    const filtered = useMemo(() => {
        if (tab === 'all') return list;
        return list.filter((tq) => {
            const run = lastRunByQuery?.[tq.id];
            if (tab === 'mentioned') return run?.target_found === true;
            if (tab === 'not') return run && run.target_found === false;
            return true;
        });
    }, [list, lastRunByQuery, tab]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    const mentionRate = stats?.mentionRatePercent;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="text-2xl font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Prompts suivis
                    </div>
                    <p className="text-[13px] text-white/40 mt-1">
                        {stats?.total ?? list.length} requête{(stats?.total ?? list.length) !== 1 ? 's' : ''} surveillée
                        {client?.client_name ? ` · ${client.client_name}` : ''}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {clientId && (
                        <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-ghost border border-white/12">
                            + Optimiser les prompts
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Total prompts</div>
                    <div className="text-3xl font-bold text-white mt-2">{stats?.total ?? list.length}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Vous mentionné</div>
                    <div className="text-3xl font-bold text-emerald-400/95 mt-2">{stats?.withTargetFound ?? 0}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Non mentionné</div>
                    <div className="text-3xl font-bold text-red-400/90 mt-2">{stats?.withRunNoTarget ?? 0}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Taux de mention</div>
                    <div className="text-3xl font-bold text-[#a78bfa] mt-2">
                        {mentionRate != null ? `${mentionRate}%` : '—'}
                    </div>
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/25">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Tous les prompts</div>
                        <div className="text-[11px] text-white/35">{filtered.length} affiché{filtered.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="geo-tabs">
                        <button type="button" className={`geo-tab ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>
                            Tous
                        </button>
                        <button
                            type="button"
                            className={`geo-tab ${tab === 'mentioned' ? 'on' : ''}`}
                            onClick={() => setTab('mentioned')}
                        >
                            Mentionné
                        </button>
                        <button type="button" className={`geo-tab ${tab === 'not' ? 'on' : ''}`} onClick={() => setTab('not')}>
                            Non cité
                        </button>
                    </div>
                </div>
                {filtered.length === 0 ? (
                    <div className="p-10 text-center text-sm text-white/35">Aucun prompt dans ce filtre.</div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        {filtered.map((tq) => {
                            const run = lastRunByQuery?.[tq.id];
                            const ok = run?.target_found === true;
                            const bad = run && run.target_found === false;
                            return (
                                <div
                                    key={tq.id}
                                    className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div
                                            className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                                ok
                                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                                    : bad
                                                      ? 'border-red-500/35 bg-red-500/10 text-red-400'
                                                      : 'border-white/15 bg-white/[0.04] text-white/35'
                                            }`}
                                        >
                                            {ok ? <Check className="w-4 h-4" /> : bad ? <X className="w-4 h-4" /> : <span className="text-xs">…</span>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm text-white/90 font-medium leading-snug">{tq.query_text}</div>
                                            <div className="text-[11px] text-white/35 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                <span>{tq.locale || '—'}</span>
                                                <span>{tq.query_type || tq.category || 'general'}</span>
                                                {run && (
                                                    <span className="font-mono text-white/45">
                                                        {run.provider} · {run.model}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 justify-between lg:justify-end shrink-0 lg:min-w-[200px]">
                                        {run?.target_position != null && ok && (
                                            <span className="geo-pill-pg text-[10px]">#{run.target_position}</span>
                                        )}
                                        {run && (
                                            <span className="text-[11px] text-white/35 font-mono whitespace-nowrap">
                                                {fmtDate(run.created_at)}
                                            </span>
                                        )}
                                        {!run && (
                                            <Link href={clientId ? `/admin/clients/${clientId}` : '#'} className="geo-btn geo-btn-ghost text-[10px] py-1">
                                                Lancer un run
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GeoPremiumCard>
        </div>
    );
}
