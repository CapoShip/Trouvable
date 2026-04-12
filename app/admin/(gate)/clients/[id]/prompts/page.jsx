import { redirect } from 'next/navigation';

export default async function PromptsRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/prompts`);
}
