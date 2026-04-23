import { redirect } from 'next/navigation';

export default async function ModelsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/models`);
}
