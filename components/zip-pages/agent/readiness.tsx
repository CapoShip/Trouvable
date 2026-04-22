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

export default function AgentReadinessPage() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-readiness');

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const summary = data?.summary || {};
    const dimensions = data?.dimensions || [];
    const blockers = data?.topBlockers || [];
    const emptyState = data?.emptyState || (!data?.available ? {
        title: 'Preparation AGENT indisponible',
        description: 'Aucun audit exploitable ne permet encore de calculer la preparation AGENT pour ce dossier.',
    } : null);

    return (
        <RealPageFrame
            eyebrow="AGENT Ops"
            title="Preparation agent"
            subtitle={`Lecture reelle de la preparation technique pour ${client?.client_name || 'ce mandat'} : dimensions du readiness engine, blocages reels et fraicheur de l'audit courant.`}
            actions={
                <>
                    {pageActionLink(`${baseHref}/agent/visibility`, 'Visibilite agent')}
                    {pageActionLink(`${baseHref}/agent/protocols`, 'Protocoles agent')}
                    {pageActionLink(data?.links?.audit || `${baseHref}/dossier/audit`, 'Audit dossier', 'primary')}
                </>
            }
            loading={loading}
            error={error}
            emptyState={emptyState}
            loadingMessage="Lecture du readiness engine et des blocages reels du dossier courant."
        >
            <MetricGrid
                items={[
                    { id: 'score', label: 'Score global', value: summary.globalScore ?? 'n.d.', detail: summary.globalSignalLabel || summary.globalStatus || 'Signal indisponible', tone: scoreTone(summary.globalScore) },
                    { id: 'pages', label: 'Pages auditees', value: summary.pageCount ?? 0, detail: 'Base structurelle observee', tone: (summary.pageCount ?? 0) > 0 ? 'info' : 'neutral' },
                    { id: 'passages', label: 'Passages forts', value: summary.highPassageCount ?? 0, detail: 'Citabilite brute extraite', tone: (summary.highPassageCount ?? 0) > 0 ? 'ok' : 'neutral' },
                    { id: 'faq', label: 'FAQ / QA', value: summary.faqCount ?? 0, detail: 'Paires utiles detectees', tone: (summary.faqCount ?? 0) > 0 ? 'ok' : 'neutral' },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.85fr]">
                <KeyValuePanel
                    title="Etat readiness"
                    subtitle="Synthese du readiness engine pour le dossier actif."
                    entries={[
                        { label: 'Signal global', value: summary.globalSignalLabel || summary.globalStatus },
                        { label: 'Dimensions', value: dimensions.length },
                        { label: 'Dernier audit', value: data?.freshness?.auditCreatedAt || data?.provenance?.observed?.label },
                        { label: 'Statut scan', value: data?.freshness?.scanStatus },
                    ]}
                />

                <AgentMessageList
                    title="Blocages majeurs"
                    subtitle="Points reels qui empechent une bonne preparation pour les agents."
                    items={blockers}
                    emptyTitle="Aucun blocage majeur detecte sur le dossier courant."
                    renderItem={(item) => (
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-semibold text-white/92">{item.title}</span>
                                {item.status ? <AgentChip tone={item.status === 'bloque' ? 'critical' : 'warning'}>{item.status}</AgentChip> : null}
                            </div>
                            {item.detail ? <div className="text-[12px] leading-relaxed text-white/60">{item.detail}</div> : null}
                        </div>
                    )}
                />
            </div>

            <AgentDimensionGrid
                title="Dimensions de preparation"
                subtitle="Chaque dimension vient du moteur readiness existant, sans score ni libelle invente."
                dimensions={dimensions}
            />
        </RealPageFrame>
    );
}
