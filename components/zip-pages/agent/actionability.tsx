'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';
import {
    KeyValuePanel,
    MetricGrid,
    RealPageFrame,
    pageActionLink,
} from '@/components/zip-pages/shared/real-page';
import { AgentChip, AgentDimensionGrid, AgentMessageList } from '@/components/zip-pages/agent/shared';

function scoreTone(score) {
    if (score == null) return 'neutral';
    if (score >= 70) return 'ok';
    if (score >= 40) return 'warning';
    return 'critical';
}

export default function AgentActionabilityPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-actionability');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const summary = data?.summary || {};
    const dimensions = data?.dimensions || [];
    const coveredDimensions = dimensions.filter((item) => Number(item?.score) >= 70).length;
    const emptyState = data?.emptyState || (!data?.available ? {
        title: 'Actionnabilite AGENT indisponible',
        description: 'Le backend ne remonte pas encore de lecture actionnable pour ce dossier.',
    } : null);

    return (
        <RealPageFrame
            eyebrow="AGENT Ops"
            title="Actionnabilite agent"
            subtitle={`Lecture reelle de l'actionnabilite pour ${client?.client_name || 'ce mandat'} : dimensions, forces et correctifs derives de l'audit du dossier courant.`}
            actions={
                <>
                    {pageActionLink(data?.links?.profile || `${baseHref}/dossier`, 'Dossier client')}
                    {pageActionLink(data?.links?.audit || `${baseHref}/dossier/audit`, 'Audit dossier')}
                    {pageActionLink(data?.links?.opportunities || `${baseHref}/geo/opportunities`, 'File d\'actions', 'primary')}
                </>
            }
            loading={loading}
            error={error}
            emptyState={emptyState}
            loadingMessage="Calcul des dimensions d'actionnabilite et des actions prioritaires du dossier."
        >
            <MetricGrid
                items={[
                    { id: 'score', label: 'Score global', value: summary.globalScore ?? 'n.d.', detail: summary.globalStatus || 'Statut indisponible', tone: scoreTone(summary.globalScore) },
                    { id: 'covered', label: 'Dimensions couvertes', value: coveredDimensions, detail: `sur ${dimensions.length} dimensions`, tone: coveredDimensions > 0 ? 'info' : 'neutral' },
                    { id: 'fixes', label: 'Correctifs prioritaires', value: data?.topFixes?.length ?? 0, detail: 'Deblocages reels identifies', tone: (data?.topFixes?.length ?? 0) > 0 ? 'warning' : 'neutral' },
                    { id: 'strengths', label: 'Forces observees', value: data?.topStrengths?.length ?? 0, detail: 'Signaux deja couverts', tone: (data?.topStrengths?.length ?? 0) > 0 ? 'ok' : 'neutral' },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
                <KeyValuePanel
                    title="Cadre d'analyse"
                    subtitle="Synthese de la fiabilite et de la fraicheur du rapport d'actionnabilite."
                    entries={[
                        { label: 'Statut global', value: summary.globalStatus },
                        { label: 'Fiabilite', value: data?.reliability },
                        { label: 'Dernier audit', value: data?.freshness?.auditCreatedAt },
                        { label: 'Statut scan', value: data?.freshness?.scanStatus },
                    ]}
                />

                <AgentMessageList
                    title="Forces detectees"
                    subtitle="Extraits reels des dimensions deja solides."
                    items={data?.topStrengths || []}
                    emptyTitle="Aucune force solide n'a encore ete qualifiee."
                    renderItem={(item) => (
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-white/92">{item.message}</span>
                                {item.score != null ? <AgentChip tone="ok">{item.score}/100</AgentChip> : null}
                            </div>
                            {item.dimensionLabel ? <div className="text-[12px] text-white/58">{item.dimensionLabel}</div> : null}
                        </div>
                    )}
                />
            </div>

            <AgentDimensionGrid
                title="Dimensions d'actionnabilite"
                subtitle="Grille branchee sur les vraies dimensions calculees par le moteur agent-actionability."
                dimensions={dimensions}
            />

            <AgentMessageList
                title="Correctifs prioritaires"
                subtitle="Actions derivees des dimensions faibles ou bloquees, sans aucune priorisation factice."
                items={data?.topFixes || []}
                emptyTitle="Aucun correctif prioritaire ouvert."
                renderItem={(item) => (
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-white/92">{item.message}</span>
                            {item.priority ? <AgentChip tone={item.priority === 'high' ? 'critical' : item.priority === 'medium' ? 'warning' : 'neutral'}>{item.priority}</AgentChip> : null}
                        </div>
                        {item.dimensionLabel ? <div className="text-[12px] text-white/58">{item.dimensionLabel}</div> : null}
                    </div>
                )}
            />
        </RealPageFrame>
    );
}
