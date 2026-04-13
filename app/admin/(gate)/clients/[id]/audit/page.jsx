import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Redirection Santé SEO',
    description: 'Redirection vers la nouvelle surface Santé SEO.',
};

export default async function AuditPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/seo/health`);
}
