import 'server-only';

const SAMPLE_SEARCH_QUERIES = [
    { query: '---', clicks: 0, impressions: 0, ctr: 0, average_position: 0 },
];

const SAMPLE_LANDING = [
    { page: '---', clicks: 0, impressions: 0, ctr: 0, average_position: 0 },
];

export async function getGscSnapshot({ connection }) {
    const sampleModeEnabled = process.env.CONNECTOR_SAMPLE_MODE === '1';

    if (connection.status === 'disabled') {
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

    if (connection.status === 'sample_mode' || sampleModeEnabled) {
        return {
            provider: 'gsc',
            status: 'sample_mode',
            hasRealData: false,
            mode: 'sample',
            message: 'Sample mode only. No real data available.',
            searchQueryTrend: SAMPLE_SEARCH_QUERIES,
            landingPageTrend: SAMPLE_LANDING,
        };
    }

    if (connection.status === 'configured') {
        return {
            provider: 'gsc',
            status: 'configured',
            hasRealData: false,
            mode: 'stub',
            message: 'Connector configured but live OAuth/SDK sync is intentionally not implemented yet.',
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }

    if (connection.status === 'error') {
        return {
            provider: 'gsc',
            status: 'error',
            hasRealData: false,
            mode: 'stub',
            message: connection.last_error || 'Connector entered an error state.',
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }

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
