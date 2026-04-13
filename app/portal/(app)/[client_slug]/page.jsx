import { notFound, redirect } from 'next/navigation';

import PortalDashboard from '@/components/portal/PortalDashboard';
import { isCurrentRequestCloudflareBypassEnabled } from '@/lib/dev-bypass-server';
import { getPortalDashboardData } from '@/lib/portal-data';
import { resolvePortalMembership } from '@/lib/portal-access';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { client_slug: clientSlug } = await params;

    return {
        title: `Portail client - ${clientSlug}`,
        robots: { index: false, follow: false },
    };
}

export default async function PortalClientPage({ params }) {
    const { client_slug: clientSlug } = await params;
    const cloudflareBypassEnabled = await isCurrentRequestCloudflareBypassEnabled();
    const membershipState = await resolvePortalMembership();
    const memberships = membershipState.memberships || [];

    if (memberships.length === 0) {
        redirect('/portal');
    }

    const membership = memberships.find((item) => item.client_slug === clientSlug);

    if (!membership) {
        if (memberships.length === 1) {
            redirect(`/portal/${memberships[0].client_slug}`);
        }

        notFound();
    }

    const dashboard = await getPortalDashboardData(membership.client_id);

    if (!dashboard) {
        notFound();
    }

    return (
        <PortalDashboard
            dashboard={dashboard}
            membershipsCount={memberships.length}
            viewerEmail={membershipState.primaryVerifiedEmail || ''}
            clientSlug={membership.client_slug}
            cloudflareBypassEnabled={cloudflareBypassEnabled}
        />
    );
}
