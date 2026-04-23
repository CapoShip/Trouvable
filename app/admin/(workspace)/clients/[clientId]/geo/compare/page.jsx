'use client';

import GeoCompareView from '@/features/admin/dashboard/geo/GeoCompareView';
import { useGeoClient } from '@/features/admin/dashboard/shared/context/ClientContext';

export default function GeoComparePage() {
    const { clientId, client } = useGeoClient();
    return <GeoCompareView linkedClientId={clientId} linkedClientName={client?.client_name || ''} />;
}

