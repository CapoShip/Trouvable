import 'server-only';

import { fetchGscSearchAnalytics } from '@/lib/connectors/providers/gsc';
import { getClientById, listClientsWithSiteUrl } from '@/lib/db/clients';
import { upsertGscSearchAnalyticsRows } from '@/lib/db/gsc';
import { updateConnectorState } from '@/lib/connectors/repository';

function dateToYmd(date) {
    return date.toISOString().slice(0, 10);
}

function resolveWindow({ startDate, endDate } = {}) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - (27 * 24 * 60 * 60 * 1000));

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Invalid GSC sync window.');
    }

    return {
        startDate: dateToYmd(start),
        endDate: dateToYmd(end),
    };
}

function normalizeSiteUrl(client) {
    const siteUrl = String(client?.website_url || '').trim();
    if (!siteUrl) return null;
    return siteUrl;
}

function toUpsertRows({ clientId, siteUrl, rows, date }) {
    return (rows || [])
        .filter((row) => row?.query && row?.page)
        .map((row) => ({
            client_id: clientId,
            site_url: siteUrl,
            date,
            query: String(row.query).slice(0, 1024),
            page: String(row.page).slice(0, 2048),
            clicks: Number(row.clicks || 0),
            impressions: Number(row.impressions || 0),
            ctr: Number(row.ctr || 0),
            position: Number(row.position || 0),
        }));
}

export async function runGscSyncForClient(clientId, options = {}) {
    const client = await getClientById(clientId);
    const siteUrl = normalizeSiteUrl(client);
    if (!siteUrl) {
        return {
            clientId,
            siteUrl: null,
            syncedRows: 0,
            fetchedRows: 0,
            skipped: true,
            reason: 'missing_website_url',
        };
    }

    const window = resolveWindow(options);

    let rows;
    try {
        rows = await fetchGscSearchAnalytics({
            siteUrl,
            startDate: window.startDate,
            endDate: window.endDate,
            rowLimit: options.rowLimit || 1000,
        });
    } catch (fetchError) {
        await updateConnectorState({
            clientId,
            provider: 'gsc',
            status: 'error',
            lastError: fetchError.message,
        });
        throw fetchError;
    }

    // TODO: include date dimension in the API query for true per-day granularity.
    const upsertRows = toUpsertRows({
        clientId,
        siteUrl,
        rows,
        date: window.endDate,
    });

    const persisted = await upsertGscSearchAnalyticsRows(upsertRows);

    await updateConnectorState({
        clientId,
        provider: 'gsc',
        status: 'healthy',
        lastSyncedAt: new Date().toISOString(),
    });

    return {
        clientId,
        siteUrl,
        syncedRows: persisted.length,
        fetchedRows: rows.length,
        skipped: false,
        window,
    };
}

export async function runGscSyncForAllClients(options = {}) {
    const clients = await listClientsWithSiteUrl();
    const results = [];

    for (const client of clients) {
        try {
            const result = await runGscSyncForClient(client.id, options);
            results.push(result);
        } catch (error) {
            results.push({
                clientId: client.id,
                siteUrl: client.website_url || null,
                syncedRows: 0,
                fetchedRows: 0,
                skipped: false,
                error: error?.message || 'gsc_sync_failed',
            });
        }
    }

    return {
        totalClients: clients.length,
        succeeded: results.filter((item) => !item.error).length,
        failed: results.filter((item) => item.error).length,
        results,
    };
}
