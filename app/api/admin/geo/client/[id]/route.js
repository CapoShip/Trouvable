import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase-admin';

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

    return NextResponse.json({
        client,
        audit,
    });
}
