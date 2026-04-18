'use client';

import { useEffect, useState } from 'react';

import ReliabilityPill from '@/components/ui/ReliabilityPill';

import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateTimeLabel,
    getSeoActionClasses,
    getPanelToneFromStatus,
    SeoActionLink,
    SeoEmptyState,
    SeoLoadingState,
    SeoPageHeader,
    SeoPageShell,
    SeoPanel,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';

function IssueCard({ issue, actionHref, promptHref }) {
    const title = issue?.title || issue?.label || 'Probleme technique';
    const description = issue?.description || issue?.detail || issue?.label || 'Description indisponible.';
    const priority = String(issue?.priority || 'medium').toLowerCase();
    const severityLabel = priority === 'critical' || priority === 'high'
        ? `Priorite ${priority}`
        : `Priorite ${priority}`;

    return (
        <div className="rounded-[26px] border border-white/[0.08] bg-black/24 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{title}</div>
                <SeoStatusBadge status={priority === 'critical' || priority === 'high' ? 'critical' : 'warning'} label={severityLabel} />
                <ReliabilityPill value={issue?.reliability || 'unavailable'} />
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-white/62">{description}</p>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Preuve</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/82">{issue?.evidence || 'Preuve indisponible.'}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Action recommandee</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/82">{issue?.recommendedFix || 'Correction a confirmer.'}</div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <SeoActionLink href={actionHref} variant="primary" className="px-3.5 py-2 text-[11px]">
                    Ouvrir Opportunites SEO
                </SeoActionLink>
                <SeoActionLink href={promptHref} variant="secondary" className="px-3.5 py-2 text-[11px]">
                    Ouvrir Prompt IA
                </SeoActionLink>
            </div>
        </div>
    );
}

function IndicatorRow({ indicator }) {
    return (
        <div className="rounded-[22px] border border-white/[0.08] bg-black/18 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white/92">{indicator.label}</div>
                <SeoStatusBadge status={indicator.status} />
            </div>
            <div className="mt-2 text-[12px] leading-relaxed text-white/62">{indicator.evidence}</div>
        </div>
    );
}

export default function SeoHealthView() {
    const { client, clientId, refetch } = useGeoClient();
    const { data, loading, error, refetch: refetchHealth } = useSeoWorkspaceSlice('health');

    const [scanUrl, setScanUrl] = useState(client?.website_url || '');
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        if (client?.website_url) setScanUrl(client.website_url);
    }, [client?.website_url]);

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    async function startScan() {
        if (!clientId || !scanUrl.trim()) return;

        setScanning(true);
        setScanError(null);

        try {
            const response = await fetch('/api/admin/audits/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    websiteUrl: scanUrl.trim(),
                }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.error || payload.message || `Erreur ${response.status}`);
            }

            refetch();
            await refetchHealth();
        } catch (requestError) {
            setScanError(requestError.message || 'Erreur reseau');
        } finally {
            setScanning(false);
        }
    }

    if (loading) {
        return <SeoLoadingState title="Chargement de la sante SEO..." description="Recuperation du dernier audit, des indicateurs observes et des priorites techniques reellement persistees." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Sante SEO indisponible"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/visibility`}>Voir la visibilite SEO</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Sante technique SEO"
                subtitle={`Controles techniques, preuves d'audit et points d'action structures pour ${client?.client_name || 'ce mandat'}.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/correction-prompts`} variant="secondary">Prompt IA</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/visibility`} variant="secondary">Visibilite SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/on-page`} variant="primary">Optimisation on-page</SeoActionLink>
                    </>
                )}
            />

            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Synthese technique
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(data?.summaryCards || []).map((card) => (
                    <SeoStatCard
                        key={card.id}
                        label={card.label}
                        value={card.value}
                        detail={card.detail}
                        reliability={card.reliability}
                        accent={card.accent}
                    />
                ))}
            </div>

            <SeoPanel title="Relancer l'audit technique" subtitle="Utilise l'URL active du site pour regenerer preuves, problemes et indicateurs." reliability="measured" tone="info">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="url"
                        value={scanUrl}
                        onChange={(event) => setScanUrl(event.target.value)}
                        placeholder="https://..."
                        disabled={scanning}
                        className="min-w-0 flex-1 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-400/30"
                    />
                    <button
                        type="button"
                        onClick={startScan}
                        disabled={scanning || !clientId}
                        className={`${getSeoActionClasses('primary')} shrink-0 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                        {scanning ? 'Audit en cours...' : "Relancer l'audit"}
                    </button>
                </div>
                {scanError ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-[12px] text-red-100">{scanError}</div> : null}
            </SeoPanel>

            {data?.emptyState ? (
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Controles et preuves
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {(data?.checks || []).map((check) => (
                            <SeoPanel
                                key={check.id}
                                title={check.label}
                                subtitle={check.detail}
                                reliability={check.reliability}
                                tone={getPanelToneFromStatus(check.status)}
                                action={<SeoStatusBadge status={check.status} />}
                            >
                                <div className="rounded-[22px] border border-white/[0.08] bg-black/20 p-4 text-[12px] leading-relaxed text-white/74">
                                    {check.evidence}
                                </div>
                                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4 text-[12px] leading-relaxed text-white/62">
                                    {check.action}
                                </div>
                            </SeoPanel>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Problemes prioritaires
                    </div>

                    <SeoPanel
                        id="issues"
                        title="Problemes techniques prioritaires"
                        subtitle="Lecture operateur: probleme, preuve, action. La generation de prompts de correction IA vit maintenant dans la section SEO dediee."
                        reliability="measured"
                        tone="default"
                        action={(
                            <SeoActionLink href={`${baseHref}/seo/correction-prompts`} variant="secondary" className="px-3.5 py-2 text-[11px]">
                                Ouvrir Prompts IA
                            </SeoActionLink>
                        )}
                    >
                        {data?.issues?.length === 0 ? (
                            <SeoEmptyState title="Aucun probleme technique majeur" description="Le dernier audit ne remonte pas de probleme technique prioritaire dans la lecture SEO actuelle." />
                        ) : (
                            <div className="space-y-3">
                                {data.issues.map((issue) => (
                                    <IssueCard
                                        key={issue.id || issue.key || issue.title || issue.label}
                                        issue={issue}
                                        actionHref={`${baseHref}/seo/opportunities`}
                                        promptHref={`${baseHref}/seo/correction-prompts${issue?.id ? `?issueId=${encodeURIComponent(issue.id)}` : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </SeoPanel>

                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Signaux observes
                    </div>

                    <SeoPanel title="Signaux techniques observes" subtitle={`Audit actif: ${formatDateTimeLabel(data.auditMeta?.createdAt)}${data.auditMeta?.sourceUrl ? ` · ${data.auditMeta.sourceUrl}` : ''}`} reliability="calculated" tone="default">
                        <div className="space-y-3">
                            {(data?.indicators || []).map((indicator) => (
                                <IndicatorRow key={indicator.id} indicator={indicator} />
                            ))}
                        </div>
                    </SeoPanel>
                </>
            )}
        </SeoPageShell>
    );
}
