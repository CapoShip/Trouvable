import { listOperatorClients } from '@/lib/operator-data';
import ClientPicker from './ClientPicker';

export const dynamic = 'force-dynamic';

/** Liste tous les profils (limite PostgREST Supabase ~1000 par requête). */
export default async function GeoDashboardIndexPage() {
    let clients = [];
    try {
        clients = await listOperatorClients();
    } catch (error) {
        console.error('[GeoDashboardIndexPage]', error.message);
    }

    const list = clients || [];
    return <ClientPicker clients={list} empty={list.length === 0} />;
}
