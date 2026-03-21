'use client';

import { Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const VIEW_COMPONENTS = {
    overview: lazy(() => import('../views/GeoOverviewView')),
    visibilite: lazy(() => import('../views/GeoOverviewView')),
    prompts: lazy(() => import('../views/GeoPromptsView')),
    runs: lazy(() => import('../views/GeoRunsView')),
    modeles: lazy(() => import('../views/GeoModelesView')),
    citations: lazy(() => import('../views/GeoCitationsView')),
    competitors: lazy(() => import('../views/GeoCompetitorsView')),
    social: lazy(() => import('../views/GeoSocialView')),
    ameliorer: lazy(() => import('../views/GeoAmeliorerView')),
    cockpit: lazy(() => import('../views/GeoCockpitView')),
    audit: lazy(() => import('../views/GeoAuditView')),
    settings: lazy(() => import('../views/GeoSettingsView')),
};

const VIEWS = Object.keys(VIEW_COMPONENTS);

function GeoDashboardContent() {
    const searchParams = useSearchParams();
    const viewParam = searchParams.get('view') || 'overview';
    const [currentView, setCurrentView] = useState(VIEWS.includes(viewParam) ? viewParam : 'overview');

    useEffect(() => {
        if (VIEWS.includes(viewParam)) setCurrentView(viewParam);
    }, [viewParam]);

    const ViewComponent = VIEW_COMPONENTS[currentView];

    return (
        <Suspense fallback={<div className="p-5 text-white/30 animate-pulse">Chargement...</div>}>
            <ViewComponent />
        </Suspense>
    );
}

export default function GeoDashboardClientPage() {
    return (
        <Suspense fallback={<div className="p-5 text-[var(--geo-t2)]">Chargement...</div>}>
            <GeoDashboardContent />
        </Suspense>
    );
}
