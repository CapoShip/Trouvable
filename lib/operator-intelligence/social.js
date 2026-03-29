import 'server-only';

import * as db from '@/lib/db';
import { getNotConnectedMeta, getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getClientConnectorRows } from '@/lib/connectors/repository';
import {
    getLatestCollectionRun,
    listClusters,
    listOpportunities,
    getCommunityStats,
} from '@/lib/db/community';
import { evidenceLevel } from '@/lib/agent-reach/contracts';

// ──────────────────────────────────────────────────────────────
// Helpers — format persisted clusters/opportunities for UI
// ──────────────────────────────────────────────────────────────

// Minimum mention count for theme/language clusters to be displayed.
// Clusters already have relevance-weighted scores from the pipeline,
// but we still filter by minimum evidence to suppress thin noise.
const MIN_THEME_DISPLAY_COUNT = 2;

function formatClusterItems(clusters, clusterType, { maxItems = 10 } = {}) {
    let filtered = clusters.filter((c) => c.cluster_type === clusterType);

    // For theme and language clusters, require minimum evidence
    if (clusterType === 'theme' || clusterType === 'language') {
        filtered = filtered.filter((c) => c.mention_count >= MIN_THEME_DISPLAY_COUNT);
    }

    return filtered
        .slice(0, maxItems)
        .map((c) => ({
            label: c.label,
            count: c.mention_count,
            evidence_level: c.evidence_level || evidenceLevel(c.mention_count),
            subreddits: (c.sources || []).slice(0, 4),
            example: c.example_url || null,
        }));
}

function formatSourceBuckets(clusters) {
    return clusters
        .filter((c) => c.cluster_type === 'source_bucket')
        .slice(0, 10)
        .map((c) => ({
            source: c.label,
            count: c.mention_count,
            evidence_level: c.evidence_level || evidenceLevel(c.mention_count),
        }));
}

function formatOpportunities(opportunities, type, { maxItems = 8 } = {}) {
    return opportunities
        .filter((o) => o.opportunity_type === type)
        .slice(0, maxItems)
        .map((o) => ({
            title: o.title,
            rationale: o.rationale,
            evidence_level: o.evidence_level,
            mention_count: o.mention_count,
            provenance: getProvenanceMeta(o.provenance || 'inferred'),
        }));
}

function resolveConnectionStatus(connectorRow, latestRun, stats) {
    if (!connectorRow || connectorRow.status === 'not_connected') {
        return {
            status: 'not_connected',
            connector: 'agent_reach',
            message: 'Intelligence communautaire non connectée — aucune collecte externe n\'a été exécutée.',
            requirement: 'Variable d\'environnement SOCIAL_REDDIT_CONNECTOR=1 pour activer la collecte automatique via le moteur continu.',
        };
    }

    if (connectorRow.status === 'error' || latestRun?.status === 'failed') {
        return {
            status: 'error',
            connector: 'agent_reach',
            message: 'La dernière collecte a échoué.',
            detail: latestRun?.error_message || connectorRow.health_detail || null,
        };
    }

    if (connectorRow.status === 'syncing' || latestRun?.status === 'running') {
        return {
            status: 'syncing',
            connector: 'agent_reach',
            message: 'Collecte en cours…',
        };
    }

    if (stats.documents === 0) {
        return {
            status: 'connected_empty',
            connector: 'agent_reach',
            message: 'Connecteur actif mais aucune donnée collectée pour le moment.',
            caveat: 'La première collecte sera déclenchée par le moteur continu selon le cadence configurée.',
        };
    }

    return {
        status: 'connected',
        connector: 'agent_reach',
        message: 'Observé en externe à partir de données communautaires collectées et persistées.',
        caveat: 'La couverture est limitée aux seeds suivis et ne constitue pas une veille sociale universelle.',
    };
}

// ──────────────────────────────────────────────────────────────
// Not-connected empty slice (preserves shape)
// ──────────────────────────────────────────────────────────────

function buildNotConnectedSlice(client) {
    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            inferred: getProvenanceMeta('inferred'),
            not_connected: getNotConnectedMeta(),
        },
        connection: {
            status: 'not_connected',
            connector: 'agent_reach',
            message: 'Intelligence communautaire non connectée — aucune collecte externe n\'a été exécutée.',
            requirement: 'Variable d\'environnement SOCIAL_REDDIT_CONNECTOR=1 pour activer la collecte automatique.',
        },
        summary: {
            generated_at: new Date().toISOString(),
            total_discussions: 0,
            unique_sources: 0,
            documents_count: 0,
            clusters_count: 0,
            opportunities_count: 0,
            mentions_count: 0,
            site_context: {
                client_name: client?.client_name || null,
                business_type: client?.business_type || null,
                city: client?.address?.city || client?.target_region || null,
            },
            query_seeds: [],
            last_run: null,
        },
        topComplaints: [],
        topQuestions: [],
        topThemes: [],
        sourceBuckets: [],
        competitorComplaints: [],
        communityLanguage: [],
        faqOpportunities: [],
        contentOpportunities: [],
        differentiationAngles: [],
        emptyState: {
            title: 'Intelligence communautaire non connectée',
            description: 'Le connecteur est désactivé : les compteurs à zéro ne signifient pas l\'absence de discussions sur votre marque, seulement qu\'aucune collecte n\'a eu lieu. Activez SOCIAL_REDDIT_CONNECTOR ou ignorez cet écran tant que la veille externe n\'est pas prioritaire.',
        },
    };
}

// ──────────────────────────────────────────────────────────────
// Main entry — reads from persisted community data
// ──────────────────────────────────────────────────────────────

export async function getSocialSlice(clientId) {
    const client = await db.getClientById(clientId).catch(() => null);

    // Resolve connector status
    let connectorRow = null;
    try {
        const rows = await getClientConnectorRows(clientId);
        connectorRow = (rows || []).find((r) => r.provider === 'agent_reach') || null;
    } catch {
        connectorRow = null;
    }

    // Fetch persisted data in parallel
    const [stats, clusters, opportunities, latestRun] = await Promise.all([
        getCommunityStats(clientId).catch(() => ({ documents: 0, clusters: 0, opportunities: 0, mentions: 0 })),
        listClusters(clientId).catch(() => []),
        listOpportunities(clientId, { status: null }).catch(() => []),
        getLatestCollectionRun(clientId).catch(() => null),
    ]);

    const connection = resolveConnectionStatus(connectorRow, latestRun, stats);

    if (connection.status === 'not_connected' && stats.documents === 0) {
        return buildNotConnectedSlice(client);
    }

    const topComplaints = formatClusterItems(clusters, 'complaint');
    const topQuestions = formatClusterItems(clusters, 'question');
    const topThemes = formatClusterItems(clusters, 'theme', { maxItems: 12 });
    const communityLanguage = formatClusterItems(clusters, 'language', { maxItems: 8 });
    const competitorComplaints = formatClusterItems(clusters, 'competitor_complaint', { maxItems: 8 });
    const sourceBuckets = formatSourceBuckets(clusters);

    const faqOpportunities = formatOpportunities(opportunities, 'faq', { maxItems: 6 });
    const contentOpportunities = formatOpportunities(opportunities, 'content', { maxItems: 8 });
    const differentiationAngles = formatOpportunities(opportunities, 'differentiation', { maxItems: 6 });

    const isConnected = connection.status === 'connected' || connection.status === 'connected_empty' || connection.status === 'syncing';

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            inferred: getProvenanceMeta('inferred'),
            not_connected: getNotConnectedMeta(),
        },
        connection,
        summary: {
            generated_at: new Date().toISOString(),
            total_discussions: stats.documents,
            unique_sources: sourceBuckets.length,
            documents_count: stats.documents,
            clusters_count: stats.clusters,
            opportunities_count: stats.opportunities,
            mentions_count: stats.mentions,
            site_context: {
                client_name: client?.client_name || null,
                business_type: client?.business_type || null,
                city: client?.address?.city || client?.target_region || null,
            },
            query_seeds: latestRun?.seed_queries || [],
            last_run: latestRun ? {
                id: latestRun.id,
                status: latestRun.status,
                started_at: latestRun.started_at,
                finished_at: latestRun.finished_at,
                documents_collected: latestRun.documents_collected,
                documents_persisted: latestRun.documents_persisted,
            } : null,
        },
        topComplaints,
        topQuestions,
        topThemes,
        sourceBuckets,
        competitorComplaints,
        communityLanguage,
        faqOpportunities,
        contentOpportunities,
        differentiationAngles,
        emptyState: !isConnected || stats.documents === 0 ? {
            title: 'Aucune donnée communautaire collectée',
            description: 'Le connecteur est actif mais aucune discussion externe n\'a encore été collectée. La prochaine collecte sera déclenchée par le moteur continu.',
        } : null,
    };
}
