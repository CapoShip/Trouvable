import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Actions SEO',
    description: 'Redirige vers la file opérationnelle unique des remédiations.',
};

export default async function SeoActionsPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/opportunities`);
}
