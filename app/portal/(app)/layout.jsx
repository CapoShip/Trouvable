import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';

export const metadata = {
    robots: { index: false, follow: false },
};

function getPrimaryEmail(user) {
    const primary = user?.emailAddresses?.find(
        (emailAddress) => emailAddress.id === user?.primaryEmailAddressId
    )?.emailAddress;

    return primary || user?.emailAddresses?.[0]?.emailAddress || '';
}

export default async function PortalAppLayout({ children }) {
    const user = await currentUser();
    const userEmail = getPrimaryEmail(user);

    return (
        <div className="min-h-screen bg-[#060607] text-white">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(91,115,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.10),transparent_26%)]" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <header className="mb-8 rounded-[26px] border border-white/10 bg-black/25 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Link href="/portal" className="inline-flex items-center gap-3 text-white">
                                <img
                                    src="/logos/trouvable_logo_blanc.png"
                                    alt=""
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] p-1"
                                />
                                <div>
                                    <div className="text-lg font-black tracking-[-0.04em]">Trouvable</div>
                                    <div className="text-xs uppercase tracking-[0.16em] text-white/35">Client Lite Portal</div>
                                </div>
                            </Link>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <Link
                                href="/portal"
                                className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                Mes dossiers
                            </Link>
                            <div className="text-sm text-white/45">{userEmail || 'Compte connecte'}</div>
                            <SignOutButton redirectUrl="/portal/sign-in">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                                >
                                    Deconnexion
                                </button>
                            </SignOutButton>
                        </div>
                    </div>
                </header>

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
