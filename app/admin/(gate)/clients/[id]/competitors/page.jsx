import { redirect } from 'next/navigation';

export default async function CompetitorsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/signals?focus=competitors`);
}
