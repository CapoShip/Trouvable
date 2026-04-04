'use client';

import { useState } from 'react';
import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function evidenceToneClass(level) {
    if (level === 'strong') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (level === 'medium') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
}

function EvidencePill({ level }) {
    if (!level) return null;
    return (
        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${evidenceToneClass(level)}`}>
            preuve {level}
        </span>
    );
}

function ExternalInsightList({ title, subtitle, items = [], emptyTitle, emptyDescription }) {
    return (
        <GeoPremiumCard className="p-5">
            <div className="mb-3">
                <div className="text-sm font-semibold text-white/95">{title}</div>
                {subtitle ? <div className="text-[11px] text-white/35 mt-1">{subtitle}</div> : null}
            </div>

            {items.length === 0 ? (
                <GeoEmptyPanel title={emptyTitle} description={emptyDescription} />
            ) : (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={`${item.label || item.title || 'item'}-${index}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-white/90 break-words">{item.label || item.title || 'Signal'}</div>
                                    {item.rationale ? <div className="text-[11px] text-white/45 mt-1">{item.rationale}</div> : null}
                                    {item.subreddits?.length ? <div className="text-[11px] text-white/35 mt-1">{item.subreddits.map((subreddit) => `r/${subreddit}`).join(' - ')}</div> : null}
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                    {item.count != null ? <div className="text-[11px] font-semibold text-white/70">{item.count} mentions</div> : null}
                                    {item.mention_count != null ? <div className="text-[11px] font-semibold text-white/70">{item.mention_count} signaux</div> : null}
                                    <EvidencePill level={item.evidence_level} />
                                </div>
                            </div>
                            {item.example ? (
                                <a
                                    href={item.example}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex mt-2 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                                >
                                    Discussion source
                                </a>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </GeoPremiumCard>
    );
}

function connectionLabel(status) {
    if (status === 'connected') return 'connecté';
    if (status === 'connected_empty') return 'connecté (vide)';
    if (status === 'syncing') return 'synchronisation';
    if (status === 'error') return 'erreur';
    if (status === 'not_connected') return 'non connecté';
    return status || 'inconnu';
}

function connectionTone(status) {
    if (status === 'connected') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'connected_empty') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    if (status === 'syncing') return 'border-sky-400/20 bg-sky-400/10 text-sky-300';
    if (status === 'error') return 'border-red-400/20 bg-red-400/10 text-red-300';
    return 'border-white/10 bg-white/[0.04] text-white/60';
}

function runStatusTone(status) {
    if (status === 'completed' || status === 'success') return 'text-emerald-300';
    if (status === 'failed' || status === 'error') return 'text-red-300';
    if (status === 'running') return 'text-sky-300';
    return 'text-white/55';
}

function connectorStatusLabel(status) {
    if (status === 'configured') return 'configure';
    if (status === 'healthy') return 'operationnel';
    if (status === 'syncing') return 'synchro';
    if (status === 'sample_mode') return 'echantillon';
    if (status === 'disabled') return 'desactive';
    if (status === 'error') return 'erreur';
    if (status === 'not_connected') return 'non connecte';
    return status || 'inconnu';
}

function connectorStatusTone(status) {
    if (status === 'configured' || status === 'healthy') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'syncing') return 'border-sky-400/20 bg-sky-400/10 text-sky-300';
    if (status === 'sample_mode') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    if (status === 'error') return 'border-red-400/20 bg-red-400/10 text-red-300';
    if (status === 'disabled') return 'border-white/10 bg-white/[0.04] text-white/60';
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
}

function recurringJobLabel(status) {
    if (status === 'completed') return 'termine';
    if (status === 'running') return 'en cours';
    if (status === 'pending') return 'en attente';
    if (status === 'failed') return 'en echec';
    if (status === 'cancelled') return 'annule';
    return status || 'inconnu';
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
    return json;
}

function summarizeCommunityRunResult(run) {
    const summary = run?.result_summary || {};

    if (!run) {
        return {
            tone: 'info',
            message: 'Run créée. Le résultat détaillé n\'est pas encore disponible.',
        };
    }

    if (run.status === 'failed') {
        return {
            tone: 'error',
            message: run.error_message || 'La collecte communautaire a échoué.',
        };
    }

    if (run.status === 'running' || run.status === 'pending') {
        return {
            tone: 'info',
            message: 'La collecte communautaire est en cours de traitement.',
        };
    }

    if (summary.skipped === true) {
        return {
            tone: 'warning',
            message: `Collecte ignorée : ${summary.reason || 'aucune exécution effective.'}`,
        };
    }

    const documentsCollected = Number(summary.documents_collected || 0);
    const documentsPersisted = Number(summary.documents_persisted || 0);
    const clustersBuilt = Number(summary.clusters_built || 0);
    const opportunitiesDerived = Number(summary.opportunities_derived || 0);

    if (documentsCollected === 0) {
        const seedInfo = summary.seed_diagnostics || [];
        const errorSeeds = seedInfo.filter((s) => s.status === 'error').length;
        const detail = seedInfo.length > 0
            ? ` (${seedInfo.length} seeds testés${errorSeeds > 0 ? `, ${errorSeeds} en erreur` : ', tous sans résultat'})`
            : '';
        return {
            tone: 'warning',
            message: `Collecte terminée, mais aucun document Reddit pertinent n'a été remonté avec les seeds actuels${detail}.`,
        };
    }

    return {
        tone: 'success',
        message: `Collecte terminée : ${documentsCollected} documents collectés, ${documentsPersisted} persistés, ${clustersBuilt} clusters et ${opportunitiesDerived} opportunités dérivées.`,
    };
}

export default function GeoSocialView() {
    const { client, clientId, loading, invalidateWorkspace } = useGeoClient();
    const { data, loading: sliceLoading, error } = useGeoWorkspaceSlice('social');
    const { data: continuousData, loading: continuousLoading } = useGeoWorkspaceSlice('continuous', { enabled: Boolean(clientId) });
    const [actionPending, setActionPending] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [actionMessageTone, setActionMessageTone] = useState('success');
    const [actionError, setActionError] = useState(null);
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading || sliceLoading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Intelligence communautaire indisponible" description="La tranche n'a pas pu être chargée (erreur API ou droits). Ce n'est pas une preuve d'absence de discussions sur votre marque." />
            </div>
        );
    }

    const connection = data.connection || {};
    const summary = data.summary || {};
    const connectorOff = connection.status === 'not_connected';
    const hasData = (summary.documents_count > 0 || summary.total_discussions > 0);
    const shouldShowEmpty = !hasData;
    const communitySyncJob = (continuousData?.jobs?.jobs || []).find((job) => job.job_type === 'community_sync') || null;
    const communityConnector = (continuousData?.connectors?.connections || []).find((connector) => connector.provider === 'agent_reach') || null;
    const actionBusy = Boolean(actionPending);

    const siteCtx = summary.site_context || {};
    const businessTypeLabel = siteCtx.business_type || siteCtx.canonical_category?.replace(/_/g, ' ') || 'non résolu';
    const cityLabel = siteCtx.city || 'localisation inconnue';

    async function postContinuousAction(payload) {
        if (!clientId) {
            throw new Error('Client introuvable.');
        }

        return parseJsonResponse(
            await fetch(`/api/admin/geo/client/${clientId}/continuous/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
        );
    }

    async function loadContinuousControls() {
        if (!clientId) {
            throw new Error('Client introuvable.');
        }

        const json = await parseJsonResponse(
            await fetch(`/api/admin/geo/client/${clientId}/continuous?refresh=${Date.now()}`, {
                cache: 'no-store',
            })
        );

        const job = (json.jobs?.jobs || []).find((item) => item.job_type === 'community_sync') || null;
        const connector = (json.connectors?.connections || []).find((item) => item.provider === 'agent_reach') || null;
        const runs = json.jobs?.runs || [];

        return { job, connector, runs };
    }

    async function handleLaunchCollection() {
        setActionPending('launch_collection');
        setActionMessage(null);
        setActionMessageTone('success');
        setActionError(null);

        try {
            const { job, connector } = await loadContinuousControls();

            if (!job) {
                throw new Error('Le job community_sync est introuvable pour ce client. Ouvrez Suivi continu une fois puis réessayez.');
            }

            if (connector && !['configured', 'healthy', 'syncing'].includes(connector.status)) {
                await postContinuousAction({
                    action: 'connector_state',
                    provider: 'agent_reach',
                    status: 'configured',
                });
            }

            if (job.is_active !== true) {
                await postContinuousAction({
                    action: 'toggle_job',
                    jobId: job.id,
                    is_active: true,
                });
            }

            const queuedRunResponse = await postContinuousAction({ action: 'run_now', jobId: job.id });
            const queuedRunId = queuedRunResponse?.result?.id || null;

            await postContinuousAction({ action: 'worker_tick', maxRunsToExecute: 8 });

            const refreshed = await loadContinuousControls();
            const latestCommunityRun = queuedRunId
                ? (refreshed.runs || []).find((run) => run.id === queuedRunId)
                : (refreshed.runs || []).find((run) => run.job_type === 'community_sync') || null;

            const outcome = summarizeCommunityRunResult(latestCommunityRun);

            if (outcome.tone === 'error') {
                setActionError(outcome.message);
            } else {
                setActionMessage(outcome.message);
                setActionMessageTone(outcome.tone === 'warning' ? 'warning' : 'success');
                setActionError(null);
            }

            invalidateWorkspace();
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setActionPending(null);
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Intelligence Communautaire"
                subtitle={`Données collectées et persistées depuis les sources communautaires (Reddit) via seeds profil. ${client?.client_name || 'Client'} : interprétez les zéros comme « collecte inactive ou vide », pas comme vérité marché absolue.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance?.observation} />
                        <GeoProvenancePill meta={data.provenance?.inferred} />
                        <GeoProvenancePill meta={data.provenance?.not_connected} />
                    </div>
                )}
            />

            <GeoPremiumCard className="p-5">
                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.85fr] gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${connectionTone(connection.status)}`}>
                                {connectionLabel(connection.status)}
                            </span>
                            {communityConnector ? (
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${connectorStatusTone(communityConnector.status)}`}>
                                    connecteur {connectorStatusLabel(communityConnector.status)}
                                </span>
                            ) : null}
                            {communitySyncJob ? (
                                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70">
                                    job {communitySyncJob.is_active ? recurringJobLabel(communitySyncJob.status) : 'inactif'}
                                </span>
                            ) : null}
                        </div>

                        <div className="text-[13px] text-white/78 mt-3 leading-relaxed">
                            {connection.message || 'Aucun statut de connexion disponible.'}
                        </div>

                        {connection.caveat ? <div className="text-[11px] text-white/45 mt-2">{connection.caveat}</div> : null}
                        {connection.requirement ? <div className="text-[11px] text-white/45 mt-1">Prerequis: {connection.requirement}</div> : null}
                        {connection.detail ? <div className="text-[11px] text-red-300 mt-1">Détail: {connection.detail}</div> : null}

                        {actionMessage ? (
                            <div className={`mt-3 rounded-xl px-3 py-2 text-[11px] ${actionMessageTone === 'warning' ? 'border border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>
                                {actionMessage}
                            </div>
                        ) : null}
                        {actionError ? <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">{actionError}</div> : null}
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35">Action rapide</div>
                        <div className="text-sm font-semibold text-white/92 mt-2">Lancer une collecte communautaire</div>
                        <p className="text-[11px] text-white/45 mt-1 leading-relaxed">
                            La page configure le connecteur si nécessaire, ajoute une run community_sync puis exécute le worker automatiquement.
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                <div className="text-white/35">Seeds</div>
                                <div className="text-white/90 font-semibold mt-1">{summary.query_seeds?.length ?? 0}</div>
                            </div>
                            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                <div className="text-white/35">Dernière run</div>
                                <div className="text-white/90 font-semibold mt-1">{summary.last_run ? recurringJobLabel(summary.last_run.status) : 'aucune'}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            <button
                                type="button"
                                className="geo-btn geo-btn-pri disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={actionBusy || continuousLoading}
                                onClick={handleLaunchCollection}
                            >
                                {actionPending === 'launch_collection' ? 'Lancement...' : 'Lancer la collecte maintenant'}
                            </button>
                            <Link href={`${baseHref}/continuous`} className="geo-btn geo-btn-ghost">
                                Suivi continu
                            </Link>
                            <Link href={`${baseHref}/runs`} className="geo-btn geo-btn-ghost">
                                Voir les runs
                            </Link>
                        </div>
                    </div>
                </div>
            </GeoPremiumCard>

            {!connectorOff && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <GeoKpiCard label="Documents collectés" value={summary.documents_count ?? summary.total_discussions ?? 0} hint="Sources communautaires persistées" accent="blue" />
                    <GeoKpiCard label="Clusters" value={summary.clusters_count ?? summary.unique_sources ?? 0} hint="Groupes thématiques agrégés" accent="violet" />
                    <GeoKpiCard label="Opportunités" value={summary.opportunities_count ?? 0} hint="Actions dérivées des preuves" accent="amber" />
                    <GeoKpiCard label="Mentions" value={summary.mentions_count ?? 0} hint="Entités détectées dans les documents" accent="emerald" />
                </div>
            )}

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Contexte de collecte</div>
                        <p className="text-[11px] text-white/35">
                            Généré le {formatDateTime(summary.generated_at)} à partir des seeds reliés au profil client et au contexte du site.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Seeds suivis</div>
                        <div className="text-lg font-semibold text-white/92 mt-2">{summary.query_seeds?.length ?? 0}</div>
                        <div className="text-[11px] text-white/40 mt-2 break-words">
                            {(summary.query_seeds || []).join(' — ') || 'Aucun seed pour le moment'}
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Contexte site</div>
                        <div className="text-[13px] text-white/88 mt-2">
                            {businessTypeLabel} — {cityLabel}
                        </div>
                        {siteCtx.business_model ? (
                            <div className="text-[11px] text-white/50 mt-1">
                                Modèle : {siteCtx.business_model}{siteCtx.target_audience ? ` · ${siteCtx.target_audience}` : ''}
                            </div>
                        ) : null}
                        <div className="text-[11px] text-white/40 mt-1">
                            Client : {siteCtx.client_name || client?.client_name || 'inconnu'}
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Dernière collecte</div>
                        {summary.last_run ? (
                            <>
                                <div className="text-[13px] text-white/88 mt-2">{formatDateTime(summary.last_run.started_at)}</div>
                                <div className={`text-[11px] mt-2 ${runStatusTone(summary.last_run.status)}`}>Statut : {summary.last_run.status}</div>
                                <div className="text-[11px] text-white/40 mt-1">
                                    {summary.last_run.documents_collected ?? 0} docs collectés — {summary.last_run.documents_persisted ?? 0} nouveaux persistés
                                </div>
                                {(summary.last_run.documents_persisted === 0 && hasData) ? (
                                    <div className="text-[10px] text-white/30 mt-1">Aucun nouveau document lors de cette run — les données historiques restent valides.</div>
                                ) : null}
                                {summary.last_run.run_context?.seed_diagnostics?.length > 0 ? (
                                    <div className="mt-3 space-y-1">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Résultats par seed</div>
                                        {summary.last_run.run_context.seed_diagnostics.map((sd, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${sd.status === 'ok' ? (sd.results > 0 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-red-400'}`} />
                                                <span className="text-white/60 truncate min-w-0">{sd.seed}</span>
                                                <span className="text-white/40 shrink-0">
                                                    {sd.status === 'ok' ? `${sd.results} résultat${sd.results !== 1 ? 's' : ''}` : 'erreur'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="text-[11px] text-white/40 mt-2">Aucune collecte exécutée pour le moment.</div>
                        )}
                    </div>
                </div>
            </GeoPremiumCard>

            {shouldShowEmpty ? (
                <GeoPremiumCard className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
                        <GeoEmptyPanel
                            title={data.emptyState?.title || 'Aucune discussion externe observée'}
                            description={data.emptyState?.description || "Aucune discussion externe n'a été observée sur le scope seed actuel."}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Etape 1</div>
                                    <div className="text-sm font-semibold text-white/90 mt-2">Verifier l&apos;activation</div>
                                    <div className="text-[11px] text-white/40 mt-1">Le connecteur doit etre configure et l&apos;environnement autoriser la collecte.</div>
                                </div>
                                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Etape 2</div>
                                    <div className="text-sm font-semibold text-white/90 mt-2">Lancer la run</div>
                                    <div className="text-[11px] text-white/40 mt-1">Le bouton principal ajoute une execution community_sync et déclenche le worker.</div>
                                </div>
                                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/30">Etape 3</div>
                                    <div className="text-sm font-semibold text-white/90 mt-2">Relire les signaux</div>
                                    <div className="text-[11px] text-white/40 mt-1">La vue affichera ensuite clusters, opportunités et langage communautaire.</div>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <button
                                    type="button"
                                    className="geo-btn geo-btn-pri disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={actionBusy || continuousLoading}
                                    onClick={handleLaunchCollection}
                                >
                                    {actionPending === 'launch_collection' ? 'Lancement...' : 'Lancer la collecte maintenant'}
                                </button>
                                <Link href={`${baseHref}/continuous`} className="geo-btn geo-btn-ghost">
                                    Suivi continu
                                </Link>
                                <Link href={`${baseHref}/settings`} className="geo-btn geo-btn-ghost">
                                    Profil client
                                </Link>
                            </div>
                        </GeoEmptyPanel>

                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35">Lecture operateur</div>
                            <div className="text-sm font-semibold text-white/92 mt-2">Ce que la premiere collecte va produire</div>
                            <div className="space-y-3 mt-4">
                                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                    <div className="text-[11px] font-semibold text-white/88">Clusters exploitables</div>
                                    <div className="text-[11px] text-white/40 mt-1">Plaintes, questions, themes et langage communautaire a partir des documents observés.</div>
                                </div>
                                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                    <div className="text-[11px] font-semibold text-white/88">Opportunites d&apos;action</div>
                                    <div className="text-[11px] text-white/40 mt-1">Pistes FAQ, contenu et differenciation derivees des preuves persistées.</div>
                                </div>
                                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                                    <div className="text-[11px] font-semibold text-white/88">Historique rejouable</div>
                                    <div className="text-[11px] text-white/40 mt-1">Runs, statuts et compteurs documents collectes / persistes visibles ensuite dans l&apos;espace admin.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </GeoPremiumCard>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Plaintes récurrentes"
                            subtitle="Observées en externe et groupées par labels récurrents."
                            items={data.topComplaints || []}
                            emptyTitle="Aucun cluster de plainte"
                            emptyDescription="Aucun motif de plainte récurrent détecté sur le jeu observé actuel."
                        />
                        <ExternalInsightList
                            title="Questions récurrentes"
                            subtitle="Patterns de questions utiles pour la couverture FAQ."
                            items={data.topQuestions || []}
                            emptyTitle="Aucun cluster de question"
                            emptyDescription="Aucun motif de question récurrent détecté sur le jeu observé actuel."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Thèmes de discussion"
                            subtitle="Thèmes récurrents inférés à partir du texte observé."
                            items={data.topThemes || []}
                            emptyTitle="Aucun thème"
                            emptyDescription="L'extraction de thèmes demande des occurrences répétées sur les discussions observées."
                        />
                        <ExternalInsightList
                            title="Langage communautaire"
                            subtitle="Langage utilisé dans les discussions publiques observées."
                            items={data.communityLanguage || []}
                            emptyTitle="Aucun cluster de langage"
                            emptyDescription="Le langage communautaire apparaît dès qu'un volume suffisant est observé."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Communautés source"
                            subtitle="Communautés qui portent actuellement le volume de discussions observées."
                            items={(data.sourceBuckets || []).map((item) => ({ ...item, label: item.source }))}
                            emptyTitle="Aucune communauté source"
                            emptyDescription="Aucune communauté source n'a été observée dans la fenêtre seed actuelle."
                        />
                        <ExternalInsightList
                            title="Plaintes concurrentielles"
                            subtitle="Plaintes de type comparaison où des angles de différenciation peuvent être positionnés."
                            items={data.competitorComplaints || []}
                            emptyTitle="Aucune plainte concurrentielle"
                            emptyDescription="Aucun pattern de plainte axé concurrent n'a été détecté."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <ExternalInsightList
                            title="Opportunités FAQ"
                            subtitle="Opportunités inférées depuis les questions externes récurrentes."
                            items={data.faqOpportunities || []}
                            emptyTitle="Aucune opportunité FAQ"
                            emptyDescription="Aucune opportunité FAQ n'a pu être inférée depuis les preuves actuelles."
                        />
                        <ExternalInsightList
                            title="Opportunités contenu"
                            subtitle="Angles de contenu inférés depuis les plaintes et thèmes observés."
                            items={data.contentOpportunities || []}
                            emptyTitle="Aucune opportunité contenu"
                            emptyDescription="Aucune opportunité contenu n'a pu être dérivée des preuves actuelles."
                        />
                        <ExternalInsightList
                            title="Angles de différenciation"
                            subtitle="Pistes de positionnement opérateur inférées depuis les clusters de plaintes."
                            items={data.differentiationAngles || []}
                            emptyTitle="Aucun angle de différenciation"
                            emptyDescription="Aucune suggestion de différenciation n'a été dérivée des preuves actuelles."
                        />
                    </div>
                </>
            )}
        </div>
    );
}

