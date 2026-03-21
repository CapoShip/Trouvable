import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { getOperatorGeoWorkspacePayload } from '@/lib/operator-data';

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

    const { id } = await params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return noStoreJson({ error: 'ID invalide' }, { status: 400 });
    }

    const payload = await getOperatorGeoWorkspacePayload(id);
    if (!payload?.client) {
        return noStoreJson({ error: 'Client non trouve' }, { status: 404 });
    }

    return noStoreJson(payload);
}
