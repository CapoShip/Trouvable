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
        return <div className="p-8 text-red-400">Accès non autorisé.</div>;
    }

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#0f0f0f] p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <Link
                        href={"/admin/clients/" + clientId + "/seo-geo"}
                        className="p-2 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-[#7b8fff]" />
                            Audit SEO/GEO : {client.client_name}
                        </h1>
                        <p className="text-[#a0a0a0] text-sm mt-1">Analyse du site web et extraction de signaux IA.</p>
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
                        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-[#d6d6d6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Play size={18} />
                        {latestAudit?.scan_status === 'running' ? 'Scan en cours...' : 'Lancer un nouvel audit'}
                    </button>
                </form>
            </div>

            {!latestAudit && (
                <div className="bg-[#0f0f0f] border border-white/10 p-12 rounded-2xl text-center">
                    <Globe size={48} className="mx-auto text-white/15 mb-4" />
                    <h3 className="text-lg font-semibold text-white/60">Aucun audit trouvé</h3>
                    <p className="text-white/30 mt-2 max-w-md mx-auto">
                        Lancez un audit pour analyser {client.website_url || "l'URL de ce client"} et obtenir des suggestions pour le Cockpit.
                    </p>
                </div>
            )}

            {latestAudit && latestAudit.scan_status === 'failed' && (
                <div className="bg-red-400/10 border border-red-400/20 text-red-300 p-6 rounded-2xl">
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
                        <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/10">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                                Résultats du Scan
                                <span className={"text-xs px-2 py-1 rounded-full " + (latestAudit.scan_status === 'success' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400')}>
                                    {latestAudit.scan_status === 'success' ? 'Complet' : 'Partiel'}
                                </span>
                            </h2>

                            <div className="flex justify-between items-center mb-6">
                                <div className="text-center">
                                    <div className="text-4xl font-extrabold text-emerald-400 mb-1">{latestAudit.seo_score}<span className="text-xl text-white/25">/100</span></div>
                                    <div className="text-sm font-semibold text-white/40 uppercase tracking-widest">SEO Score</div>
                                </div>
                                <div className="w-px h-16 bg-white/10"></div>
                                <div className="text-center">
                                    <div className="text-4xl font-extrabold text-[#7b8fff] mb-1">{latestAudit.geo_score}<span className="text-xl text-white/25">/100</span></div>
                                    <div className="text-sm font-semibold text-white/40 uppercase tracking-widest">GEO Score</div>
                                </div>
                            </div>

                            <div className="text-xs text-white/30 text-center mb-6">
                                URL: <a href={latestAudit.resolved_url || latestAudit.source_url} target="_blank" className="hover:underline text-[#7b8fff] break-all">{latestAudit.resolved_url || latestAudit.source_url}</a>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Points Forts</h4>
                                    <ul className="space-y-2">
                                        {latestAudit.strengths?.length > 0 ? latestAudit.strengths.map((s, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-[#a0a0a0]">
                                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{s}</span>
                                            </li>
                                        )) : <li className="text-sm text-white/20 italic">Aucun point fort majeur détecté.</li>}
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-white/[0.07]">
                                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">À Améliorer</h4>
                                    <ul className="space-y-2">
                                        {latestAudit.issues?.length > 0 ? latestAudit.issues.map((iss, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-[#a0a0a0]">
                                                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{iss}</span>
                                            </li>
                                        )) : <li className="text-sm text-white/20 italic">Aucun problème majeur détecté.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* PAGES SCANNÉES */}
                        <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/10">
                            <h3 className="text-sm font-bold text-white mb-4">Pages Analysées ({latestAudit.scanned_pages?.length || 0})</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {latestAudit.scanned_pages?.map((p, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                        {p.success ? (
                                            <CheckCircle2 size={14} className="text-emerald-400 mt-1 shrink-0" />
                                        ) : (
                                            <XCircle size={14} className="text-red-400 mt-1 shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-white/60 truncate">{p.url}</div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-white/[0.04] border border-white/10 px-1.5 py-0.5 rounded text-white/40">{p.status_code || 'Err'}</span>
                                                <span className="text-[10px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded capitalize">{p.page_type}</span>
                                            </div>
                                            {!p.success && <div className="text-[10px] text-red-400 mt-1">{p.error_message}</div>}
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
