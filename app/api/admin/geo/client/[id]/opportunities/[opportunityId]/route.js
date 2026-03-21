import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import * as db from '@/lib/db';

const VALID_STATUSES = new Set(['open', 'in_progress', 'done', 'dismissed']);

function noStoreJson(payload, init = {}) {
    return NextResponse.json(payload, {
        ...init,
        headers: {
            'Cache-Control': 'no-store',
            ...(init.headers || {}),
        },
    });
}

export async function POST(request, { params }) {
    const admin = await requireAdmin();
    if (!admin) {
        return noStoreJson({ error: 'Non autorise' }, { status: 401 });
    }

    const { id, opportunityId } = await params;
    let body;

    try {
        body = await request.json();
    } catch {
        return noStoreJson({ error: 'JSON invalide' }, { status: 400 });
    }

    const status = body?.status;
    if (!id || !opportunityId || !VALID_STATUSES.has(status)) {
        return noStoreJson({ error: 'Statut invalide' }, { status: 400 });
    }

    try {
        const row = await db.updateOpportunity(opportunityId, { status });
        if (row.client_id !== id) {
            return noStoreJson({ error: 'Opportunity introuvable pour ce client' }, { status: 404 });
        }

        await db.logAction({
            client_id: id,
            action_type: 'opportunity_status_updated',
            details: { opportunity_id: opportunityId, status },
            performed_by: admin.email,
        });

        return noStoreJson({ success: true, opportunity: row });
    } catch (error) {
        console.error(`[api/admin/geo/client/${id}/opportunities/${opportunityId}]`, error);
        return noStoreJson({ error: error.message }, { status: 500 });
    }
}
