import 'server-only';

import { getTrafficDailyRows, getTopPagesRows } from '@/lib/db/ga4';
import { getRecentGscRows } from '@/lib/db/gsc';
import { getClientConnectorRows } from '@/lib/connectors/repository';
import { getAdminSupabase } from '@/lib/supabase-admin';

// ──────────────────────────────────────────────────────────────
// Visibility slice — SEO visibility (GSC first, GA4 as support)
// ──────────────────────────────────────────────────────────────

const CURRENT_WINDOW_DAYS = 28;
const COMPARISON_WINDOW_DAYS = 56;

const BRAND_STOPWORDS = new Set([
    'inc',
    'corp',
    'co',
    'compagnie',
    'company',
    'groupe',
    'group',
    'les',
    'des',
    'pour',
    'avec',
    'sur',
    'dans',
    'and',
    'the',
    'sas',
    'sarl',
    'sa',
    'ltd',
    'llc',
    'studio',
    'agence',
]);

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

function toNumber(value) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 0;
}

function sumField(rows, field) {
    return rows.reduce((acc, row) => acc + toNumber(row[field]), 0);
}

function getSinceDate(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function filterRowsSince(rows, sinceDate) {
    return (rows || []).filter((row) => String(row.date || '') >= sinceDate);
}

function getLatestObservedDate(rows) {
    return (rows || [])
        .map((row) => String(row.date || '').trim())
        .filter(Boolean)
        .sort((left, right) => right.localeCompare(left))[0] || null;
}

function getObservedAgeDays(dateString) {
    if (!dateString) return null;

    const timestamp = new Date(`${dateString}T00:00:00Z`).getTime();
    if (Number.isNaN(timestamp)) return null;

    return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

function buildFreshness(sourceLabel, connector, rows) {
    const lastObservedDate = getLatestObservedDate(rows);
    const ageDays = getObservedAgeDays(lastObservedDate);

    if (!lastObservedDate) {
        return {
            label: sourceLabel,
            status: connector.status === 'not_connected' ? 'unavailable' : 'warning',
            lastObservedDate: null,
            lastSyncedAt: connector.lastSyncedAt,
            detail: connector.status === 'not_connected'
                ? 'Source non connectée pour ce mandat.'
                : 'Source connectée sans données observées sur la fenêtre disponible.',
            reliability: connector.status === 'not_connected' ? 'unavailable' : 'measured',
        };
    }

    const status = ageDays === null ? 'warning' : ageDays <= 3 ? 'ok' : ageDays <= 7 ? 'warning' : 'critical';

    return {
        label: sourceLabel,
        status,
        lastObservedDate,
        lastSyncedAt: connector.lastSyncedAt,
        detail: ageDays === null
            ? 'Date observée non exploitable proprement.'
            : ageDays <= 3
                ? 'Données fraîches sur la fenêtre SEO active.'
                : ageDays <= 7
                    ? 'Données utilisables, mais à surveiller.'
                    : 'Données anciennes pour un pilotage quotidien.',
        reliability: 'measured',
    };
}

function weightedPosition(clicks, impressions, weightedPositionSum, fallbackPositionSum, fallbackCount) {
    if (impressions > 0) return weightedPositionSum / impressions;
    if (fallbackCount > 0) return fallbackPositionSum / fallbackCount;
    return null;
}

function aggregateSearchRows(rows, keyField) {
    const aggregated = new Map();

    for (const row of rows || []) {
        const key = String(row?.[keyField] || '').trim();
        if (!key) continue;

        if (!aggregated.has(key)) {
            aggregated.set(key, {
                key,
                clicks: 0,
                impressions: 0,
                weightedPositionSum: 0,
                fallbackPositionSum: 0,
                fallbackCount: 0,
            });
        }

        const bucket = aggregated.get(key);
        const clicks = toNumber(row.clicks);
        const impressions = toNumber(row.impressions);
        const position = toNumber(row.position);

        bucket.clicks += clicks;
        bucket.impressions += impressions;
        bucket.weightedPositionSum += impressions > 0 ? position * impressions : 0;

        if (position > 0) {
            bucket.fallbackPositionSum += position;
            bucket.fallbackCount += 1;
        }
    }

    return Array.from(aggregated.values())
        .map((bucket) => ({
            [keyField]: bucket.key,
            clicks: bucket.clicks,
            impressions: bucket.impressions,
            ctr: bucket.impressions > 0 ? bucket.clicks / bucket.impressions : null,
            position: weightedPosition(
                bucket.clicks,
                bucket.impressions,
                bucket.weightedPositionSum,
                bucket.fallbackPositionSum,
                bucket.fallbackCount,
            ),
        }))
        .sort((left, right) => {
            const clicksDelta = right.clicks - left.clicks;
            if (clicksDelta !== 0) return clicksDelta;
            return right.impressions - left.impressions;
        });
}

function aggregateDailySearchRows(rows) {
    const aggregated = new Map();

    for (const row of rows || []) {
        const date = String(row?.date || '').trim();
        if (!date) continue;

        if (!aggregated.has(date)) {
            aggregated.set(date, {
                date,
                clicks: 0,
                impressions: 0,
                weightedPositionSum: 0,
                fallbackPositionSum: 0,
                fallbackCount: 0,
            });
        }

        const bucket = aggregated.get(date);
        const clicks = toNumber(row.clicks);
        const impressions = toNumber(row.impressions);
        const position = toNumber(row.position);

        bucket.clicks += clicks;
        bucket.impressions += impressions;
        bucket.weightedPositionSum += impressions > 0 ? position * impressions : 0;

        if (position > 0) {
            bucket.fallbackPositionSum += position;
            bucket.fallbackCount += 1;
        }
    }

    return Array.from(aggregated.values())
        .map((bucket) => ({
            date: bucket.date,
            clicks: bucket.clicks,
            impressions: bucket.impressions,
            ctr: bucket.impressions > 0 ? bucket.clicks / bucket.impressions : null,
            position: weightedPosition(
                bucket.clicks,
                bucket.impressions,
                bucket.weightedPositionSum,
                bucket.fallbackPositionSum,
                bucket.fallbackCount,
            ),
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
}

function buildComparison(currentRows, previousRows) {
    const currentClicks = sumField(currentRows, 'clicks');
    const currentImpressions = sumField(currentRows, 'impressions');
    const previousClicks = sumField(previousRows, 'clicks');
    const previousImpressions = sumField(previousRows, 'impressions');

    const currentCtr = currentImpressions > 0 ? currentClicks / currentImpressions : null;
    const previousCtr = previousImpressions > 0 ? previousClicks / previousImpressions : null;

    const currentPositionRows = aggregateDailySearchRows(currentRows);
    const previousPositionRows = aggregateDailySearchRows(previousRows);
    const currentPosition = currentPositionRows.length > 0
        ? currentPositionRows.reduce((sum, row) => sum + toNumber(row.position), 0) / currentPositionRows.length
        : null;
    const previousPosition = previousPositionRows.length > 0
        ? previousPositionRows.reduce((sum, row) => sum + toNumber(row.position), 0) / previousPositionRows.length
        : null;

    const deltaPercent = (currentValue, previousValue) => {
        if (previousValue === null || previousValue === undefined || previousValue === 0) return null;
        return ((currentValue - previousValue) / previousValue) * 100;
    };

    return {
        clicksDeltaPercent: deltaPercent(currentClicks, previousClicks),
        impressionsDeltaPercent: deltaPercent(currentImpressions, previousImpressions),
        ctrDeltaPercent: currentCtr === null || previousCtr === null || previousCtr === 0
            ? null
            : ((currentCtr - previousCtr) / previousCtr) * 100,
        positionDelta: currentPosition === null || previousPosition === null
            ? null
            : currentPosition - previousPosition,
    };
}

function normalizeToken(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function extractBrandTokens(clientName) {
    return normalizeToken(clientName)
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4 && !BRAND_STOPWORDS.has(token));
}

function buildBrandSplit(clientName, queryRows) {
    const tokens = extractBrandTokens(clientName);

    if (tokens.length === 0) {
        return {
            status: 'unavailable',
            reason: 'Nom de marque trop générique ou insuffisamment discriminant pour segmenter proprement les requêtes.',
            reliability: 'unavailable',
        };
    }

    const brand = { clicks: 0, impressions: 0, queryCount: 0 };
    const nonBrand = { clicks: 0, impressions: 0, queryCount: 0 };

    for (const row of queryRows || []) {
        const query = normalizeToken(row.query);
        const isBrand = tokens.some((token) => query.includes(token));
        const bucket = isBrand ? brand : nonBrand;

        bucket.clicks += toNumber(row.clicks);
        bucket.impressions += toNumber(row.impressions);
        bucket.queryCount += 1;
    }

    if (brand.queryCount === 0) {
        return {
            status: 'unavailable',
            reason: 'Aucune requête de marque n’a été détectée de manière assez fiable dans les données Search Console actuelles.',
            reliability: 'unavailable',
        };
    }

    const totalClicks = brand.clicks + nonBrand.clicks;
    const totalImpressions = brand.impressions + nonBrand.impressions;

    return {
        status: 'available',
        tokens,
        brand,
        nonBrand,
        clickShare: totalClicks > 0 ? brand.clicks / totalClicks : null,
        impressionShare: totalImpressions > 0 ? brand.impressions / totalImpressions : null,
        reliability: 'calculated',
    };
}

async function getClientName(clientId) {
    const { data } = await getAdminSupabase()
        .from('client_geo_profiles')
        .select('client_name')
        .eq('id', clientId)
        .maybeSingle();

    return String(data?.client_name || '').trim();
}

export async function getVisibilitySlice(clientId) {
    const currentSince = getSinceDate(CURRENT_WINDOW_DAYS);

    const [clientName, connectorRows, trafficRows56, ga4TopPages, gscRows56] = await Promise.all([
        getClientName(clientId).catch(() => ''),
        getClientConnectorRows(clientId).catch(() => []),
        getTrafficDailyRows(clientId, { days: COMPARISON_WINDOW_DAYS }).catch(() => []),
        getTopPagesRows(clientId, { limit: 20 }).catch(() => []),
        getRecentGscRows(clientId, { days: COMPARISON_WINDOW_DAYS, limit: 1200 }).catch(() => []),
    ]);

    const ga4Status = resolveConnectorStatus(connectorRows, 'ga4');
    const gscStatus = resolveConnectorStatus(connectorRows, 'gsc');

    const currentTrafficRows = filterRowsSince(trafficRows56, currentSince);
    const previousTrafficRows = (trafficRows56 || []).filter((row) => String(row.date || '') < currentSince);
    const currentGscRows = filterRowsSince(gscRows56, currentSince);
    const previousGscRows = (gscRows56 || []).filter((row) => String(row.date || '') < currentSince);

    const bothDisconnected =
        ga4Status.status === 'not_connected' && gscStatus.status === 'not_connected';

    if (bothDisconnected && currentTrafficRows.length === 0 && currentGscRows.length === 0) {
        return {
            connectors: { ga4: ga4Status, gsc: gscStatus },
            freshness: {
                ga4: buildFreshness('GA4', ga4Status, currentTrafficRows),
                gsc: buildFreshness('Search Console', gscStatus, currentGscRows),
            },
            summary: null,
            comparison: null,
            trends: { gsc: [], ga4: [] },
            topPages: [],
            topQueries: [],
            ga4LandingPages: [],
            brandSplit: {
                status: 'unavailable',
                reason: 'Aucune segmentation marque/hors marque sans données Search Console exploitables.',
                reliability: 'unavailable',
            },
            emptyState: {
                title: 'Visibilité SEO non connectée',
                description:
                    'Les connecteurs GA4 et Search Console ne sont pas configurés pour ce client. Configurez-les avant d’ouvrir une lecture SEO mesurée.',
            },
        };
    }

    const aggregatedQueries = aggregateSearchRows(currentGscRows, 'query');
    const aggregatedPages = aggregateSearchRows(currentGscRows, 'page');
    const clickTotal = sumField(currentGscRows, 'clicks');
    const impressionTotal = sumField(currentGscRows, 'impressions');
    const weightedPositionSum = (currentGscRows || []).reduce((sum, row) => sum + (toNumber(row.position) * Math.max(toNumber(row.impressions), 0)), 0);
    const fallbackPositionSum = (currentGscRows || []).reduce((sum, row) => sum + toNumber(row.position), 0);
    const fallbackPositionCount = (currentGscRows || []).filter((row) => toNumber(row.position) > 0).length;

    const sessionsTotal = sumField(currentTrafficRows, 'sessions');
    const usersTotal = sumField(currentTrafficRows, 'users');
    const previousSessionsTotal = sumField(previousTrafficRows, 'sessions');
    const ga4SessionsDeltaPercent = previousSessionsTotal > 0
        ? ((sessionsTotal - previousSessionsTotal) / previousSessionsTotal) * 100
        : null;

    return {
        connectors: { ga4: ga4Status, gsc: gscStatus },
        freshness: {
            ga4: buildFreshness('GA4', ga4Status, currentTrafficRows),
            gsc: buildFreshness('Search Console', gscStatus, currentGscRows),
        },
        kpis: {
            totalClicks: clickTotal || 0,
            totalImpressions: impressionTotal || 0,
            gscQueryCount: aggregatedQueries.length,
            gscPageCount: aggregatedPages.length,
            sessions: sessionsTotal || 0,
            users: usersTotal || 0,
            daysWithTraffic: currentTrafficRows.length,
        },
        summary: {
            clicks: clickTotal || null,
            impressions: impressionTotal || null,
            ctr: impressionTotal > 0 ? clickTotal / impressionTotal : null,
            position: weightedPosition(clickTotal, impressionTotal, weightedPositionSum, fallbackPositionSum, fallbackPositionCount),
            queryCount: aggregatedQueries.length,
            pageCount: aggregatedPages.length,
            organicSessions: sessionsTotal || null,
            organicUsers: usersTotal || null,
        },
        comparison: buildComparison(currentGscRows, previousGscRows),
        trends: {
            gsc: aggregateDailySearchRows(currentGscRows),
            ga4: currentTrafficRows,
        },
        topQueries: aggregatedQueries.slice(0, 12),
        topPages: aggregatedPages.slice(0, 12),
        landingPages: ga4TopPages.slice(0, 12),
        ga4LandingPages: ga4TopPages.slice(0, 12),
        ga4Support: {
            sessions: sessionsTotal || null,
            users: usersTotal || null,
            sessionsDeltaPercent: ga4SessionsDeltaPercent,
            reliability: currentTrafficRows.length > 0 ? 'measured' : 'unavailable',
        },
        brandSplit: buildBrandSplit(clientName, aggregatedQueries),
        emptyState: null,
    };
}
