import { redirect } from 'next/navigation';

export default async function RunsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/runs`);
}
