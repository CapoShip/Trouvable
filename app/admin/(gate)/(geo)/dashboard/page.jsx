import { redirect } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase-admin';
import ClientPicker from './ClientPicker';

export const dynamic = 'force-dynamic';

export default async function GeoDashboardIndexPage() {

    const supabase = getAdminSupabase();
    const { data: clients } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug')
        .order('updated_at', { ascending: false })
        .limit(50);

    if (clients?.length === 0) {
        return <ClientPicker clients={[]} empty />;
    }

    redirect(`/admin/dashboard/${clients[0].id}`);
}
