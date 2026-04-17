import 'server-only';

const LOADERS = {
    dossier: async (clientId) => (await import('@/lib/operator-intelligence/dossier')).getDossierOverviewSlice(clientId),
    'dossier-activity': async (clientId) => (await import('@/lib/operator-intelligence/dossier')).getDossierActivitySlice(clientId),
    'dossier-connectors': async (clientId) => (await import('@/lib/operator-intelligence/dossier')).getDossierConnectorsSlice(clientId),
    overview: async (clientId) => (await import('@/lib/operator-intelligence/overview')).getOverviewSlice(clientId),
    prompts: async (clientId) => (await import('@/lib/operator-intelligence/prompts')).getPromptSlice(clientId),
    runs: async (clientId) => (await import('@/lib/operator-intelligence/runs')).getRunsSlice(clientId),
    citations: async (clientId) => (await import('@/lib/operator-intelligence/sources')).getSourceSlice(clientId),
    competitors: async (clientId) => (await import('@/lib/operator-intelligence/competitors')).getCompetitorSlice(clientId),
    social: async (clientId) => (await import('@/lib/operator-intelligence/social')).getSocialSlice(clientId),
    opportunities: async (clientId) => (await import('@/lib/operator-intelligence/opportunities')).getOpportunitySlice(clientId),
    activity: async (clientId) => (await import('@/lib/operator-intelligence/activity')).getRecentSafeActivity(clientId),
    models: async (clientId) => (await import('@/lib/operator-intelligence/models')).getModelsSlice(clientId),
    continuous: async (clientId) => (await import('@/lib/continuous/jobs')).getTrendSlice(clientId),
    crawlers: async (clientId) => (await import('@/lib/operator-intelligence/geo-crawlers')).getCrawlerSlice(clientId),
    readiness: async (clientId) => (await import('@/lib/operator-intelligence/geo-readiness')).getReadinessSlice(clientId),
    schema: async (clientId) => (await import('@/lib/operator-intelligence/geo-schema')).getSchemaSlice(clientId),
    consistency: async (clientId) => (await import('@/lib/operator-intelligence/geo-consistency')).getConsistencySlice(clientId),
    alerts: async (clientId) => (await import('@/lib/operator-intelligence/geo-alerts')).getAlertsSlice(clientId),
    visibility: async (clientId) => (await import('@/lib/operator-intelligence/visibility')).getVisibilitySlice(clientId),
    'seo-content': async (clientId) => (await import('@/lib/operator-intelligence/seo-content')).getSeoContentSlice(clientId),
    'seo-health': async (clientId) => (await import('@/lib/operator-intelligence/seo-health')).getSeoHealthSlice(clientId),
    'seo-on-page': async (clientId) => (await import('@/lib/operator-intelligence/seo-on-page')).getSeoOnPageSlice(clientId),
};

export function hasGeoSlice(slice) {
    return typeof LOADERS[slice] === 'function';
}

export async function loadGeoSlice(slice, clientId) {
    const loader = LOADERS[slice];
    if (!loader) {
        return null;
    }

    return loader(clientId);
}
