import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
// Side-effect: registers the community-briefing task
import '@/lib/ai/tasks/community-briefing';
import { executeTask } from '@/lib/ai/tasks/registry';
import {
    getLatestCollectionRun,
    listClusters,
    listOpportunities,
} from '@/lib/db/community';
import * as db from '@/lib/db';
import { resolveBusinessType } from '@/lib/ai/business-type-resolver';

function noStoreJson(payload, init = {}) {
    return NextResponse.json(payload, {
        ...init,
        headers: {
            'Cache-Control': 'no-store',
            ...(init.headers || {}),
        },
    });
}

export async function POST(_, { params }) {
    const admin = await requireAdmin();
    if (!admin) {
        return noStoreJson({ error: 'Non autorise' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return noStoreJson({ error: 'ID invalide' }, { status: 400 });
    }

    try {
        const client = await db.getClientById(id).catch(() => null);
        if (!client) {
            return noStoreJson({ error: 'Client introuvable' }, { status: 404 });
        }

        const [latestRun, clusters, opportunities] = await Promise.all([
            getLatestCollectionRun(id).catch(() => null),
            listClusters(id).catch(() => []),
            listOpportunities(id, { status: null }).catch(() => []),
        ]);

        const rawBusinessType = String(client?.business_type || '').trim();
        const siteClassification = client?.site_classification || {};
        const clientName = String(client?.client_name || '').trim();
        const resolved = resolveBusinessType(rawBusinessType, siteClassification, clientName);
        const businessLabel = resolved.offering_anchor
            || (resolved.canonical_category !== 'unknown' ? resolved.canonical_category.replace(/_/g, ' ') : '')
            || rawBusinessType
            || 'entreprise locale';
        const city = String(client?.address?.city || client?.target_region || '').trim() || null;

        const seedDiagnostics = latestRun?.run_context?.seed_diagnostics || [];
        const querySeeds = latestRun?.seed_queries || [];

        const taskInput = {
            clientName: clientName || 'Inconnue',
            businessType: businessLabel,
            city,
            runStatus: latestRun?.status || 'aucune collecte',
            documentsCollected: latestRun?.documents_collected ?? 0,
            documentsPersisted: latestRun?.documents_persisted ?? 0,
            seedDiagnostics,
            clusters: clusters.slice(0, 20),
            opportunities: opportunities.slice(0, 10),
            querySeeds,
        };

        const { data, meta } = await executeTask('community-briefing', taskInput, {
            clientId: id,
            triggerSource: 'manual',
        });

        return noStoreJson({
            briefing: data,
            meta: {
                provider: meta.provider,
                model: meta.model,
                latencyMs: meta.latencyMs,
                generated_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error(`[api/admin/geo/client/${id}/briefing]`, error);
        return noStoreJson({ error: error.message || 'Erreur generation briefing' }, { status: 500 });
    }
}
