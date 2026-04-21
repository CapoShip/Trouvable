'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Orbit, RadioTower } from 'lucide-react';

import GeoCitationsView from './GeoCitationsView';
import GeoCompetitorsView from './GeoCompetitorsView';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

const SECTIONS = [
    { id: 'sources', label: 'Sources & citations' },
    { id: 'concurrents', label: 'Concurrents' },
];

function ObservatoryDial({ label, value, hint, tone = 'neutral' }) {
    const ring =
        tone === 'hot'
            ? 'from-rose-400/30 via-amber-300/15 to-emerald-300/10'
            : tone === 'cool'
                ? 'from-sky-400/25 via-indigo-400/15 to-transparent'
                : 'from-white/15 via-white/5 to-transparent';
    return (
        <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#07080c] p-4">
            <div className={`pointer-events-none absolute -inset-1 rounded-[22px] bg-gradient-to-br opacity-80 blur-xl ${ring}`} />
            <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-white/95">{value ?? '—'}</div>
                {hint ? <div className="mt-1 text-[11px] text-white/42">{hint}</div> : null}
            </div>
        </div>
    );
}

function SignalsHero({ client, citationsData, competitorsData }) {
    const coverage = citationsData?.summary?.citationCoveragePercent;
    const uniqueHosts = citationsData?.summary?.uniqueSourceHosts ?? 0;
    const confirmedCompetitors = competitorsData?.summary?.competitorMentions ?? 0;
    const substitutionRisk = competitorsData?.summary?.runsWithoutTargetButCompetitor ?? 0;
    const totalRuns = citationsData?.summary?.totalCompletedRuns || competitorsData?.summary?.totalCompletedRuns || 0;

    const signalReading = useMemo(() => {
        if (!citationsData && !competitorsData) return null;
        if (totalRuns === 0) return 'Aucune exécution, signaux en attente de données.';
        const parts = [];
        if (coverage != null) parts.push(`${coverage}% de couverture source`);
        if (uniqueHosts > 0) parts.push(`${uniqueHosts} domaine${uniqueHosts > 1 ? 's' : ''}`);
        if (confirmedCompetitors > 0) parts.push(`${confirmedCompetitors} concurrent${confirmedCompetitors > 1 ? 's' : ''} confirmé${confirmedCompetitors > 1 ? 's' : ''}`);
        if (substitutionRisk > 0) parts.push(`${substitutionRisk} risque${substitutionRisk > 1 ? 's' : ''} substitution`);
        return parts.length ? parts.join(' · ') : 'Exécutions terminées, analyse en cours.';
    }, [citationsData, competitorsData, coverage, uniqueHosts, confirmedCompetitors, substitutionRisk, totalRuns]);

    return (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-[28px] border border-white/[0.07] bg-[linear-gradient(135deg,#0a0c12_0%,#05060a_55%,#07060d_100%)] p-6 sm:p-8">
                <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/80">
                        <RadioTower className="h-4 w-4" />
                        Observatoire GEO
                    </div>
                    <h1 className="mt-5 text-[clamp(1.6rem,3.2vw,2.3rem)] font-semibold tracking-[-0.05em] text-white">
                        Signaux convergents
                    </h1>
                    <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/48">
                        Lecture radar pour {client?.client_name || 'ce mandat'} : citations d’abord, pression concurrentielle ensuite — deux plans distincts.
                    </p>
                    {signalReading ? (
                        <p className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[12px] font-medium leading-relaxed text-white/68">
                            {signalReading}
                        </p>
                    ) : null}
                </div>
                <nav className="mt-8 flex flex-wrap gap-2" aria-label="Sections signaux">
                    {SECTIONS.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="rounded-full border border-white/[0.08] bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white/55 transition-colors hover:border-violet-400/35 hover:text-white"
                        >
                            {s.label}
                        </a>
                    ))}
                </nav>
            </div>
            {totalRuns > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                    <ObservatoryDial label="Exécutions" value={totalRuns} hint="Runs terminés côté moteurs" />
                    <ObservatoryDial
                        label="Couverture source"
                        value={coverage != null ? `${coverage}%` : 'n.d.'}
                        hint="Liens observés dans les réponses"
                        tone="cool"
                    />
                    <ObservatoryDial label="Domaines distincts" value={uniqueHosts} hint="Hôtes uniques cités" />
                    <ObservatoryDial
                        label="Concurrents actifs"
                        value={confirmedCompetitors}
                        hint="Mentions confirmées"
                        tone={confirmedCompetitors > 0 ? 'hot' : 'neutral'}
                    />
                </div>
            ) : (
                <div className="flex flex-col justify-center rounded-[28px] border border-dashed border-white/[0.12] bg-white/[0.02] p-8 text-center text-[13px] text-white/45">
                    <Orbit className="mx-auto mb-3 h-8 w-8 text-white/25" />
                    Les indicateurs détaillés apparaissent dès qu’au moins une exécution est disponible.
                </div>
            )}
        </section>
    );
}

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
        <div className="mx-auto max-w-[1840px] space-y-10 px-4 py-8 md:px-8 md:py-10 pb-20">
            <SignalsHero client={client} citationsData={citationsData} competitorsData={competitorsData} />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:gap-10">
                <section
                    id="sources"
                    className="scroll-mt-24 rounded-[32px] border border-cyan-400/15 bg-[linear-gradient(180deg,#06080f_0%,#040509_100%)] p-1 shadow-[0_32px_100px_rgba(0,0,0,0.55)]"
                >
                    <div className="rounded-[30px] border border-white/[0.05] bg-[#070910]/95 p-4 sm:p-6">
                        <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">Plan A</div>
                                <div className="mt-1 text-lg font-semibold text-white/95">Preuves & citations</div>
                                <p className="mt-2 max-w-prose text-[12px] text-white/45">
                                    Bloc principal : la preuve doit être lisible avant le paysage concurrentiel.
                                </p>
                            </div>
                        </div>
                        <GeoCitationsView sharedData={citationsData} />
                    </div>
                </section>

                <section
                    id="concurrents"
                    className="scroll-mt-24 rounded-[32px] border border-amber-400/18 bg-[#090705]/90 p-4 sm:p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)]"
                >
                    <div className="mb-5 border-b border-white/[0.07] pb-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/70">Plan B</div>
                        <div className="mt-1 text-lg font-semibold text-white/95">Pression concurrentielle</div>
                        <p className="mt-2 text-[12px] text-white/45">
                            Colonne plus étroite : lecture comparée des mentions sans absorber tout l’écran.
                        </p>
                    </div>
                    <GeoCompetitorsView sharedData={competitorsData} />
                </section>
            </div>
        </div>
    );
}
