// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';

import { CommandHeader, CommandMetricCard, CommandPageShell } from '@/features/admin/dashboard/shared/components/command';
import { CommandTable } from '@/features/admin/dashboard/shared/components/command/CommandTable';
import { COMMAND_BUTTONS, cn } from '@/lib/tokens';
import CommandEmptyState from '@/features/admin/dashboard/shared/components/command/CommandEmptyState';
import { useGeoClient, useGeoWorkspaceSlice } from '@/features/admin/dashboard/shared/context/ClientContext';

function toneFromStatus(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('align')) return 'ok';
    if (normalized.includes('partiel') || normalized.includes('confirmer')) return 'warning';
    if (normalized.includes('ecart') || normalized.includes('incoher') || normalized.includes('manquant')) return 'critical';
    return 'neutral';
}

function chipClass(status) {
    const tone = toneFromStatus(status);
    if (tone === 'ok') return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
    if (tone === 'warning') return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
    if (tone === 'critical') return 'bg-rose-400/10 text-rose-400 border border-rose-400/20';
    return 'bg-white/5 text-white/50 border border-white/10';
}

export default function GeoConsistencyPage() {
    const { clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('consistency');

    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const seoBase = clientId ? `/admin/clients/${clientId}/seo` : '/admin/clients';
    const dimensions = data?.dimensions || [];
    const alignedCount = dimensions.filter((item) => toneFromStatus(item.status) === 'ok').length;
    const partialCount = dimensions.filter((item) => toneFromStatus(item.status) === 'warning').length;
    const contradictionCount = data?.criticalContradictions?.length || 0;

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="Fiabilite IA"
                    subtitle="Comparaison reelle entre les verites du dossier et les signaux structures exposes au dernier audit."
                    actions={(
                        <>
                            <Link href={`${geoBase}/schema`} className={COMMAND_BUTTONS.secondary}>Schema & entites</Link>
                            <Link href={`${seoBase}/health`} className={COMMAND_BUTTONS.secondary}>Sante SEO</Link>
                        </>
                    )}
                />
            )}
        >
            {loading ? (
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-8 text-[13px] text-white/55">Chargement de la lecture de coherence...</div>
            ) : error ? (
                <CommandEmptyState title="Lecture indisponible" description={error} />
            ) : data?.emptyState ? (
                <CommandEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <CommandMetricCard label="Etat global" value={data?.summary?.globalState || 'n.d.'} detail={data?.summary?.reliability || 'Fiabilite non exposee'} tone={toneFromStatus(data?.summary?.globalState)} />
                        <CommandMetricCard label="Incoherences majeures" value={contradictionCount} detail="Contradictions critiques observees" tone={contradictionCount > 0 ? 'critical' : 'neutral'} />
                        <CommandMetricCard label="Dimensions alignees" value={alignedCount} detail={`${dimensions.length} dimensions comparees`} tone={alignedCount > 0 ? 'ok' : 'neutral'} />
                        <CommandMetricCard label="Points a confirmer" value={partialCount} detail={data?.freshness?.audit?.value || 'Audit inconnu'} tone={partialCount > 0 ? 'warning' : 'neutral'} />
                    </div>

                    <div className="mt-6">
                        <div className="mb-4 text-[14px] font-semibold text-white/90">Divergences detectees</div>
                        <CommandTable
                            headers={['Dimension', 'Etat observe', 'Preuve / detail', 'Statut']}
                            rows={dimensions.map((item) => [
                                <span className="font-medium text-white/80">{item.label}</span>,
                                <span className="text-[12px] text-white/70">{item.evidence || item.detail || 'Aucun detail supplementaire.'}</span>,
                                <span className="text-[12px] text-white/60">
                                    {(item.contradictions || item.gaps || item.missingFields || []).slice(0, 2).join(' · ') || item.reliability || 'n.d.'}
                                </span>,
                                <span className={cn('px-2 py-0.5 rounded text-[10px]', chipClass(item.status))}>{item.status || 'n.d.'}</span>,
                            ])}
                        />
                    </div>

                    {contradictionCount > 0 ? (
                        <div className="mt-6 rounded-[22px] border border-rose-400/20 bg-rose-400/[0.05] p-5">
                            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-rose-200/80">Contradictions critiques</div>
                            <div className="mt-3 space-y-2">
                                {(data.criticalContradictions || []).map((item, index) => (
                                    <div key={`${item.label}-${index}`} className="rounded-xl border border-rose-400/15 bg-black/20 p-3 text-[12px] text-rose-100/85">
                                        <div className="font-semibold">{item.label}</div>
                                        <div className="mt-1 text-rose-100/65">{item.detail || item.evidence || 'Aucun detail supplementaire.'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {(data.recommendations || []).length > 0 ? (
                        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {data.recommendations.map((item, index) => (
                                <div key={`${item.title}-${index}`} className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
                                    <div className="text-[13px] font-semibold text-white/92">{item.title}</div>
                                    <div className="mt-2 text-[12px] leading-relaxed text-white/60">{item.rationale || item.description || 'Aucune recommandation detaillee.'}</div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </>
            )}
        </CommandPageShell>
    );
}
