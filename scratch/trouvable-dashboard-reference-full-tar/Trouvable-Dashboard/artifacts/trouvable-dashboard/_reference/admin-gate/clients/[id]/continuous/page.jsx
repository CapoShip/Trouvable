import { redirect } from 'next/navigation';

export default async function ContinuousRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/continuous`);
}
