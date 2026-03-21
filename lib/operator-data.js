import 'server-only';

import { normalizeClientProfileShape } from '@/lib/client-profile';
import { getOperatorWorkspaceShell } from '@/lib/operator-intelligence/base';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function listOperatorClients() {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url, business_type, publication_status, is_published, updated_at, archived_at')
        .is('archived_at', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new Error(`[OperatorData] listOperatorClients: ${error.message}`);
    }

    return (data || []).map(normalizeClientProfileShape);
}

export async function getOperatorGeoWorkspacePayload(clientId) {
    return getOperatorWorkspaceShell(clientId);
}
