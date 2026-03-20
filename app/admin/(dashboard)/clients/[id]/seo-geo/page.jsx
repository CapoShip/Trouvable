import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase-admin';
import CockpitForm from './CockpitForm';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Activity } from 'lucide-react';

export default async function CockpitPage({ params }) {

    const { id } = await params;
    const supabase = getAdminSupabase();

    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !client) {
        notFound();
    }

    const { data: latestAudit } = await supabase
        .from('client_site_audits')
        .select('id, created_at, scan_status, seo_score, geo_score')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    // Calcul de la fraîcheur
    let auditFreshness = 'none'; // none, recent, outdated
    if (latestAudit) {
        const auditDate = new Date(latestAudit.created_at);
        const profileDate = new Date(client.updated_at || client.created_at);

        if (profileDate > auditDate) {
            auditFreshness = 'outdated';
        } else {
            auditFreshness = 'recent';
        }
    }

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/admin/clients" className="inline-flex items-center text-sm font-medium text-[#a0a0a0] hover:text-white mb-2 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Retour aux clients
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        Cockpit SEO/GEO
                        <span className="text-sm font-medium bg-[#5b73ff]/10 text-[#7b8fff] px-3 py-1 rounded-full border border-[#5b73ff]/20">
                            {client.client_name}
                        </span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/clients/${client.id}/audit`}
                        className="bg-[#5b73ff]/10 border text-sm border-[#5b73ff]/20 text-[#7b8fff] hover:bg-[#5b73ff]/20 font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Activity size={16} /> Rapport d'Audit Complet
                    </Link>
                    <Link
                        href={`/admin/clients/${client.id}`}
                        className="bg-[#0f0f0f] border text-sm border-white/10 text-[#a0a0a0] hover:bg-white/[0.06] font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                        Éditer profil de base
                    </Link>
                    <a
                        href={`/clients/${client.client_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/[0.04] text-[#a0a0a0] hover:bg-white/[0.08] p-2 rounded-lg transition-colors flex items-center justify-center border border-white/10"
                        title="Voir la page publique"
                    >
                        <ExternalLink size={20} />
                    </a>
                </div>
            </div>

            {/* AUTOMATION STATUS BAR */}
            <div className="mb-8 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0 border border-white/10">
                        <Activity className={auditFreshness === 'recent' ? "text-green-400" : auditFreshness === 'outdated' ? "text-orange-400" : "text-slate-500"} size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Statut de l'Automatisation</h3>
                        <p className="text-[#a0a0a0] text-sm">
                            {auditFreshness === 'none' && "Aucun scan n'a été effectué sur ce site."}
                            {auditFreshness === 'recent' && "Le Cockpit est synchronisé avec le dernier audit."}
                            {auditFreshness === 'outdated' && "Le Cockpit a été modifié manuellement depuis le dernier audit."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {latestAudit && (latestAudit.scan_status === 'success' || latestAudit.scan_status === 'partial_error') && (
                        <div className="flex gap-4 text-center">
                            <div>
                                <div className="text-2xl font-black text-emerald-400">{latestAudit.seo_score}<span className="text-sm text-white/25 font-normal">/100</span></div>
                                <div className="text-[10px] uppercase tracking-wider text-white/25 font-bold mt-1">SEO</div>
                            </div>
                            <div className="w-px bg-white/10 my-1"></div>
                            <div>
                                <div className="text-2xl font-black text-[#7b8fff]">{latestAudit.geo_score}<span className="text-sm text-white/25 font-normal">/100</span></div>
                                <div className="text-[10px] uppercase tracking-wider text-white/25 font-bold mt-1">GEO</div>
                            </div>
                        </div>
                    )}
                    <Link
                        href={`/admin/clients/${client.id}/audit`}
                        className="bg-white text-black hover:bg-[#d6d6d6] px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        {auditFreshness === 'none' ? "Lancer un Audit" : "Vérifier les Suggestions"}
                    </Link>
                </div>
            </div>

            <CockpitForm initialData={client} />
        </div>
    );
}
