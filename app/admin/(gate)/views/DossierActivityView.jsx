'use client';

import Link from 'next/link';

import { useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    DossierEmptyState,
    DossierErrorState,
    DossierHero,
    DossierLoadingState,
    DossierPageShell,
    DossierQuickLinkCard,
    DossierSectionHeading,
    DossierSummaryCard,
    DossierTimelineItem,
} from './DossierViewShared';

export default function DossierActivityView() {
    const { data, loading, error } = useGeoWorkspaceSlice('dossier-activity');

    if (loading) {
        return <DossierLoadingState label="Chargement de l’activité du dossier…" />;
    }

    if (error) {
        return <DossierErrorState message={error} />;
    }

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

    return (
        <DossierPageShell>
            <DossierHero
                header={data.header}
                primaryAction={<Link href="../dossier" className="geo-btn geo-btn-pri text-[11px] py-1.5 px-3.5">Retour dossier</Link>}
                secondaryAction={<Link href="../continuous" className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">Suivi continu</Link>}
            />

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Journal transverse"
                    title="Activité du mandat"
                    subtitle="Les événements affichés ici proviennent uniquement des audits, automations, collectes et actions tracées dans Trouvable."
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {data.summaryCards.map((item) => (
                        <DossierSummaryCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Flux"
                    title="Événements récents"
                    subtitle="Une lecture partageable qui mélange actions humaines et système sans attribuer à l'IA une vérité qu'elle n'a pas."
                />
                {data.items.length > 0 ? (
                    <div className="space-y-3">
                        {data.items.map((item) => (
                            <DossierTimelineItem key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <DossierEmptyState {...data.emptyState} />
                )}
            </div>

            {quickLinks.length > 0 ? (
                <div className="space-y-3">
                    <DossierSectionHeading
                        eyebrow="Liens utiles"
                        title="Rejoindre le bon espace"
                        subtitle="Le journal transverse renvoie ensuite vers les écrans spécialisés pour traiter le problème au bon niveau."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {quickLinks.map((item) => (
                            <DossierQuickLinkCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            ) : null}
        </DossierPageShell>
    );
}