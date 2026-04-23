import { redirect } from 'next/navigation';

export const metadata = {
    title: 'SEO Ops',
    description: 'Entrée SEO Ops du mandat opérateur.',
};

export default async function ClientSeoPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/seo/visibility`);
}
