'use client';

import Link from 'next/link';

import { useGeoClient } from '../../context/GeoClientContext';
import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';

export default function GeoSocialView() {
    const { client, clientId, loading } = useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Social listening"
                subtitle={`Placeholder secondaire pour ${client?.client_name || 'ce client'}. Cette capacite n'est pas connectee a une source live.`}
                action={<GeoProvenancePill meta={{ label: 'Not connected', shortLabel: 'Not connected', tone: 'slate', description: 'No live social connector is active.' }} />}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Total mentions" value={null} hint="Not connected" />
                <GeoKpiCard label="Positive sentiment" value={null} hint="Not connected" />
                <GeoKpiCard label="Estimated reach" value={null} hint="Not connected" />
                <GeoKpiCard label="Threads to engage" value={null} hint="Not connected" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GeoPremiumCard className="p-6">
                    <GeoEmptyPanel
                        title="Not connected"
                        description="No live social connector is active. This area stays secondary until real observed data can be synced."
                    />
                </GeoPremiumCard>
                <GeoPremiumCard className="p-6">
                    <GeoEmptyPanel
                        title="No social threads available"
                        description="Conversation threads will only appear here after a real social source is connected."
                    />
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-8 text-center bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
                <h3 className="text-lg font-bold text-white mb-2">Social listening not connected</h3>
                <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
                    Trouvable does not currently have a live social connector in this workspace, so nothing here is inferred or fabricated.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                    <Link href={`${baseHref}?view=overview`} className="geo-btn geo-btn-pri">
                        Overview
                    </Link>
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost">
                        Opportunity center
                    </Link>
                </div>
            </GeoPremiumCard>
        </div>
    );
}
