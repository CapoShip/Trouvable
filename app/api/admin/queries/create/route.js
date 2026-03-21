import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { trackedQueryCreateSchema } from '@/lib/admin-schemas';
import * as db from '@/lib/db';

const TRACKED_QUERY_DRIFT_ERROR =
    'Impossible d enregistrer ce tracked prompt: environnement DB en drift de contraintes. Appliquez les migrations Supabase les plus recentes puis reessayez.';

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const v = trackedQueryCreateSchema.safeParse(body);
    if (!v.success) {
        return NextResponse.json({ error: 'Validation', details: v.error.issues }, { status: 400 });
    }

    const d = v.data;
    try {
        const row = await db.createTrackedQuery({
            client_id: d.clientId,
            query_text: d.query_text,
            category: d.category,
            locale: d.locale,
            query_type: d.query_type,
            is_active: d.is_active,
        });
        await db.logAction({
            client_id: d.clientId,
            action_type: 'tracked_query_created',
            details: { id: row.id },
            performed_by: admin.email,
        });
        return NextResponse.json({ success: true, query: row });
    } catch (err) {
        console.error('[queries/create]', err);
        if (db.isTrackedQueryConstraintDrift(err)) {
            return NextResponse.json({ error: TRACKED_QUERY_DRIFT_ERROR }, { status: 500 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
