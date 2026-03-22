import 'server-only';

import { normalizeClientProfileShape } from '@/lib/client-profile';
import { getAdminSupabase } from '@/lib/supabase-admin';

function latestIso(values) {
    return values
        .filter(Boolean)
        .sort((a, b) => String(b).localeCompare(String(a)))[0] || null;
}

export async function getOperatorWorkspaceShell(clientId) {
    const supabase = getAdminSupabase();

    const { data: clientRow, error: clientError } = await supabase
        .from('client_geo_profiles')
        .select('*')
        .eq('id', clientId)
        .single();

    if (clientError || !clientRow) {
        return null;
    }

    const [
        latestAuditResult,
        trackedQueryCountResult,
        activeTrackedQueryCountResult,
        completedRunsResult,
        openOpportunitiesResult,
        pendingMergeResult,
        latestRunResult,
        latestActionResult,
    ] = await Promise.all([
        supabase
            .from('client_site_audits')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('tracked_queries')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId),
        supabase
            .from('tracked_queries')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('is_active', true),
        supabase
            .from('query_runs')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'completed')
            .or('run_mode.is.null,run_mode.eq.standard'),
        supabase
            .from('opportunities')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'open'),
        supabase
            .from('merge_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'pending'),
        supabase
            .from('query_runs')
            .select('id, created_at, status')
            .eq('client_id', clientId)
            .or('run_mode.is.null,run_mode.eq.standard')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('actions')
            .select('id, created_at, action_type')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);

    if (latestAuditResult.error) {
        throw new Error(`[OperatorIntelligence/base] latest audit: ${latestAuditResult.error.message}`);
    }

    const client = normalizeClientProfileShape(clientRow);
    const audit = latestAuditResult.data || null;
    const issueCount = Array.isArray(audit?.issues) ? audit.issues.length : 0;
    const refreshMarker = latestIso([
        client.updated_at,
        audit?.created_at,
        latestRunResult.data?.created_at,
        latestActionResult.data?.created_at,
    ]) || new Date(0).toISOString();

    return {
        client,
        audit,
        workspace: {
            trackedPromptCount: trackedQueryCountResult.count ?? 0,
            activeTrackedPromptCount: activeTrackedQueryCountResult.count ?? 0,
            completedRunCount: completedRunsResult.count ?? 0,
            openOpportunityCount: openOpportunitiesResult.count ?? 0,
            pendingMergeCount: pendingMergeResult.count ?? 0,
            issueCount,
            seoScore: audit?.seo_score ?? null,
            geoScore: audit?.geo_score ?? null,
            latestAuditAt: audit?.created_at || null,
            latestRunAt: latestRunResult.data?.created_at || null,
            latestRunStatus: latestRunResult.data?.status || null,
            latestActivityAt: latestActionResult.data?.created_at || null,
            refreshMarker,
        },
    };
}
