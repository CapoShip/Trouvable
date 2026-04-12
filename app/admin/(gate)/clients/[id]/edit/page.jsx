import { getAdminSupabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import ClientForm from '../../ClientForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    return { title: 'Éditer le profil — Trouvable OS' };
}

export default async function EditClientPage({ params }) {
    const { id } = await params;
    const supabase = getAdminSupabase();

    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url, business_type, seo_title, seo_description, is_published, social_profiles, address, geo_faqs')
        .eq('id', id)
        .single();

    if (error || !client) notFound();

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <Link href={`/admin/clients/${id}/dossier`} className="text-[11px] text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Retour
                </Link>
            </div>
            <div>
                <h1 className="text-lg font-bold text-white/95">Éditer : {client.client_name}</h1>
                <p className="text-[12px] text-white/35 mt-0.5">Profil SEO/GEO</p>
            </div>
            <ClientForm initialData={client} />
        </div>
    );
}
