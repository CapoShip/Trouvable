import 'server-only';

import { getTrafficDailyRows, getTopPagesRows } from '@/lib/db/ga4';
import { getRecentGscRows } from '@/lib/db/gsc';
import { getClientConnectorRows } from '@/lib/connectors/repository';

// ──────────────────────────────────────────────────────────────
// Visibility slice — GA4 traffic + GSC search performance
// ──────────────────────────────────────────────────────────────

function resolveConnectorStatus(rows, provider) {
    const row = (rows || []).find((r) => r.provider === provider) || null;
    if (!row || row.status === 'not_connected') {
        return { status: 'not_connected', lastSyncedAt: null, lastError: null };
    }
    return {
        status: row.status,
        lastSyncedAt: row.last_synced_at || null,
        lastError: row.last_error || null,
    };
}

function sumField(rows, field) {
    return rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
}

export async function getVisibilitySlice(clientId) {
    const [connectorRows, trafficRows, topPages, gscRows] = await Promise.all([
        getClientConnectorRows(clientId).catch(() => []),
        getTrafficDailyRows(clientId, { days: 28 }).catch(() => []),
        getTopPagesRows(clientId, { limit: 20 }).catch(() => []),
        getRecentGscRows(clientId, { days: 28, limit: 200 }).catch(() => []),
    ]);

    const ga4Status = resolveConnectorStatus(connectorRows, 'ga4');
    const gscStatus = resolveConnectorStatus(connectorRows, 'gsc');

    const bothDisconnected =
        ga4Status.status === 'not_connected' && gscStatus.status === 'not_connected';

    if (bothDisconnected && trafficRows.length === 0 && gscRows.length === 0) {
        return {
            connectors: { ga4: ga4Status, gsc: gscStatus },
            kpis: null,
            trafficDaily: [],
            topPages: [],
            gscQueries: [],
            emptyState: {
                title: 'Visibilité Google non connectée',
                description:
                    'Les connecteurs GA4 et Search Console ne sont pas configurés pour ce client. Configurez-les dans les paramètres pour activer le suivi de visibilité.',
            },
        };
    }

    const kpis = {
        sessions: sumField(trafficRows, 'sessions'),
        users: sumField(trafficRows, 'users'),
        newUsers: sumField(trafficRows, 'new_users'),
        pageViews: sumField(trafficRows, 'page_views'),
        totalClicks: sumField(gscRows, 'clicks'),
        totalImpressions: sumField(gscRows, 'impressions'),
        daysWithTraffic: trafficRows.length,
        gscQueryCount: new Set(gscRows.map((r) => r.query)).size,
    };

    // Aggregate GSC rows by query (sum clicks/impressions, avg position/ctr)
    const queryMap = new Map();
    for (const row of gscRows) {
        const key = row.query;
        if (!queryMap.has(key)) {
            queryMap.set(key, { query: key, clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 });
        }
        const agg = queryMap.get(key);
        agg.clicks += Number(row.clicks) || 0;
        agg.impressions += Number(row.impressions) || 0;
        agg.ctrSum += Number(row.ctr) || 0;
        agg.positionSum += Number(row.position) || 0;
        agg.count += 1;
    }

    const gscQueries = Array.from(queryMap.values())
        .map((a) => ({
            query: a.query,
            clicks: a.clicks,
            impressions: a.impressions,
            ctr: a.count > 0 ? Math.round((a.ctrSum / a.count) * 100) / 100 : 0,
            position: a.count > 0 ? Math.round((a.positionSum / a.count) * 10) / 10 : 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 50);

    return {
        connectors: { ga4: ga4Status, gsc: gscStatus },
        kpis,
        trafficDaily: trafficRows,
        topPages: topPages.slice(0, 20),
        gscQueries,
        emptyState: null,
    };
}
