'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import {
    GenericTablePanel,
    KeyValuePanel,
    MetricGrid,
    RealPageFrame,
    pageActionLink,
} from '@/components/zip-pages/shared/real-page';
import { AgentChip, AgentMessageList } from '@/components/zip-pages/agent/shared';

export default function AgentCompetitorsPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-competitors');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const summary = data?.summary || {};
    const emptyState = data?.emptyState || (!data?.available ? {
        title: 'Comparatif AGENT indisponible',
        description: 'Aucun run exploitable ne permet encore de lire la pression concurrentielle du dossier.',
    } : null);

    return (
        <RealPageFrame
            eyebrow="AGENT Ops"
            title="Comparatif agent"
            subtitle={`Lecture concurrentielle reelle pour ${client?.client_name || 'ce mandat'} : concurrents cites, prompts perdus et mentions generiques sans aucune simulation.`}
            actions={
                <>
                    {pageActionLink(data?.links?.prompts || `${baseHref}/geo/prompts`, 'Requetes GEO')}
                    {pageActionLink(data?.links?.runs || `${baseHref}/geo/runs`, 'Runs GEO')}
                    {pageActionLink(data?.links?.competitors || `${baseHref}/geo/competitors`, 'Carte concurrents', 'primary')}
                </>
            }
            loading={loading}
            error={error}
            emptyState={emptyState}
            loadingMessage="Lecture des concurrents reels observes dans les reponses IA du dossier courant."
        >
            <MetricGrid
                items={[
                    { id: 'runs', label: 'Runs completes', value: summary.totalCompletedRuns ?? 0, detail: 'Base d\'observation', tone: (summary.totalCompletedRuns ?? 0) > 0 ? 'info' : 'neutral' },
                    { id: 'mentions', label: 'Mentions concurrents', value: summary.competitorMentions ?? 0, detail: `${summary.recommendedCompetitors ?? 0} concurrents recommandes`, tone: (summary.competitorMentions ?? 0) > 0 ? 'warning' : 'neutral' },
                    { id: 'pressure', label: 'Pression / run', value: summary.normalizedPressurePerRun != null ? summary.normalizedPressurePerRun.toFixed(1) : 'n.d.', detail: 'Indicateur normalise', tone: 'info' },
                    { id: 'lost', label: 'Runs sans nous', value: summary.runsWithoutTargetButCompetitor ?? 0, detail: 'Substitution observee', tone: (summary.runsWithoutTargetButCompetitor ?? 0) > 0 ? 'critical' : 'neutral' },
                ]}
            />

            {summary.sampleSizeWarning ? (
                <CommandChartCard title="Alerte echantillon" subtitle="Lecture honnete de la taille de base utilisee pour le comparatif.">
                    <div className="rounded-[18px] border border-amber-300/20 bg-amber-400/10 p-4 text-[12px] leading-relaxed text-amber-100/90">
                        {summary.sampleSizeWarning}
                    </div>
                </CommandChartCard>
            ) : null}

            <KeyValuePanel
                title="Cadre concurrentiel"
                subtitle="Synthese du comparatif observe sur les runs du mandat."
                entries={[
                    { label: 'Mentions cible', value: summary.targetMentions },
                    { label: 'Mentions concurrents', value: summary.competitorMentions },
                    { label: 'Concurrents recommandes', value: summary.recommendedCompetitors },
                    { label: 'Score pression', value: summary.competitorPressureScore },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.95fr]">
                <GenericTablePanel
                    title="Top concurrents"
                    subtitle="Concurrents reellement cites dans les reponses IA du dossier."
                    rows={data?.topCompetitors || []}
                    columns={[
                        { key: 'name', label: 'Concurrent' },
                        { key: 'count', label: 'Mentions' },
                    ]}
                />

                <AgentMessageList
                    title="Prompts sous pression"
                    subtitle="Prompts ou un concurrent apparait alors que la cible manque."
                    items={data?.promptsLost || []}
                    emptyTitle="Aucun prompt perdu n'a ete remonte."
                    renderItem={(item) => (
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-white/92">{item.queryText}</span>
                                {item.severity ? <AgentChip tone={item.severity === 'high' ? 'critical' : item.severity === 'medium' ? 'warning' : 'neutral'}>{item.severity}</AgentChip> : null}
                            </div>
                            <div className="text-[12px] text-white/60">{item.category || 'categorie'} · {item.competitorMentions ?? 0} mention(s) · dernier run {item.latestRunAt || 'n.d.'}</div>
                        </div>
                    )}
                />
            </div>

            <AgentMessageList
                title="Mentions generiques"
                subtitle="Noms detectes mais pas encore qualifies comme concurrents confirmes."
                items={data?.genericMentions || []}
                emptyTitle="Aucune mention generique non confirmee."
                renderItem={(item) => (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-white/92">{item.name}</span>
                        <AgentChip>{item.count ?? 0} mention(s)</AgentChip>
                    </div>
                )}
            />
        </RealPageFrame>
    );
}
