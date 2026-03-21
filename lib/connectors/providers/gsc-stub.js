import 'server-only';

const SAMPLE_SEARCH_QUERIES = [
    { query: 'service de seo a montreal', clicks: 43, impressions: 701, ctr: 0.061, average_position: 8.4 },
    { query: 'agence geo montreal', clicks: 27, impressions: 372, ctr: 0.072, average_position: 6.8 },
    { query: 'visibilite ia local business', clicks: 15, impressions: 190, ctr: 0.079, average_position: 5.9 },
];

const SAMPLE_LANDING = [
    { page: '/', clicks: 82, impressions: 1204, ctr: 0.068, average_position: 7.4 },
    { page: '/villes/montreal', clicks: 40, impressions: 633, ctr: 0.063, average_position: 8.9 },
    { page: '/expertises/restaurants', clicks: 18, impressions: 288, ctr: 0.062, average_position: 10.2 },
];

export async function getGscSnapshot({ connection }) {
    const sampleModeEnabled = process.env.CONNECTOR_SAMPLE_MODE === '1';

    if (connection.status === 'disabled') {
        return {
            provider: 'gsc',
            status: 'disabled',
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
            mode: 'sample',
            message: 'Sample mode only. Replace with live connector in a future phase.',
            searchQueryTrend: SAMPLE_SEARCH_QUERIES,
            landingPageTrend: SAMPLE_LANDING,
        };
    }

    if (connection.status === 'configured') {
        return {
            provider: 'gsc',
            status: 'configured',
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
            mode: 'stub',
            message: connection.last_error || 'Connector entered an error state.',
            searchQueryTrend: [],
            landingPageTrend: [],
        };
    }

    return {
        provider: 'gsc',
        status: 'not_connected',
        mode: 'stub',
        message: 'GSC is not connected.',
        searchQueryTrend: [],
        landingPageTrend: [],
    };
}
