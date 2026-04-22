'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { KeyValuePanel, MetricGrid, RealPageFrame, pageActionLink } from '@/components/zip-pages/shared/real-page';
import { AgentChip, AgentDimensionGrid, AgentMessageList } from '@/components/zip-pages/agent/shared';

const SUBSCORE_LABELS = {
    visibility: 'Visibilite',
    readiness: 'Preparation',
    actionability: 'Actionnabilite',
    advanced_protocols: 'Protocoles',
};

export default function AgentOverviewPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent');
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const score = data?.score || null;
    const snapshot = data?.snapshot || null;
    const subscores = score
        ? Object.values(score.subscores || {}).map((entry) => {
            const item = (entry || {}) as any;
            return {
                key: item.key,
                score: item.score,
                status: item.status,
                weight: item.weight,
                signalLabel: item.signalLabel,
                evidence: item.evidence,
                gaps: item.gaps,
                label: SUBSCORE_LABELS[item.key] || item.key || 'Sous-score',
                summary: item.reason || `${item.reliability || 'Fiabilite indisponible'}${item.provisional ? ' · provisoire' : ''}`,
            };
        })
        : [];

    return (
        <RealPageFrame eyebrow="AGENT Ops" title="Vue AGENT" subtitle={`Lecture composite AGENT pour ${client?.client_name || 'ce mandat'} : score calcule a la volee, sous-scores reels et file de remediation liee au dossier courant.`} actions={<>{pageActionLink(data?.links?.visibility || `${baseHref}/agent/visibility`, 'Visibilite agent')}{pageActionLink(data?.links?.readiness || `${baseHref}/agent/readiness`, 'Preparation agent')}{pageActionLink(data?.links?.fixes || `${baseHref}/agent/fixes`, 'Correctifs agent', 'primary')}</>} loading={loading} error={error} emptyState={data?.emptyState || null} loadingMessage="Calcul du score AGENT et lecture des sous-scores vivants a partir des slices reelles du mandat.">
            <MetricGrid items={[{ id: 'score', label: 'Score AGENT', value: score?.agent_score ?? 'n.d.', detail: score?.verdict || 'Verdict indisponible', tone: score?.agent_score != null ? 'info' : 'neutral' }, { id: 'runs', label: 'Runs completes', value: snapshot?.completedRunsTotal ?? 0, detail: snapshot?.lastRunAt || 'Aucun run observe', tone: snapshot?.completedRunsTotal > 0 ? 'ok' : 'neutral' }, { id: 'prompts', label: 'Prompts suivis', value: snapshot?.trackedPromptsTotal ?? 0, detail: 'Base de lecture AGENT', tone: snapshot?.trackedPromptsTotal > 0 ? 'info' : 'neutral' }, { id: 'open', label: 'Correctifs ouverts', value: snapshot?.openOpportunitiesCount ?? 0, detail: `${snapshot?.highPriorityOpen ?? 0} haute priorite`, tone: (snapshot?.highPriorityOpen ?? 0) > 0 ? 'warning' : 'neutral' }]} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
                <CommandChartCard title="Lecture du score" subtitle="Verdict composite calcule a la lecture, jamais simule ni persiste artificiellement.">
                    <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <AgentChip tone={score?.agent_score != null ? 'info' : 'neutral'}>{score?.verdict || 'unavailable'}</AgentChip>
                            <AgentChip>{score?.confidence || 'confidence-unavailable'}</AgentChip>
                            {score?.provisional ? <AgentChip tone="warning">provisoire</AgentChip> : null}
                        </div>
                        <div className="mt-4 text-[14px] leading-relaxed text-white/78">Le score AGENT agrege les sous-scores visibilite, preparation, actionnabilite et protocoles avances a partir des slices reelles. Aucune dimension manquante n'est masquee par un faux resultat.</div>
                    </div>
                </CommandChartCard>
                <KeyValuePanel title="Snapshot mandat" subtitle="Fenetre courte utilisee pour la vue globale." entries={[{ label: 'Dernier audit', value: snapshot?.lastAuditAt }, { label: 'Derniere execution', value: snapshot?.lastRunAt }, { label: 'Correctifs haute priorite', value: snapshot?.highPriorityOpen }, { label: 'Opportunites ouvertes', value: snapshot?.openOpportunitiesCount }]} />
            </div>
            <AgentDimensionGrid title="Sous-scores AGENT" subtitle="Chaque sous-score reste branche a sa slice reelle et reste explicitement provisoire quand la preuve manque." dimensions={subscores} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <AgentMessageList title="Correctifs prioritaires" subtitle="Extrait de la file d'actions reelle, triee par impact et priorite." items={data?.topFixes || []} emptyTitle="Aucun correctif prioritaire ouvert." renderItem={(item) => <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold text-white/92">{item.title}</span>{item.priority ? <AgentChip tone={item.priority === 'high' ? 'critical' : item.priority === 'medium' ? 'warning' : 'neutral'}>{item.priority}</AgentChip> : null}</div><div className="text-[12px] text-white/60">{item.category || 'categorie'} · {item.status || 'open'}</div></div>} />
                <AgentMessageList title="Blocages majeurs" subtitle="Blocages remontes depuis la preparation AGENT du dossier courant." items={data?.topBlockers || []} emptyTitle="Aucun blocage majeur detecte." renderItem={(item) => <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold text-white/92">{item.title}</span>{item.status ? <AgentChip tone={item.status === 'bloque' ? 'critical' : 'warning'}>{item.status}</AgentChip> : null}</div>{item.detail ? <div className="text-[12px] leading-relaxed text-white/60">{item.detail}</div> : null}</div>} />
            </div>
        </RealPageFrame>
    );
}
