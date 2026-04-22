import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Redirection Audit Lab',
    description: 'Redirection vers le laboratoire d’audit opérateur (Lab).',
};

export default async function AuditPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/dossier/audit`);
}
