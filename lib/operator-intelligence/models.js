import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

export async function getModelsSlice(clientId) {
    const [metrics, recentQueryRuns] = await Promise.all([
        db.getClientGeoMetrics(clientId),
        db.getRecentQueryRuns(clientId, 120),
    ]);

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
        },
        providerCounts: Object.entries(metrics?.runsByProvider || {})
            .sort((a, b) => b[1] - a[1])
            .map(([provider, count]) => ({ provider, count })),
        modelPerformance: metrics?.modelPerformance || [],
        recentQueryRuns,
        summary: {
            totalRuns: metrics?.totalQueryRuns ?? 0,
            totalProviders: Object.keys(metrics?.runsByProvider || {}).length,
        },
        emptyState: {
            title: 'No runs yet',
            description: 'Run tracked prompts first. Provider and model performance is derived only from completed observed runs.',
        },
    };
}
