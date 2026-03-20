import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase-admin';
import * as db from '@/lib/db';

export async function GET(_, { params }) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { data: client, error: clientError } = await supabase
        .from('client_geo_profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (clientError || !client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const { data: auditRows } = await supabase
        .from('client_site_audits')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

    const audit = auditRows?.[0] ?? null;

    let metrics = null;
    let recentAudits = [];
    let recentQueryRuns = [];
    let trackedQueries = [];
    let lastRunByQuery = {};
    let opportunities = [];
    let mergeSuggestionsPending = [];

    try {
        metrics = await db.getClientGeoMetrics(id);
    } catch (e) {
        console.error('[geo/client] metrics:', e.message);
    }

    try {
        recentAudits = await db.getRecentAudits(id, 40);
        recentQueryRuns = await db.getRecentQueryRuns(id, 200);
        trackedQueries = await db.getTrackedQueriesAll(id);
        const map = await db.getLastRunPerTrackedQuery(id);
        lastRunByQuery = Object.fromEntries(map);
    } catch (e) {
        console.error('[geo/client] history:', e.message);
    }

    try {
        const opps = await db.getOpportunities(id);
        opportunities = (opps || []).filter((o) => o.status === 'open').slice(0, 50);
    } catch (e) {
        console.error('[geo/client] opportunities:', e.message);
    }

    try {
        const ms = await db.getMergeSuggestions(id, 'pending');
        mergeSuggestionsPending = (ms || []).slice(0, 40);
    } catch (e) {
        console.error('[geo/client] merge:', e.message);
    }

    return NextResponse.json({
        client,
        audit,
        metrics,
        recentAudits,
        recentQueryRuns,
        trackedQueries,
        lastRunByQuery,
        opportunities,
        mergeSuggestionsPending,
    });
}
