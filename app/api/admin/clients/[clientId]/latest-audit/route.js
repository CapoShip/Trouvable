import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import * as db from '@/lib/db';

export async function GET(request, { params }) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { clientId } = await params;

    try {
        const audit = await db.getLatestAudit(clientId);
        if (!audit) {
            return NextResponse.json({
                audit: null,
                opportunities: [],
                mergeSuggestions: [],
            });
        }

        const opportunities = await db.getOpportunities(clientId);
        const mergeSuggestions = await db.getMergeSuggestions(clientId);

        return NextResponse.json({
            audit: {
                id: audit.id,
                source_url: audit.source_url || null,
                resolved_url: audit.resolved_url || null,
                scan_status: audit.scan_status || 'pending',
                seo_score: audit.seo_score ?? 0,
                geo_score: audit.geo_score ?? 0,
                seo_breakdown: audit.seo_breakdown || {},
                geo_breakdown: audit.geo_breakdown || {},
                issues: Array.isArray(audit.issues) ? audit.issues : [],
                strengths: Array.isArray(audit.strengths) ? audit.strengths : [],
                prefill_suggestions: audit.prefill_suggestions || [],
                error_message: audit.error_message || null,
                created_at: audit.created_at,
            },
            opportunities: opportunities || [],
            mergeSuggestions: mergeSuggestions || [],
        });
    } catch (err) {
        console.error('[API/latest-audit] Erreur:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

