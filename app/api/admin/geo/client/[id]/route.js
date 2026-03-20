import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getOperatorGeoWorkspacePayload } from '@/lib/operator-data';

export async function GET(_, { params }) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const payload = await getOperatorGeoWorkspacePayload(id);

    if (!payload?.client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
        ...payload,
    });
}
