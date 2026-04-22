'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';
import { GenericTablePanel, KeyValuePanel, MetricGrid, RealPageFrame, pageActionLink } from '@/components/zip-pages/shared/real-page';

export default function AgentVisibilityPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-visibility');
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const kpis = data?.kpis || null;
    const promptCoverage = data?.promptCoverage || null;

    return (
        <RealPageFrame eyebrow="AGENT Ops" title="Visibilite AGENT" subtitle={`Lecture reelle de la presence du mandat ${client?.client_name || ''} dans les reponses IA, a partir des prompts, runs, concurrents et sources reellement observes.`.trim()} actions={<>{pageActionLink(data?.links?.prompts || `${baseHref}/geo/prompts`, 'Requetes GEO')}{pageActionLink(data?.links?.runs || `${baseHref}/geo/runs`, 'Execution GEO')}{pageActionLink(data?.links?.continuous || `${baseHref}/geo/continuous`, 'Suivi continu', 'primary')}</>} loading={loading} error={error} emptyState={data?.emptyState || null} loadingMessage="Lecture du taux de mention, de la couverture source et des modeles reellement actifs sur le mandat.">
            <MetricGrid items={[{ id: 'mention', label: 'Taux de mention', value: kpis?.mentionRatePercent != null ? `${kpis.mentionRatePercent}%` : 'n.d.', detail: `${kpis?.completedRunsTotal ?? 0} runs completes`, tone: 'ok' }, { id: 'visibility', label: 'Proxy visibilite', value: kpis?.visibilityProxyPercent != null ? `${kpis.visibilityProxyPercent}%` : 'n.d.', detail: kpis?.visibilityProxyReliability || 'Fiabilite indisponible', tone: 'info' }, { id: 'sources', label: 'Couverture citations', value: kpis?.citationCoveragePercent != null ? `${kpis.citationCoveragePercent}%` : 'n.d.', detail: `${kpis?.genericMentionsCount ?? 0} mentions generiques`, tone: 'neutral' }, { id: 'competitors', label: 'Concurrents cites', value: kpis?.competitorMentionsCount ?? 0, detail: `${kpis?.trackedPromptsTotal ?? 0} prompts suivis`, tone: (kpis?.competitorMentionsCount ?? 0) > 0 ? 'warning' : 'neutral' }]} />
            <KeyValuePanel title="Couverture des prompts" subtitle="Distribution reelle des prompts suivis dans le funnel de visibilite IA." entries={[{ label: 'Total suivis', value: promptCoverage?.total }, { label: 'Actifs', value: promptCoverage?.active }, { label: 'Avec cible', value: promptCoverage?.withTargetFound }, { label: 'Run sans cible', value: promptCoverage?.withRunNoTarget }, { label: 'Sans run', value: promptCoverage?.noRunYet }, { label: 'Taux de mention', value: promptCoverage?.mentionRatePercent != null ? `${promptCoverage.mentionRatePercent}%` : 'n.d.' }]} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <GenericTablePanel title="Top modeles" subtitle="Providers/modeles reellement les plus actifs sur le mandat." rows={data?.topModels || []} columns={[{ key: 'provider', label: 'Provider' }, { key: 'model', label: 'Modele' }, { key: 'total_runs', label: 'Runs' }, { key: 'total_mentions', label: 'Mentions' }]} />
                <GenericTablePanel title="Concurrents cites" subtitle="Concurrents reellement observes dans les reponses IA." rows={data?.topCompetitors || []} columns={[{ key: 'name', label: 'Concurrent' }, { key: 'mention_count', label: 'Mentions' }]} />
                <GenericTablePanel title="Sources citees" subtitle="Hotes les plus presents dans les reponses observees." rows={data?.topSources || []} columns={[{ key: 'host', label: 'Source' }, { key: 'citation_count', label: 'Citations' }]} />
            </div>
        </RealPageFrame>
    );
}
