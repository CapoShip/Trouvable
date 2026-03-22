import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { trackedQueryUpdateSchema } from '@/lib/admin-schemas';
import * as db from '@/lib/db';
import { buildPromptMetadata, shouldSoftBlockPromptActivation } from '@/lib/queries/prompt-intelligence';
import { getAdminSupabase } from '@/lib/supabase-admin';

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

    const validation = trackedQueryUpdateSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Validation', details: validation.error.issues }, { status: 400 });
    }

    const { id, ...rest } = validation.data;
    const updates = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'Aucun champ a mettre a jour' }, { status: 400 });
    }

    try {
        const supabase = getAdminSupabase();
        const { data: trackedQuery, error: trackedQueryError } = await supabase
            .from('tracked_queries')
            .select('id, client_id, query_text, locale')
            .eq('id', id)
            .single();

        if (trackedQueryError || !trackedQuery) {
            return NextResponse.json({ error: 'Prompt suivi introuvable.' }, { status: 404 });
        }

        const client = await db.getClientById(trackedQuery.client_id);
        const resolvedQueryText = updates.query_text || trackedQuery.query_text;
        const promptMetadata = buildPromptMetadata({
            queryText: resolvedQueryText,
            clientName: client?.client_name || '',
            city: client?.address?.city || client?.target_region || '',
            region: client?.target_region || '',
            locale: updates.locale || trackedQuery.locale || 'fr-CA',
            category: client?.business_type || '',
            services: client?.business_details?.services || [],
            knownCompetitors: client?.business_details?.competitors || [],
            promptOrigin: updates.prompt_origin || 'manual_operator',
            intentFamily: updates.intent_family || null,
        });

        const activationBlocked = shouldSoftBlockPromptActivation(promptMetadata) && updates.is_active === true;
        const mergedUpdates = {
            ...updates,
            ...promptMetadata,
            ...(activationBlocked ? { is_active: false } : {}),
        };

        const row = await db.updateTrackedQuery(id, mergedUpdates);
        await db.logAction({
            client_id: row.client_id,
            action_type: 'tracked_query_updated',
            details: {
                id,
                fields: Object.keys(mergedUpdates),
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
                ? 'Activation bloquee: prompt faible, revue operateur requise.'
                : null,
        });
    } catch (error) {
        console.error('[queries/update]', error);
        if (db.isTrackedQueryConstraintDrift(error)) {
            return NextResponse.json({ error: TRACKED_QUERY_DRIFT_ERROR }, { status: 500 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
