'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import GeoCitationsView from './GeoCitationsView';
import GeoCompetitorsView from './GeoCompetitorsView';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { GeoKpiCard } from '../components/GeoPremium';

/* ─── Navigation anchors ─── */

const SECTIONS = [
    { id: 'sources', label: 'Sources & citations' },
    { id: 'concurrents', label: 'Concurrents' },
];

/* ─── Signal Command Header ─── */

function SignalCommandHeader({ client, citationsData, competitorsData }) {
    const coverage = citationsData?.summary?.citationCoveragePercent;
    const uniqueHosts = citationsData?.summary?.uniqueSourceHosts ?? 0;
    const confirmedCompetitors = competitorsData?.summary?.competitorMentions ?? 0;
    const substitutionRisk = competitorsData?.summary?.runsWithoutTargetButCompetitor ?? 0;

    const signalReading = useMemo(() => {
        if (!citationsData && !competitorsData) return null;
        const totalRuns = citationsData?.summary?.totalCompletedRuns || competitorsData?.summary?.totalCompletedRuns || 0;
        if (totalRuns === 0) return 'Aucune exécution, signaux en attente de données.';

        const parts = [];
        if (coverage != null) parts.push(`${coverage}% de couverture source`);
        if (uniqueHosts > 0) parts.push(`${uniqueHosts} domaine${uniqueHosts > 1 ? 's' : ''}`);
        if (confirmedCompetitors > 0) parts.push(`${confirmedCompetitors} concurrent${confirmedCompetitors > 1 ? 's' : ''} confirmé${confirmedCompetitors > 1 ? 's' : ''}`);
        if (substitutionRisk > 0) parts.push(`${substitutionRisk} risque${substitutionRisk > 1 ? 's' : ''} substitution`);
        return parts.length ? parts.join(' · ') : 'Exécutions terminées, analyse en cours.';
    }, [citationsData, competitorsData, coverage, uniqueHosts, confirmedCompetitors, substitutionRisk]);

    return (
        <div className="relative rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/30 before:to-transparent">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-lg font-bold tracking-[-0.02em] text-white/95">
                        Signaux
                    </h1>
                    <p className="text-[12px] text-white/40 mt-1 max-w-xl leading-snug truncate sm:whitespace-normal">
                        Visibilité observée pour {client?.client_name || 'ce client'}, avec sources, citations et paysage concurrentiel.
                    </p>
                    {signalReading && (
                        <p className="text-[11px] text-white/55 mt-2 font-medium">{signalReading}</p>
                    )}
                </div>

                <nav className="flex flex-wrap gap-1.5 shrink-0" aria-label="Sections signaux">
                    {SECTIONS.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-md border border-white/[0.08] text-white/45 hover:text-white/80 hover:border-white/15 bg-white/[0.02] transition-colors"
                        >
                            {s.label}
                        </a>
                    ))}
                </nav>
            </div>

            {/* Provenance interpretation — one contextual explanation, not decorative pills */}
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-4 text-[10px]">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-white/50 font-medium">Observé</span>
                            <span className="text-white/25">: vu dans les réponses IA</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            <span className="text-white/50 font-medium">Dérivé</span>
                            <span className="text-white/25">: calculé à partir des données observées</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Signal Summary Band ─── */

function SignalSummaryBand({ citationsData, competitorsData }) {
    const totalRuns = citationsData?.summary?.totalCompletedRuns || competitorsData?.summary?.totalCompletedRuns || 0;
    const coverage = citationsData?.summary?.citationCoveragePercent;
    const uniqueHosts = citationsData?.summary?.uniqueSourceHosts ?? 0;
    const confirmedCompetitors = competitorsData?.summary?.competitorMentions ?? 0;

    if (totalRuns === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GeoKpiCard label="Exécutions" value={totalRuns} accent="blue" />
            <GeoKpiCard label="Couverture source" value={coverage != null ? `${coverage}%` : null} accent="violet" />
            <GeoKpiCard label="Domaines uniques" value={uniqueHosts} accent="emerald" />
            <GeoKpiCard
                label="Concurrents confirmés"
                value={confirmedCompetitors}
                accent={confirmedCompetitors > 0 ? 'amber' : 'default'}
            />
        </div>
    );
}

/* ─── Main Page ─── */

export default function GeoSignalsView() {
    const searchParams = useSearchParams();
    const focus = searchParams.get('focus') || '';
    const { client } = useGeoClient();
    const { data: citationsData } = useGeoWorkspaceSlice('citations');
    const { data: competitorsData } = useGeoWorkspaceSlice('competitors');

    useEffect(() => {
        if (!focus) return;
        const el = document.getElementById(focus === 'competitors' ? 'concurrents' : focus);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [focus]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-5 p-4 md:p-6">
            <SignalCommandHeader
                client={client}
                citationsData={citationsData}
                competitorsData={competitorsData}
            />

            <SignalSummaryBand
                citationsData={citationsData}
                competitorsData={competitorsData}
            />

            <section id="sources" className="scroll-mt-20">
                <GeoCitationsView sharedData={citationsData} />
            </section>

            <section id="concurrents" className="scroll-mt-20 pt-2">
                <GeoCompetitorsView sharedData={competitorsData} />
            </section>
        </div>
    );
}
