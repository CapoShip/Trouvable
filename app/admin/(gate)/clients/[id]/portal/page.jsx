import Link from 'next/link';
import { notFound } from 'next/navigation';

import PortalDashboard from '@/components/portal/PortalDashboard';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { listClientPortalMembers } from '@/lib/portal-access';
import { getPortalDashboardData } from '@/lib/portal-data';
import PortalAccessPanel from '../../PortalAccessPanel';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    return { title: 'Portail client — Trouvable OS' };
}

export default async function ClientPortalPage({ params }) {
    const { id } = await params;
    const supabase = getAdminSupabase();

    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug')
        .eq('id', id)
        .is('archived_at', null)
        .single();

    if (error || !client) notFound();

    let members = [];
    try {
        members = await listClientPortalMembers(id);
    } catch (e) {
        console.error('[ClientPortalPage] listClientPortalMembers', e);
    }

    let clientDashboard = null;
    try {
        clientDashboard = await getPortalDashboardData(id);
    } catch (e) {
        console.error('[ClientPortalPage] getPortalDashboardData', e);
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-4 pb-12 md:p-6">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/clients/${id}/overview`}
                        className="flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white/70"
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour
                    </Link>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white/95">Portail client</h1>
                    <p className="mt-0.5 text-[12px] text-white/35">
                        {client.client_name} — définir qui peut ouvrir le tableau de bord lecture seule (
                        <code className="text-white/45">/portal</code>).
                    </p>
                </div>

                <PortalAccessPanel clientId={client.id} clientName={client.client_name} clientSlug={client.client_slug} initialMembers={members} />
            </div>

            <section className="rounded-[28px] border border-[#5b73ff]/25 bg-[#5b73ff]/[0.06] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-6">
                <div className="mb-6 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-white">Aperçu — tableau de bord client</h2>
                        <p className="mt-1 max-w-2xl text-sm text-white/50">
                            Rendu identique à ce qu&apos;un invité voit sur{' '}
                            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[13px] text-white/70">
                                /portal/{client.client_slug}
                            </code>{' '}
                            (mêmes données lecture seule, sans en-tête portail ni sélection multi-dossiers).
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
                        <Link
                            href={`/portal/${client.client_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-center text-sm font-semibold text-white/80 hover:bg-white/[0.1] hover:text-white"
                        >
                            Ouvrir /portal (nouvel onglet)
                        </Link>
                        <span className="text-[11px] text-white/35">Nécessite une session avec accès portail.</span>
                    </div>
                </div>

                {clientDashboard ? (
                    <div className="rounded-2xl border border-white/8 bg-[#060607]/80 p-4 md:p-6">
                        <PortalDashboard dashboard={clientDashboard} membershipsCount={1} />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-12 text-center text-sm text-white/45">
                        Aucune donnée portail disponible pour ce dossier (profil introuvable ou erreur de chargement).
                    </div>
                )}
            </section>
        </div>
    );
}
