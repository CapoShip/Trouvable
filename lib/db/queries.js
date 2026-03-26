import 'server-only';

import { db } from '@/lib/db/core';

const QUERY_RUN_TRACKED_QUERY_SELECT = 'tracked_queries(query_text, category, query_type, locale)';

function getSingleRelation(value) {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function normalizeQueryRunRow(row) {
    if (!row) return row;
    const trackedQuery = getSingleRelation(row.tracked_queries);
    return {
        ...row,
        tracked_queries: trackedQuery,
        query_text: row.query_text || trackedQuery?.query_text || null,
    };
}

export async function getRecentQueryRuns(clientId, limit = 5) {
    const { data, error } = await db()
        .from('query_runs')
        .select(`id, tracked_query_id, query_text, provider, model, status, run_mode, engine_variant, parse_status, parse_confidence, latency_ms, target_found, total_mentioned, created_at, parsed_response, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('client_id', clientId)
        .or('run_mode.is.null,run_mode.eq.standard')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(`[DB/queries] getRecentQueryRuns: ${error.message}`);
    return (data || []).map((row) => normalizeQueryRunRow(row));
}

export async function createQueryRun(runData) {
    const { data, error } = await db().from('query_runs').insert(runData).select().single();
    if (error) throw new Error(`[DB/queries] createQueryRun: ${error.message}`);
    return data;
}

export async function createQueryMentions(mentions) {
    if (!mentions.length) return [];
    const { data, error } = await db().from('query_mentions').insert(mentions).select();
    if (error) throw new Error(`[DB/queries] createQueryMentions: ${error.message}`);
    return data || [];
}
