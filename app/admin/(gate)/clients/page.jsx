import { getAdminSupabase } from '@/lib/supabase-admin';
import { enrichClientsWithOperationalSignals } from '@/lib/operator-data';
import Link from 'next/link';
import SearchBar from './SearchBar';
import PublishToggle from './PublishToggle';
import ClientListActions from './ClientListActions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Portefeuille — Trouvable Command',
};

const ITEMS_PER_PAGE = 50;

const ATTENTION_ORDER = { critical: 0, needs_attention: 1, watch: 2, stable: 3 };

function FreshnessIndicator({ dateStr }) {
    if (!dateStr) return null;
    const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    const color = hours < 24 ? 'bg-emerald-400' : hours < 72 ? 'bg-amber-400' : 'bg-red-400';
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />;
}

function AttentionBadge({ attention }) {
    const meta = {
        critical: {
            label: 'Critique',
            dot: 'bg-red-400',
            cls: 'bg-red-400/10 text-red-200/90 border-red-400/20',
        },
        needs_attention: {
            label: 'Action requise',
            dot: 'bg-amber-400',
            cls: 'bg-amber-400/8 text-amber-200/85 border-amber-400/18',
        },
        watch: {
            label: 'Surveillance',
            dot: 'bg-white/30',
            cls: 'bg-white/[0.04] text-white/45 border-white/[0.08]',
        },
        stable: {
            label: 'Stable',
            dot: 'bg-emerald-400',
            cls: 'bg-emerald-400/8 text-emerald-200/85 border-emerald-400/18',
        },
    };
    const m = meta[attention] || meta.stable;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.06em] px-2 py-[3px] rounded-md border ${m.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot} shrink-0 ${attention === 'critical' ? 'cmd-health-dot' : ''}`} />
            {m.label}
        </span>
    );
}

function PortfolioKpi({ label, value, accent = 'default' }) {
    const accents = {
        default: 'text-white/90',
        critical: 'text-red-300',
        warning: 'text-amber-300',
        success: 'text-emerald-300',
        blue: 'text-[#7b8fff]',
    };
    return (
        <div className="cmd-surface px-4 py-3 min-w-[120px] flex-1 cmd-animate-in">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-1.5">{label}</div>
            <div className={`text-[22px] font-bold tabular-nums tracking-[-0.03em] ${accents[accent] || accents.default}`}>
                {value}
            </div>
        </div>
    );
}

function PortfolioHealthBoard({ rows }) {
    const buckets = [
        { key: 'critical', label: 'Critique', color: '#f87171', bg: 'bg-red-400' },
        { key: 'needs_attention', label: 'Action requise', color: '#fbbf24', bg: 'bg-amber-400' },
        { key: 'watch', label: 'Surveillance', color: 'rgba(255,255,255,0.3)', bg: 'bg-white/30' },
        { key: 'stable', label: 'Stable', color: '#34d399', bg: 'bg-emerald-400' },
    ];

    const counts = {};
    buckets.forEach((b) => {
        counts[b.key] = rows.filter((r) => (r.operatorSignals?.attention || 'stable') === b.key).length;
    });
    const total = rows.length || 1;

    const activeBuckets = buckets.filter((b) => counts[b.key] > 0);
    if (activeBuckets.length <= 1) return null;

    return (
        <div className="cmd-surface px-5 py-4 cmd-animate-in">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-3">
                Distribution santé portefeuille
            </div>

            {/* Stacked health bar */}
            <div className="flex h-[8px] overflow-hidden rounded-full bg-white/[0.03] mb-3">
                {buckets.map((bucket) => {
                    const pct = (counts[bucket.key] / total) * 100;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={bucket.key}
                            className="h-full transition-all duration-700"
                            style={{
                                width: `${pct}%`,
                                background: bucket.color,
                                opacity: 0.65,
                                marginRight: 1,
                            }}
                        />
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {buckets.map((bucket) => {
                    if (counts[bucket.key] === 0) return null;
                    const pct = Math.round((counts[bucket.key] / total) * 100);
                    return (
                        <div key={bucket.key} className="flex items-center gap-2 text-[10px]">
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: bucket.color, opacity: 0.7 }}
                            />
                            <span className="text-white/40">{bucket.label}</span>
                            <span className="font-bold tabular-nums text-white/65">
                                {counts[bucket.key]}
                            </span>
                            <span className="text-white/20">({pct}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PortfolioFreshnessStrip({ rows }) {
    const now = Date.now();
    const withRun = rows.filter((r) => r.operatorSignals?.latestRunAt);
    if (withRun.length === 0) return null;

    const fresh = withRun.filter((r) => {
        const h = (now - new Date(r.operatorSignals.latestRunAt).getTime()) / 3600000;
        return h < 24;
    }).length;
    const aging = withRun.filter((r) => {
        const h = (now - new Date(r.operatorSignals.latestRunAt).getTime()) / 3600000;
        return h >= 24 && h < 72;
    }).length;
    const stale = withRun.filter((r) => {
        const h = (now - new Date(r.operatorSignals.latestRunAt).getTime()) / 3600000;
        return h >= 72;
    }).length;
    const noRun = rows.length - withRun.length;

    return (
        <div className="cmd-surface px-5 py-4 cmd-animate-in">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-3">
                Fraîcheur des données
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-emerald-300">{fresh}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">{'< 24h'}</div>
                </div>
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-amber-300">{aging}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">24-72h</div>
                </div>
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-red-300">{stale}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">{'> 72h'}</div>
                </div>
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-white/30">{noRun}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">Aucun</div>
                </div>
            </div>
        </div>
    );
}

function clientsListLink({ q, page, archived }) {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (page && page > 1) p.set('page', String(page));
    if (archived) p.set('archived', '1');
    const s = p.toString();
    return s ? `/admin/clients?${s}` : '/admin/clients';
}

export default async function AdminClientsPage({ searchParams }) {
    const paramsData = await searchParams;
    const rawQ = paramsData?.q || '';
    const q = rawQ.slice(0, 60).replace(/[^a-zA-Z0-9 -éèàùâêîôûç]/g, '').trim();
    const page = parseInt(paramsData?.page, 10) || 1;
    const showArchived = paramsData?.archived === '1';

    const supabase = getAdminSupabase();

    let query = supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, is_published, updated_at, archived_at', { count: 'exact' });

    if (showArchived) {
        query = query.not('archived_at', 'is', null);
    } else {
        query = query.is('archived_at', null);
    }

    if (q) {
        query = query.or(`client_name.ilike.%${q}%,client_slug.ilike.%${q}%`);
    }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: clients, count, error } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('[AdminClientsPage] Supabase error:', error);
    }

    let rows = clients || [];
    try {
        rows = await enrichClientsWithOperationalSignals(rows);
    } catch (enrichErr) {
        console.error('[AdminClientsPage] enrich signals:', enrichErr);
    }

    rows = [...rows].sort((a, b) => {
        const sa = a.operatorSignals?.attention || 'stable';
        const sb = b.operatorSignals?.attention || 'stable';
        const da = ATTENTION_ORDER[sa] ?? 9;
        const db = ATTENTION_ORDER[sb] ?? 9;
        if (da !== db) return da - db;
        const oa = a.operatorSignals?.openOpportunities ?? 0;
        const ob = b.operatorSignals?.openOpportunities ?? 0;
        if (oa !== ob) return ob - oa;
        return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

    const criticalCount = rows.filter((r) => r.operatorSignals?.attention === 'critical').length;
    const attentionCount = rows.filter((r) => r.operatorSignals?.attention === 'needs_attention').length;
    const stableCount = rows.filter((r) => r.operatorSignals?.attention === 'stable').length;
    const totalActions = rows.reduce((sum, r) => sum + (r.operatorSignals?.openOpportunities ?? 0), 0);
    const maxRunsWindow = Math.max(...rows.map((r) => r.operatorSignals?.completedRunsWindow ?? 0), 1);

    return (
        <div className="p-5 md:p-7 space-y-5 max-w-[1500px] mx-auto">
            {/* Portfolio header */}
            <div className="cmd-animate-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-white/95">Portefeuille</h1>
                        <p className="text-white/30 mt-1 text-[12px] max-w-lg leading-relaxed">
                            Supervision globale des mandats. Priorisez l&apos;attention par état moteur, alertes et file d&apos;actions.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <SearchBar />
                        <Link
                            href={showArchived ? '/admin/clients' : '/admin/clients?archived=1'}
                            className="geo-btn geo-btn-ghost"
                        >
                            {showArchived ? '← Mandats actifs' : 'Archives'}
                        </Link>
                        <Link href="/admin/clients/new" className="geo-btn geo-btn-pri">
                            + Nouveau mandat
                        </Link>
                    </div>
                </div>
            </div>

            {/* Portfolio overview strip */}
            {!showArchived && rows.length > 0 && (
                <>
                    <div className="flex flex-wrap gap-3">
                        <PortfolioKpi label="Mandats actifs" value={count ?? rows.length} accent="blue" />
                        {criticalCount > 0 && (
                            <PortfolioKpi label="Critiques" value={criticalCount} accent="critical" />
                        )}
                        {attentionCount > 0 && (
                            <PortfolioKpi label="Actions requises" value={attentionCount} accent="warning" />
                        )}
                        <PortfolioKpi label="Stables" value={stableCount} accent="success" />
                        <PortfolioKpi label="Actions en file" value={totalActions} accent="default" />
                    </div>

                    {/* Visual health panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <PortfolioHealthBoard rows={rows} />
                        <PortfolioFreshnessStrip rows={rows} />
                    </div>
                </>
            )}

            {/* Portfolio table */}
            <div className="cmd-surface-elevated overflow-hidden cmd-animate-in cmd-delay-1">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm text-[#9a9ba0]">
                        <thead className="border-b border-white/[0.06]">
                            <tr className="text-[9px] font-bold text-white/30 uppercase tracking-[0.1em]">
                                <th className="px-5 py-3.5 w-[220px]">Client</th>
                                <th className="px-5 py-3.5 text-center w-[130px]">État</th>
                                <th className="px-5 py-3.5">Signaux opérationnels</th>
                                <th className="px-5 py-3.5 text-center w-32">Publication</th>
                                <th className="px-5 py-3.5 w-40">Dernière activité</th>
                                <th className="px-5 py-3.5 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-red-300/80 font-medium text-sm">
                                        Une erreur est survenue lors du chargement du portefeuille.
                                    </td>
                                </tr>
                            ) : clients?.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center cmd-animate-in">
                                            <div className="w-14 h-14 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-4">
                                                <svg className="w-6 h-6 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                            <p className="text-[14px] font-semibold text-white/55">Aucun mandat trouvé</p>
                                            <p className="text-white/25 mt-1 text-[12px]">Créez un nouveau mandat ou ajustez votre recherche.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rows?.map((client, idx) => {
                                    const s = client.operatorSignals;
                                    const isCritical = s?.attention === 'critical';
                                    return (
                                    <tr
                                        key={client.id}
                                        className={`hover:bg-white/[0.025] transition-colors duration-200 align-top cmd-animate-in ${isCritical ? 'bg-red-500/[0.02]' : ''}`}
                                        style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                                    >
                                        <td className="px-5 py-3.5">
                                            <Link href={`/admin/clients/${client.id}/overview`} className="group block">
                                                <span className="font-semibold text-white/90 group-hover:text-[#a78bfa] transition-colors block truncate max-w-[200px] text-[13px]">
                                                    {client.client_name}
                                                </span>
                                                <span className="font-mono text-[10px] text-white/20 truncate block max-w-[200px] mt-0.5">{client.client_slug}</span>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {s ? <AttentionBadge attention={s.attention} /> : <span className="text-white/15 text-[10px]">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-[11px] text-white/40 leading-snug">
                                            {s ? (
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                                        <span>{s.activePrompts} prompts</span>
                                                        <span className="text-white/12">·</span>
                                                        <span>{s.openOpportunities} actions</span>
                                                        <span className="text-white/12">·</span>
                                                        <span>{s.completedRunsWindow} runs / 21j</span>
                                                    </div>
                                                    {(s.failedRunsWindow > 0 || s.lowConfidenceRunsWindow > 0) && (
                                                        <div className="text-amber-200/60 text-[10px]">
                                                            {s.failedRunsWindow > 0 && <span>{s.failedRunsWindow} échec(s) </span>}
                                                            {s.lowConfidenceRunsWindow > 0 && <span>{s.lowConfidenceRunsWindow} conf. basse</span>}
                                                        </div>
                                                    )}
                                                    {s.latestAuditAt && (
                                                        <div className="text-[10px] text-white/20">
                                                            Audit : {new Date(s.latestAuditAt).toLocaleDateString('fr-CA')}
                                                            {s.reasons?.includes('stale_audit') && (
                                                                <span className="text-amber-300/70 ml-1">(obsolète)</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Activity density bar */}
                                                    {s.completedRunsWindow > 0 && (
                                                        <div className="h-[2px] w-20 overflow-hidden rounded-full bg-white/[0.04] mt-1">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${Math.min(100, Math.round((s.completedRunsWindow / maxRunsWindow) * 100))}%`,
                                                                    background: 'linear-gradient(90deg, #5b73ff88, #5b73ff22)',
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-white/20">Signaux indisponibles</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {showArchived && (
                                                <span className="text-[9px] uppercase font-bold text-amber-400/80 block mb-1 tracking-wide">Archivé</span>
                                            )}
                                            <PublishToggle id={client.id} isPublished={client.is_published} />
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-white/30">
                                            {s?.latestRunAt ? (
                                                <div className="flex items-center gap-2">
                                                    <FreshnessIndicator dateStr={s.latestRunAt} />
                                                    <span title="Dernier run">
                                                        Run · {new Date(s.latestRunAt).toLocaleDateString('fr-CA')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-white/15">Aucun run</span>
                                            )}
                                            <div className="text-[10px] text-white/15 mt-0.5">
                                                Maj. {new Date(client.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <ClientListActions client={client} showArchived={showArchived} />
                                        </td>
                                    </tr>
                                );})
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-white/[0.05] flex items-center justify-between">
                        <span className="text-[11px] text-white/25">
                            <span className="font-semibold text-white/45 tabular-nums">{from + 1}–{Math.min(to + 1, count)}</span>
                            {' '}sur{' '}
                            <span className="font-semibold text-white/45 tabular-nums">{count}</span>
                            {' '}mandats
                        </span>

                        <div className="flex gap-2">
                            {page > 1 ? (
                                <Link
                                    href={clientsListLink({ q, page: page - 1, archived: showArchived })}
                                    className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] text-[11px] font-semibold text-white/50 transition-all"
                                >
                                    Précédent
                                </Link>
                            ) : (
                                <button disabled className="px-3 py-1.5 bg-white/[0.015] border border-white/[0.03] text-white/15 rounded-lg text-[11px] cursor-not-allowed">
                                    Précédent
                                </button>
                            )}

                            {page < totalPages ? (
                                <Link
                                    href={clientsListLink({ q, page: page + 1, archived: showArchived })}
                                    className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] text-[11px] font-semibold text-white/50 transition-all"
                                >
                                    Suivant
                                </Link>
                            ) : (
                                <button disabled className="px-3 py-1.5 bg-white/[0.015] border border-white/[0.03] text-white/15 rounded-lg text-[11px] cursor-not-allowed">
                                    Suivant
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
