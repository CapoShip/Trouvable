import Link from 'next/link';
import Image from 'next/image';
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
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(91,115,255,0.09),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.07),transparent_35%)]" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
                <header className="mb-10 rounded-[28px] border border-white/[0.07] bg-black/30 px-6 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Link href="/portal" className="inline-flex items-center gap-3 text-white">
                                <Image
                                    src="/logos/trouvable_logo_blanc1.png"
                                    alt=""
                                    width={40}
                                    height={40}
                                    sizes="40px"
                                    className="h-10 w-10 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1"
                                />
                                <div>
                                    <div className="text-lg font-black tracking-[-0.04em]">Trouvable</div>
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/30">Espace client</div>
                                </div>
                            </Link>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <div className="text-[13px] text-white/35">{userEmail || 'Compte connecté'}</div>
                            <SignOutButton redirectUrl="/espace">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] font-semibold text-white/55 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
                                >
                                    Déconnexion
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
