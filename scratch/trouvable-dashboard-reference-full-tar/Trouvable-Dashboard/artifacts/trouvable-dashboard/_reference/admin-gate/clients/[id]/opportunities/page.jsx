import { redirect } from 'next/navigation';

export default async function OpportunitiesRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/opportunities`);
}
