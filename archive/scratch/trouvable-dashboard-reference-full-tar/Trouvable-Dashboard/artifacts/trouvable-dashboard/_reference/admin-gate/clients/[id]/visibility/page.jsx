import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Redirection Visibilité SEO',
    description: 'Redirection vers la nouvelle surface Visibilité SEO.',
};

export default async function VisibilityPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/seo/visibility`);
}
