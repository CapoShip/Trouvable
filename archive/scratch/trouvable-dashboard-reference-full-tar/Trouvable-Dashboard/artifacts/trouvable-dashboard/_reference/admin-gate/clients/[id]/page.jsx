import { redirect } from 'next/navigation';

export default async function ClientIndexPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/dossier`);
}
