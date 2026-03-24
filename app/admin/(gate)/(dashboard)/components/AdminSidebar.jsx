'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

function NavLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[7px] transition-all text-[12.5px] font-[450] ${
                active
                    ? 'bg-white/[0.06] text-white border-l-2 border-[#5b73ff] pl-3.5'
                    : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'
            }`}
        >
            {children}
        </Link>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => { setOpen(false); }, [pathname]);

    const isNew = pathname === '/admin/clients/new';
    const isClients = pathname.startsWith('/admin/clients') && !isNew;
    const isDashboard = pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/');

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed top-4 left-4 z-30 flex items-center justify-center w-10 h-10 rounded-lg bg-[#0a0a0a] border border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors lg:hidden"
                aria-label="Ouvrir le menu"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 w-[210px] bg-[#0a0a0a] text-[#f0f0f0] flex flex-col z-40 border-r border-white/[0.08] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    open ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0`}
            >
                <div className="p-[15px] pb-3 border-b border-white/[0.08] flex items-center justify-between">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-white/[0.04]"
                        title="Workspace opérateur"
                    >
                        <img src="/logos/trouvable_logo_blanc1.png" alt="" className="h-[22px] w-[22px] object-contain" aria-hidden />
                        <span className="text-[14px] font-bold tracking-[-0.03em] text-white">
                            Trouvable <span className="text-[#7b8fff] text-[11px] font-semibold">OS</span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors lg:hidden"
                        aria-label="Fermer le menu"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 p-2 space-y-px overflow-y-auto">
                    <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-2 pb-1">
                        Workspace
                    </div>
                    <NavLink href="/admin/dashboard" active={isDashboard}>
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="6" height="6" rx="1.5" /><rect x="12" y="2" width="6" height="6" rx="1.5" /><rect x="2" y="12" width="6" height="6" rx="1.5" /><rect x="12" y="12" width="6" height="6" rx="1.5" /></svg>
                        Dashboard GEO
                    </NavLink>

                    <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-4 pb-1">
                        Gestion clients
                    </div>
                    <NavLink href="/admin/clients" active={isClients}>
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" /></svg>
                        Clients &amp; Profils
                    </NavLink>
                    <NavLink href="/admin/clients/new" active={isNew}>
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 4v12M4 10h12" /></svg>
                        Nouveau profil
                    </NavLink>
                </nav>

                <div className="p-2 border-t border-white/[0.08]">
                    <SignOutButton redirectUrl="/admin/sign-in">
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-[11px] font-medium text-white/40 hover:text-red-300 hover:bg-red-400/10 rounded-[7px] transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Déconnexion
                        </button>
                    </SignOutButton>
                </div>
            </aside>
        </>
    );
}
