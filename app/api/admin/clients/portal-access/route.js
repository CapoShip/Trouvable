import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth';
import { listClientPortalMembers, setClientPortalAccessStatus, upsertClientPortalAccess } from '@/lib/portal-access';
import { logAction } from '@/lib/db';

const upsertBody = z.object({
    action: z.literal('upsert'),
    clientId: z.string().uuid(),
    contactEmail: z.string().email().max(320),
});

const revokeBody = z.object({
    action: z.literal('revoke'),
    clientId: z.string().uuid(),
    accessId: z.string().uuid(),
});

const activateBody = z.object({
    action: z.literal('activate'),
    clientId: z.string().uuid(),
    accessId: z.string().uuid(),
});

const bodySchema = z.discriminatedUnion('action', [upsertBody, revokeBody, activateBody]);

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Validation', details: parsed.error.issues }, { status: 400 });
    }

    try {
        if (parsed.data.action === 'upsert') {
            const row = await upsertClientPortalAccess({
                clientId: parsed.data.clientId,
                contactEmail: parsed.data.contactEmail,
                portalRole: 'viewer',
                memberType: 'client_contact',
                status: 'active',
            });

            await logAction({
                client_id: parsed.data.clientId,
                action_type: 'portal_access_upserted',
                details: { contact_email: row.contact_email, access_id: row.id },
                performed_by: admin.email || null,
            });

            const members = await listClientPortalMembers(parsed.data.clientId);
            return NextResponse.json({ success: true, access: row, members });
        }

        const nextStatus = parsed.data.action === 'activate' ? 'active' : 'revoked';
        const row = await setClientPortalAccessStatus(parsed.data.accessId, nextStatus);
        if (row.client_id !== parsed.data.clientId) {
            return NextResponse.json({ error: 'Accès invalide pour ce client' }, { status: 400 });
        }

        await logAction({
            client_id: parsed.data.clientId,
            action_type: parsed.data.action === 'activate' ? 'portal_access_activated' : 'portal_access_revoked',
            details: {
                access_id: parsed.data.accessId,
                contact_email: row.contact_email,
                status: nextStatus,
            },
            performed_by: admin.email || null,
        });

        const members = await listClientPortalMembers(parsed.data.clientId);
        return NextResponse.json({ success: true, members });
    } catch (err) {
        console.error('[clients/portal-access]', err);
        return NextResponse.json({ error: err?.message || 'Échec' }, { status: 500 });
    }
}
