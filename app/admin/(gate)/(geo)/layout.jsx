'use client';

import { Suspense } from 'react';
import Link from 'next/link';

import GeoSidebar from './components/GeoSidebar';
import { GeoClientProvider, useGeoClient } from './context/GeoClientContext';

function WorkspaceTopbar() {
    const { client, workspace, invalidateWorkspace } = useGeoClient();

    return (
        <div className="h-[46px] border-b border-white/8 flex items-center px-[18px] gap-2 flex-shrink-0 bg-[#0a0a0a] z-10">
            <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white/80 truncate">
                    {client?.client_name || 'Workspace GEO'}
                </div>
                <div className="text-[10px] text-white/35 truncate">
                    {workspace?.latestActivityAt
                        ? `Derniere activite: ${new Date(workspace.latestActivityAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}`
                        : 'Aucune activite observee encore'}
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={invalidateWorkspace} className="geo-btn geo-btn-ghost">
                    Actualiser
                </button>
                <Link href="/admin/clients/new" className="geo-btn geo-btn-pri">+ Nouveau client</Link>
            </div>
        </div>
    );
}

export default function GeoLayout({ children }) {
    return (
        <GeoClientProvider clients={[]}>
            <div className="geo-shell bg-[var(--geo-bg)] text-[var(--geo-t1)]">
                <Suspense
                    fallback={(
                        <nav className="geo-sb animate-pulse">
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
        </GeoClientProvider>
    );
}
