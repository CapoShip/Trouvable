import 'server-only';
import { getAdminSupabase } from './supabase-admin.js';

const sb = () => getAdminSupabase();

// ─── Clients (client_geo_profiles) ───────────────────────────────────────────

export async function getClientById(id) {
    const { data, error } = await sb().from('client_geo_profiles').select('*').eq('id', id).single();
    if (error) throw new Error(`[DB] Client ${id}: ${error.message}`);
    return data;
}

export async function getClientBySlug(slug) {
    const { data, error } = await sb().from('client_geo_profiles').select('*').eq('client_slug', slug).single();
    if (error && error.code !== 'PGRST116') throw new Error(`[DB] Client slug ${slug}: ${error.message}`);
    return data || null;
}

export async function listClients(options = {}) {
    const { includeArchived = false } = options;
    let q = sb().from('client_geo_profiles').select('*').order('updated_at', { ascending: false });
    if (!includeArchived) {
        q = q.is('archived_at', null);
    }
    const { data, error } = await q;
    if (error) throw new Error(`[DB] listClients: ${error.message}`);
    return data || [];
}

export async function createClient({ client_name, client_slug, website_url, business_type, notes, target_region }) {
    const row = {
        client_name,
        client_slug,
        website_url,
        business_type: business_type || 'LocalBusiness',
    };
    if (notes != null) row.notes = notes;
    if (target_region != null) row.target_region = target_region;
    const { data, error } = await sb().from('client_geo_profiles').insert(row).select().single();
    if (error) throw new Error(`[DB] createClient: ${error.message}`);
    return data;
}

export async function updateClient(id, updates) {
    const { data, error } = await sb().from('client_geo_profiles').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`[DB] updateClient ${id}: ${error.message}`);
    return data;
}

// ─── Audits (client_site_audits) ─────────────────────────────────────────────

export async function getLatestAudit(clientId) {
    const { data, error } = await sb()
        .from('client_site_audits')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') throw new Error(`[DB] latestAudit ${clientId}: ${error.message}`);
    return data || null;
}

export async function createAuditRun(auditData) {
    const { data, error } = await sb().from('client_site_audits').insert(auditData).select().single();
    if (error) throw new Error(`[DB] createAuditRun: ${error.message}`);
    return data;
}

export async function updateAuditRun(id, updates) {
    const { data, error } = await sb().from('client_site_audits').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`[DB] updateAuditRun ${id}: ${error.message}`);
    return data;
}

// ─── Tracked Queries ─────────────────────────────────────────────────────────

export async function getTrackedQueries(clientId, activeOnly = true) {
    let q = sb().from('tracked_queries').select('*').eq('client_id', clientId);
    if (activeOnly) q = q.eq('is_active', true);
    const { data, error } = await q.order('created_at', { ascending: true });
    if (error) throw new Error(`[DB] trackedQueries ${clientId}: ${error.message}`);
    return data || [];
}

export async function createTrackedQuery({ client_id, query_text, category, locale, query_type, is_active }) {
    const row = {
        client_id,
        query_text,
        category: category || query_type || 'general',
        locale: locale || 'fr-CA',
        query_type: query_type || category || 'general',
        is_active: is_active !== false,
    };
    const { data, error } = await sb().from('tracked_queries').insert(row).select().single();
    if (error) throw new Error(`[DB] createTrackedQuery: ${error.message}`);
    return data;
}

// ─── Query Runs ──────────────────────────────────────────────────────────────

export async function createQueryRun(runData) {
    const { data, error } = await sb().from('query_runs').insert(runData).select().single();
    if (error) throw new Error(`[DB] createQueryRun: ${error.message}`);
    return data;
}

export async function getQueryRuns(clientId, limit = 20) {
    const { data, error } = await sb()
        .from('query_runs')
        .select('*, tracked_queries(query_text, category)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] queryRuns ${clientId}: ${error.message}`);
    return data || [];
}

// ─── Query Mentions ──────────────────────────────────────────────────────────

export async function createQueryMentions(mentions) {
    if (!mentions.length) return [];
    const { data, error } = await sb().from('query_mentions').insert(mentions).select();
    if (error) throw new Error(`[DB] createQueryMentions: ${error.message}`);
    return data || [];
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export async function getOpportunities(clientId) {
    const { data, error } = await sb()
        .from('opportunities')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(`[DB] opportunities ${clientId}: ${error.message}`);
    return data || [];
}

export async function archiveOldOpportunities(clientId) {
    const { error } = await sb()
        .from('opportunities')
        .update({ status: 'dismissed' })
        .eq('client_id', clientId)
        .eq('status', 'open');
    if (error) console.error(`[DB] archiveOldOpportunities: ${error.message}`);
}

export async function createOpportunities(opps) {
    if (!opps.length) return [];
    const { data, error } = await sb().from('opportunities').insert(opps).select();
    if (error) throw new Error(`[DB] createOpportunities: ${error.message}`);
    return data || [];
}

// ─── Merge Suggestions ──────────────────────────────────────────────────────

export async function getMergeSuggestions(clientId, status = null) {
    let q = sb().from('merge_suggestions').select('*').eq('client_id', clientId);
    if (status) q = q.eq('status', status);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw new Error(`[DB] mergeSuggestions ${clientId}: ${error.message}`);
    return data || [];
}

export async function archiveOldMergeSuggestions(clientId) {
    const { error } = await sb()
        .from('merge_suggestions')
        .update({ status: 'rejected' })
        .eq('client_id', clientId)
        .eq('status', 'pending');
    if (error) console.error(`[DB] archiveOldMergeSuggestions: ${error.message}`);
}

export async function createMergeSuggestions(suggestions) {
    if (!suggestions.length) return [];
    const { data, error } = await sb().from('merge_suggestions').insert(suggestions).select();
    if (error) throw new Error(`[DB] createMergeSuggestions: ${error.message}`);
    return data || [];
}

export async function getMergeSuggestionById(id) {
    const { data, error } = await sb().from('merge_suggestions').select('*').eq('id', id).single();
    if (error) throw new Error(`[DB] mergeSuggestion ${id}: ${error.message}`);
    return data;
}

export async function updateMergeSuggestion(id, updates) {
    const { data, error } = await sb().from('merge_suggestions').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`[DB] updateMergeSuggestion ${id}: ${error.message}`);
    return data;
}

// ─── Actions Log ─────────────────────────────────────────────────────────────

export async function logAction({ client_id, action_type, details, performed_by }) {
    const { error } = await sb().from('actions').insert({ client_id, action_type, details, performed_by });
    if (error) console.error(`[DB] logAction: ${error.message}`);
}

// ─── Tracked queries (CRUD) ─────────────────────────────────────────────────

export async function getTrackedQueriesAll(clientId) {
    const { data, error } = await sb()
        .from('tracked_queries')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(`[DB] getTrackedQueriesAll ${clientId}: ${error.message}`);
    return data || [];
}

export async function updateTrackedQuery(id, updates) {
    const { data, error } = await sb().from('tracked_queries').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`[DB] updateTrackedQuery ${id}: ${error.message}`);
    return data;
}

export async function deleteTrackedQuery(id) {
    const { error } = await sb().from('tracked_queries').delete().eq('id', id);
    if (error) throw new Error(`[DB] deleteTrackedQuery ${id}: ${error.message}`);
}

// ─── Audits / runs history ─────────────────────────────────────────────────

export async function getRecentAudits(clientId, limit = 5) {
    const { data, error } = await sb()
        .from('client_site_audits')
        .select('id, scan_status, seo_score, geo_score, created_at, error_message')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] getRecentAudits: ${error.message}`);
    return data || [];
}

export async function getRecentQueryRuns(clientId, limit = 5) {
    const { data, error } = await sb()
        .from('query_runs')
        .select('id, tracked_query_id, query_text, provider, model, status, target_found, total_mentioned, created_at, parsed_response')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] getRecentQueryRuns: ${error.message}`);
    return data || [];
}

// ─── Client archive / delete ────────────────────────────────────────────────

export async function archiveClient(id) {
    const { data, error } = await sb()
        .from('client_geo_profiles')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .is('archived_at', null)
        .select()
        .single();
    if (error) throw new Error(`[DB] archiveClient: ${error.message}`);
    return data;
}

export async function restoreClient(id) {
    const { data, error } = await sb()
        .from('client_geo_profiles')
        .update({ archived_at: null })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(`[DB] restoreClient: ${error.message}`);
    return data;
}

export async function deleteClientHard(id) {
    const { error } = await sb().from('client_geo_profiles').delete().eq('id', id);
    if (error) throw new Error(`[DB] deleteClientHard: ${error.message}`);
}

/**
 * Agrégations réelles pour le dashboard GEO (pas de données inventées).
 */
export async function getClientGeoMetrics(clientId) {
    const supa = sb();

    const latestAudit = await getLatestAudit(clientId);

    const { count: openOpportunities } = await supa
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'open');

    const { count: pendingMerge } = await supa
        .from('merge_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'pending');

    const { count: activeTrackedQueries } = await supa
        .from('tracked_queries')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('is_active', true);

    const { count: totalTrackedQueries } = await supa
        .from('tracked_queries')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

    const { count: totalQueryRuns } = await supa
        .from('query_runs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'completed');

    const { count: brandRecommendations } = await supa
        .from('query_runs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .eq('target_found', true);

    const { data: runRows } = await supa
        .from('query_runs')
        .select('id, provider, model')
        .eq('client_id', clientId)
        .eq('status', 'completed');

    const runsByProvider = {};
    for (const r of runRows || []) {
        const k = r.provider || 'unknown';
        runsByProvider[k] = (runsByProvider[k] || 0) + 1;
    }

    const { data: clientRuns } = await supa.from('query_runs').select('id').eq('client_id', clientId);
    const runIds = (clientRuns || []).map((r) => r.id);
    let mentionRows = [];
    if (runIds.length > 0) {
        const { data: m } = await supa
            .from('query_mentions')
            .select('entity_type, is_target, business_name, created_at, query_run_id')
            .in('query_run_id', runIds);
        mentionRows = m || [];
    }

    let competitorMentions = 0;
    let sourceMentions = 0;
    let brandTargetMentions = 0;
    const sourceHosts = new Map();
    const sourceMentionsByDay = new Map();

    for (const m of mentionRows) {
        const et = m.entity_type || 'business';
        if (et === 'source') {
            sourceMentions += 1;
            if (m.created_at) {
                const d = String(m.created_at).slice(0, 10);
                sourceMentionsByDay.set(d, (sourceMentionsByDay.get(d) || 0) + 1);
            }
            const host = (m.business_name || '').replace(/^https?:\/\//, '').split('/')[0];
            if (host) sourceHosts.set(host, (sourceHosts.get(host) || 0) + 1);
        } else if (et === 'competitor' || (et === 'business' && m.is_target === false)) {
            competitorMentions += 1;
        }
        if (et === 'business' && m.is_target === true) {
            brandTargetMentions += 1;
        }
    }

    const topSources = [...sourceHosts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([host, count]) => ({ host, count }));

    const sourceMentionsTimeline = [...sourceMentionsByDay.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

    /** Runs ayant au moins une mention « source » (couverture citations par run) */
    const runsWithSourceCitation = new Set();
    for (const m of mentionRows) {
        if ((m.entity_type || 'business') === 'source' && m.query_run_id) runsWithSourceCitation.add(m.query_run_id);
    }
    const runsWithSourceCitationCount = runsWithSourceCitation.size;

    const { data: lastRunRow } = await supa
        .from('query_runs')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const tq = totalQueryRuns ?? 0;
    const br = brandRecommendations ?? 0;
    const visibilityProxyPercent = tq > 0 ? Math.round((br / tq) * 100) : null;
    const avgSourceMentionsPerRun = tq > 0 ? Math.round((sourceMentions / tq) * 10) / 10 : null;
    const citationCoveragePercent =
        tq > 0 ? Math.round((runsWithSourceCitationCount / tq) * 100) : null;

    /** Stats tracked queries × dernier run */
    let trackedPromptStats = {
        total: 0,
        withTargetFound: 0,
        withRunNoTarget: 0,
        noRunYet: 0,
        mentionRatePercent: null,
    };
    try {
        const trackedList = await getTrackedQueriesAll(clientId);
        const lastMap = await getLastRunPerTrackedQuery(clientId);
        trackedPromptStats.total = trackedList.length;
        for (const t of trackedList) {
            const lr = lastMap.get(t.id);
            if (!lr) trackedPromptStats.noRunYet += 1;
            else if (lr.target_found) trackedPromptStats.withTargetFound += 1;
            else trackedPromptStats.withRunNoTarget += 1;
        }
        if (trackedPromptStats.total > 0) {
            trackedPromptStats.mentionRatePercent = Math.round(
                (trackedPromptStats.withTargetFound / trackedPromptStats.total) * 100
            );
        }
    } catch (e) {
        console.error('[getClientGeoMetrics] trackedPromptStats', e.message);
    }

    /** Performance par couple provider / model (runs réels) */
    let modelPerformance = [];
    try {
        const { data: cr } = await supa
            .from('query_runs')
            .select('id, provider, model, target_found')
            .eq('client_id', clientId)
            .eq('status', 'completed');
        const crList = cr || [];
        const runById = new Map(crList.map((r) => [r.id, r]));
        const agg = new Map();
        for (const r of crList) {
            const key = `${r.provider || 'unknown'}|||${r.model || 'unknown'}`;
            if (!agg.has(key)) {
                agg.set(key, {
                    provider: r.provider || 'unknown',
                    model: r.model || 'unknown',
                    runs: 0,
                    targetFound: 0,
                    sources: 0,
                });
            }
            const row = agg.get(key);
            row.runs += 1;
            if (r.target_found) row.targetFound += 1;
        }
        const crIds = crList.map((r) => r.id);
        if (crIds.length > 0) {
            const { data: srcM } = await supa
                .from('query_mentions')
                .select('query_run_id, entity_type')
                .in('query_run_id', crIds);
            for (const m of srcM || []) {
                if (m.entity_type !== 'source') continue;
                const run = runById.get(m.query_run_id);
                if (!run) continue;
                const key = `${run.provider || 'unknown'}|||${run.model || 'unknown'}`;
                if (agg.has(key)) agg.get(key).sources += 1;
            }
        }
        modelPerformance = [...agg.values()]
            .map((row) => ({
                ...row,
                targetRatePercent: row.runs > 0 ? Math.round((row.targetFound / row.runs) * 100) : 0,
            }))
            .sort((a, b) => b.runs - a.runs);
    } catch (e) {
        console.error('[getClientGeoMetrics] modelPerformance', e.message);
    }

    return {
        latestAudit,
        lastAuditAt: latestAudit?.created_at ?? null,
        lastGeoRunAt: lastRunRow?.created_at ?? null,
        openOpportunities: openOpportunities ?? 0,
        pendingMerge: pendingMerge ?? 0,
        activeTrackedQueries: activeTrackedQueries ?? 0,
        totalTrackedQueries: totalTrackedQueries ?? 0,
        totalQueryRuns: tq,
        brandRecommendationRuns: br,
        competitorMentions,
        sourceMentions,
        uniqueSourceHosts: sourceHosts.size,
        brandTargetMentions,
        topSources,
        sourceMentionsTimeline,
        runsByProvider,
        visibilityProxyPercent,
        avgSourceMentionsPerRun,
        runsWithSourceCitation: runsWithSourceCitationCount,
        citationCoveragePercent,
        trackedPromptStats,
        modelPerformance,
        strengths: latestAudit?.strengths || [],
        issues: latestAudit?.issues || [],
        seoScore: latestAudit?.seo_score ?? null,
        geoScore: latestAudit?.geo_score ?? null,
    };
}

/**
 * Dernier run par tracked query (pour GeoPromptsView).
 */
export async function getLastRunPerTrackedQuery(clientId) {
    const { data: runs, error } = await sb()
        .from('query_runs')
        .select('id, tracked_query_id, provider, model, status, target_found, created_at, parsed_response')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(`[DB] getLastRunPerTrackedQuery: ${error.message}`);

    const byTq = new Map();
    for (const r of runs || []) {
        if (!r.tracked_query_id) continue;
        if (!byTq.has(r.tracked_query_id)) byTq.set(r.tracked_query_id, r);
    }
    return byTq;
}
