'use client';

import Link from 'next/link';

import { useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    DossierEmptyState,
    DossierErrorState,
    DossierFieldCard,
    DossierHero,
    DossierLoadingState,
    DossierPageShell,
    DossierQuickLinkCard,
    DossierSectionHeading,
    DossierSummaryCard,
    DossierTimelineItem,
    connectorStatusLabel,
} from './DossierViewShared';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

function ConnectorPreviewCard({ item }) {
    return (
        <Link href={item.href} className="block">
            <div className="geo-card border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4 h-full hover:border-white/[0.12] transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold text-white/90">{item.label}</div>
                    <ReliabilityPill value={item.reliability} />
                </div>
                <div className="text-[11px] text-white/40 mt-2 leading-relaxed">{item.detail}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/25 mt-3">
                    {connectorStatusLabel(item.status)}
                </div>
            </div>
        </Link>
    );
}

function QuickLinksSection({ title, items }) {
    if (!items?.length) return null;

    return (
        <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/25">{title}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((item) => (
                    <DossierQuickLinkCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

export default function DossierOverviewView() {
    const { data, loading, error } = useGeoWorkspaceSlice('dossier');

    if (loading) {
        return <DossierLoadingState label="Chargement du dossier partagé…" />;
    }

    if (error) {
        return <DossierErrorState message={error} />;
    }

    if (!data) {
        return (
            <div className="p-5 md:p-7 max-w-[1600px] mx-auto">
                <DossierEmptyState
                    title="Dossier partagé indisponible"
                    description="La synthèse transverse du mandat n'a pas pu être chargée proprement."
                />
            </div>
        );
    }

    return (
        <DossierPageShell>
            <DossierHero
                header={data.header}
                primaryAction={<Link href="./dossier/activity" className="geo-btn geo-btn-pri text-[11px] py-1.5 px-3.5">Activité</Link>}
                secondaryAction={<Link href="./dossier/connectors" className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">Connecteurs</Link>}
            />

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Dossier partagé"
                    title="Fondations mandatées"
                    subtitle="Socle client, territoire, offre et statut de publication visibles sans dupliquer les écrans SEO ou GEO spécialisés."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {data.identityCards.map((item) => (
                        <DossierFieldCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Lecture opérateur"
                    title="Trois angles clairs"
                    subtitle="Le dossier partagé sert de hub et renvoie ensuite vers SEO Ops et GEO Ops pour le détail spécialisé."
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {data.summaryCards.map((item) => (
                        <DossierSummaryCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Cadence"
                    title="Fraîcheur du mandat"
                    subtitle="Une lecture transverse de ce qui a vraiment bougé : audit, moteur GEO, activité opérateur."
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {data.freshnessCards.map((item) => (
                        <DossierFieldCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
                <div className="space-y-3">
                    <DossierSectionHeading
                        eyebrow="Priorités"
                        title="Actions ouvertes"
                        subtitle={data.actions.staleCount > 0
                            ? `${data.actions.staleCount} action(s) remontent d'un audit antérieur et méritent une revue.`
                            : "File d'actions actuellement visible sans artifices."}
                        action={<Link href="./opportunities" className="text-[11px] font-semibold text-[#7b8fff]/70 hover:text-[#7b8fff]">Voir la file →</Link>}
                    />
                    {data.actions.items.length > 0 ? data.actions.items.map((item) => (
                        <DossierTimelineItem key={item.id} item={item} />
                    )) : <DossierEmptyState {...data.actions.emptyState} />}
                </div>

                <div className="space-y-3">
                    <DossierSectionHeading
                        eyebrow="Trace"
                        title="Activité récente"
                        subtitle="Audits, automations et actions partageables visibles depuis le Dossier sans interprétation abusive."
                        action={<Link href="./dossier/activity" className="text-[11px] font-semibold text-[#7b8fff]/70 hover:text-[#7b8fff]">Ouvrir le journal →</Link>}
                    />
                    {data.activity.items.length > 0 ? data.activity.items.map((item) => (
                        <DossierTimelineItem key={item.id} item={item} />
                    )) : <DossierEmptyState {...data.activity.emptyState} />}
                </div>
            </div>

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Sources"
                    title="Connecteurs stratégiques"
                    subtitle="État synthétique des trois sources transverses suivies pour ce mandat."
                    action={<Link href="./dossier/connectors" className="text-[11px] font-semibold text-[#7b8fff]/70 hover:text-[#7b8fff]">Voir le détail →</Link>}
                />
                {data.connectors.preview.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {data.connectors.preview.map((item) => (
                            <ConnectorPreviewCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <DossierEmptyState {...data.connectors.emptyState} />
                )}
            </div>

            <div className="space-y-4">
                <DossierSectionHeading
                    eyebrow="Navigation"
                    title="Accès rapides"
                    subtitle="Passer du Dossier partagé aux espaces SEO Ops et GEO Ops sans dupliquer leur détail ici."
                />
                <QuickLinksSection title="Dossier partagé" items={data.quickLinks.shared} />
                <QuickLinksSection title="SEO Ops" items={data.quickLinks.seo} />
                <QuickLinksSection title="GEO Ops" items={data.quickLinks.geo} />
            </div>
        </DossierPageShell>
    );
}