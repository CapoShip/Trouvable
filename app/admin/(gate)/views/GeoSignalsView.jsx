'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import GeoCitationsView from './GeoCitationsView';
import GeoCompetitorsView from './GeoCompetitorsView';
import { useGeoClient } from '../context/ClientContext';

const SECTIONS = [
    { id: 'citations', label: 'Citations & sources' },
    { id: 'concurrents', label: 'Concurrents' },
];

export default function GeoSignalsView() {
    const searchParams = useSearchParams();
    const focus = searchParams.get('focus') || '';
    const { client } = useGeoClient();

    useEffect(() => {
        if (!focus) return;
        const el = document.getElementById(focus === 'competitors' ? 'concurrents' : focus);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [focus]);

    const subtitle = useMemo(
        () => `Visibilité observée (sources + paysage concurrentiel) pour ${client?.client_name || 'ce client'}.`,
        [client?.client_name],
    );

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-2 border-b border-white/[0.07] bg-[#0a0a0a]/95 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-bold tracking-[-0.02em] text-white/95">Signaux</h1>
                        <p className="text-[11px] text-white/40 mt-0.5 max-w-xl leading-snug">{subtitle}</p>
                    </div>
                    <nav className="flex flex-wrap gap-1.5" aria-label="Sections signaux">
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
            </div>

            <section id="citations" className="scroll-mt-28 border-t border-transparent">
                <GeoCitationsView />
            </section>
            <section id="concurrents" className="scroll-mt-28 border-t border-white/[0.06] pt-2">
                <GeoCompetitorsView />
            </section>
        </div>
    );
}
