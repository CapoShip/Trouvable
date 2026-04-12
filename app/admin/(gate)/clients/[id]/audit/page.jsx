import { redirect } from 'next/navigation';

export default async function AuditRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/dossier/audit`);
}
