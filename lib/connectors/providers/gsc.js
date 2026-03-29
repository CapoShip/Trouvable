import 'server-only';

import { google } from 'googleapis';
import { getRecentGscRows } from '@/lib/db/gsc';

const GSC_SCOPE = ['https://www.googleapis.com/auth/webmasters.readonly'];

function normalizePrivateKey(rawValue) {
    if (!rawValue) return '';
    return String(rawValue).replace(/\\n/g, '\n');
}

function getSearchConsoleAuthClient() {
    const clientEmail = process.env.GOOGLE_SC_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.GOOGLE_SC_PRIVATE_KEY);

    if (!clientEmail || !privateKey) {
        throw new Error('Missing GOOGLE_SC_CLIENT_EMAIL or GOOGLE_SC_PRIVATE_KEY for Search Console connector.');
    }

    return new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: GSC_SCOPE,
    });
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function resolveDateWindow({ startDate, endDate } = {}) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - (27 * 24 * 60 * 60 * 1000));

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Invalid GSC date window. Expected YYYY-MM-DD compatible dates.');
    }

    if (start > end) {
        throw new Error('Invalid GSC date window. startDate must be <= endDate.');
    }

    return {
        startDate: formatDate(start),
        endDate: formatDate(end),
    };
}

/**
 * Query Search Console Search Analytics with a minimal MVP scope.
 * TODO: add country and device filters once per-client targeting is available.
 * TODO: support pagination when rowLimit > API max page size.
 */
export async function fetchGscSearchAnalytics({
    siteUrl,
    startDate,
    endDate,
    rowLimit = 1000,
}) {
    if (!siteUrl || !String(siteUrl).trim()) {
        throw new Error('fetchGscSearchAnalytics requires siteUrl.');
    }

    const window = resolveDateWindow({ startDate, endDate });
    const auth = getSearchConsoleAuthClient();
    const webmasters = google.webmasters({ version: 'v3', auth });

    const response = await webmasters.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate: window.startDate,
            endDate: window.endDate,
            dimensions: ['query', 'page'],
            aggregationType: 'auto',
            rowLimit: Math.max(1, Math.min(Number(rowLimit || 1000), 25000)),
        },
    });

    const rows = response?.data?.rows || [];

    return rows.map((row) => {
        const [query, page] = row.keys || [];
        return {
            query: query || null,
            page: page || null,
            clicks: Number(row.clicks || 0),
            impressions: Number(row.impressions || 0),
            ctr: Number(row.ctr || 0),
            position: Number(row.position || 0),
        };
    });
}

/**
 * Build a connector snapshot by reading from the gsc_search_analytics DB table.
 * Returns hasRealData: true when rows are present, false when empty or not connected.
 */
export async function getGscSnapshotFromDb({ connection, clientId }) {
    if (connection?.status === 'disabled') {
        return {
            provider: 'gsc',
            status: 'disabled',
            hasRealData: false,
            mode: 'disabled',
            message: 'GSC connector is disabled for this client.',
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }

    if (connection?.status === 'sample_mode' || process.env.CONNECTOR_SAMPLE_MODE === '1') {
        return {
            provider: 'gsc',
            status: 'sample_mode',
            hasRealData: false,
            mode: 'sample',
            message: 'Sample mode only. No real GSC data is collected; tables stay empty by design.',
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }

    if (!connection || connection.status === 'not_connected') {
        return {
            provider: 'gsc',
            status: 'not_connected',
            hasRealData: false,
            mode: 'stub',
            message: 'GSC is not connected.',
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }

    try {
        const rows = await getRecentGscRows(clientId, { days: 28, limit: 500 });

        if (!rows || rows.length === 0) {
            return {
                provider: 'gsc',
                status: connection.status,
                hasRealData: false,
                mode: 'configured',
                message: 'GSC connector is configured. No data synced yet.',
                searchQueryTrend: [],
                landingPageTrend: [],
                lastSyncedAt: connection.last_synced_at || null,
            };
        }

        const byQuery = new Map();
        const byPage = new Map();

        for (const row of rows) {
            if (row.query) {
                if (!byQuery.has(row.query)) {
                    byQuery.set(row.query, { query: row.query, clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 });
                }
                const q = byQuery.get(row.query);
                q.clicks += Number(row.clicks || 0);
                q.impressions += Number(row.impressions || 0);
                q.ctrSum += Number(row.ctr || 0);
                q.positionSum += Number(row.position || 0);
                q.count += 1;
            }
            if (row.page) {
                if (!byPage.has(row.page)) {
                    byPage.set(row.page, { page: row.page, clicks: 0, impressions: 0 });
                }
                const p = byPage.get(row.page);
                p.clicks += Number(row.clicks || 0);
                p.impressions += Number(row.impressions || 0);
            }
        }

        const searchQueryTrend = [...byQuery.values()]
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 20)
            .map(({ query, clicks, impressions, ctrSum, positionSum, count }) => ({
                query,
                clicks,
                impressions,
                ctr: count > 0 ? ctrSum / count : 0,
                average_position: count > 0 ? positionSum / count : 0,
            }));

        const landingPageTrend = [...byPage.values()]
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 20)
            .map(({ page, clicks, impressions }) => ({
                page,
                sessions: clicks,
                clicks,
                impressions,
            }));

        return {
            provider: 'gsc',
            status: connection.status,
            hasRealData: true,
            mode: 'real',
            message: `GSC data: ${rows.length} rows over the last 28 days.`,
            searchQueryTrend,
            landingPageTrend,
            lastSyncedAt: connection.last_synced_at || null,
        };
    } catch (error) {
        return {
            provider: 'gsc',
            status: 'error',
            hasRealData: false,
            mode: 'error',
            message: error.message,
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }
}
