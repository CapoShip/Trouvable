import { redirect } from 'next/navigation';

export default async function SignalsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/signals`);
}
