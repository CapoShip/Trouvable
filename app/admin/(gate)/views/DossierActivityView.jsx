'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Crosshair, LayoutList, PanelRight } from 'lucide-react';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    DossierEmptyState,
    DossierErrorState,
    DossierLoadingState,
    DossierQuickLinkCard,
    formatDateTime,
    stagger,
} from './DossierViewShared';
import { CommandHeader, CommandPageShell, COMMAND_BUTTONS, cn } from '../components/command';

export default function DossierActivityView() {
    const { clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('dossier-activity');
    const base = clientId ? `/admin/clients/${clientId}` : '';
    const [focusId, setFocusId] = useState(null);

    const items = data?.items || [];
    const focused = useMemo(() => items.find((i) => i.id === focusId) || items[0] || null, [items, focusId]);

    if (loading) return <DossierLoadingState label="Chargement de l’activité du dossier…" />;
    if (error) return <DossierErrorState message={error} />;
    if (!data) {
        return (
            <div className="p-5 md:p-7 max-w-[1600px] mx-auto">
                <DossierEmptyState
                    title="Activité indisponible"
                    description="Le journal transverse du dossier n'a pas pu être constitué à partir des sources disponibles."
                />
            </div>
        );
    }

    const quickLinks = [...(data.quickLinks?.shared || []), ...(data.quickLinks?.geo || [])];

    const header = (
        <CommandHeader
            eyebrow="console.mission.log"
            title="Centre de lecture événements"
            subtitle="Triptyque : filtres et métriques à gauche, fil principal au centre, inspection sémantique à droite — sans chronologie latérale classique."
            actions={(
                <>
                    <Link href={`${base}/dossier`} className={COMMAND_BUTTONS.secondary}>Dossier</Link>
                    <Link href={`${base}/geo/continuous`} className={cn(COMMAND_BUTTONS.primary, 'gap-2')}>
                        <Activity className="h-4 w-4" />
                        Suivi continu
                    </Link>
                </>
            )}
        />
    );

    return (
        <CommandPageShell header={header} className="text-white">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto grid max-w-[1900px] gap-0 lg:grid-cols-[280px_minmax(0,1fr)_340px] lg:min-h-[min(100vh,1080px)]">
                {/* Colonne A — métriques & raccourcis */}
                <aside className="border-b border-white/[0.08] bg-white/[0.02] p-4 lg:border-b-0 lg:border-r lg:border-white/[0.08]">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                        <LayoutList className="h-3.5 w-3.5" />
                        Impulsions
                    </div>
                    <div className="mt-4 space-y-2">
                        {Array.isArray(data.summaryCards) && data.summaryCards.length > 0 ? (
                            data.summaryCards.map((item) => (
                                <div key={item.id || item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
                                    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">{item.label}</div>
                                    <div className="mt-1 text-xl font-bold tabular-nums text-white/90">{item.value ?? '—'}</div>
                                    {item.detail ? <div className="mt-1 text-[10px] text-white/38">{item.detail}</div> : null}
                                </div>
                            ))
                        ) : (
                            <p className="text-[11px] text-white/35">Pas de synthèse agrégée pour ce flux.</p>
                        )}
                    </div>
                    {quickLinks.length > 0 ? (
                        <div className="mt-6 space-y-2 border-t border-white/[0.06] pt-5">
                            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/28">Sauts</div>
                            <div className="flex flex-col gap-2">
                                {quickLinks.slice(0, 5).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-[11px] font-medium text-white/65 hover:border-sky-400/25 hover:text-white"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </aside>

                {/* Colonne B — fil principal type terminal */}
                <main className="min-w-0 border-b border-white/[0.06] lg:border-b-0">
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#06070a]/95 px-4 py-3 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/45">
                            <Crosshair className="h-3.5 w-3.5 text-cyan-300/80" />
                            {items.length} ligne{items.length !== 1 ? 's' : ''} indexée{items.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="max-h-[min(78vh,920px)] overflow-y-auto geo-scrollbar">
                        {items.length > 0 ? (
                            <div className="divide-y divide-white/[0.05]">
                                {items.map((item, index) => {
                                    const active = focused?.id === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setFocusId(item.id)}
                                            className={`w-full text-left px-4 py-4 transition-colors ${
                                                active ? 'bg-cyan-500/[0.07]' : 'hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[10px] text-white/25">{String(index + 1).padStart(3, '0')}</span>
                                                {item.category ? (
                                                    <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/40">
                                                        {item.category}
                                                    </span>
                                                ) : null}
                                                {item.statusLabel ? (
                                                    <span className="rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/50">
                                                        {item.statusLabel}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-2 text-[14px] font-semibold text-white/92">{item.title}</div>
                                            {item.description ? (
                                                <p className="mt-1 text-[12px] leading-relaxed text-white/42 line-clamp-2">{item.description}</p>
                                            ) : null}
                                            {item.timestamp ? (
                                                <div className="mt-2 text-[10px] text-white/30">{formatDateTime(item.timestamp)}</div>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6">
                                <DossierEmptyState {...data.emptyState} />
                            </div>
                        )}
                    </div>
                </main>

                {/* Colonne C — inspecteur */}
                <aside className="border-slate-400/10 bg-white/[0.02] p-4 lg:border-l lg:border-white/[0.08]">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                        <PanelRight className="h-3.5 w-3.5" />
                        Inspecteur
                    </div>
                    <AnimatePresence mode="wait">
                        {focused ? (
                            <motion.div
                                key={focused.id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 space-y-4"
                            >
                                <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Événement sélectionné</div>
                                    <h2 className="mt-2 text-[16px] font-semibold leading-snug text-white">{focused.title}</h2>
                                    {focused.description ? (
                                        <p className="mt-3 text-[12px] leading-relaxed text-white/55">{focused.description}</p>
                                    ) : null}
                                    {focused.timestamp ? (
                                        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2 text-[11px] text-white/45">
                                            Horodatage : {formatDateTime(focused.timestamp)}
                                        </div>
                                    ) : null}
                                </div>
                                {focused.href ? (
                                    <Link
                                        href={focused.href}
                                        className={cn(COMMAND_BUTTONS.primary, 'w-full justify-center rounded-xl')}
                                    >
                                        Ouvrir la ressource liée
                                    </Link>
                                ) : null}
                            </motion.div>
                        ) : (
                            <p className="mt-6 text-[12px] text-white/35">
                                Sélectionnez une ligne du fil pour afficher le détail ici.
                            </p>
                        )}
                    </AnimatePresence>

                    {quickLinks.length > 5 ? (
                        <div className="mt-8 space-y-3 border-t border-white/[0.06] pt-6">
                            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/28">Cartes larges</div>
                            <div className="space-y-2">
                                {quickLinks.map((item) => (
                                    <DossierQuickLinkCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    ) : null}
                </aside>
        </motion.div>
        </CommandPageShell>
    );
}
