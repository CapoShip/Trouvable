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

export default function AgentProtocolsPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-protocols');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const summary = data?.summary || {};
    const emptyState = data?.emptyState || (!data?.available ? {
        title: 'Protocoles AGENT indisponibles',
        description: 'Le dossier ne remonte pas encore de lecture exploitable sur les protocoles exposes.',
    } : null);

    return (
        <RealPageFrame
            eyebrow="AGENT Ops"
            title="Protocoles agent"
            subtitle={`Lecture reelle des signaux techniques exposes pour ${client?.client_name || 'ce mandat'} : protocoles, preuves et manques reels observables par un agent.`}
            actions={
                <>
                    {pageActionLink(`${baseHref}/agent/readiness`, 'Preparation agent')}
                    {pageActionLink(data?.links?.audit || `${baseHref}/dossier/audit`, 'Audit dossier')}
                    {pageActionLink(data?.links?.opportunities || `${baseHref}/geo/opportunities`, 'File d\'actions', 'primary')}
                </>
            }
            loading={loading}
            error={error}
            emptyState={emptyState}
            loadingMessage="Lecture des protocoles exposes et des correctifs reels issus du dernier audit."
        >
            <MetricGrid
                items={[
                    { id: 'score', label: 'Score protocoles', value: summary.globalScore ?? 'n.d.', detail: summary.globalStatus || 'Statut indisponible', tone: scoreTone(summary.globalScore) },
                    { id: 'coverage', label: 'Dimensions couvertes', value: `${summary.coveredDimensions ?? 0}/${summary.totalDimensions ?? 0}`, detail: 'Couvert = score >= 70', tone: (summary.coveredDimensions ?? 0) > 0 ? 'info' : 'neutral' },
                    { id: 'fixes', label: 'Correctifs ouverts', value: data?.topFixes?.length ?? 0, detail: 'Deblocages techniques identifies', tone: (data?.topFixes?.length ?? 0) > 0 ? 'warning' : 'neutral' },
                    { id: 'strengths', label: 'Protocoles couverts', value: data?.topStrengths?.length ?? 0, detail: 'Signaux deja observes', tone: (data?.topStrengths?.length ?? 0) > 0 ? 'ok' : 'neutral' },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
                <KeyValuePanel
                    title="Contexte protocoles"
                    subtitle="Fiabilite de lecture et fraicheur de l'echantillon courant."
                    entries={[
                        { label: 'Statut global', value: summary.globalStatus },
                        { label: 'Fiabilite', value: data?.reliability },
                        { label: 'Dernier audit', value: data?.freshness?.auditCreatedAt },
                        { label: 'Statut scan', value: data?.freshness?.scanStatus },
                    ]}
                />

                <AgentMessageList
                    title="Protocoles deja couverts"
                    subtitle="Dimensions techniques deja solides pour les agents."
                    items={data?.topStrengths || []}
                    emptyTitle="Aucun protocole solide n'est encore remonte."
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
                title="Dimensions protocoles"
                subtitle="Dimensionnement reel du sous-score protocoles, sans bonus ni statuts inventes."
                dimensions={data?.dimensions || []}
            />

            <AgentMessageList
                title="Correctifs protocoles"
                subtitle="Actions prioritaires pour rendre le mandat plus lisible et plus executable par les agents."
                items={data?.topFixes || []}
                emptyTitle="Aucun correctif protocole prioritaire."
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
