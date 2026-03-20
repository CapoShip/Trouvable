import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { trackedQueryToggleSchema } from '@/lib/admin-schemas';
import * as db from '@/lib/db';

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const v = trackedQueryToggleSchema.safeParse(body);
    if (!v.success) {
        return NextResponse.json({ error: 'Validation', details: v.error.issues }, { status: 400 });
    }

    try {
        const row = await db.updateTrackedQuery(v.data.id, { is_active: v.data.is_active });
        await db.logAction({
            client_id: row.client_id,
            action_type: 'tracked_query_toggled',
            details: { id: v.data.id, is_active: v.data.is_active },
            performed_by: admin.email,
        });
        return NextResponse.json({ success: true, query: row });
    } catch (err) {
        console.error('[queries/toggle]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
