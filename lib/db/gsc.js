import 'server-only';

import { db } from '@/lib/db/core';

export async function upsertGscSearchAnalyticsRows(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const { data, error } = await db()
        .from('gsc_search_analytics')
        .upsert(rows, { onConflict: 'client_id,date,query,page' })
        .select('id, client_id, date, query, page, clicks, impressions, ctr, position');

    if (error) {
        throw new Error(`[DB/gsc] upsertGscSearchAnalyticsRows: ${error.message}`);
    }

    return data || [];
}
