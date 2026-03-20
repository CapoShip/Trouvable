import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function GeoDashboardClientLayout({ children, params }) {

    const { clientId } = await params;
    const supabase = getAdminSupabase();
    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('id')
        .eq('id', clientId)
        .single();

    if (error || !client) {
        notFound();
    }

    return <>{children}</>;
}
