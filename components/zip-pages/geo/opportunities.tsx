// @ts-nocheck
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    CalendarIcon,
    MessageSquareIcon,
    UserIcon,
} from 'lucide-react';

import { CommandHeader, CommandPageShell } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import CommandEmptyState from '@/app/admin/(gate)/components/command/CommandEmptyState';
import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';

function formatShortDate(value) {
    if (!value) return null;
    try {
        return new Date(value).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
    } catch {
        return null;
    }
}

function priorityChip(priority) {
    if (priority === 'high') return 'bg-rose-500/20 text-rose-300';
    if (priority === 'medium') return 'bg-amber-500/20 text-amber-300';
    return 'bg-white/10 text-white/50';
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
    return json;
}

export default function GeoOpportunitiesPage() {
    const { clientId, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('opportunities');
    const [pendingId, setPendingId] = useState(null);
    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';

    const columns = useMemo(() => ([
        { id: 'backlog', title: 'Backlog', color: 'text-white/50', items: data?.reviewQueue || [] },
        { id: 'todo', title: 'Ouvert', color: 'text-indigo-400', items: data?.byStatus?.open || [] },
        { id: 'doing', title: 'En cours', color: 'text-amber-400', items: data?.byStatus?.in_progress || [] },
        { id: 'blocked', title: 'A revoir', color: 'text-rose-400', items: data?.byStatus?.dismissed || [] },
        { id: 'done', title: 'Termine', color: 'text-emerald-400', items: data?.byStatus?.done || [] },
    ]), [data]);

    async function updateStatus(id, status) {
        if (!clientId || !id || pendingId) return;
        setPendingId(id);
        try {
            const response = await fetch(`/api/admin/geo/client/${clientId}/opportunities/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            await parseJsonResponse(response);
            invalidateWorkspace();
        } finally {
            setPendingId(null);
        }
    }

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="File d'action"
                    subtitle="Kanban alimente par les vraies opportunites, la queue de revue et les statuts persistants du dossier courant."
                    actions={(
                        <>
                            <Link href={`${geoBase}/continuous`} className={COMMAND_BUTTONS.secondary}>Suivi continu</Link>
                            <Link href={`${geoBase}/runs`} className={COMMAND_BUTTONS.primary}>Executions</Link>
                        </>
                    )}
                />
            )}
        >
            {loading ? (
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-8 text-[13px] text-white/55">Chargement des opportunites...</div>
            ) : error ? (
                <CommandEmptyState title="File d'action indisponible" description={error} />
            ) : !data || ((data.summary?.total || 0) === 0 && !(data.reviewQueue || []).length) ? (
                <CommandEmptyState title={data?.emptyState?.noOpen?.title || 'Aucune opportunite ouverte'} description={data?.emptyState?.noOpen?.description || 'Les opportunites apparaitront ici apres audit ou analyse.'} />
            ) : (
                <div className="mt-4 flex h-[calc(100vh-180px)] min-h-[600px] gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10">
                    {columns.map((column) => (
                        <div key={column.id} className="flex w-[300px] shrink-0 flex-col rounded-[24px] border border-white/[0.03] bg-white/[0.01]">
                            <div className="flex items-center justify-between border-b border-white/[0.05] p-4">
                                <div className="flex items-center gap-2">
                                    <h3 className={cn('text-[13px] font-bold uppercase tracking-wider', column.color)}>{column.title}</h3>
                                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/30">
                                        {column.items.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto p-3 scrollbar-none">
                                {column.items.map((card, index) => (
                                    <motion.div
                                        key={card.id || `${column.id}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={cn(COMMAND_PANEL, 'group flex flex-col gap-3 p-4 transition-all hover:ring-1 hover:ring-white/20', column.id === 'done' && 'opacity-60 hover:opacity-100')}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest', priorityChip(card.priority || card.review_item?.priority))}>
                                                {(card.priority || card.review_item?.priority || 'info').toUpperCase()}
                                            </span>
                                        </div>

                                        <h4 className="text-[13px] font-semibold leading-snug text-white/90">
                                            {card.title || card.review_item?.title || 'Action'}
                                        </h4>

                                        <div className="text-[11px] leading-relaxed text-white/55">
                                            {card.description || card.rationale || card.review_item?.description || card.review_item?.evidence_summary || 'Aucun detail supplementaire.'}
                                        </div>

                                        <div className="mt-auto flex items-center justify-between border-t border-white/[0.05] pt-2">
                                            <div className="flex gap-2">
                                                {card.created_at ? (
                                                    <div className="flex items-center gap-1 text-[10px] text-white/40">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {formatShortDate(card.created_at)}
                                                    </div>
                                                ) : null}
                                                <div className="flex items-center gap-1 text-[10px] text-white/20">
                                                    <MessageSquareIcon className="h-3 w-3" />
                                                    {card.category || card.review_item?.category || 'queue'}
                                                </div>
                                            </div>

                                            {card.owner ? (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-lg">{card.owner}</div>
                                            ) : (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/20">
                                                    <UserIcon className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>

                                        {card.id ? (
                                            <div className="flex flex-wrap gap-2 border-t border-white/[0.05] pt-2">
                                                {column.id === 'todo' ? (
                                                    <button
                                                        type="button"
                                                        disabled={pendingId === card.id}
                                                        onClick={() => updateStatus(card.id, 'in_progress')}
                                                        className="rounded bg-white/5 px-2.5 py-1 text-[10px] text-white/65 hover:bg-white/10"
                                                    >
                                                        Demarrer
                                                    </button>
                                                ) : null}
                                                {column.id === 'doing' ? (
                                                    <button
                                                        type="button"
                                                        disabled={pendingId === card.id}
                                                        onClick={() => updateStatus(card.id, 'done')}
                                                        className="rounded bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300 hover:bg-emerald-500/20"
                                                    >
                                                        Terminer
                                                    </button>
                                                ) : null}
                                                {column.id === 'blocked' ? (
                                                    <button
                                                        type="button"
                                                        disabled={pendingId === card.id}
                                                        onClick={() => updateStatus(card.id, 'open')}
                                                        className="rounded bg-white/5 px-2.5 py-1 text-[10px] text-white/65 hover:bg-white/10"
                                                    >
                                                        Reouvrir
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </motion.div>
                                ))}

                                {column.items.length === 0 ? (
                                    <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-white/5">
                                        <span className="text-[11px] text-white/20">Aucun element</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CommandPageShell>
    );
}
