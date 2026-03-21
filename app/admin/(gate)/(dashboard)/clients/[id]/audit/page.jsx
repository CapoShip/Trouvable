import Link from 'next/link';
import { Activity, AlertTriangle, ArrowLeft, Globe, Play } from 'lucide-react';

import AuditExplainabilityPanel from '@/components/audit/AuditExplainabilityPanel';
import { getAdminSupabase } from '@/lib/supabase-admin';

import AuditSuggester from './AuditSuggester';
import { launchSiteAuditAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Audit SEO / GEO - Admin',
};

export default async function AuditPage({ params }) {
    const { id: clientId } = await params;
    const supabase = getAdminSupabase();

    const { data: client, error: clientError } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url')
        .eq('id', clientId)
        .single();

    if (clientError || !client) {
        return <div className="p-8 text-red-400">Client introuvable.</div>;
    }

    const { data: audits } = await supabase
        .from('client_site_audits')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

    const latestAudit = audits && audits.length > 0 ? audits[0] : null;
    const hybridScore = latestAudit?.geo_breakdown?.overall?.hybrid_score ?? null;
    const siteType = latestAudit?.geo_breakdown?.site_classification?.label || latestAudit?.seo_breakdown?.site_classification?.label || null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/clients/${clientId}/seo-geo`}
                        className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                            <Activity className="text-[#7b8fff]" />
                            Audit SEO/GEO : {client.client_name}
                        </h1>
                        <p className="mt-1 text-sm text-[#a0a0a0]">
                            Extraction observee, scoring site-type-aware et synthese IA defensive.
                        </p>
                    </div>
                </div>

                <form
                    action={async () => {
                        'use server';
                        if (!client.website_url) return;
                        await launchSiteAuditAction(client.id, client.website_url);
                    }}
                >
                    <button
                        type="submit"
                        disabled={!client.website_url || latestAudit?.scan_status === 'running'}
                        className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-bold text-black transition-colors hover:bg-[#d6d6d6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Play size={18} />
                        {latestAudit?.scan_status === 'running' ? 'Scan en cours...' : 'Lancer un nouvel audit'}
                    </button>
                </form>
            </div>

            {!latestAudit && (
                <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-12 text-center">
                    <Globe size={48} className="mx-auto mb-4 text-white/15" />
                    <h3 className="text-lg font-semibold text-white/60">Aucun audit trouve</h3>
                    <p className="mx-auto mt-2 max-w-md text-white/30">
                        Lancez un audit pour analyser {client.website_url || "l'URL de ce client"} et obtenir un rendu explicable pour le Cockpit.
                    </p>
                </div>
            )}

            {latestAudit && latestAudit.scan_status === 'failed' && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-300">
                    <h3 className="flex items-center gap-2 font-bold">
                        <AlertTriangle size={20} /> Echec de l'audit
                    </h3>
                    <p className="mt-2 text-sm">{latestAudit.error_message}</p>
                </div>
            )}

            {latestAudit && (latestAudit.scan_status === 'success' || latestAudit.scan_status === 'partial_error') && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-1">
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Resultats du scan</h2>
                                <span className={`rounded-full px-2 py-1 text-xs ${latestAudit.scan_status === 'success' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>
                                    {latestAudit.scan_status === 'success' ? 'Complet' : 'Partiel'}
                                </span>
                            </div>

                            <div className="mb-6 grid grid-cols-1 gap-4">
                                <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/35">Technical SEO</div>
                                    <div className="mt-2 text-4xl font-extrabold text-emerald-400">
                                        {latestAudit.seo_score}<span className="text-xl text-white/25">/100</span>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-[#7b8fff]/15 bg-[#7b8fff]/5 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/35">Local / GEO readiness</div>
                                    <div className="mt-2 text-4xl font-extrabold text-[#7b8fff]">
                                        {latestAudit.geo_score}<span className="text-xl text-white/25">/100</span>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/35">Hybrid audit view</div>
                                    <div className="mt-2 text-4xl font-extrabold text-white/90">
                                        {hybridScore != null ? hybridScore : '-'}
                                        <span className="text-xl text-white/25">{hybridScore != null ? '/100' : ''}</span>
                                    </div>
                                    <div className="mt-3 text-xs text-white/35">
                                        {siteType ? `Detected site profile: ${siteType}` : 'Waiting for a classified audit run'}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-xs text-white/30">
                                URL:{' '}
                                <a
                                    href={latestAudit.resolved_url || latestAudit.source_url}
                                    target="_blank"
                                    className="break-all text-[#7b8fff] hover:underline"
                                >
                                    {latestAudit.resolved_url || latestAudit.source_url}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 xl:col-span-2">
                        <AuditExplainabilityPanel audit={latestAudit} showPages />
                        <AuditSuggester
                            clientId={clientId}
                            automationData={Array.isArray(latestAudit.prefill_suggestions) ? latestAudit.prefill_suggestions : []}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
