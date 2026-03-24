'use client';

import { ClientProvider, useGeoClient } from '../../context/ClientContext';

function WorkspaceHeader() {
    const { client, workspace, invalidateWorkspace } = useGeoClient();
    return (
        <div className="h-[42px] border-b border-white/[0.06] flex items-center px-4 gap-3 flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-sm">
            <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-white/75 truncate">
                    {client?.client_name || 'Chargement...'}
                </div>
                <div className="text-[9px] text-white/30 truncate">
                    {workspace?.latestActivityAt
                        ? `Activité : ${new Date(workspace.latestActivityAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}`
                        : 'Aucune activité'}
                </div>
            </div>
            <button type="button" onClick={invalidateWorkspace} className="geo-btn geo-btn-ghost text-[10px] py-1 px-2">
                Actualiser
            </button>
        </div>
    );
}

export default function ClientWorkspaceShell({ clientId, children }) {
    return (
        <ClientProvider clientId={clientId}>
            <WorkspaceHeader />
            {children}
        </ClientProvider>
    );
}
