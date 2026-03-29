import 'server-only';

import { getAdminSupabase } from '@/lib/supabase-admin';

/**
 * Returns the persisted community snapshot for a client from DB tables.
 * Used by the connector overview to surface agent_reach status alongside ga4/gsc.
 */
export async function getAgentReachSnapshotFromDb({ connection, clientId }) {
    const status = connection?.status || 'not_connected';

    if (status === 'not_connected') {
        return {
            status: 'not_connected',
            documents_count: 0,
            clusters_count: 0,
            opportunities_count: 0,
            last_run: null,
        };
    }

    const supabase = getAdminSupabase();

    const [docsResult, clustersResult, opportunitiesResult, lastRunResult] = await Promise.all([
        supabase
            .from('community_documents')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),
        supabase
            .from('community_clusters')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),
        supabase
            .from('community_opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'open'),
        supabase
            .from('community_collection_runs')
            .select('id, source, status, started_at, finished_at, documents_collected, documents_persisted')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);

    return {
        status,
        documents_count: docsResult.count || 0,
        clusters_count: clustersResult.count || 0,
        opportunities_count: opportunitiesResult.count || 0,
        last_run: lastRunResult.data || null,
    };
}
