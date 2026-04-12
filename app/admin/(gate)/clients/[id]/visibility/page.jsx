import { redirect } from 'next/navigation';

export default async function VisibilityRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/seo/visibility`);
}
