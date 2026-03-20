import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { clientUpdateSchema } from '@/lib/admin-schemas';
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

    const v = clientUpdateSchema.safeParse(body);
    if (!v.success) {
        return NextResponse.json({ error: 'Validation', details: v.error.issues }, { status: 400 });
    }

    const { id, ...rest } = v.data;
    const updates = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));

    try {
        const client = await db.updateClient(id, updates);
        await db.logAction({
            client_id: id,
            action_type: 'client_updated',
            details: { fields: Object.keys(updates) },
            performed_by: admin.email,
        });
        return NextResponse.json({ success: true, client });
    } catch (err) {
        console.error('[clients/update]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
