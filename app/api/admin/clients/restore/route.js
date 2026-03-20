import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { clientIdSchema } from '@/lib/admin-schemas';
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

    const v = clientIdSchema.safeParse(body);
    if (!v.success) {
        return NextResponse.json({ error: 'Validation', details: v.error.issues }, { status: 400 });
    }

    try {
        const client = await db.restoreClient(v.data.clientId);
        await db.logAction({
            client_id: v.data.clientId,
            action_type: 'client_restored',
            details: {},
            performed_by: admin.email,
        });
        return NextResponse.json({ success: true, client });
    } catch (err) {
        console.error('[clients/restore]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
