import { redirect } from 'next/navigation';

export default async function SocialRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/social`);
}
