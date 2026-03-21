import 'server-only';

import { getClientConnectorRows } from '@/lib/connectors/repository';
import { getGa4Snapshot } from '@/lib/connectors/providers/ga4-stub';
import { getGscSnapshot } from '@/lib/connectors/providers/gsc-stub';

export async function getConnectorOverviewForClient(clientId) {
    const connections = await getClientConnectorRows(clientId);
    const byProvider = new Map(connections.map((connection) => [connection.provider, connection]));

    const [ga4, gsc] = await Promise.all([
        getGa4Snapshot({ connection: byProvider.get('ga4') }),
        getGscSnapshot({ connection: byProvider.get('gsc') }),
    ]);

    return {
        connections,
        providers: {
            ga4,
            gsc,
        },
        summary: {
            configured: connections.filter((row) => row.status === 'configured').length,
            sample_mode: connections.filter((row) => row.status === 'sample_mode').length,
            not_connected: connections.filter((row) => row.status === 'not_connected').length,
            disabled: connections.filter((row) => row.status === 'disabled').length,
            error: connections.filter((row) => row.status === 'error').length,
        },
    };
}
