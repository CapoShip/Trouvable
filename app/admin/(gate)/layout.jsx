import { currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/admin-email';
import SwitchAccountButton from '../components/SwitchAccountButton';
import AdminSidebar from './components/AdminSidebar';
import './admin-shell.css';

export const metadata = {
    title: 'Trouvable OS',
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
                <SwitchAccountButton className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 text-[13px] font-semibold hover:bg-white/[0.1] transition-all disabled:opacity-50 disabled:cursor-wait" />
            </div>
        );
    }

    return (
        <div className="geo-shell bg-[var(--geo-bg)] text-[var(--geo-t1)]">
            <AdminSidebar />
            <div className="geo-main">
                <div className="geo-content">{children}</div>
            </div>
        </div>
    );
}
