import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { trackedQueryUpdateSchema } from '@/lib/admin-schemas';
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

    const v = trackedQueryUpdateSchema.safeParse(body);
    if (!v.success) {
        return NextResponse.json({ error: 'Validation', details: v.error.issues }, { status: 400 });
    }

    const { id, ...rest } = v.data;
        const updates = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
        }

    try {
        const row = await db.updateTrackedQuery(id, updates);
        await db.logAction({
            client_id: row.client_id,
            action_type: 'tracked_query_updated',
            details: { id, fields: Object.keys(updates) },
            performed_by: admin.email,
        });
        return NextResponse.json({ success: true, query: row });
    } catch (err) {
        console.error('[queries/update]', err);
        if (db.isTrackedQueryConstraintDrift(err)) {
            return NextResponse.json({ error: TRACKED_QUERY_DRIFT_ERROR }, { status: 500 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
