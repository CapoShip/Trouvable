import { redirect } from 'next/navigation';

export default async function CitationsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/signals?focus=citations`);
}
