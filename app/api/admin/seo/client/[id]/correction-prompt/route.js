import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import {
    CorrectionPromptServiceError,
    generateSeoHealthCorrectionPrompt,
} from '@/lib/correction-prompts/service';

function noStoreJson(payload, init = {}) {
    return NextResponse.json(payload, {
        ...init,
        headers: {
            'Cache-Control': 'no-store',
            ...(init.headers || {}),
        },
    });
}

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
    const admin = await requireAdmin();
    if (!admin) {
        return noStoreJson({ error: 'Non autorise' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return noStoreJson({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const issueId = typeof body?.issueId === 'string' ? body.issueId.trim() : '';

    if (!issueId) {
        return noStoreJson({ error: 'issueId manquant' }, { status: 400 });
    }

    try {
        const result = await generateSeoHealthCorrectionPrompt({
            clientId: id,
            issueId,
            triggerSource: 'manual',
        });

        return noStoreJson(result);
    } catch (error) {
        if (error instanceof CorrectionPromptServiceError) {
            return noStoreJson({
                error: error.message,
                details: error.details || null,
            }, { status: error.status || 500 });
        }

        console.error(`[api/admin/seo/client/${id}/correction-prompt]`, error);
        return noStoreJson({ error: 'Erreur generation prompt correction' }, { status: 500 });
    }
}
