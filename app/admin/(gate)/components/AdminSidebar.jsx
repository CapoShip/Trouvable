'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { SignOutButton, UserButton } from '@clerk/nextjs';

const CLIENT_NAV = [
    { id: 'overview', label: "Vue d'ensemble", icon: 'grid', path: '' },
    { id: 'geo-compare', label: 'GEO Compare', icon: 'pulse', path: '/geo-compare' },
    { id: 'audit', label: 'Audit', icon: 'file', path: '/audit' },
    { id: 'runs', label: 'Exécution', icon: 'pulse', path: '/runs' },
    { id: 'signals', label: 'Signaux', icon: 'quote', path: '/signals' },
    { id: 'social', label: 'Veille Reddit', icon: 'list', path: '/social' },
    { id: 'opportunities', label: 'Actions', icon: 'trend', path: '/opportunities' },
    { id: 'portal', label: 'Portail client', icon: 'users', path: '/portal' },
];

const GLOBAL_NAV = [];

const ICONS = {
    grid: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="6" height="6" rx="1.5" /><rect x="12" y="2" width="6" height="6" rx="1.5" /><rect x="2" y="12" width="6" height="6" rx="1.5" /><rect x="12" y="12" width="6" height="6" rx="1.5" /></svg>,
    list: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 4h16M2 8h12M2 12h10M2 16h6" /></svg>,
    pulse: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 10h3l2-4 3 8 2-4h6" /></svg>,
    quote: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></svg>,
    users: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" /></svg>,
    file: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9M13 2l5 5h-5V2zM7 10h6M7 13h4" /></svg>,
    trend: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l5-5 4 4 8-12" /><path d="M14 5h5v5" /></svg>,
    gear: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path d="M17.7 10a8 8 0 01-.1 1l1.5 1.2-1.5 2.6-1.8-.8a7.4 7.4 0 01-1.8 1l-.3 1.9h-3l-.3-1.9a7.4 7.4 0 01-1.8-1l-1.8.8L5 13.2 6.5 12a8 8 0 010-2L5 8.8l1.5-2.6 1.8.8a7.4 7.4 0 011.8-1L10.3 4h3l.3 1.9a7.4 7.4 0 011.8 1l1.8-.8 1.5 2.6-1.5 1.2a8 8 0 01.5 1z" /></svg>,
    clients: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" /><path d="M17 6a2.5 2.5 0 010 5M3 11A2.5 2.5 0 013 6" /></svg>,
    plus: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 4v12M4 10h12" /></svg>,
};

function NavLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] transition-all text-[12px] font-[450] ${
                active
                    ? 'bg-white/[0.07] text-white border-l-2 border-[#5b73ff] pl-3'
                    : 'text-white/50 hover:bg-white/[0.03] hover:text-white/75'
            }`}
        >
            {children}
        </Link>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const clientId = useMemo(() => {
        const match = pathname?.match(/\/admin\/clients\/([^/]+)/);
        const id = match ? match[1] : null;
        if (id === 'new' || id === 'create' || id === 'onboarding') return null;
        return id;
    }, [pathname]);

    const isClientList = pathname === '/admin/clients' || (pathname?.startsWith('/admin/clients') && !clientId);
    const isNewClient =
        pathname === '/admin/clients/new'
        || pathname === '/admin/clients/create'
        || pathname === '/admin/clients/onboarding';
    const isGeoCompare = pathname?.startsWith('/admin/geo-compare');
    const clientBase = clientId ? `/admin/clients/${clientId}` : null;

    const activeView = useMemo(() => {
        if (!clientId) return null;
        const sub = pathname?.replace(`/admin/clients/${clientId}`, '') || '';
        const seg = sub.split('/').filter(Boolean)[0];
        if (!seg) return 'overview';
        if (seg === 'citations' || seg === 'competitors') return 'signals';
        if (seg === 'social') return 'social';
        return seg;
    }, [pathname, clientId]);

    return (
        <>
            {/* Mobile hamburger */}
            <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="fixed top-3 left-3 z-30 flex items-center justify-center w-9 h-9 rounded-lg bg-[#0a0a0a] border border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white transition-colors lg:hidden"
                aria-label="Menu"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            <nav className={`geo-sb ${mobileOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="p-[14px] pb-2.5 border-b border-white/[0.07]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <Link href="/admin/clients" className="flex items-center gap-2 rounded-lg -mx-0.5 px-0.5 py-0.5 transition-colors hover:bg-white/[0.04] min-w-0">
                            <img src="/logos/trouvable_logo_blanc1.png" alt="Trouvable" className="w-[20px] h-[20px] object-contain shrink-0" />
                            <span className="text-[13px] font-bold tracking-[-0.03em] text-white">Trouvable <span className="text-[#7b8fff] text-[10px] font-semibold">OS</span></span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="p-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-colors lg:hidden"
                            aria-label="Fermer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Nav content */}
                <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-px">
                    {/* Clients section — always visible */}
                    <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-1 pb-1">Gestion</div>
                    <NavLink href="/admin/clients" active={isClientList}>
                        {ICONS.clients}
                        Clients
                    </NavLink>
                    <NavLink href="/admin/clients/new" active={isNewClient}>
                        {ICONS.plus}
                        Nouveau client
                    </NavLink>
                    <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-4 pb-1">Outils GEO</div>
                    {GLOBAL_NAV.map((item) => (
                        <NavLink key={item.id} href={item.href} active={item.id === 'geo_compare' ? isGeoCompare : false}>
                            {ICONS[item.icon]}
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Client workspace — only when a client is selected */}
                    {clientBase && (
                        <>
                            <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-4 pb-1">Pilotage client</div>
                            {CLIENT_NAV.map((item) => (
                                <NavLink
                                    key={item.id}
                                    href={`${clientBase}${item.path}`}
                                    active={activeView === item.id}
                                >
                                    {ICONS[item.icon]}
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer : paramètres dossier séparés du pilotage client, au-dessus du compte */}
                <div className="space-y-2 border-t border-white/[0.07] p-2.5">
                    {clientBase ? (
                        <NavLink href={`${clientBase}/settings`} active={activeView === 'settings'}>
                            {ICONS.gear}
                            Paramètres
                        </NavLink>
                    ) : null}
                    <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] px-2 py-1.5">
                        <UserButton
                            afterSignOutUrl="/espace"
                            appearance={{ elements: { avatarBox: 'w-[24px] h-[24px]' } }}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-medium text-white/50">Administrateur</div>
                        </div>
                    </div>
                    <SignOutButton redirectUrl="/espace">
                        <button
                            type="button"
                            className="w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-center text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                        >
                            Déconnexion
                        </button>
                    </SignOutButton>
                </div>
            </nav>
        </>
    );
}
