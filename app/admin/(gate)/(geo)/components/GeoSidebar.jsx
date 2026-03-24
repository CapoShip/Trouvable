'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

import { ADMIN_GEO_LABELS } from '@/lib/i18n/admin-fr';
import { useGeoClient } from '../context/GeoClientContext';
import { useGeoSidebarToggle } from '../layout';

const MONITOR_NAV_ITEMS = [
    { id: 'overview', label: ADMIN_GEO_LABELS.nav.overview, icon: 'grid' },
    { id: 'runs', label: ADMIN_GEO_LABELS.nav.runs, icon: 'pulse' },
    { id: 'prompts', label: ADMIN_GEO_LABELS.nav.prompts, icon: 'list', badge: 'prompts' },
    { id: 'citations', label: ADMIN_GEO_LABELS.nav.citations, icon: 'quote' },
    { id: 'competitors', label: ADMIN_GEO_LABELS.nav.competitors, icon: 'users' },
    { id: 'modeles', label: ADMIN_GEO_LABELS.nav.models, icon: 'cpu' },
];

const OPTIMIZE_NAV_ITEMS = [
    { id: 'ameliorer', label: ADMIN_GEO_LABELS.nav.opportunities, icon: 'trend', badge: 'opportunities' },
    { id: 'audit', label: ADMIN_GEO_LABELS.nav.audit, icon: 'file' },
    { id: 'continuous', label: ADMIN_GEO_LABELS.nav.continuous, icon: 'clock' },
];

const SECONDARY_NAV_ITEMS = [
    { id: 'social', label: ADMIN_GEO_LABELS.nav.social, icon: 'chat' },
];

const ICONS = {
    grid: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="6" height="6" rx="1.5" /><rect x="12" y="2" width="6" height="6" rx="1.5" /><rect x="2" y="12" width="6" height="6" rx="1.5" /><rect x="12" y="12" width="6" height="6" rx="1.5" /></svg>,
    list: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 4h16M2 8h12M2 12h10M2 16h6" /></svg>,
    pulse: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 10h3l2-4 3 8 2-4h6" /></svg>,
    quote: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></svg>,
    users: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" /><path d="M17 6a2.5 2.5 0 010 5M3 11A2.5 2.5 0 013 6" /></svg>,
    cpu: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="3" /><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.6 4.6l2.1 2.1M13.3 13.3l2.1 2.1M4.6 15.4l2.1-2.1M13.3 6.7l2.1-2.1" /></svg>,
    trend: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l5-5 4 4 8-12" /><path d="M14 5h5v5" /></svg>,
    target: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" /><path d="M10 10l-3-3" /><circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" /></svg>,
    file: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9M13 2l5 5h-5V2zM7 10h6M7 13h4" /></svg>,
    clock: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></svg>,
    chat: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 3H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h4l4 4 4-4h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg>,
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
    for (let index = 0; index < name.length; index += 1) hash = name.charCodeAt(index) + ((hash << 5) - hash);
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

    return (
        <div
            className="flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
                width: size,
                height: size,
                borderRadius: size <= 24 ? 6 : 8,
                background: `linear-gradient(135deg, ${from}, ${to})`,
                fontSize: size <= 24 ? 9 : size <= 32 ? 11 : 13,
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

function NavLink({ href, active, children, badge, muted = false }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-[7px] transition-all text-[12.5px] font-[450] ${
                active
                    ? 'bg-white/[0.06] text-white border-l-2 border-[#5b73ff] pl-3'
                    : muted
                      ? 'text-white/35 hover:bg-white/[0.02] hover:text-white/60'
                      : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'
            }`}
        >
            {children}
            {badge != null && (
                <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold border border-white/8 bg-white/[0.03] text-white/50">
                    {badge}
                </span>
            )}
        </Link>
    );
}

export default function GeoSidebar() {
    const { user, isLoaded } = useUser();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const rawView = searchParams.get('view') || 'overview';
    const view = rawView === 'visibilite' ? 'overview' : rawView;
    const { client, clients, clientId, isNewClientPage, switchClient, workspace } = useGeoClient();
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerRef = useRef(null);

    // Mobile sidebar toggle
    let sidebarToggle = { open: false, close: () => {} };
    try { sidebarToggle = useGeoSidebarToggle(); } catch (e) { /* context may not be available */ }
    const { open: sidebarOpen, close: closeSidebar } = sidebarToggle;

    // Close sidebar on route change (mobile)
    useEffect(() => { closeSidebar?.(); }, [pathname, searchParams]);

    const adminLabel =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.username ||
        'Admin';
    const adminSub = user?.primaryEmailAddress?.emailAddress || 'Compte administrateur';
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const hasClient = Boolean(client);
    const hasClients = (clients?.length || 0) > 0;

    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) setPickerOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className={`geo-sb ${sidebarOpen ? 'open' : ''}`}>
            <div className="p-[15px] pb-3 border-b border-white/8">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-white/[0.04] min-w-0"
                        title="Workspace opérateur"
                    >
                        <img src="/logos/trouvable_logo_blanc1.png" alt="Trouvable" className="w-[22px] h-[22px] object-contain shrink-0" />
                        <span className="text-[14px] font-bold tracking-[-0.03em] text-white truncate">Trouvable <span className="text-[#7b8fff] text-[11px] font-semibold">OS</span></span>
                    </Link>
                    <Link
                        href="/admin/clients"
                        className="shrink-0 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-md px-2 py-1 transition-colors"
                        title="Gestion clients"
                    >
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17v-1a3 3 0 00-3-3H8a3 3 0 00-3 3v1" /><circle cx="10" cy="7" r="3" /></svg>
                        Gérer
                    </Link>
                </div>

                <div className="relative" ref={pickerRef}>
                    <button
                        type="button"
                        onClick={() => (hasClients ? setPickerOpen((value) => !value) : undefined)}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer text-left group"
                    >
                        <ClientAvatar name={hasClient ? client.client_name : null} size={32} />
                        <div className="flex-1 min-w-0">
                            <div className="text-[11.5px] font-semibold truncate text-white/90">
                                {hasClient ? client.client_name : 'Sélectionner un client'}
                            </div>
                            <div className="text-[10px] text-white/30 flex items-center gap-1.5">
                                {hasClient ? (
                                    <>
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${client.is_published ? 'bg-emerald-400' : 'bg-amber-400/60'}`} />
                                        {client.is_published ? 'Publié' : 'Brouillon'}
                                        {client.business_type ? ` · ${client.business_type}` : ''}
                                    </>
                                ) : hasClients
                                    ? `${clients.length} client${clients.length > 1 ? 's' : ''}`
                                    : 'Aucun client'}
                            </div>
                        </div>
                        {hasClients && (
                            <svg className={`transition-transform text-white/20 group-hover:text-white/40 ${pickerOpen ? 'rotate-180' : ''}`} width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                        )}
                    </button>
                    {pickerOpen && hasClients && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-50 max-h-[min(70vh,24rem)] overflow-y-auto">
                            {clients.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        switchClient(item.id);
                                        setPickerOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] text-left transition-colors rounded-lg mx-0 ${item.id === clientId ? 'bg-white/[0.04]' : ''}`}
                                >
                                    <ClientAvatar name={item.client_name} size={24} />
                                    <span className="text-[11px] font-medium truncate flex-1 text-white/75">{item.client_name}</span>
                                    {item.id === clientId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-px">
                <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-2 pb-1">Monitoring</div>
                {MONITOR_NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.id}
                        href={item.id === 'overview' ? baseHref : `${baseHref}?view=${item.id}`}
                        active={!isNewClientPage && view === item.id}
                        badge={item.badge === 'prompts' && workspace?.trackedPromptCount > 0 ? workspace.trackedPromptCount : null}
                    >
                        {ICONS[item.icon]}
                        {item.label}
                    </NavLink>
                ))}

                <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-4 pb-1">{ADMIN_GEO_LABELS.nav.optimization}</div>
                {OPTIMIZE_NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.id}
                        href={`${baseHref}?view=${item.id}`}
                        active={!isNewClientPage && view === item.id}
                        badge={item.badge === 'opportunities' && workspace?.openOpportunityCount > 0 ? workspace.openOpportunityCount : null}
                    >
                        {ICONS[item.icon]}
                        {item.label}
                    </NavLink>
                ))}

                <div className="text-[9px] font-bold text-white/15 tracking-[0.12em] uppercase px-2 pt-4 pb-1">{ADMIN_GEO_LABELS.nav.secondary}</div>
                {SECONDARY_NAV_ITEMS.map((item) => (
                    <NavLink key={item.id} href={`${baseHref}?view=${item.id}`} active={!isNewClientPage && view === item.id} muted>
                        {ICONS[item.icon]}
                        {item.label}
                    </NavLink>
                ))}
            </div>

            <div className="p-2 border-t border-white/8">
                <NavLink href={`${baseHref}?view=settings`} active={!isNewClientPage && view === 'settings'}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path d="M17.7 10a8 8 0 01-.1 1l1.5 1.2-1.5 2.6-1.8-.8a7.4 7.4 0 01-1.8 1l-.3 1.9h-3l-.3-1.9a7.4 7.4 0 01-1.8-1l-1.8.8L5 13.2 6.5 12a8 8 0 010-2L5 8.8l1.5-2.6 1.8.8a7.4 7.4 0 011.8-1L10.3 4h3l.3 1.9a7.4 7.4 0 011.8 1l1.8-.8 1.5 2.6-1.5 1.2a8 8 0 01.5 1z" /></svg>
                    {ADMIN_GEO_LABELS.nav.settings}
                </NavLink>

                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] mt-1">
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
                            {!isLoaded ? '...' : adminLabel}
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
