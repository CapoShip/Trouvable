'use client';

import { Suspense, useState, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';

import GeoSidebar from './components/GeoSidebar';
import { GeoClientProvider, useGeoClient } from './context/GeoClientContext';

// Context to share sidebar toggle state
const GeoSidebarToggleContext = createContext({ open: false, toggle: () => {}, close: () => {} });
export function useGeoSidebarToggle() { return useContext(GeoSidebarToggleContext); }

function WorkspaceTopbar() {
    const { client, workspace, invalidateWorkspace } = useGeoClient();
    const { toggle } = useGeoSidebarToggle();

    return (
        <div className="h-[46px] border-b border-white/8 flex items-center px-[18px] gap-2 flex-shrink-0 bg-[#0a0a0a] z-10">
            {/* Mobile hamburger */}
            <button
                type="button"
                onClick={toggle}
                className="mr-1 flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors lg:hidden"
                aria-label="Menu"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white/80 truncate">
                    {client?.client_name || 'Workspace GEO'}
                </div>
                <div className="text-[10px] text-white/35 truncate">
                    {workspace?.latestActivityAt
                        ? `Dernière activité : ${new Date(workspace.latestActivityAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}`
                        : 'Aucune activité observee encore'}
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={invalidateWorkspace} className="geo-btn geo-btn-ghost">
                    Actualiser
                </button>
                <Link href="/admin/clients/new" className="geo-btn geo-btn-pri hidden sm:flex">+ Nouveau client</Link>
            </div>
        </div>
    );
}

function GeoLayoutInner({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggle = useCallback(() => setSidebarOpen(v => !v), []);
    const close = useCallback(() => setSidebarOpen(false), []);

    return (
        <GeoSidebarToggleContext.Provider value={{ open: sidebarOpen, toggle, close }}>
            <div className="geo-shell bg-[var(--geo-bg)] text-[var(--geo-t1)]">
                {/* Mobile backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={close}
                    />
                )}

                <Suspense
                    fallback={(
                        <nav className="geo-sb">
                            <div className="p-4 h-24 bg-[var(--geo-s1)]" />
                            <div className="flex-1 p-2" />
                        </nav>
                    )}
                >
                    <GeoSidebar />
                </Suspense>

                <div className="geo-main">
                    <WorkspaceTopbar />
                    <div className="geo-content">{children}</div>
                </div>
            </div>
        </GeoSidebarToggleContext.Provider>
    );
}

export default function GeoLayout({ children }) {
    return (
        <GeoClientProvider clients={[]}>
            <GeoLayoutInner>{children}</GeoLayoutInner>
        </GeoClientProvider>
    );
}
