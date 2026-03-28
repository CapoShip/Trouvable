import 'server-only';

import { LIFECYCLE_SERVICEABLE_STATES } from '@/lib/lifecycle';
import { syncClientProfileCompatibilityFields } from '@/lib/client-profile';
import { db } from '@/lib/db/core';

export async function getClientById(id) {
    const { data, error } = await db().from('client_geo_profiles').select('*').eq('id', id).single();
    if (error?.code === 'PGRST116') throw new Error(`[DB/clients] Client introuvable: ${id}`);
    if (error) throw new Error(`[DB/clients] getClientById ${id}: ${error.message}`);
    return data;
}

export async function listClientsWithSiteUrl({ includeArchived = false } = {}) {
    let query = db()
        .from('client_geo_profiles')
        .select('id, client_name, client_slug, website_url, archived_at, updated_at')
        .not('website_url', 'is', null)
        .neq('website_url', '')
        .order('updated_at', { ascending: false });

    if (!includeArchived) {
        query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[DB/clients] listClientsWithSiteUrl: ${error.message}`);
    return data || [];
}

export async function listActiveClientIds() {
    const { data, error } = await db()
        .from('client_geo_profiles')
        .select('id')
        .in('lifecycle_status', LIFECYCLE_SERVICEABLE_STATES)
        .order('updated_at', { ascending: false });

    if (error) throw new Error(`[DB/clients] listActiveClientIds: ${error.message}`);
    return (data || []).map((row) => row.id).filter(Boolean);
}

export async function updateClient(id, updates) {
    const normalizedUpdates = syncClientProfileCompatibilityFields(updates);
    const { data, error } = await db().from('client_geo_profiles').update(normalizedUpdates).eq('id', id).select().single();
    if (error) throw new Error(`[DB/clients] updateClient ${id}: ${error.message}`);
    return data;
}
