import { NextResponse } from 'next/server';

export const maxDuration = 300;

import { requireAdmin } from '@/lib/auth';
import { auditRunPayloadSchema } from '@/lib/ai/schemas';
import { runFullAudit } from '@/lib/audit/run-audit';
import { upsertVisibilitySnapshotForClient } from '@/lib/continuous/jobs';
import * as db from '@/lib/db';

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const validation = auditRunPayloadSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Payload invalide', details: validation.error.issues }, { status: 400 });
    }

    const { clientId, websiteUrl, clientName } = validation.data;

    try {
        let client;

        if (clientId) {
            client = await db.getClientById(clientId);
        } else if (websiteUrl && clientName) {
            const slug = clientName
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            const existing = await db.getClientBySlug(slug);
            if (existing) {
                client = existing;
            } else {
                client = await db.createClient({
                    client_name: clientName,
                    client_slug: slug,
                    website_url: websiteUrl,
                });
            }
        }

        if (!client) {
            return NextResponse.json({ error: 'Client introuvable et impossible à créer' }, { status: 404 });
        }

        const url = websiteUrl || client.website_url;
        if (!url) {
            return NextResponse.json({ error: 'website_url manquant pour ce client' }, { status: 400 });
        }

        const result = await runFullAudit(client.id, url);

        if (result.success) {
            try {
                await upsertVisibilitySnapshotForClient({
                    clientId: client.id,
                    source: 'manual',
                    metadata: {
                        reason: 'manual_audit_run',
                    },
                });
            } catch (snapshotError) {
                console.error('[API/audits/run] snapshot capture failed:', snapshotError.message);
            }
        }

        if (result.success) {
            return NextResponse.json(result, { status: 200 });
        }

        if (result.error === 'invalid_url') {
            return NextResponse.json(result, { status: 400 });
        }

        if (result.error === 'audit_timeout') {
            return NextResponse.json(result, { status: 504 });
        }

        return NextResponse.json(result, { status: 500 });
    } catch (err) {
        console.error('[API/audits/run] Erreur:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
