import { redirect } from 'next/navigation';

export default async function GeoCompareRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/compare`);
}
