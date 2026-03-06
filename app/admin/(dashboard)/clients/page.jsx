import { getAdminSupabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import SearchBar from './SearchBar';
import PublishToggle from './PublishToggle';
import { logoutAction } from '../../actions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Gestion des Clients - Admin',
};

const ITEMS_PER_PAGE = 10;

export default async function AdminClientsPage({ searchParams }) {
    // 1. Lire les paramètres d'URL (Server Component side) - await in Next.js 15
    const paramsData = await searchParams;
    const rawQ = paramsData?.q || '';

    // Sanitize backend : max 60 chars, keep only letters, numbers, spaces, and safe accents
    const q = rawQ.slice(0, 60).replace(/[^a-zA-Z0-9 -éèàùâêîôûç]/g, '').trim();

    const page = parseInt(paramsData?.page, 10) || 1;

    // 2. Client DB Bypass RLS via service role
    const supabase = getAdminSupabase();

    // 3. Construction de la requête principale
    let query = supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, is_published, updated_at', { count: 'exact' });

    // Filtrer par recherche (ilike sur le nom OU le slug)
    if (q) {
        query = query.or(`client_name.ilike.%${q}%,client_slug.ilike.%${q}%`);
    }

    // Pagination (calcul mathématique d'offset pour DB Postgres)
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Execution avec Range + tri (plus récent d'abord)
    const { data: clients, count, error } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('[AdminClientsPage] Supabase error:', error);
    }

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            {/* Header: Title + Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients & Profils</h1>
                    <p className="text-slate-500 mt-1">Gérez les fiches SEO/GEO de l'application.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <SearchBar />
                    <Link
                        href="/admin/clients/new"
                        className="bg-orange-600 text-white px-4 py-2 border border-transparent rounded-lg text-sm font-bold hover:bg-pink-600 transition-colors shadow-sm shrink-0"
                    >
                        + Nouveau Profil
                    </Link>
                    <form action={logoutAction}>
                        <button type="submit" className="text-sm px-4 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 font-medium transition-colors shadow-sm">
                            Déconnexion
                        </button>
                    </form>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden auto-cols-auto">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 uppercase tracking-wide text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Nom du Client</th>
                                <th className="px-6 py-4 font-semibold">Slug (URL)</th>
                                <th className="px-6 py-4 font-semibold text-center w-32">Statut</th>
                                <th className="px-6 py-4 font-semibold w-48">Dernière modif.</th>
                                <th className="px-6 py-4 font-semibold text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {error ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-red-500 font-medium">
                                        Une erreur est survenue lors du chargement des clients.
                                    </td>
                                </tr>
                            ) : clients?.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <p className="text-base font-medium text-slate-900">Aucun profil trouvé.</p>
                                            <p className="text-slate-500 mt-1">Créez un nouveau client ou modifiez votre recherche.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clients?.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-xs">
                                            {client.client_name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-xs">
                                            {client.client_slug}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <PublishToggle id={client.id} isPublished={client.is_published} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {new Date(client.updated_at).toLocaleDateString('fr-FR', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end items-center gap-4">
                                            <Link
                                                href={`/admin/clients/${client.id}/seo-geo`}
                                                className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                                            >
                                                Cockpit
                                            </Link>
                                            <Link
                                                href={`/admin/clients/${client.id}/edit`}
                                                className="text-orange-600 font-semibold hover:text-pink-600 transition-colors"
                                            >
                                                Éditer
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <span className="text-sm text-slate-500">
                            Affichage <span className="font-semibold text-slate-800">{from + 1}-{Math.min(to + 1, count)}</span> sur <span className="font-semibold text-slate-800">{count}</span> résultats
                        </span>

                        <div className="flex gap-2">
                            {page > 1 ? (
                                <Link
                                    href={`/admin/clients?q=${encodeURIComponent(q)}&page=${page - 1}`}
                                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
                                >
                                    Précédent
                                </Link>
                            ) : (
                                <button disabled className="px-3 py-1.5 bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400 rounded-md text-sm cursor-not-allowed">
                                    Précédent
                                </button>
                            )}

                            {page < totalPages ? (
                                <Link
                                    href={`/admin/clients?q=${encodeURIComponent(q)}&page=${page + 1}`}
                                    className="px-4 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
                                >
                                    Suivant
                                </Link>
                            ) : (
                                <button disabled className="px-4 py-1.5 bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400 rounded-md text-sm cursor-not-allowed">
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
