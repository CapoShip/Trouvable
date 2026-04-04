import 'server-only';

import * as db from '@/lib/db';
import { listBenchmarkVariants } from '@/lib/queries/engine-variants';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getGeoWorkspaceSnapshot } from '@/lib/operator-intelligence/snapshot';

function summarizeBenchmarkSession(session, runs = []) {
    const rows = (runs || []).map((run) => ({
        run_id: run.id,
        engine_variant: run.engine_variant || 'unknown',
        provider: run.provider || 'unknown',
        model: run.model || 'unknown',
        target_found: run.target_found === true,
        target_position: run.target_position ?? null,
        parse_status: run.parse_status || 'parsed_failed',
        parse_confidence: run.parse_confidence ?? null,
        latency_ms: run.latency_ms ?? null,
        citations: Number(
            run.normalized_response?.external_source_mentions
            ?? run.normalized_response?.source_mentions
            ?? 0,
        ),
        competitors: Number(run.normalized_response?.competitor_mentions || 0),
        cost_estimate_usd: run.raw_analysis?.benchmark?.cost_estimate_usd ?? null,
        error_class: run.error_class || null,
        created_at: run.created_at,
    }));

    // Group rows by variant, prioritizing the latest successful variant run
    const grouped = new Map();
    for (const row of rows) {
        const key = row.engine_variant;
        if (!grouped.has(key)) {
            grouped.set(key, { ...row, attempts: 1, history: [row] });
        } else {
            const existing = grouped.get(key);
            existing.attempts += 1;
            existing.history.push(row);
            // Replace primary if the new one looks more complete or successful
            if (row.parse_status && row.parse_status !== 'parsed_failed' && !row.error_class) {
                Object.assign(existing, row);
                existing.attempts = existing.history.length;
            }
        }
    }

    return {
        id: session.id,
        status: session.status,
        created_at: session.created_at,
        tracked_query_id: session.tracked_query_id || null,
        variants: session.requested_variants || [],
        rows: Array.from(grouped.values()),
    };
}

export async function getModelsSlice(clientId) {
    const [ws, recentQueryRuns, benchmarkSessions] = await Promise.all([
        getGeoWorkspaceSnapshot(clientId),
        db.getRecentQueryRuns(clientId, 120, { includeAllModes: true }),
        db.getBenchmarkSessionsForClient(clientId, 6).catch(() => []),
    ]);

    const sessionDetails = [];
    for (const session of benchmarkSessions || []) {
        const runs = await db.getBenchmarkRunsBySession(session.id).catch(() => []);
        sessionDetails.push(summarizeBenchmarkSession(session, runs));
    }

    const { runMetrics, modelPerformance } = ws;

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
            inferred: getProvenanceMeta('inferred'),
        },
        providerCounts: Object.entries(runMetrics.runsByProvider || {})
            .sort((a, b) => b[1] - a[1])
            .map(([provider, count]) => ({ provider, count })),
        modelPerformance,
        recentQueryRuns,
        summary: {
            totalRuns: runMetrics.totalQueryRuns.value ?? 0,
            totalProviders: Object.keys(runMetrics.runsByProvider || {}).length,
        },
        benchmark: {
            variantsCatalog: listBenchmarkVariants(),
            sessions: sessionDetails,
        },
        emptyState: {
            title: 'Aucune execution pour le moment',
            description: 'Lancez d abord les prompts suivis. Les performances provider/modele sont calculees sur les exécutions observées.',
        },
    };
}
