import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { trackedQueryCreateSchema } from '@/lib/admin-schemas';
import * as db from '@/lib/db';
import { buildPromptMetadata, shouldSoftBlockPromptActivation } from '@/lib/queries/prompt-intelligence';

const TRACKED_QUERY_DRIFT_ERROR =
    'Impossible d enregistrer ce prompt suivi: environnement DB en drift de contraintes. Appliquez les migrations Supabase les plus recentes puis reessayez.';

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const validation = trackedQueryCreateSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Validation', details: validation.error.issues }, { status: 400 });
    }

    const input = validation.data;
    try {
        const client = await db.getClientById(input.clientId);
        const promptMetadata = buildPromptMetadata({
            queryText: input.query_text,
            clientName: client?.client_name || '',
            city: client?.address?.city || client?.target_region || '',
            region: client?.target_region || '',
            locale: input.locale || 'fr-CA',
            category: client?.business_type || '',
            services: client?.business_details?.services || [],
            knownCompetitors: client?.business_details?.competitors || [],
            promptOrigin: input.prompt_origin || 'manual_operator',
            intentFamily: input.intent_family || null,
        });
        const activationBlocked = shouldSoftBlockPromptActivation(promptMetadata) && input.is_active !== false;

        const row = await db.createTrackedQuery({
            client_id: input.clientId,
            query_text: input.query_text,
            category: input.category,
            locale: input.locale,
            query_type: input.query_type,
            is_active: activationBlocked ? false : input.is_active,
            ...promptMetadata,
            prompt_metadata: {
                ...(input.prompt_metadata || {}),
                generated_at: new Date().toISOString(),
            },
        });

        await db.logAction({
            client_id: input.clientId,
            action_type: 'tracked_query_created',
            details: {
                id: row.id,
                quality_status: promptMetadata.quality_status,
                activation_blocked: activationBlocked,
            },
            performed_by: admin.email,
        });

        return NextResponse.json({
            success: true,
            query: row,
            quality: promptMetadata,
            activation_blocked: activationBlocked,
            warning: activationBlocked
                ? 'Prompt cree avec statut faible: activation bloquee en attente de revue operateur.'
                : null,
        });
    } catch (error) {
        console.error('[queries/create]', error);
        if (db.isTrackedQueryConstraintDrift(error)) {
            return NextResponse.json({ error: TRACKED_QUERY_DRIFT_ERROR }, { status: 500 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
