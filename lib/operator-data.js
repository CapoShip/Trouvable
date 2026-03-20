import 'server-only';

import * as db from '@/lib/db';
import { normalizeClientProfileShape } from '@/lib/client-profile';
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
    const supabase = getAdminSupabase();

    const { data: client, error: clientError } = await supabase
        .from('client_geo_profiles')
        .select('*')
        .eq('id', clientId)
        .single();

    if (clientError || !client) {
        return null;
    }

    const { data: auditRows } = await supabase
        .from('client_site_audits')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1);

    let metrics = null;
    let recentAudits = [];
    let recentQueryRuns = [];
    let trackedQueries = [];
    let lastRunByQuery = {};
    let opportunities = [];
    let mergeSuggestionsPending = [];

    try {
        metrics = await db.getClientGeoMetrics(clientId);
    } catch (error) {
        console.error('[OperatorData] metrics:', error.message);
    }

    try {
        recentAudits = await db.getRecentAudits(clientId, 40);
        recentQueryRuns = await db.getRecentQueryRuns(clientId, 200);
        trackedQueries = await db.getTrackedQueriesAll(clientId);
        const lastRunMap = await db.getLastRunPerTrackedQuery(clientId);
        lastRunByQuery = Object.fromEntries(lastRunMap);
    } catch (error) {
        console.error('[OperatorData] history:', error.message);
    }

    try {
        const openOpportunities = await db.getOpportunities(clientId);
        opportunities = (openOpportunities || []).filter((item) => item.status === 'open').slice(0, 50);
    } catch (error) {
        console.error('[OperatorData] opportunities:', error.message);
    }

    try {
        const pendingMergeSuggestions = await db.getMergeSuggestions(clientId, 'pending');
        mergeSuggestionsPending = (pendingMergeSuggestions || []).slice(0, 40);
    } catch (error) {
        console.error('[OperatorData] merge suggestions:', error.message);
    }

    return {
        client: normalizeClientProfileShape(client),
        audit: auditRows?.[0] ?? null,
        metrics,
        recentAudits,
        recentQueryRuns,
        trackedQueries,
        lastRunByQuery,
        opportunities,
        mergeSuggestionsPending,
    };
}
