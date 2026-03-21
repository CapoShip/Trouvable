import { getAdminSupabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Pencil, Activity } from 'lucide-react';
import ProductDashboard from './ProductDashboard';
import ClientTrackedQueries from './ClientTrackedQueries';
import ClientHistorySection from './ClientHistorySection';
import PortalAccessManager from './PortalAccessManager';
import { listClientPortalMembers } from '@/lib/portal-access';
import * as db from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Fiche client — Admin',
};

export default async function ClientDetailPage({ params }) {
    const { id: clientId } = await params;
    const supabase = getAdminSupabase();

    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('*')
        .eq('id', clientId)
        .single();

    if (error || !client) notFound();

    const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    const { data: mergeSuggestions } = await supabase
        .from('merge_suggestions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    const { data: latestAudit } = await supabase
        .from('client_site_audits')
        .select('id, seo_score, geo_score, scan_status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const { data: trackedQueries } = await supabase
        .from('tracked_queries')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

    const { data: recentAudits } = await supabase
        .from('client_site_audits')
        .select('id, scan_status, seo_score, geo_score, created_at, error_message')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

    const recentQueryRuns = await db.getRecentQueryRuns(clientId, 5).catch((queryRunsError) => {
        console.error('[ClientDetailPage] recent query runs:', queryRunsError.message);
        return [];
    });

    let portalMembers = [];
    try {
        portalMembers = await listClientPortalMembers(clientId);
    } catch (error) {
        console.error('[ClientDetailPage] portal access:', error.message);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/clients"
                            className="p-2 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{client.client_name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                {client.website_url && (
                                    <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-[#7b8fff] text-sm hover:underline flex items-center gap-1">
                                        {client.website_url} <ExternalLink size={12} />
                                    </a>
                                )}
                                <span className={"text-xs px-2 py-0.5 rounded-full " + (client.is_published ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/30')}>
                                    {client.is_published ? 'Publié' : 'Brouillon'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/clients/${clientId}/edit`} className="flex items-center gap-2 text-sm bg-white/[0.06] text-white/60 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                            <Pencil size={14} /> Éditer
                        </Link>
                        <Link href={`/admin/clients/${clientId}/seo-geo`} className="flex items-center gap-2 text-sm bg-white/[0.06] text-white/60 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                            Cockpit
                        </Link>
                        <Link href={`/admin/clients/${clientId}/audit`} className="flex items-center gap-2 text-sm bg-white/[0.06] text-white/60 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                            <Activity size={14} /> Audit détaillé
                        </Link>
                    </div>
                </div>

                {/* Score Summary */}
                {latestAudit && (latestAudit.scan_status === 'success' || latestAudit.scan_status === 'partial_error') && (
                    <div className="mt-6 pt-5 border-t border-white/[0.07] flex gap-8">
                        <div>
                            <span className="text-xs text-white/30 uppercase tracking-wider">SEO</span>
                            <div className="text-3xl font-extrabold text-emerald-400">{latestAudit.seo_score}<span className="text-sm text-white/20">/100</span></div>
                        </div>
                        <div>
                            <span className="text-xs text-white/30 uppercase tracking-wider">GEO</span>
                            <div className="text-3xl font-extrabold text-[#7b8fff]">{latestAudit.geo_score}<span className="text-sm text-white/20">/100</span></div>
                        </div>
                        <div className="ml-auto text-right">
                            <span className="text-xs text-white/30">Dernier audit</span>
                            <div className="text-sm text-white/50">{new Date(latestAudit.created_at).toLocaleDateString('fr-CA')}</div>
                        </div>
                    </div>
                )}
            </div>

            <ClientTrackedQueries clientId={clientId} initialQueries={trackedQueries || []} />

            <ClientHistorySection audits={recentAudits || []} queryRuns={recentQueryRuns || []} />

            <PortalAccessManager clientId={clientId} initialMembers={portalMembers} />

            {/* Product Dashboard */}
            <ProductDashboard
                clientId={clientId}
                initialOpportunities={opportunities || []}
                initialMergeSuggestions={mergeSuggestions || []}
            />
        </div>
    );
}
