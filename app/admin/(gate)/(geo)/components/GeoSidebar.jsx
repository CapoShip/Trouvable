'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGeoClient } from '../context/GeoClientContext';
import { useState, useRef, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'visibilite', label: 'Visibilité IA', icon: 'chart' },
    { id: 'prompts', label: 'Prompts', icon: 'list', badge: 'prompts' },
    { id: 'modeles', label: 'Modèles IA', icon: 'cpu' },
    { id: 'citations', label: 'Citations', icon: 'quote' },
    { id: 'social', label: 'Social Listening', icon: 'chat' },
    { id: 'ameliorer', label: 'Améliorer', icon: 'trend', badge: 'improvements' },
    { id: 'cockpit', label: 'Cockpit Client', icon: 'target' },
    { id: 'audit', label: 'Audit SEO/GEO', icon: 'file' },
];

const ICONS = {
    grid: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="6" height="6" rx="1.5" /><rect x="12" y="2" width="6" height="6" rx="1.5" /><rect x="2" y="12" width="6" height="6" rx="1.5" /><rect x="12" y="12" width="6" height="6" rx="1.5" /></svg>,
    chart: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 14l5-5 4 4 7-9" /></svg>,
    list: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 4h16M2 8h12M2 12h10M2 16h6" /></svg>,
    cpu: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="3" /><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.6 4.6l2.1 2.1M13.3 13.3l2.1 2.1M4.6 15.4l2.1-2.1M13.3 6.7l2.1-2.1" /></svg>,
    quote: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></svg>,
    chat: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 3H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h4l4 4 4-4h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg>,
    trend: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l5-5 4 4 8-12" /><path d="M14 5h5v5" /></svg>,
    target: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" /><path d="M10 10l-3-3" /><circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" /></svg>,
    file: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9M13 2l5 5h-5V2zM7 10h6M7 13h4" /></svg>,
};

const AVATAR_COLORS = [
    ['#6366f1', '#8b5cf6'],
    ['#3b82f6', '#06b6d4'],
    ['#f97316', '#f59e0b'],
    ['#ec4899', '#f43f5e'],
    ['#10b981', '#34d399'],
    ['#8b5cf6', '#a78bfa'],
    ['#ef4444', '#f97316'],
];

function getAvatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitialsLocal(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function ClientAvatar({ name, size = 32 }) {
    const [from, to] = getAvatarColor(name);
    const initials = getInitialsLocal(name);
    const fontSize = size <= 24 ? 9 : size <= 32 ? 11 : 13;
    const radius = size <= 24 ? 6 : 8;

    return (
        <div
            className="flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                background: `linear-gradient(135deg, ${from}, ${to})`,
                fontSize,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.02em',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
        >
            {initials}
        </div>
    );
}


export default function GeoSidebar() {
    const { user, isLoaded } = useUser();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'overview';
    const { client, audit, clients, clientId, isNewClientPage, getInitials, switchClient } = useGeoClient();

    const adminLabel =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.username ||
        'Admin';
    const adminSub =
        user?.primaryEmailAddress?.emailAddress || 'Compte administrateur';
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerRef = useRef(null);

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const hasClient = !!client;
    const hasClients = clients?.length > 0;

    const improvementCount = audit?.issues?.length ?? 0;

    useEffect(() => {
        function handleClickOutside(e) {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="geo-sb">
            <div className="p-[15px] pb-3 border-b border-white/8">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 mb-3 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-white/[0.04]"
                    title="Retour au site public"
                >
                    <img src="/logos/trouvable_logo_blanc.png" alt="Trouvable" className="w-[22px] h-[22px] object-contain" />
                    <span className="text-[15px] font-semibold tracking-[-0.025em] text-white">Trouvable</span>
                </Link>
                <div className="relative" ref={pickerRef}>
                    <button
                        type="button"
                        onClick={() => hasClients ? setPickerOpen(!pickerOpen) : undefined}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer text-left group"
                    >
                        <ClientAvatar name={hasClient ? client.client_name : null} size={32} />
                        <div className="flex-1 min-w-0">
                            <div className="text-[11.5px] font-semibold truncate text-white/90">{hasClient ? client.client_name : 'Sélectionner un client'}</div>
                            <div className="text-[10px] text-white/30">
                                {hasClient ? (client.business_type || 'LocalBusiness') + ' · ' + (client.is_published ? 'publié' : 'brouillon') : hasClients ? `${clients.length} client${clients.length > 1 ? 's' : ''} disponible${clients.length > 1 ? 's' : ''}` : 'Aucun client'}
                            </div>
                        </div>
                        {hasClients && <svg className={`transition-transform text-white/20 group-hover:text-white/40 ${pickerOpen ? 'rotate-180' : ''}`} width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>}
                    </button>
                    {pickerOpen && hasClients && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-50 max-h-52 overflow-y-auto">
                            {clients.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => { switchClient(c.id); setPickerOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] text-left transition-colors rounded-lg mx-0 ${c.id === clientId ? 'bg-white/[0.04]' : ''}`}
                                >
                                    <ClientAvatar name={c.client_name} size={24} />
                                    <span className="text-[11px] font-medium truncate flex-1 text-white/75">{c.client_name}</span>
                                    {c.id === clientId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-px">
                <Link href={baseHref} className={`flex items-center gap-2 px-2 py-1.5 rounded-[7px] transition-all text-[12.5px] font-[450] ${!isNewClientPage && view === 'overview' ? 'bg-white/[0.06] text-white border-l-2 border-[#5b73ff] pl-3' : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'}`}>
                    {ICONS.grid}
                    Overview
                </Link>
                <div className="text-[10px] font-semibold text-white/20 tracking-[0.1em] uppercase px-2 pt-4 pb-1">Analyse</div>
                {NAV_ITEMS.slice(1, 6).map((item) => (
                    <Link key={item.id} href={`${baseHref}?view=${item.id}`} className={`flex items-center gap-2 px-2 py-1.5 rounded-[7px] transition-all text-[12.5px] font-[450] ${!isNewClientPage && view === item.id ? 'bg-white/[0.06] text-white border-l-2 border-[#5b73ff] pl-3' : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'}`}>
                        {ICONS[item.icon]}
                        {item.label}
                        {item.badge === 'prompts' && <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold border border-white/8 bg-white/[0.03] text-white/35">47</span>}
                    </Link>
                ))}
                <div className="text-[10px] font-semibold text-white/20 tracking-[0.1em] uppercase px-2 pt-4 pb-1">Optimisation</div>
                {NAV_ITEMS.slice(6).map((item) => (
                    <Link key={item.id} href={`${baseHref}?view=${item.id}`} className={`flex items-center gap-2 px-2 py-1.5 rounded-[7px] transition-all text-[12.5px] font-[450] ${!isNewClientPage && view === item.id ? 'bg-white/[0.06] text-white border-l-2 border-[#5b73ff] pl-3' : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'}`}>
                        {ICONS[item.icon]}
                        {item.label}
                        {item.badge === 'improvements' && improvementCount > 0 && <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold border border-white/8 bg-white/[0.03] text-white/35">{improvementCount}</span>}
                    </Link>
                ))}
            </div>

            <div className="p-2 border-t border-white/8">
                <Link href={`${baseHref}?view=settings`} className={`flex items-center gap-2 px-2 py-1.5 rounded-[7px] transition-all text-[12.5px] font-[450] mb-1 ${!isNewClientPage && view === 'settings' ? 'bg-white/[0.06] text-white border-l-2 border-[#5b73ff] pl-3' : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path d="M17.7 10a8 8 0 01-.1 1l1.5 1.2-1.5 2.6-1.8-.8a7.4 7.4 0 01-1.8 1l-.3 1.9h-3l-.3-1.9a7.4 7.4 0 01-1.8-1l-1.8.8L5 13.2 6.5 12a8 8 0 010-2L5 8.8l1.5-2.6 1.8.8a7.4 7.4 0 011.8-1L10.3 4h3l.3 1.9a7.4 7.4 0 011.8 1l1.8-.8 1.5 2.6-1.5 1.2a8 8 0 01.5 1z" /></svg>
                    Paramètres
                </Link>
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <UserButton
                        afterSignOutUrl="/admin/sign-in"
                        appearance={{
                            elements: {
                                avatarBox: 'w-[26px] h-[26px]',
                            },
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-white/80 truncate">
                            {!isLoaded ? '…' : adminLabel}
                        </div>
                        <div className="text-[10px] text-white/25 truncate" title={adminSub}>
                            {!isLoaded ? 'Chargement' : adminSub}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
