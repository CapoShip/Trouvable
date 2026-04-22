'use client';

import GeoCompareView from '../../../../views/GeoCompareView';
import { useGeoClient } from '../../../../context/ClientContext';

export default function GeoComparePage() {
    const { clientId, client } = useGeoClient();
    return <GeoCompareView linkedClientId={clientId} linkedClientName={client?.client_name || ''} />;
}
