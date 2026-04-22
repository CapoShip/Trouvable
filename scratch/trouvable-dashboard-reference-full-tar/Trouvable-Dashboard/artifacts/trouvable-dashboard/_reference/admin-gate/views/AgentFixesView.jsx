'use client';

import Link from 'next/link';

import { GeoPremiumCard, GeoProvenancePill } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    CommandEmptyState,
    CommandSkeleton,
} from '../components/command';

const PRIORITY_META = {
    high: { label: 'Haute', border: 'border-red-400/30', chip: 'text-red-200 bg-red-500/15 border-red-400/30' },
    medium: { label: 'Moyenne', border: 'border-amber-400/28', chip: 'text-amber-100 bg-amber-400/12 border-amber-400/25' },
    low: { label: 'Basse', border: 'border-white/[0.08]', chip: 'text-white/60 bg-white/[0.04] border-white/[0.12]' },
};

function PriorityBadge({ priority }) {
    const meta = PRIORITY_META[priority] || PRIORITY_META.low;
    return (
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>
            {meta.label}
        </span>
    );
}

function FixCard({ fix, clientId }) {
    return (
        <Link
            href={`/admin/clients/${clientId}/geo/opportunities`}
            className="block rounded-2xl border border-white/[0.07] bg-black/25 p-4 transition-colors hover:border-violet-400/35 hover:bg-white/[0.03]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white/95">{fix.title}</div>
                    {fix.description && (
                        <div className="mt-1 text-[11px] text-white/45 leading-snug line-clamp-3">{fix.description}</div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/35 uppercase tracking-wider">
                        <span>{fix.category || 'seo'}</span>
                        <span className="text-white/15">·</span>
                        <span>{fix.status}</span>
                    </div>
                </div>
                <PriorityBadge priority={fix.priority} />
            </div>
        </Link>
    );
}

function AuditSnippet({ issue }) {
    const priorityColor = issue.priority === 'high' ? 'text-red-300' : issue.priority === 'medium' ? 'text-amber-300' : 'text-white/60';
    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-white/90">{issue.title}</div>
                    {issue.evidence_summary && (
                        <div className="mt-2 text-[11px] text-white/45 leading-snug line-clamp-3">{issue.evidence_summary}</div>
                    )}
                </div>
                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${priorityColor}`}>
                    {issue.priority}
                </span>
            </div>
            {issue.recommended_fix && (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-[11px] text-white/62 leading-snug">
                    <span className="font-semibold text-white/85">Piste — </span>
                    {issue.recommended_fix}
                </div>
            )}
        </div>
    );
}

export default function AgentFixesView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-fixes');

    if (loading) return <CommandSkeleton />;

    if (error) {
        return (
            <div className="mx-auto max-w-[1200px] p-6">
                <CommandEmptyState tone="critical" title="Correctifs AGENT indisponibles" description={error} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="mx-auto max-w-[1200px] p-6">
                <CommandEmptyState title="Correctifs AGENT indisponibles" description="Aucune donnée n’a pu être chargée." />
            </div>
        );
    }

    const { summary, byPriority, topFixes, auditEvidence, links, emptyState, provenance, staleWarning } = data;

    const highFixes = topFixes.filter((f) => f.priority === 'high');
    const medFixes = topFixes.filter((f) => f.priority === 'medium');
    const restFixes = topFixes.filter((f) => f.priority !== 'high' && f.priority !== 'medium');

    return (
        <div className="bg-[#020203]">
            <div className="mx-auto max-w-[1680px] px-4 py-10 md:px-10">
                <header className="grid gap-8 border-b border-white/[0.06] pb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200/70">Correctifs</div>
                        <h1 className="mt-3 text-[clamp(1.7rem,3.2vw,2.45rem)] font-semibold tracking-[-0.045em] text-white">
                            Studio des incidents
                        </h1>
                        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-white/48">
                            Chaises vides de tableaux : trois travées (priorité) pour {client?.client_name || 'ce mandat'}. Les actions restent dans la file GEO Ops.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={links.geoOpportunities}
                                className="inline-flex items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/15 px-5 py-2.5 text-[12px] font-semibold text-violet-50 transition hover:bg-violet-500/25"
                            >
                                Ouvrir la file complète
                            </Link>
                        </div>
                        {provenance?.observed ? <GeoProvenancePill meta={provenance.observed} /> : null}
                    </div>
                </header>

                {staleWarning && (
                    <div className="mt-8 rounded-2xl border border-amber-400/28 bg-amber-400/10 px-5 py-4 text-[12px] text-amber-100/90 leading-relaxed">
                        {staleWarning.message || 'Certaines données sont plus anciennes que la fenêtre attendue.'}
                    </div>
                )}

                {emptyState ? (
                    <div className="mt-10">
                        <CommandEmptyState title={emptyState.title} description={emptyState.description} />
                    </div>
                ) : (
                    <>
                        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { k: 'Ouverts', v: summary?.open ?? 0, d: 'File d’actions' },
                                { k: 'Haute priorité', v: byPriority?.high ?? 0, d: 'À traiter vite', warn: (byPriority?.high ?? 0) > 0 },
                                { k: 'En cours', v: summary?.inProgress ?? 0, d: 'Engagés' },
                                { k: 'Revue', v: summary?.reviewQueueCount ?? 0, d: 'Fusion / arbitrage' },
                            ].map((row) => (
                                <div
                                    key={row.k}
                                    className={`rounded-2xl border px-4 py-4 ${row.warn ? 'border-red-400/25 bg-red-500/[0.07]' : 'border-white/[0.07] bg-white/[0.02]'}`}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{row.k}</div>
                                    <div className="mt-2 text-3xl font-bold tabular-nums text-white/95">{row.v}</div>
                                    <div className="mt-1 text-[11px] text-white/40">{row.d}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 grid gap-8 lg:grid-cols-3">
                            <GeoPremiumCard className={`border ${PRIORITY_META.high.border} bg-[#0c0506]/90 p-4`}>
                                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-red-200/80">Travée critique</div>
                                <div className="space-y-3">
                                    {highFixes.length === 0 ? (
                                        <div className="text-[12px] text-white/35">Aucun correctif haute priorité dans le top affiché.</div>
                                    ) : (
                                        highFixes.map((fix) => <FixCard key={fix.id} fix={fix} clientId={clientId} />)
                                    )}
                                </div>
                            </GeoPremiumCard>

                            <GeoPremiumCard className={`border ${PRIORITY_META.medium.border} bg-[#0b0904]/90 p-4`}>
                                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200/80">Travée vigilance</div>
                                <div className="space-y-3">
                                    {medFixes.length === 0 ? (
                                        <div className="text-[12px] text-white/35">Rien ici — bon signe ou données fragmentées.</div>
                                    ) : (
                                        medFixes.map((fix) => <FixCard key={fix.id} fix={fix} clientId={clientId} />)
                                    )}
                                </div>
                            </GeoPremiumCard>

                            <GeoPremiumCard className="border border-white/[0.07] bg-[#07080c]/95 p-4">
                                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">File résiduelle</div>
                                <div className="space-y-3">
                                    {restFixes.length === 0 ? (
                                        <div className="text-[12px] text-white/35">Pas d’autres éléments dans l’extrait.</div>
                                    ) : (
                                        restFixes.map((fix) => <FixCard key={fix.id} fix={fix} clientId={clientId} />)
                                    )}
                                </div>
                            </GeoPremiumCard>
                        </div>

                        <div className="mt-10 grid gap-6 xl:grid-cols-2">
                            <div>
                                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">Preuves d’audit (extraits)</div>
                                <div className="space-y-3">
                                    {auditEvidence.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-white/[0.1] p-6 text-[12px] text-white/35">
                                            Aucune preuve liée au dernier audit.
                                        </div>
                                    ) : (
                                        auditEvidence.map((issue) => <AuditSnippet key={issue.id} issue={issue} />)
                                    )}
                                </div>
                            </div>
                            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 text-[12px] leading-relaxed text-white/48">
                                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">Rappel</div>
                                <p className="mt-3">
                                    Assignation, résolution et fusions restent dans{' '}
                                    <Link href={links.geoOpportunities} className="font-semibold text-violet-300 hover:text-white">
                                        GEO Ops › Opportunités
                                    </Link>
                                    . Cette page ne fait qu’organiser la lecture côté AGENT.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
