import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { trackedQueryToggleSchema } from '@/lib/admin-schemas';
import * as db from '@/lib/db';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const validation = trackedQueryToggleSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Validation', details: validation.error.issues }, { status: 400 });
    }

    const { id, is_active: requestedState } = validation.data;

    try {
        if (requestedState === true) {
            const supabase = getAdminSupabase();
            const { data: prompt, error: promptError } = await supabase
                .from('tracked_queries')
                .select('id, quality_status')
                .eq('id', id)
                .single();

            if (promptError || !prompt) {
                return NextResponse.json({ error: 'Prompt suivi introuvable.' }, { status: 404 });
            }

            if (prompt.quality_status === 'weak') {
                return NextResponse.json({
                    error: 'Activation refusee: ce prompt est classe faible. Modifiez-le puis relancez l activation.',
                    code: 'weak_prompt_activation_blocked',
                }, { status: 409 });
            }
        }

        const row = await db.updateTrackedQuery(id, { is_active: requestedState });
        await db.logAction({
            client_id: row.client_id,
            action_type: 'tracked_query_toggled',
            details: { id, is_active: requestedState },
            performed_by: admin.email,
        });

        return NextResponse.json({ success: true, query: row });
    } catch (error) {
        console.error('[queries/toggle]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
