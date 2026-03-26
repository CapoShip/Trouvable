import 'server-only';

import { google } from 'googleapis';

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
