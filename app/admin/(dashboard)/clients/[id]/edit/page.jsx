import { getAdminSupabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import ClientForm from '../../ClientForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    return { title: 'Éditer le profil client - Admin' };
}

export default async function EditClientPage({ params }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const supabase = getAdminSupabase();

    // Fetch user details server side
    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url, business_type, seo_title, seo_description, is_published, social_profiles, address, geo_faqs')
        .eq('id', id)
        .single();

    if (error || !client) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <Link href="/admin/clients" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour aux clients
                </Link>
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Éditer Profil : {client.client_name}</h1>
                    {client.is_published && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">LIGNES PUBLIÉES</span>
                    )}
                </div>
                <p className="text-slate-500 mt-1">Modifiez les informations du profil GEO/SEO.</p>
            </div>

            <ClientForm initialData={client} />
        </div>
    );
}
