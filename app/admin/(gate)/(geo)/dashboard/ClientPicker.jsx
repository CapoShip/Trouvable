'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
}

export default function ClientPicker({ clients = [], empty }) {
    const router = useRouter();

    if (empty) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--geo-s2)] border border-[var(--geo-bd)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--geo-t3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                    </div>
                    <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[var(--geo-t1)] mb-2">Aucun client</h2>
                    <p className="text-sm text-[var(--geo-t2)] mb-6">Créez votre premier profil client pour accéder au dashboard GEO.</p>
                    <Link href="/admin/dashboard/new" className="geo-btn geo-btn-pri inline-flex items-center gap-2">
                        + Nouveau client
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center min-h-[60vh] py-12">
            <div className="w-full max-w-lg px-6">
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[var(--geo-t1)] mb-2 text-center">Sélectionner un client</h2>
                <p className="text-sm text-[var(--geo-t2)] mb-1 text-center">Choisissez le client à analyser</p>
                <p className="text-xs text-[var(--geo-t3)] mb-6 text-center">
                    {clients.length} profil{clients.length > 1 ? 's' : ''} — gestion détaillée sur{' '}
                    <Link href="/admin/clients" className="text-[#a78bfa] hover:underline">
                        Clients &amp; Profils
                    </Link>
                </p>
                <div className="space-y-2 max-h-[min(60vh,28rem)] overflow-y-auto pr-1">
                    {clients.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => router.push(`/admin/dashboard/${c.id}`)}
                            className="w-full flex items-center gap-3 p-3 rounded-[var(--geo-r2)] bg-[var(--geo-s1)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] hover:bg-[var(--geo-s2)] transition-all text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] text-sm font-extrabold text-white flex-shrink-0">
                                {getInitials(c.client_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[var(--geo-t1)] truncate">{c.client_name}</div>
                                <div className="text-xs text-[var(--geo-t3)] truncate">
                                {c.client_slug}
                                {c.is_published === false && (
                                    <span className="ml-2 text-amber-400/90">· brouillon</span>
                                )}
                            </div>
                            </div>
                            <svg className="w-4 h-4 text-[var(--geo-t3)] flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 12l4-4-4-4" />
                            </svg>
                        </button>
                    ))}
                </div>
                <div className="mt-6 text-center">
                    <Link href="/admin/dashboard/new" className="text-sm text-[#a78bfa] hover:underline">
                        + Créer un nouveau client
                    </Link>
                </div>
            </div>
        </div>
    );
}
