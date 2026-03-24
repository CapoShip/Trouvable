import { getAdminSupabase } from '@/lib/supabase-admin';
import { enrichClientsWithOperationalSignals } from '@/lib/operator-data';
import Link from 'next/link';
import SearchBar from './SearchBar';
import PublishToggle from './PublishToggle';
import ClientListActions from './ClientListActions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Gestion des Clients - Admin',
};

const ITEMS_PER_PAGE = 50;

const ATTENTION_ORDER = { critical: 0, needs_attention: 1, watch: 2, stable: 3 };

function AttentionBadge({ attention }) {
    const meta = {
        critical: { label: 'Critique', cls: 'bg-red-400/15 text-red-200 border-red-400/25' },
        needs_attention: { label: 'Action', cls: 'bg-amber-400/12 text-amber-200 border-amber-400/22' },
        watch: { label: 'Veille', cls: 'bg-white/[0.06] text-white/55 border-white/10' },
        stable: { label: 'Stable', cls: 'bg-emerald-400/10 text-emerald-200/90 border-emerald-400/20' },
    };
    const m = meta[attention] || meta.stable;
    return (
        <span className={`inline-flex text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${m.cls}`}>
            {m.label}
        </span>
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

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white/95">Pilotage clients</h1>
                    <p className="text-white/35 mt-0.5 text-[12px]">
                        Priorisez l’attention : état moteur, alertes et file d’actions par compte.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <SearchBar />
                    <Link
                        href={showArchived ? '/admin/clients' : '/admin/clients?archived=1'}
                        className="geo-btn geo-btn-ghost"
                    >
                        {showArchived ? '← Actifs' : 'Archivés'}
                    </Link>
                    <Link href="/admin/clients/new" className="geo-btn geo-btn-pri">
                        + Nouveau
                    </Link>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm text-[#a0a0a0]">
                        <thead className="bg-white/[0.03] border-b border-white/8 text-white/50 uppercase tracking-wide text-xs">
                            <tr>
                                <th className="px-4 py-3 font-semibold w-[200px]">Client</th>
                                <th className="px-4 py-3 font-semibold text-center w-[100px]">Priorité</th>
                                <th className="px-4 py-3 font-semibold">Signaux opérateur</th>
                                <th className="px-4 py-3 font-semibold text-center w-32">Publication</th>
                                <th className="px-4 py-3 font-semibold w-40">Dernière activité</th>
                                <th className="px-4 py-3 font-semibold text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-red-400 font-medium">
                                        Une erreur est survenue lors du chargement des clients.
                                    </td>
                                </tr>
                            ) : clients?.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-[#666]">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-white/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <p className="text-base font-medium text-white/60">Aucun profil trouvé.</p>
                                            <p className="text-white/30 mt-1">Créez un nouveau client ou modifiez votre recherche.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rows?.map((client) => {
                                    const s = client.operatorSignals;
                                    return (
                                    <tr key={client.id} className="hover:bg-white/[0.03] transition-colors align-top">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/clients/${client.id}/overview`} className="font-medium text-white hover:text-[#a78bfa] block truncate max-w-[200px]">
                                                {client.client_name}
                                            </Link>
                                            <span className="font-mono text-[10px] text-white/25 truncate block max-w-[200px]">{client.client_slug}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {s ? <AttentionBadge attention={s.attention} /> : <span className="text-white/20 text-[10px]">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-white/45 leading-snug">
                                            {s ? (
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                                        <span>{s.activePrompts} prompts</span>
                                                        <span className="text-white/20">·</span>
                                                        <span>{s.openOpportunities} actions</span>
                                                        <span className="text-white/20">·</span>
                                                        <span>{s.completedRunsWindow} runs / 21j</span>
                                                    </div>
                                                    {(s.failedRunsWindow > 0 || s.lowConfidenceRunsWindow > 0) && (
                                                        <div className="text-amber-200/70">
                                                            {s.failedRunsWindow > 0 && <span>{s.failedRunsWindow} échec(s) </span>}
                                                            {s.lowConfidenceRunsWindow > 0 && <span>{s.lowConfidenceRunsWindow} conf. basse</span>}
                                                        </div>
                                                    )}
                                                    {s.latestAuditAt && (
                                                        <div className="text-[10px] text-white/25">
                                                            Audit: {new Date(s.latestAuditAt).toLocaleDateString('fr-CA')}
                                                            {s.reasons?.includes('stale_audit') && (
                                                                <span className="text-amber-300/80 ml-1">(stale)</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-white/25">Signaux indisponibles</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {showArchived && (
                                                <span className="text-[10px] uppercase font-bold text-amber-400/90 block mb-1">Archivé</span>
                                            )}
                                            <PublishToggle id={client.id} isPublished={client.is_published} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[11px] text-white/35">
                                            {s?.latestRunAt ? (
                                                <span title="Dernier run">Run {new Date(s.latestRunAt).toLocaleDateString('fr-CA')}</span>
                                            ) : (
                                                <span className="text-white/25">Aucun run</span>
                                            )}
                                            <div className="text-[10px] text-white/20 mt-0.5">
                                                Maj. {new Date(client.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ClientListActions client={client} showArchived={showArchived} />
                                        </td>
                                    </tr>
                                );})
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between bg-white/[0.02]">
                        <span className="text-sm text-white/30">
                            Affichage <span className="font-semibold text-white/60">{from + 1}-{Math.min(to + 1, count)}</span> sur <span className="font-semibold text-white/60">{count}</span> résultats
                        </span>

                        <div className="flex gap-2">
                            {page > 1 ? (
                                <Link
                                    href={clientsListLink({ q, page: page - 1, archived: showArchived })}
                                    className="px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-md hover:bg-white/[0.08] text-sm font-medium text-[#a0a0a0] transition-colors"
                                >
                                    Précédent
                                </Link>
                            ) : (
                                <button disabled className="px-3 py-1.5 bg-white/[0.02] flex items-center justify-center border border-white/[0.05] text-white/20 rounded-md text-sm cursor-not-allowed">
                                    Précédent
                                </button>
                            )}

                            {page < totalPages ? (
                                <Link
                                    href={clientsListLink({ q, page: page + 1, archived: showArchived })}
                                    className="px-4 py-1.5 bg-white/[0.04] border border-white/10 rounded-md hover:bg-white/[0.08] text-sm font-medium text-[#a0a0a0] transition-colors"
                                >
                                    Suivant
                                </Link>
                            ) : (
                                <button disabled className="px-4 py-1.5 bg-white/[0.02] flex items-center justify-center border border-white/[0.05] text-white/20 rounded-md text-sm cursor-not-allowed">
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
