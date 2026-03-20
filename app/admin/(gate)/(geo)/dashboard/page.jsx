import { getAdminSupabase } from '@/lib/supabase-admin';
import ClientPicker from './ClientPicker';

export const dynamic = 'force-dynamic';

/** Liste tous les profils (limite PostgREST Supabase ~1000 par requête). */
export default async function GeoDashboardIndexPage() {
    const supabase = getAdminSupabase();
    const { data: clients, error } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url, is_published')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('[GeoDashboardIndexPage]', error.message);
    }

    const list = clients || [];
    return <ClientPicker clients={list} empty={list.length === 0} />;
}
