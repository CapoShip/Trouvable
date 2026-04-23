import { redirect } from 'next/navigation';

export const metadata = {
    title: 'SEO Ops',
    description: 'Entrée SEO Ops du mandat opérateur.',
};

export default async function ClientSeoPage({ params }) {
    const { clientId } = await params;
    redirect(`/admin/clients/${clientId}/seo/visibility`);
}

