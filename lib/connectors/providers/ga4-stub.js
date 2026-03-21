import 'server-only';

const SAMPLE_TRAFFIC = [
    { date: '2026-02-20', sessions: 124, users: 102, conversions: 8 },
    { date: '2026-02-27', sessions: 139, users: 114, conversions: 9 },
    { date: '2026-03-06', sessions: 151, users: 126, conversions: 11 },
    { date: '2026-03-13', sessions: 163, users: 132, conversions: 12 },
];

const SAMPLE_LANDING = [
    { page: '/', sessions: 202, conversions: 11, period: '30d' },
    { page: '/villes/montreal', sessions: 121, conversions: 6, period: '30d' },
    { page: '/expertises/restaurants', sessions: 77, conversions: 4, period: '30d' },
];

const SAMPLE_ATTRIBUTION = [
    { source: 'google', medium: 'organic', sessions: 228, conversions: 14 },
    { source: 'direct', medium: '(none)', sessions: 95, conversions: 5 },
    { source: 'referral', medium: 'citation', sessions: 42, conversions: 2 },
];

export async function getGa4Snapshot({ connection }) {
    const sampleModeEnabled = process.env.CONNECTOR_SAMPLE_MODE === '1';

    if (connection.status === 'disabled') {
        return {
            provider: 'ga4',
            status: 'disabled',
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
            mode: 'sample',
            message: 'Sample mode only. Replace with live connector in a future phase.',
            trafficTrend: SAMPLE_TRAFFIC,
            landingPages: SAMPLE_LANDING,
            attributionSummary: SAMPLE_ATTRIBUTION,
        };
    }

    if (connection.status === 'configured') {
        return {
            provider: 'ga4',
            status: 'configured',
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
        mode: 'stub',
        message: 'GA4 is not connected.',
        trafficTrend: [],
        landingPages: [],
        attributionSummary: [],
    };
}
