import 'server-only';

const FALLBACK_ISO_DATE = new Date().toISOString().slice(0, 10);

const SAMPLE_TRAFFIC = [
    { date: FALLBACK_ISO_DATE, sessions: 0, users: 0, conversions: 0 },
];

const SAMPLE_LANDING = [
    { page: '---', sessions: 0, conversions: 0, period: '30d' },
];

const SAMPLE_ATTRIBUTION = [
    { source: 'demo', medium: 'none', sessions: 0, conversions: 0 },
];

export async function getGa4Snapshot({ connection }) {
    const sampleModeEnabled = process.env.CONNECTOR_SAMPLE_MODE === '1';

    if (connection.status === 'disabled') {
        return {
            provider: 'ga4',
            status: 'disabled',
            hasRealData: false,
            mode: 'disabled',
            message: 'GA4 connector is disabled for this client.',
            trafficTrend: [],
            landingPages: [],
            attributionSummary: [],
        };
    }

    if (connection.status === 'sample_mode' || sampleModeEnabled) {
        return {
            provider: 'ga4',
            status: 'sample_mode',
            hasRealData: false,
            mode: 'sample',
            message: 'Sample mode only. No real data available.',
            trafficTrend: SAMPLE_TRAFFIC,
            landingPages: SAMPLE_LANDING,
            attributionSummary: SAMPLE_ATTRIBUTION,
        };
    }

    if (connection.status === 'configured') {
        return {
            provider: 'ga4',
            status: 'configured',
            hasRealData: false,
            mode: 'stub',
            message: 'Connector configured but live OAuth/SDK sync is intentionally not implemented yet.',
            trafficTrend: [],
            landingPages: [],
            attributionSummary: [],
        };
    }

    if (connection.status === 'error') {
        return {
            provider: 'ga4',
            status: 'error',
            hasRealData: false,
            mode: 'stub',
            message: connection.last_error || 'Connector entered an error state.',
            trafficTrend: [],
            landingPages: [],
            attributionSummary: [],
        };
    }

    return {
        provider: 'ga4',
        status: 'not_connected',
        hasRealData: false,
        mode: 'stub',
        message: 'GA4 is not connected.',
        trafficTrend: [],
        landingPages: [],
        attributionSummary: [],
    };
}
