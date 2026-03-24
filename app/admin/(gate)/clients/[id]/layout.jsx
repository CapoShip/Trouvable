import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase-admin';
import ClientWorkspaceShell from './ClientWorkspaceShell';

export const dynamic = 'force-dynamic';

export default async function ClientLayout({ children, params }) {
    const { id } = await params;

    const supabase = getAdminSupabase();
    const { data: client, error } = await supabase
        .from('client_geo_profiles')
        .select('id')
        .eq('id', id)
        .single();

    if (error || !client) {
        notFound();
    }

    return <ClientWorkspaceShell clientId={id}>{children}</ClientWorkspaceShell>;
}
