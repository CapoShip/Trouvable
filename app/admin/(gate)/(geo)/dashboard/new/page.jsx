import { redirect } from 'next/navigation';

export default function GeoDashboardNewClientRedirectPage() {
    redirect('/admin/clients/new');
}
