import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { generateRemediationSuggestionsForClient } from '@/lib/remediation/run-remediation';

export async function POST(_request, context) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    const clientId = context?.params?.clientId;
    if (!clientId) {
        return NextResponse.json({ error: 'clientId manquant' }, { status: 400 });
    }

    try {
        const result = await generateRemediationSuggestionsForClient(clientId);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API/admin/remediation/generate] Erreur:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
    }
}
