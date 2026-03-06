'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '../../actions';

export default function AdminSidebar() {
    const pathname = usePathname();

    const isNew = pathname === '/admin/clients/new';
    const isClients = pathname.startsWith('/admin/clients') && !isNew;

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 flex flex-col z-20 shadow-xl border-r border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Trouvable <span className="text-orange-600">OS</span>
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-4">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Gestion SEO/GEO
                    </p>
                    <Link
                        href="/admin/clients"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isClients
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <svg className={`w-5 h-5 ${isClients ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Clients & Profils
                    </Link>
                    <Link
                        href="/admin/clients/new"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isNew
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <svg className={`w-5 h-5 ${isNew ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nouveau Profil
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-all border border-slate-800 hover:border-red-600/50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Déconnexion
                    </button>
                </form>
                <p className="text-xs text-slate-500 text-center">Trouvable v0.1.0</p>
            </div>
        </aside>
    );
}
