import { redirect } from 'next/navigation';

export default async function GeoSchemaRedirectPage({ params }) {
    const { id } = await params;
    redirect(`/admin/clients/${id}/geo/schema`);
}