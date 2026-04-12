import { redirect } from 'next/navigation';

export default async function SettingsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/dossier/settings`);
}
