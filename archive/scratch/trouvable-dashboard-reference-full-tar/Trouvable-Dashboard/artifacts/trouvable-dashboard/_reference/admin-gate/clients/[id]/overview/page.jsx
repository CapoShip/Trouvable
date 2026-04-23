import { redirect } from 'next/navigation';

export default async function OverviewRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo`);
}
