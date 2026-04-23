import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Actions SEO',
    description: 'Redirige vers la file opérationnelle SEO unique.',
};

export default async function SeoActionsPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/seo/opportunities`);
}
