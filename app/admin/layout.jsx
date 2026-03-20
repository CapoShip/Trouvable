import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const ADMIN_EMAIL = 'contact.marchadidi@gmail.com';

export const metadata = {
    robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }) {
    const user = await currentUser();

    if (!user) {
        redirect('/admin/sign-in');
    }

    const userEmail = user.emailAddresses?.find(
        (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (userEmail !== ADMIN_EMAIL) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Accès refusé</h1>
                <p className="text-white/40 text-sm mb-1 max-w-sm">
                    Le compte <span className="text-white/70 font-medium">{userEmail}</span> n&apos;a pas les permissions administrateur.
                </p>
                <p className="text-white/25 text-xs mb-8">
                    Seul l&apos;administrateur principal peut accéder à cette section.
                </p>
                <a
                    href="/admin/sign-in"
                    className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 text-[13px] font-semibold hover:bg-white/[0.1] transition-all"
                >
                    Se connecter avec un autre compte
                </a>
            </div>
        );
    }

    return <>{children}</>;
}
