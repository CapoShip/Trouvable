'use client';

import Link from 'next/link';

import { useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    DossierConnectorCard,
    DossierEmptyState,
    DossierErrorState,
    DossierHero,
    DossierLoadingState,
    DossierPageShell,
    DossierQuickLinkCard,
    DossierSectionHeading,
    DossierSummaryCard,
} from './DossierViewShared';

export default function DossierConnectorsView() {
    const { data, loading, error } = useGeoWorkspaceSlice('dossier-connectors');

    if (loading) {
        return <DossierLoadingState label="Chargement des connecteurs du dossier…" />;
    }

    if (error) {
        return <DossierErrorState message={error} />;
    }

    if (!data) {
        return (
            <div className="p-5 md:p-7 max-w-[1600px] mx-auto">
                <DossierEmptyState
                    title="Connecteurs indisponibles"
                    description="L'état transverse des sources du mandat n'a pas pu être chargé."
                />
            </div>
        );
    }

    const quickLinks = [
        ...(data.quickLinks?.shared || []),
        ...(data.quickLinks?.seo || []),
        ...(data.quickLinks?.geo || []),
    ];

    return (
        <DossierPageShell>
            <DossierHero
                header={data.header}
                primaryAction={<Link href="../dossier" className="geo-btn geo-btn-pri text-[11px] py-1.5 px-3.5">Retour dossier</Link>}
                secondaryAction={<Link href="../continuous" className="geo-btn geo-btn-ghost text-[11px] py-1.5 px-3.5">Suivi continu</Link>}
            />

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Sources mandatées"
                    title="État des connecteurs"
                    subtitle="GA4, Search Console et Intelligence communautaire lus comme des briques partagées du mandat, sans présenter de faux signal si la source manque."
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {data.summaryCards.map((item) => (
                        <DossierSummaryCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <DossierSectionHeading
                    eyebrow="Détail"
                    title="Connecteurs suivis"
                    subtitle="Chaque carte expose une seule fiabilité, les derniers signaux observés et les incidents techniques récents si présents."
                />
                {data.items.length > 0 ? (
                    <div className="space-y-4">
                        {data.items.map((item) => (
                            <DossierConnectorCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <DossierEmptyState {...data.emptyState} />
                )}
            </div>

            {quickLinks.length > 0 ? (
                <div className="space-y-3">
                    <DossierSectionHeading
                        eyebrow="Routage"
                        title="Continuer l’analyse"
                        subtitle="Les cartes ci-dessus pointent déjà vers leurs sources. Cette section garde aussi les accès rapides du dossier pour passer au bon espace."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {quickLinks.map((item) => (
                            <DossierQuickLinkCard key={`${item.section}-${item.id}`} item={item} />
                        ))}
                    </div>
                </div>
            ) : null}
        </DossierPageShell>
    );
}