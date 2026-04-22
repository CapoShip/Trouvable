'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import {
    KeyValuePanel,
    MetricGrid,
    RealPageFrame,
    pageActionLink,
} from '@/components/zip-pages/shared/real-page';
import { AgentChip, AgentMessageList } from '@/components/zip-pages/agent/shared';

export default function AgentFixesPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-fixes');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const summary = data?.summary || {};

    return (
        <RealPageFrame
            eyebrow="AGENT Ops"
            title="Correctifs agent"
            subtitle={`File de remediation reelle pour ${client?.client_name || 'ce mandat'} : top correctifs, preuves d'audit et backlog ouvert du dossier courant.`}
            actions={
                <>
                    {pageActionLink(data?.links?.geoOpportunities || `${baseHref}/geo/opportunities`, 'File GEO complete', 'primary')}
                </>
            }
            loading={loading}
            error={error}
            emptyState={data?.emptyState || null}
            loadingMessage="Assemblage du backlog d'opportunites et des preuves d'audit liees a AGENT."
        >
            <MetricGrid
                items={[
                    { id: 'open', label: 'Correctifs ouverts', value: summary.open ?? 0, detail: 'File active', tone: (summary.open ?? 0) > 0 ? 'warning' : 'neutral' },
                    { id: 'high', label: 'Haute priorite', value: data?.byPriority?.high ?? 0, detail: 'A traiter rapidement', tone: (data?.byPriority?.high ?? 0) > 0 ? 'critical' : 'neutral' },
                    { id: 'progress', label: 'En cours', value: summary.inProgress ?? 0, detail: 'Actions engagees', tone: (summary.inProgress ?? 0) > 0 ? 'info' : 'neutral' },
                    { id: 'review', label: 'File revue', value: summary.reviewQueueCount ?? 0, detail: `${summary.remediationDraftCount ?? 0} draft(s)`, tone: (summary.reviewQueueCount ?? 0) > 0 ? 'warning' : 'neutral' },
                ]}
            />

            {data?.staleWarning?.message ? (
                <CommandChartCard title="Avertissement de fraicheur" subtitle="Le slice signale un retard ou une anciennete de certaines preuves.">
                    <div className="rounded-[18px] border border-amber-300/20 bg-amber-400/10 p-4 text-[12px] leading-relaxed text-amber-100/90">
                        {data.staleWarning.message}
                    </div>
                </CommandChartCard>
            ) : null}

            <KeyValuePanel
                title="Cadre backlog"
                subtitle="Synthese de la file d'actions sous-jacente."
                entries={[
                    { label: 'Haute priorite ouverte', value: summary.highPriorityOpen },
                    { label: 'Merges en attente', value: summary.pendingMergeCount },
                    { label: 'Drafts remediation', value: summary.remediationDraftCount },
                    { label: 'File revue', value: summary.reviewQueueCount },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.95fr]">
                <AgentMessageList
                    title="Top correctifs"
                    subtitle="Extrait priorise de la vraie file d'actions GEO liee au dossier."
                    items={data?.topFixes || []}
                    emptyTitle="Aucun correctif ouvert dans l'extrait courant."
                    renderItem={(item) => (
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-white/92">{item.title}</span>
                                {item.priority ? <AgentChip tone={item.priority === 'high' ? 'critical' : item.priority === 'medium' ? 'warning' : 'neutral'}>{item.priority}</AgentChip> : null}
                                {item.status ? <AgentChip>{item.status}</AgentChip> : null}
                            </div>
                            {item.description ? <div className="text-[12px] leading-relaxed text-white/60">{item.description}</div> : null}
                            <div className="text-[11px] text-white/42">{item.category || 'categorie'} · {item.created_at || 'date inconnue'}</div>
                        </div>
                    )}
                />

                <AgentMessageList
                    title="Preuves d'audit"
                    subtitle="Extraits reels relies au backlog agent, sans aucun log de demonstration."
                    items={data?.auditEvidence || []}
                    emptyTitle="Aucune preuve d'audit n'est rattachee a l'extrait courant."
                    renderItem={(item) => (
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-white/92">{item.title}</span>
                                {item.priority ? <AgentChip tone={item.priority === 'high' ? 'critical' : item.priority === 'medium' ? 'warning' : 'neutral'}>{item.priority}</AgentChip> : null}
                            </div>
                            {item.evidence_summary ? <div className="text-[12px] leading-relaxed text-white/60">{item.evidence_summary}</div> : null}
                            {item.recommended_fix ? <div className="text-[11px] text-emerald-100/80">Piste : {item.recommended_fix}</div> : null}
                        </div>
                    )}
                />
            </div>
        </RealPageFrame>
    );
}
