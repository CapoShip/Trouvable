import 'server-only';

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
            message: 'Sample mode only. No real GA4 data is collected; charts stay empty by design.',
            trafficTrend: [],
            landingPages: [],
            attributionSummary: [],
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
