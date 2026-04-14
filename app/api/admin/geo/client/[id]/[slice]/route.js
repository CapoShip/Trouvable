import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { getTrendSlice } from '@/lib/continuous/jobs';
import { getRecentSafeActivity } from '@/lib/operator-intelligence/activity';
import { getCompetitorSlice } from '@/lib/operator-intelligence/competitors';
import {
    getDossierActivitySlice,
    getDossierConnectorsSlice,
    getDossierOverviewSlice,
} from '@/lib/operator-intelligence/dossier';
import { getModelsSlice } from '@/lib/operator-intelligence/models';
import { getOpportunitySlice } from '@/lib/operator-intelligence/opportunities';
import { getOverviewSlice } from '@/lib/operator-intelligence/overview';
import { getPromptSlice } from '@/lib/operator-intelligence/prompts';
import { getRunsSlice } from '@/lib/operator-intelligence/runs';
import { getCrawlerSlice } from '@/lib/operator-intelligence/geo-crawlers';
import { getSchemaSlice } from '@/lib/operator-intelligence/geo-schema';
import { getSeoContentSlice } from '@/lib/operator-intelligence/seo-content';
import { getSeoHealthSlice } from '@/lib/operator-intelligence/seo-health';
import { getSeoOnPageSlice } from '@/lib/operator-intelligence/seo-on-page';
import { getSocialSlice } from '@/lib/operator-intelligence/social';
import { getSourceSlice } from '@/lib/operator-intelligence/sources';
import { getVisibilitySlice } from '@/lib/operator-intelligence/visibility';

const LOADERS = {
    dossier: getDossierOverviewSlice,
    'dossier-activity': getDossierActivitySlice,
    'dossier-connectors': getDossierConnectorsSlice,
    overview: getOverviewSlice,
    prompts: getPromptSlice,
    runs: getRunsSlice,
    citations: getSourceSlice,
    competitors: getCompetitorSlice,
    social: getSocialSlice,
    opportunities: getOpportunitySlice,
    activity: getRecentSafeActivity,
    models: getModelsSlice,
    continuous: getTrendSlice,
    crawlers: getCrawlerSlice,
    schema: getSchemaSlice,
    visibility: getVisibilitySlice,
    'seo-content': getSeoContentSlice,
    'seo-health': getSeoHealthSlice,
    'seo-on-page': getSeoOnPageSlice,
};

function noStoreJson(payload, init = {}) {
    return NextResponse.json(payload, {
        ...init,
        headers: {
            'Cache-Control': 'no-store',
            ...(init.headers || {}),
        },
    });
}

export async function GET(_, { params }) {
    const admin = await requireAdmin();
    if (!admin) {
        return noStoreJson({ error: 'Non autorise' }, { status: 401 });
    }

    const { id, slice } = await params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return noStoreJson({ error: 'ID invalide' }, { status: 400 });
    }

    const loader = LOADERS[slice];
    if (!loader) {
        return noStoreJson({ error: 'Slice inconnue' }, { status: 404 });
    }

    try {
        const data = await loader(id);
        return noStoreJson(data);
    } catch (error) {
        console.error(`[api/admin/geo/client/${id}/${slice}]`, error);
        return noStoreJson({ error: 'Erreur chargement tranche' }, { status: 500 });
    }
}
