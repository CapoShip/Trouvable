import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { getRunInspectorSlice } from '@/lib/operator-intelligence/runs';

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

    const { id, runId } = await params;
    if (!id || !runId) {
        return noStoreJson({ error: 'Parametres invalides' }, { status: 400 });
    }

    try {
        const data = await getRunInspectorSlice(id, runId);
        return noStoreJson(data);
    } catch (error) {
        console.error(`[api/admin/geo/client/${id}/runs/${runId}]`, error);
        return noStoreJson({ error: error.message }, { status: 500 });
    }
}
