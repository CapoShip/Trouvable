'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@clerk/nextjs';

export default function AdminSidebar() {
    const pathname = usePathname();

    const isNew = pathname === '/admin/clients/new';
    const isClients = pathname.startsWith('/admin/clients') && !isNew;

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] text-[#f0f0f0] flex flex-col z-20 border-r border-white/7">
            <div className="p-6 border-b border-white/7 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    Trouvable <span className="text-[#7b8fff]">OS</span>
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-4">
                    <p className="px-3 text-[10px] font-bold text-white/25 uppercase tracking-[0.1em] mb-2">
                        Gestion SEO/GEO
                    </p>
                    <Link
                        href="/admin/dashboard"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${pathname === '/admin/dashboard' ? 'bg-[#5b73ff]/15 text-[#7b8fff] font-semibold' : 'text-[#a0a0a0] hover:bg-white/[0.04] hover:text-white'}`}
                    >
                        <svg className={`w-5 h-5 ${pathname === '/admin/dashboard' ? 'text-[#7b8fff]' : 'text-white/25'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Dashboard GEO
                    </Link>
                    <Link
                        href="/admin/clients"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${isClients ? 'bg-[#5b73ff]/15 text-[#7b8fff] font-semibold' : 'text-[#a0a0a0] hover:bg-white/[0.04] hover:text-white'}`}
                    >
                        <svg className={`w-5 h-5 ${isClients ? 'text-[#7b8fff]' : 'text-white/25'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Clients & Profils
                    </Link>
                    <Link
                        href="/admin/clients/new"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm mt-1 ${isNew ? 'bg-[#5b73ff]/15 text-[#7b8fff] font-semibold' : 'text-[#a0a0a0] hover:bg-white/[0.04] hover:text-white'}`}
                    >
                        <svg className={`w-5 h-5 ${isNew ? 'text-[#7b8fff]' : 'text-white/25'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nouveau Profil
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-white/7 flex flex-col gap-4">
                <SignOutButton redirectUrl="/admin/sign-in">
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#a0a0a0] hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all border border-white/7 hover:border-red-400/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Déconnexion
                    </button>
                </SignOutButton>
                <p className="text-xs text-white/20 text-center">Trouvable v0.1.0</p>
            </div>
        </aside>
    );
}
