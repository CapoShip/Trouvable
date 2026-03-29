'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { SignOutButton, UserButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

const PORTFOLIO_NAV = [
    { id: 'clients', label: 'Portefeuille', icon: 'portfolio', href: '/admin/clients' },
    { id: 'new', label: 'Nouveau mandat', icon: 'plus', href: '/admin/clients/new' },
];

const CLIENT_MISSION_NAV = [
    { id: 'overview', label: 'Situation', icon: 'command', path: '' },
    { id: 'runs', label: 'Exécution', icon: 'pulse', path: '/runs' },
    { id: 'audit', label: 'Audit', icon: 'audit', path: '/audit' },
    { id: 'geo-compare', label: 'Benchmark', icon: 'compare', path: '/geo-compare' },
];

const CLIENT_SIGNALS_NAV = [
    { id: 'signals', label: 'Signaux', icon: 'signal', path: '/signals' },
    { id: 'social', label: 'Veille sociale', icon: 'social', path: '/social' },
    { id: 'opportunities', label: "File d'actions", icon: 'actions', path: '/opportunities' },
];

const CLIENT_OPTIMISATION_NAV = [
    { id: 'llms-txt', label: 'llms.txt', icon: 'llmstxt', path: '/llms-txt' },
];

const CLIENT_RESTITUTION_NAV = [
    { id: 'portal', label: 'Restitution client', icon: 'portal', path: '/portal' },
];

const ICONS = {
    portfolio: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" />
            <path d="M17 6a2.5 2.5 0 010 5M3 11A2.5 2.5 0 013 6" />
        </svg>
    ),
    plus: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4v12M4 10h12" />
        </svg>
    ),
    command: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="6" height="6" rx="1.5" /><rect x="12" y="2" width="6" height="6" rx="1.5" />
            <rect x="2" y="12" width="6" height="6" rx="1.5" /><rect x="12" y="12" width="6" height="6" rx="1.5" />
        </svg>
    ),
    pulse: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 10h3l2-4 3 8 2-4h6" />
        </svg>
    ),
    audit: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9M13 2l5 5h-5V2zM7 10h6M7 13h4" />
        </svg>
    ),
    compare: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 17l5-5 4 4 8-12" /><path d="M14 5h5v5" />
        </svg>
    ),
    signal: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" />
        </svg>
    ),
    social: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h16M2 8h12M2 12h10M2 16h6" />
        </svg>
    ),
    actions: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 17l5-5 4 4 8-12" /><path d="M14 5h5v5" />
        </svg>
    ),
    portal: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" />
        </svg>
    ),
    llmstxt: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8l-6-6z" />
            <path d="M11 2v6h6" /><path d="M7 13h6M7 10h3" />
        </svg>
    ),
    gear: (
        <svg className="w-[15px] h-[15px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path d="M17.7 10a8 8 0 01-.1 1l1.5 1.2-1.5 2.6-1.8-.8a7.4 7.4 0 01-1.8 1l-.3 1.9h-3l-.3-1.9a7.4 7.4 0 01-1.8-1l-1.8.8L5 13.2 6.5 12a8 8 0 010-2L5 8.8l1.5-2.6 1.8.8a7.4 7.4 0 011.8-1L10.3 4h3l.3 1.9a7.4 7.4 0 011.8 1l1.8-.8 1.5 2.6-1.5 1.2a8 8 0 01.5 1z" />
        </svg>
    ),
};

function NavGroup({ label, children }) {
    return (
        <div className="space-y-0.5">
            <div className="px-4 pt-5 pb-1.5">
                <span className="text-[9px] font-bold text-white/20 tracking-[0.14em] uppercase">{label}</span>
            </div>
            {children}
        </div>
    );
}

function NavItem({ href, active, icon, children }) {
    return (
        <Link
            href={href}
            className={`group relative flex items-center gap-2.5 px-3 py-[7px] mx-2 rounded-lg transition-all duration-200 text-[12px] font-medium ${
                active
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/40 hover:bg-white/[0.03] hover:text-white/65'
            }`}
        >
            {active && (
                <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#5b73ff]"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
            )}
            <span className={`shrink-0 transition-colors duration-200 ${active ? 'text-[#7b8fff]' : 'text-white/25 group-hover:text-white/45'}`}>
                {icon}
            </span>
            {children}
        </Link>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => { setHydrated(true); }, []);
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
            <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="fixed top-3 left-3 z-30 flex items-center justify-center w-9 h-9 rounded-lg bg-[#090a0b]/90 border border-white/[0.06] text-white/45 hover:bg-white/[0.06] hover:text-white backdrop-blur-sm transition-colors lg:hidden"
                aria-label="Menu"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            <nav className={`geo-sb ${mobileOpen ? 'open' : ''}`}>
                {/* Brand */}
                <div className="px-4 py-4 border-b border-white/[0.05]">
                    <div className="flex items-center justify-between gap-2">
                        <Link
                            href="/admin/clients"
                            className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-white/[0.03] min-w-0"
                        >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5b73ff]/20 to-[#8b5cf6]/10 border border-[#5b73ff]/15 flex items-center justify-center shrink-0">
                                <img src="/logos/trouvable_logo_blanc1.png" alt="Trouvable" className="w-4 h-4 object-contain" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[13px] font-bold tracking-[-0.03em] text-white leading-none">Trouvable</div>
                                <div className="text-[9px] font-semibold text-[#7b8fff]/60 tracking-[0.08em] uppercase mt-0.5">Command</div>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="p-1 rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] transition-colors lg:hidden"
                            aria-label="Fermer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-1">
                    <NavGroup label="Supervision">
                        {PORTFOLIO_NAV.map((item) => (
                            <NavItem
                                key={item.id}
                                href={item.href}
                                active={item.id === 'clients' ? isClientList : isNewClient}
                                icon={ICONS[item.icon]}
                            >
                                {item.label}
                            </NavItem>
                        ))}
                    </NavGroup>

                    <AnimatePresence>
                        {hydrated && clientBase && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <NavGroup label="Mission">
                                    {CLIENT_MISSION_NAV.map((item) => (
                                        <NavItem
                                            key={item.id}
                                            href={`${clientBase}${item.path}`}
                                            active={activeView === item.id}
                                            icon={ICONS[item.icon]}
                                        >
                                            {item.label}
                                        </NavItem>
                                    ))}
                                </NavGroup>

                                <NavGroup label="Recherche & signaux">
                                    {CLIENT_SIGNALS_NAV.map((item) => (
                                        <NavItem
                                            key={item.id}
                                            href={`${clientBase}${item.path}`}
                                            active={activeView === item.id}
                                            icon={ICONS[item.icon]}
                                        >
                                            {item.label}
                                        </NavItem>
                                    ))}
                                </NavGroup>

                                <NavGroup label="Optimisation">
                                    {CLIENT_OPTIMISATION_NAV.map((item) => (
                                        <NavItem
                                            key={item.id}
                                            href={`${clientBase}${item.path}`}
                                            active={activeView === item.id}
                                            icon={ICONS[item.icon]}
                                        >
                                            {item.label}
                                        </NavItem>
                                    ))}
                                </NavGroup>

                                <NavGroup label="Restitution">
                                    {CLIENT_RESTITUTION_NAV.map((item) => (
                                        <NavItem
                                            key={item.id}
                                            href={`${clientBase}${item.path}`}
                                            active={activeView === item.id}
                                            icon={ICONS[item.icon]}
                                        >
                                            {item.label}
                                        </NavItem>
                                    ))}
                                </NavGroup>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.05] p-3 space-y-2">
                    {clientBase && (
                        <NavItem href={`${clientBase}/settings`} active={activeView === 'settings'} icon={ICONS.gear}>
                            Paramètres
                        </NavItem>
                    )}

                    <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 mt-1">
                        <UserButton
                            afterSignOutUrl="/espace"
                            appearance={{ elements: { avatarBox: 'w-[22px] h-[22px]' } }}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-semibold text-white/35 tracking-[0.04em] uppercase">Opérateur</div>
                        </div>
                    </div>

                    <SignOutButton redirectUrl="/espace">
                        <button
                            type="button"
                            className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-center text-[11px] font-semibold text-white/35 transition hover:bg-white/[0.06] hover:text-white/60 hover:border-white/[0.10]"
                        >
                            Déconnexion
                        </button>
                    </SignOutButton>
                </div>
            </nav>
        </>
    );
}
