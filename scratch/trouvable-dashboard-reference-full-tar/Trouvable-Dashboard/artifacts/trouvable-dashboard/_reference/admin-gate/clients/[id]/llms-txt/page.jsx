import { redirect } from 'next/navigation';

export default async function LlmsTxtRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/llms-txt`);
}
