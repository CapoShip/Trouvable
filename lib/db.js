import 'server-only';
import { getAdminSupabase } from './supabase-admin.js';
import { syncClientProfileCompatibilityFields } from './client-profile.js';
import { flattenSnapshotToLegacy } from './operator-intelligence/kpi-core.js';
import { getGeoWorkspaceSnapshot } from './operator-intelligence/snapshot.js';
import { normalizeTrackedQueryCategory, prepareTrackedQueryWrite } from './operator-intelligence/prompt-taxonomy.js';

const sb = () => getAdminSupabase();
const QUERY_RUN_TRACKED_QUERY_SELECT = 'tracked_queries(query_text, category, query_type, locale)';
const LEGACY_TRACKED_QUERY_CATEGORY_MAP = {
    discovery: 'general',
    local_intent: 'local',
    service_intent: 'service',
    competitor_comparison: 'competitor',
    brand: 'brand',
};

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

function normalizeQueryRunRows(rows) {
    return (rows || []).map((row) => normalizeQueryRunRow(row));
}

function createDbError(context, error, metadata = {}) {
    const dbError = new Error(`[DB] ${context}: ${error?.message || 'Unknown database error'}`);
    dbError.code = error?.code;
    dbError.details = error?.details;
    dbError.hint = error?.hint;
    dbError.constraint = error?.constraint;
    Object.assign(dbError, metadata);
    return dbError;
}

function isTrackedQueryConstraintDriftError(error) {
    if (!error || String(error.code || '') !== '23514') return false;
    const constraint = String(error.constraint || '').toLowerCase();
    const message = String(error.message || '').toLowerCase();
    const details = String(error.details || '').toLowerCase();
    const trackedQueriesContext = constraint.includes('tracked_queries')
        || message.includes('tracked_queries')
        || details.includes('tracked_queries');

    if (!trackedQueriesContext) return false;

    return (
        constraint.includes('query_type')
        || constraint.includes('category')
        || message.includes('query_type')
        || message.includes('category')
        || message.includes('check constraint')
        || details.includes('check constraint')
    );
}

function mapTrackedQueryWriteToLegacy(row) {
    const canonicalCategory = normalizeTrackedQueryCategory(row?.category ?? row?.query_type, row?.query_text);
    const legacyCategory = LEGACY_TRACKED_QUERY_CATEGORY_MAP[canonicalCategory] || 'general';
    return {
        ...row,
        category: legacyCategory,
        query_type: legacyCategory,
    };
}

export function isTrackedQueryConstraintDrift(error) {
    return Boolean(error?.isTrackedQueryConstraintDrift);
}

function uniqueNonEmptyStrings(values) {
    return [...new Set((values || []).filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

function compactOpportunityDebugRow(row) {
    if (!row || typeof row !== 'object') return null;
    return {
        client_id: row.client_id ?? null,
        audit_id: row.audit_id ?? null,
        title: typeof row.title === 'string' ? row.title.slice(0, 120) : null,
        priority: row.priority ?? null,
        status: row.status ?? null,
    };
}

function findInvalidClientIdRows(rows) {
    return (rows || [])
        .map((row, index) => ({ index, row }))
        .filter(({ row }) => typeof row?.client_id !== 'string' || row.client_id.trim().length === 0)
        .map(({ index, row }) => ({
            index,
            ...compactOpportunityDebugRow(row),
        }));
}

async function validateClientAuditReferences(rows, context) {
    const payloads = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (payloads.length === 0) return;

    const clientIds = uniqueNonEmptyStrings(payloads.map((row) => row.client_id));
    const auditIds = uniqueNonEmptyStrings(payloads.map((row) => row.audit_id));

    console.log(`[DB-debug] ${context} validate refs start`, {
        rowCount: payloads.length,
        clientIds,
        auditIds,
        firstRows: payloads.slice(0, 5).map((row) => compactOpportunityDebugRow(row)),
    });

    if (clientIds.length === 0) {
        throw new Error(`[DB] ${context}: missing client_id on payload(s)`);
    }

    const { data: clientRows, error: clientError } = await sb()
        .from('client_geo_profiles')
        .select('id')
        .in('id', clientIds);
    if (clientError) {
        throw new Error(`[DB] ${context}: failed to validate client_id references: ${clientError.message}`);
    }

    const existingClientIds = new Set((clientRows || []).map((row) => row.id));
    console.log(`[DB-debug] ${context} client refs`, {
        requestedClientIds: clientIds,
        existingClientIds: [...existingClientIds],
        existsByClientId: clientIds.map((id) => ({ client_id: id, exists: existingClientIds.has(id) })),
    });
    const missingClientIds = clientIds.filter((id) => !existingClientIds.has(id));
    if (missingClientIds.length > 0) {
        throw new Error(`[DB] ${context}: invalid client_id reference(s): ${missingClientIds.join(', ')}`);
    }

    if (auditIds.length === 0) return;

    const { data: auditRows, error: auditError } = await sb()
        .from('client_site_audits')
        .select('id, client_id')
        .in('id', auditIds);
    if (auditError) {
        throw new Error(`[DB] ${context}: failed to validate audit_id references: ${auditError.message}`);
    }

    const auditsById = new Map((auditRows || []).map((row) => [row.id, row]));
    console.log(`[DB-debug] ${context} audit refs`, {
        requestedAuditIds: auditIds,
        existingAudits: (auditRows || []).map((row) => ({ id: row.id, client_id: row.client_id })),
    });
    const missingAuditIds = auditIds.filter((id) => !auditsById.has(id));
    if (missingAuditIds.length > 0) {
        throw new Error(`[DB] ${context}: invalid audit_id reference(s): ${missingAuditIds.join(', ')}`);
    }

    const mismatches = payloads
        .filter((row) => row.audit_id)
        .map((row, index) => {
            const audit = auditsById.get(row.audit_id);
            if (!audit || audit.client_id === row.client_id) return null;
            return `payload[${index}] audit_id=${row.audit_id} belongs to client_id=${audit.client_id}, received client_id=${row.client_id}`;
        })
        .filter(Boolean);

    console.log(`[DB-debug] ${context} audit/client match`, {
        matches: payloads
            .filter((row) => row.audit_id)
            .map((row, index) => {
                const audit = auditsById.get(row.audit_id);
                return {
                    index,
                    audit_id: row.audit_id,
                    payload_client_id: row.client_id,
                    audit_client_id: audit?.client_id ?? null,
                    matches: Boolean(audit && audit.client_id === row.client_id),
                };
            }),
    });

    if (mismatches.length > 0) {
        throw new Error(`[DB] ${context}: audit/client mismatch detected (${mismatches.join(' | ')})`);
    }
}

// ─── Clients (client_geo_profiles) ───────────────────────────────────────────

export async function getClientById(id) {
    const { data, error } = await sb().from('client_geo_profiles').select('*').eq('id', id).single();
    if (error?.code === 'PGRST116') throw new Error(`[DB] Client introuvable: ${id}`);
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
        business_type: business_type || 'A_confirmer',
    };
    if (notes != null) row.notes = notes;
    if (target_region != null) row.target_region = target_region;
    const { data, error } = await sb().from('client_geo_profiles').insert(row).select().single();
    if (error) throw new Error(`[DB] createClient: ${error.message}`);
    return data;
}

export async function updateClient(id, updates) {
    const normalizedUpdates = syncClientProfileCompatibilityFields(updates);
    const { data, error } = await sb().from('client_geo_profiles').update(normalizedUpdates).eq('id', id).select().single();
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

export async function getLatestAuditByUrl(sourceUrl) {
    if (!sourceUrl) return null;
    const normalized = sourceUrl.replace(/\/+$/, '').toLowerCase();
    const { data, error } = await sb()
        .from('client_site_audits')
        .select('*')
        .or(`source_url.ilike.${normalized},source_url.ilike.${normalized}/,resolved_url.ilike.${normalized},resolved_url.ilike.${normalized}/`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) {
        console.error(`[DB] getLatestAuditByUrl ${sourceUrl}: ${error.message}`);
        return null;
    }
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

export async function createTrackedQuery({
    client_id,
    query_text,
    category,
    locale,
    query_type,
    is_active,
    prompt_origin,
    intent_family,
    query_type_v2,
    funnel_stage,
    geo_scope,
    brand_scope,
    comparison_scope,
    quality_status,
    quality_score,
    quality_reasons,
    prompt_metadata,
}) {
    const row = prepareTrackedQueryWrite({
        client_id,
        query_text,
        category,
        locale,
        query_type,
        is_active: is_active !== false,
        ...(prompt_origin !== undefined ? { prompt_origin } : {}),
        ...(intent_family !== undefined ? { intent_family } : {}),
        ...(query_type_v2 !== undefined ? { query_type_v2 } : {}),
        ...(funnel_stage !== undefined ? { funnel_stage } : {}),
        ...(geo_scope !== undefined ? { geo_scope } : {}),
        ...(brand_scope !== undefined ? { brand_scope } : {}),
        ...(comparison_scope !== undefined ? { comparison_scope } : {}),
        ...(quality_status !== undefined ? { quality_status } : {}),
        ...(quality_score !== undefined ? { quality_score } : {}),
        ...(quality_reasons !== undefined ? { quality_reasons } : {}),
        ...(prompt_metadata !== undefined ? { prompt_metadata } : {}),
    });
    const { data, error } = await sb().from('tracked_queries').insert(row).select().single();
    if (!error) return data;

    if (isTrackedQueryConstraintDriftError(error)) {
        const legacyRow = mapTrackedQueryWriteToLegacy(row);
        console.warn(
            '[DB] createTrackedQuery: tracked_queries category/query_type constraint drift detected. Retrying with legacy mapping; apply latest Supabase migrations.'
        );

        const { data: retryData, error: retryError } = await sb().from('tracked_queries').insert(legacyRow).select().single();
        if (!retryError) return retryData;

        throw createDbError('createTrackedQuery', retryError, {
            isTrackedQueryConstraintDrift: true,
            trackedQueryConstraintDriftInitialError: error.message,
        });
    }

    throw createDbError('createTrackedQuery', error);
}

// ─── Query Runs ──────────────────────────────────────────────────────────────

export async function createQueryRun(runData) {
    const normalizedRunData = {
        ...runData,
        provider: runData.provider || 'unknown',
        model: runData.model || 'unknown',
        status: runData.status || 'completed',
        run_mode: runData.run_mode || 'standard',
        engine_variant: runData.engine_variant || 'tavily_orchestrated',
        locale: runData.locale || 'fr-CA',
        target_found: runData.target_found ?? false,
        total_mentioned: runData.total_mentioned ?? 0,
        raw_analysis: runData.raw_analysis ?? {},
        parsed_response: runData.parsed_response ?? {},
        prompt_payload: runData.prompt_payload ?? {},
        raw_response_full: runData.raw_response_full ?? runData.response_text ?? null,
        normalized_response: runData.normalized_response ?? runData.parsed_response ?? {},
        parse_status: runData.parse_status || 'parsed_failed',
        parse_warnings: runData.parse_warnings ?? [],
        usage_tokens: runData.usage_tokens ?? {},
        retry_count: runData.retry_count ?? 0,
        extraction_version: runData.extraction_version || 'v2',
        target_detection: runData.target_detection ?? {},
    };

    const { data, error } = await sb().from('query_runs').insert(normalizedRunData).select().single();
    if (error) throw new Error(`[DB] createQueryRun: ${error.message}`);
    return data;
}

export async function updateQueryRun(id, updates) {
    const normalizedUpdates = {
        ...updates,
        ...(Object.prototype.hasOwnProperty.call(updates, 'provider') ? { provider: updates.provider || 'unknown' } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'model') ? { model: updates.model || 'unknown' } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'raw_analysis') ? { raw_analysis: updates.raw_analysis ?? {} } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'parsed_response') ? { parsed_response: updates.parsed_response ?? {} } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'prompt_payload') ? { prompt_payload: updates.prompt_payload ?? {} } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'normalized_response') ? { normalized_response: updates.normalized_response ?? {} } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'parse_warnings') ? { parse_warnings: updates.parse_warnings ?? [] } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'usage_tokens') ? { usage_tokens: updates.usage_tokens ?? {} } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'target_detection') ? { target_detection: updates.target_detection ?? {} } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'total_mentioned') ? { total_mentioned: updates.total_mentioned ?? 0 } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'target_found') ? { target_found: updates.target_found ?? false } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'run_mode') ? { run_mode: updates.run_mode || 'standard' } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'engine_variant') ? { engine_variant: updates.engine_variant || 'tavily_orchestrated' } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'locale') ? { locale: updates.locale || 'fr-CA' } : {}),
    };

    const { data, error } = await sb().from('query_runs').update(normalizedUpdates).eq('id', id).select().single();
    if (error) throw new Error(`[DB] updateQueryRun ${id}: ${error.message}`);
    return data;
}

export async function getQueryRuns(clientId, limit = 20) {
    const { data, error } = await sb()
        .from('query_runs')
        .select(`*, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] queryRuns ${clientId}: ${error.message}`);
    return normalizeQueryRunRows(data);
}

export async function getQueryRunById(id) {
    const { data, error } = await sb()
        .from('query_runs')
        .select(`*, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('id', id)
        .single();
    if (error) throw new Error(`[DB] getQueryRunById ${id}: ${error.message}`);
    return normalizeQueryRunRow(data);
}

export async function getQueryRunMentions(queryRunId) {
    const { data, error } = await sb()
        .from('query_mentions')
        .select('*')
        .eq('query_run_id', queryRunId)
        .order('position', { ascending: true });
    if (error) throw new Error(`[DB] getQueryRunMentions ${queryRunId}: ${error.message}`);
    return data || [];
}

export async function getQueryRunsHistory(clientId, limit = 200) {
    const { data, error } = await sb()
        .from('query_runs')
        .select(`id, client_id, tracked_query_id, query_text, provider, model, status, run_mode, engine_variant, parse_status, parse_confidence, latency_ms, target_found, target_position, total_mentioned, created_at, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('client_id', clientId)
        .or('run_mode.is.null,run_mode.eq.standard')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] getQueryRunsHistory ${clientId}: ${error.message}`);
    return normalizeQueryRunRows(data);
}

export async function getCompletedQueryRuns(clientId, limit = null) {
    let query = sb()
        .from('query_runs')
        .select(`id, client_id, tracked_query_id, query_text, provider, model, status, run_mode, engine_variant, parse_status, parse_confidence, latency_ms, target_found, target_position, total_mentioned, created_at, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .or('run_mode.is.null,run_mode.eq.standard')
        .order('created_at', { ascending: false });

    if (Number.isInteger(limit) && limit > 0) {
        query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[DB] getCompletedQueryRuns ${clientId}: ${error.message}`);
    return normalizeQueryRunRows(data);
}

// ─── Query Mentions ──────────────────────────────────────────────────────────

export async function createQueryMentions(mentions) {
    if (!mentions.length) return [];
    const { data, error } = await sb().from('query_mentions').insert(mentions).select();
    if (error) throw new Error(`[DB] createQueryMentions: ${error.message}`);
    return data || [];
}

export async function deleteQueryMentionsByRunId(queryRunId) {
    const { error } = await sb()
        .from('query_mentions')
        .delete()
        .eq('query_run_id', queryRunId);
    if (error) throw new Error(`[DB] deleteQueryMentionsByRunId ${queryRunId}: ${error.message}`);
}

export async function getCompetitorAliases(clientId, activeOnly = true) {
    let query = sb()
        .from('competitor_aliases')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[DB] getCompetitorAliases ${clientId}: ${error.message}`);
    return data || [];
}

export async function upsertCompetitorAliases(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const { data, error } = await sb()
        .from('competitor_aliases')
        .upsert(rows, { onConflict: 'client_id,alias' })
        .select('*');
    if (error) throw new Error(`[DB] upsertCompetitorAliases: ${error.message}`);
    return data || [];
}

export async function createBenchmarkSession(payload) {
    const { data, error } = await sb()
        .from('benchmark_sessions')
        .insert(payload)
        .select('*')
        .single();
    if (error) throw new Error(`[DB] createBenchmarkSession: ${error.message}`);
    return data;
}

export async function updateBenchmarkSession(id, updates) {
    const { data, error } = await sb()
        .from('benchmark_sessions')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
    if (error) throw new Error(`[DB] updateBenchmarkSession ${id}: ${error.message}`);
    return data;
}

export async function getBenchmarkSessionById(id) {
    const { data, error } = await sb()
        .from('benchmark_sessions')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw new Error(`[DB] getBenchmarkSessionById ${id}: ${error.message}`);
    return data;
}

export async function getBenchmarkSessionsForClient(clientId, limit = 8) {
    const { data, error } = await sb()
        .from('benchmark_sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] getBenchmarkSessionsForClient ${clientId}: ${error.message}`);
    return data || [];
}

export async function getBenchmarkRunsBySession(sessionId) {
    const { data, error } = await sb()
        .from('query_runs')
        .select(`*, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('benchmark_session_id', sessionId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(`[DB] getBenchmarkRunsBySession ${sessionId}: ${error.message}`);
    return normalizeQueryRunRows(data);
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
    const distinctClientIds = uniqueNonEmptyStrings(opps.map((row) => row.client_id));
    const invalidClientIdRows = findInvalidClientIdRows(opps);
    const compactRows = opps.slice(0, 5).map((row) => compactOpportunityDebugRow(row));

    console.log('[DB-debug] createOpportunities payload', {
        rowCount: opps.length,
        distinctClientIds,
        invalidClientIdRows,
        firstRows: compactRows,
    });

    if (invalidClientIdRows.length > 0) {
        throw new Error(`[DB] createOpportunities: invalid opportunity payload(s) missing client_id: ${JSON.stringify(invalidClientIdRows)}`);
    }

    await validateClientAuditReferences(opps, 'createOpportunities');
    const { data, error } = await sb().from('opportunities').insert(opps).select();
    if (error) {
        console.error('[DB-debug] createOpportunities insert failed', {
            distinctClientIds,
            firstRows: compactRows,
            invalidClientIdRows,
            error: {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            },
        });
        if (error.code === '23503' && typeof error.details === 'string' && error.details.includes('table "clients"')) {
            throw new Error('[DB] createOpportunities: live opportunities.client_id foreign key still points to legacy table "clients". Apply the foreign-key repair migration before rerunning the audit.');
        }
        throw new Error(`[DB] createOpportunities: ${error.message}`);
    }
    return data || [];
}

export async function updateOpportunity(id, updates) {
    const { data, error } = await sb().from('opportunities').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`[DB] updateOpportunity ${id}: ${error.message}`);
    return data;
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
    await validateClientAuditReferences(suggestions, 'createMergeSuggestions');
    const { data, error } = await sb().from('merge_suggestions').insert(suggestions).select();
    if (error) {
        if (error.code === '23503' && typeof error.details === 'string' && error.details.includes('table "clients"')) {
            throw new Error('[DB] createMergeSuggestions: live merge_suggestions.client_id foreign key still points to legacy table "clients". Apply the foreign-key repair migration before rerunning the audit.');
        }
        throw new Error(`[DB] createMergeSuggestions: ${error.message}`);
    }
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

export async function getActions(clientId, actionTypes = [], limit = 25) {
    let query = sb()
        .from('actions')
        .select('id, client_id, action_type, details, performed_by, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (Array.isArray(actionTypes) && actionTypes.length > 0) {
        query = query.in('action_type', actionTypes);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[DB] getActions ${clientId}: ${error.message}`);
    return data || [];
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
    let normalizedUpdates = updates;

    if (updates.category !== undefined || updates.query_type !== undefined || updates.query_text !== undefined || updates.locale !== undefined) {
        const { data: existing, error: existingError } = await sb().from('tracked_queries').select('*').eq('id', id).single();
        if (existingError) throw new Error(`[DB] updateTrackedQuery ${id}: ${existingError.message}`);
        normalizedUpdates = prepareTrackedQueryWrite(updates, existing);
    }

    const { data, error } = await sb().from('tracked_queries').update(normalizedUpdates).eq('id', id).select().single();
    if (!error) return data;

    if (isTrackedQueryConstraintDriftError(error)) {
        const legacyUpdates = mapTrackedQueryWriteToLegacy(normalizedUpdates);
        console.warn(
            `[DB] updateTrackedQuery ${id}: tracked_queries category/query_type constraint drift detected. Retrying with legacy mapping; apply latest Supabase migrations.`
        );

        const { data: retryData, error: retryError } = await sb().from('tracked_queries').update(legacyUpdates).eq('id', id).select().single();
        if (!retryError) return retryData;

        throw createDbError(`updateTrackedQuery ${id}`, retryError, {
            isTrackedQueryConstraintDrift: true,
            trackedQueryConstraintDriftInitialError: error.message,
        });
    }

    throw createDbError(`updateTrackedQuery ${id}`, error);
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
        .select(`id, tracked_query_id, query_text, provider, model, status, run_mode, engine_variant, parse_status, parse_confidence, latency_ms, target_found, total_mentioned, created_at, parsed_response, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('client_id', clientId)
        .or('run_mode.is.null,run_mode.eq.standard')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(`[DB] getRecentQueryRuns: ${error.message}`);
    return normalizeQueryRunRows(data);
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
 * @deprecated Use getGeoWorkspaceSnapshot() for new code.
 * Legacy compat layer — flattens the canonical snapshot into the flat shape
 * consumed by portal-data, continuous/jobs, and getTrendSlice.
 * Will be removed once all consumers migrate to the snapshot API.
 */
export async function getClientGeoMetrics(clientId) {
    const ws = await getGeoWorkspaceSnapshot(clientId);
    const legacy = flattenSnapshotToLegacy(ws.snapshot, ws.latestAudit);
    legacy.modelPerformance = ws.modelPerformance;
    return legacy;
}

/**
 * Opportunities scoped to the latest audit only.
 * Open opportunities from older audits are flagged as stale.
 */
export async function getLatestOpportunities(clientId) {
    const [latestAudit, allOpps] = await Promise.all([
        getLatestAudit(clientId),
        getOpportunities(clientId),
    ]);

    const latestAuditId = latestAudit?.id ?? null;
    const active = [];
    const stale = [];

    for (const o of allOpps) {
        if (o.status !== 'open') {
            active.push(o);
        } else if (!latestAuditId || o.audit_id === latestAuditId || !o.audit_id) {
            active.push(o);
        } else {
            stale.push(o);
        }
    }

    return { active, stale, latestAuditId };
}

/**
 * Dernier run par tracked query (pour GeoPromptsView).
 */
export async function getLastRunPerTrackedQuery(clientId) {
    const { data: runs, error } = await sb()
        .from('query_runs')
        .select(`id, tracked_query_id, query_text, provider, model, status, run_mode, engine_variant, parse_status, parse_confidence, latency_ms, target_found, target_position, total_mentioned, response_text, raw_response_full, created_at, parsed_response, ${QUERY_RUN_TRACKED_QUERY_SELECT}`)
        .eq('client_id', clientId)
        .or('run_mode.is.null,run_mode.eq.standard')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`[DB] getLastRunPerTrackedQuery: ${error.message}`);

    const byTq = new Map();
    for (const r of normalizeQueryRunRows(runs)) {
        if (!r.tracked_query_id) continue;
        if (!byTq.has(r.tracked_query_id)) byTq.set(r.tracked_query_id, r);
    }
    return byTq;
}
