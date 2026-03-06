import { verifySession } from '@/lib/session';
import { getAdminSupabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Activity, Globe, CheckCircle2, XCircle, AlertTriangle, Play } from 'lucide-react';
import AuditSuggester from './AuditSuggester';
import { launchSiteAuditAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Audit SEO / GEO - Admin',
};

export default async function AuditPage({ params }) {
    const { id: clientId } = await params;
    const session = await verifySession();

    if (!session || session.role !== 'admin') {
        return <div className="p-8 text-red-600">Accès non autorisé.</div>;
    }

    const supabase = getAdminSupabase();

    // 1. Fetch Client Info
    const { data: client, error: clientError } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url')
        .eq('id', clientId)
        .single();

    if (clientError || !client) {
        return <div className="p-8 text-red-600">Client introuvable.</div>;
    }

    // 2. Fetch Latest Audits
    const { data: audits } = await supabase
        .from('client_site_audits')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

    const latestAudit = audits && audits.length > 0 ? audits[0] : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/clients/${clientId}/seo-geo`}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="text-indigo-600" />
                            Audit SEO/GEO : {client.client_name}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Analyse du site web et extraction de signaux IA.</p>
                    </div>
                </div>

                <form action={async () => {
                    'use server';
                    if (!client.website_url) return;
                    await launchSiteAuditAction(client.id, client.website_url);
                }}>
                    <button
                        type="submit"
                        disabled={!client.website_url || latestAudit?.scan_status === 'running'}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Play size={18} />
                        {latestAudit?.scan_status === 'running' ? 'Scan en cours...' : 'Lancer un nouvel audit'}
                    </button>
                </form>
            </div>

            {!latestAudit && (
                <div className="bg-slate-50 border border-slate-200 p-12 rounded-xl text-center">
                    <Globe size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Aucun audit trouvé</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        Lancez un audit pour analyser {client.website_url || "l'URL de ce client"} et obtenir des suggestions pour le Cockpit.
                    </p>
                </div>
            )}

            {latestAudit && latestAudit.scan_status === 'failed' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
                    <h3 className="font-bold flex items-center gap-2">
                        <AlertTriangle size={20} /> Échec de l'audit
                    </h3>
                    <p className="mt-2 text-sm">{latestAudit.error_message}</p>
                </div>
            )}

            {latestAudit && (latestAudit.scan_status === 'success' || latestAudit.scan_status === 'partial_error') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne Gauche : Scores et Breakdown */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* SCORE CARD */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                                Résultats du Scan
                                <span className={`text-xs px-2 py-1 rounded-full ${latestAudit.scan_status === 'success' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {latestAudit.scan_status === 'success' ? 'Complet' : 'Partiel'}
                                </span>
                            </h2>

                            <div className="flex justify-between items-center mb-6">
                                <div className="text-center">
                                    <div className="text-4xl font-extrabold text-green-600 mb-1">{latestAudit.seo_score}<span className="text-xl text-slate-400">/100</span></div>
                                    <div className="text-sm font-semibold text-slate-600 uppercase tracking-widest">SEO Score</div>
                                </div>
                                <div className="w-px h-16 bg-slate-200"></div>
                                <div className="text-center">
                                    <div className="text-4xl font-extrabold text-orange-600 mb-1">{latestAudit.geo_score}<span className="text-xl text-slate-400">/100</span></div>
                                    <div className="text-sm font-semibold text-slate-600 uppercase tracking-widest">GEO Score</div>
                                </div>
                            </div>

                            <div className="text-xs text-slate-500 text-center mb-6">
                                URL: <a href={latestAudit.resolved_url || latestAudit.source_url} target="_blank" className="hover:underline text-indigo-500 break-all">{latestAudit.resolved_url || latestAudit.source_url}</a>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Points Forts</h4>
                                    <ul className="space-y-2">
                                        {latestAudit.strengths?.length > 0 ? latestAudit.strengths.map((s, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{s}</span>
                                            </li>
                                        )) : <li className="text-sm text-slate-400 italic">Aucun point fort majeur détecté.</li>}
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">À Améliorer</h4>
                                    <ul className="space-y-2">
                                        {latestAudit.issues?.length > 0 ? latestAudit.issues.map((iss, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{iss}</span>
                                            </li>
                                        )) : <li className="text-sm text-slate-400 italic">Aucun problème majeur détecté.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* PAGES SCANNÉES */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Pages Analysées ({latestAudit.scanned_pages?.length || 0})</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {latestAudit.scanned_pages?.map((p, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-100">
                                        {p.success ? (
                                            <CheckCircle2 size={14} className="text-green-500 mt-1 shrink-0" />
                                        ) : (
                                            <XCircle size={14} className="text-red-400 mt-1 shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-slate-700 truncate">{p.url}</div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500">{p.status_code || 'Err'}</span>
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded capitalize">{p.page_type}</span>
                                            </div>
                                            {!p.success && <div className="text-[10px] text-red-500 mt-1">{p.error_message}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Colonne Droite : Préremplissage Cockpit */}
                    <div className="lg:col-span-2 space-y-6">
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
