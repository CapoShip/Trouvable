'use client';

import { ClientProvider, useGeoClient } from '../../context/ClientContext';
import { motion } from 'framer-motion';

function MissionCommandHeader() {
    const { client, workspace, invalidateWorkspace } = useGeoClient();

    const freshness = workspace?.latestRunAt
        ? Math.floor((Date.now() - new Date(workspace.latestRunAt).getTime()) / 3600000)
        : null;

    const freshnessStatus = freshness === null ? 'idle'
        : freshness > 72 ? 'critical'
        : freshness > 24 ? 'warning'
        : 'ok';

    const statusColors = {
        ok: 'bg-emerald-400',
        warning: 'bg-amber-400',
        critical: 'bg-red-400',
        idle: 'bg-white/20',
    };

    const statusLabels = {
        ok: 'Données fraîches',
        warning: 'Fraîcheur dégradée',
        critical: 'Données obsolètes',
        idle: 'En attente',
    };

    function timeSinceRun() {
        if (freshness === null) return null;
        if (freshness < 1) return '< 1h';
        if (freshness < 24) return `${freshness}h`;
        return `${Math.floor(freshness / 24)}j`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="border-b border-white/[0.05] bg-[#090a0b]/70 backdrop-blur-sm"
        >
            <div className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[freshnessStatus]} cmd-health-dot`} />
                    <div className="min-w-0">
                        <div className="text-[13px] font-bold text-white/90 tracking-[-0.015em] truncate">
                            {client?.client_name || 'Chargement du mandat…'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            {client?.business_type && (
                                <span className="text-[10px] text-white/25 font-medium">{client.business_type}</span>
                            )}
                            {freshnessStatus !== 'idle' && (
                                <>
                                    <span className="text-white/10">·</span>
                                    <span className={`text-[10px] font-medium ${
                                        freshnessStatus === 'critical' ? 'text-red-300/60' :
                                        freshnessStatus === 'warning' ? 'text-amber-300/50' :
                                        'text-white/25'
                                    }`}>
                                        {statusLabels[freshnessStatus]} · {timeSinceRun()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {client?.website_url && (
                        <a
                            href={client.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#7b8fff]/60 hover:text-[#7b8fff] hover:bg-white/[0.03] transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Site
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={invalidateWorkspace}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.05] text-[10px] font-semibold text-white/35 hover:text-white/60 hover:bg-white/[0.05] hover:border-white/[0.10] transition-all"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualiser
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function ClientWorkspaceShell({ clientId, children }) {
    return (
        <ClientProvider clientId={clientId}>
            <MissionCommandHeader />
            {children}
        </ClientProvider>
    );
}
