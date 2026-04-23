import { redirect } from 'next/navigation';

export default async function GeoCrawlersRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/crawlers`);
}