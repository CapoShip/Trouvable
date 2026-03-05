import Link from 'next/link';

export default function AdminSidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 flex flex-col z-20 shadow-xl border-r border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-ea580c" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Trouvable <span className="text-ea580c">OS</span>
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-4">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Gestion SEO/GEO
                    </p>
                    <Link
                        href="/admin/clients"
                        className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Clients & Profils
                    </Link>
                    <Link
                        href="/admin/clients/new"
                        className="flex items-center gap-3 px-3 py-2 mt-1 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nouveau Profil
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
                <p>Trouvable v0.1.0</p>
            </div>
        </aside>
    );
}
