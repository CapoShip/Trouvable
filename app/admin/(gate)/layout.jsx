import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/admin-email';
import { resolvePortalMembership } from '@/lib/portal-access';
import SwitchAccountButton from '../components/SwitchAccountButton';
import AdminSidebar from './components/AdminSidebar';
import AdminTopCommandBar from './components/AdminTopCommandBar';
import './admin-shell.css';

export const metadata = {
    title: 'Trouvable — Centre de commande',
    robots: { index: false, follow: false },
};

function userHasAdminAccess(user) {
    if (!user) return false;
    const all = user.emailAddresses?.map((e) => e.emailAddress).filter(Boolean) ?? [];
    return all.some((email) => isAdminEmail(email));
}

function displayEmail(user) {
    const primary = user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
    return primary || user.emailAddresses?.[0]?.emailAddress || '';
}

export default async function AdminGateLayout({ children }) {
    const user = await currentUser();

    if (!user) {
        return <>{children}</>;
    }

    if (!userHasAdminAccess(user)) {
        const userEmail = displayEmail(user);

        let portalHref = null;
        let portalLabel = null;
        try {
            const { memberships = [] } = await resolvePortalMembership();
            if (memberships.length === 1) {
                portalHref = `/portal/${memberships[0].client_slug}`;
                portalLabel = 'Ouvrir mon espace client';
            } else if (memberships.length > 1) {
                portalHref = '/portal';
                portalLabel = 'Ouvrir le portail client';
            }
        } catch (e) {
            console.error('[AdminGateLayout] resolvePortalMembership', e);
        }

        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] p-6 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                    <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
                <h1 className="mb-2 text-xl font-bold text-white">Accès administration refusé</h1>
                <p className="mb-1 max-w-md text-sm text-white/40">
                    Le compte <span className="font-medium text-white/70">{userEmail}</span> n&apos;est pas dans la liste des opérateurs
                    Trouvable (<code className="text-white/50">CLERK_ADMIN_EMAIL</code>).
                </p>
                <p className="mb-6 max-w-md text-xs text-white/30">
                    L&apos;accès au <strong className="text-white/45">portail client</strong> et au centre de commande sont deux rôles distincts.
                </p>

                <div className="flex w-full max-w-sm flex-col gap-3">
                    {portalHref && portalLabel ? (
                        <Link
                            href={portalHref}
                            className="rounded-xl bg-[#5b73ff] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#4a62ee]"
                        >
                            {portalLabel}
                        </Link>
                    ) : null}
                    <SwitchAccountButton className="rounded-xl border border-white/[0.08] bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white/70 transition-all hover:bg-white/[0.1] disabled:cursor-wait disabled:opacity-50" />
                    <p className="text-[11px] text-white/25">
                        Portail client :{' '}
                        <Link href="/portal/sign-in" className="text-[#7b8fff] hover:underline">
                            /portal/sign-in
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="geo-shell">
            <AdminSidebar />
            <div className="geo-main">
                <AdminTopCommandBar />
                <div className="geo-content">{children}</div>
            </div>
        </div>
    );
}
