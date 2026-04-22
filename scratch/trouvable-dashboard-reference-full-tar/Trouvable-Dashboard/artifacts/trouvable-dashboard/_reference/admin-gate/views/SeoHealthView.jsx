'use client';

import { useEffect, useState } from 'react';

import ReliabilityPill from '@/components/ui/ReliabilityPill';

import IssueQuickAction from '../components/IssueQuickAction';
import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateTimeLabel,
    getSeoActionClasses,
    getPanelToneFromStatus,
    SeoActionLink,
    SeoEmptyState,
    SeoLoadingState,
    SeoPageShell,
    SeoPanel,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';

function IssueCard({ issue, actionHref, clientId }) {
    const title = issue?.title || issue?.label || 'Problème technique';
    const description = issue?.description || issue?.detail || issue?.label || 'Description indisponible.';
    const priority = String(issue?.priority || 'medium').toLowerCase();
    const severityLabel = `Priorité ${priority}`;

    const problemRef = issue?.id && clientId
        ? {
            source: 'seo_health_issue',
            clientId,
            issueId: issue.id,
            dimension: issue?.dimension,
            category: issue?.category,
            pageUrl: issue?.sourceUrl,
            label: title,
        }
        : null;

    return (
        <div className="rounded-[26px] border border-slate-400/15 bg-[#2a2f3a] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{title}</div>
                <SeoStatusBadge status={priority === 'critical' || priority === 'high' ? 'critical' : 'warning'} label={severityLabel} />
                <ReliabilityPill value={issue?.reliability || 'unavailable'} />
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-white/62">{description}</p>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-400/12 bg-[#323845] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Preuve</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/82">{issue?.evidence || 'Preuve indisponible.'}</div>
                </div>
                <div className="rounded-2xl border border-slate-400/12 bg-[#323845] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Action recommandée</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/82">{issue?.recommendedFix || 'Correction a confirmer.'}</div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <SeoActionLink href={actionHref} variant="secondary" className="px-3.5 py-2 text-[11px]">
                    Ouvrir Opportunites SEO
                </SeoActionLink>
                {problemRef ? (
                    <>
                        <IssueQuickAction problemRef={problemRef} label="Générer prompt" variant="primary" />
                        <IssueQuickAction problemRef={problemRef} label="Page complète" variant="ghost" mode="navigate" />
                    </>
                ) : null}
            </div>
        </div>
    );
}

function priorityOrder(priority) {
    const normalized = String(priority || 'medium').toLowerCase();
    if (normalized === 'critical') return 0;
    if (normalized === 'high') return 1;
    if (normalized === 'low') return 3;
    return 2;
}

function sortIssues(issues) {
    return [...(issues || [])].sort((a, b) => priorityOrder(a?.priority) - priorityOrder(b?.priority));
}

function IndicatorRow({ indicator }) {
    return (
        <div className="rounded-[22px] border border-slate-400/12 bg-[#2e3440] px-4 py-3">
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
        return <SeoLoadingState title="Chargement de la santé SEO…" description="Récupération du dernier audit, des indicateurs observés et des priorités techniques réellement persistées." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Santé SEO indisponible"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/visibility`}>Voir la visibilité SEO</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    const sortedIssues = sortIssues(data?.issues);

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#1a2230] text-white">
            <div className="border-b border-cyan-500/20 bg-[linear-gradient(120deg,rgba(6,182,212,0.12)_0%,transparent_45%,rgba(99,102,241,0.08)_100%)]">
                <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/65">seo.health.monitor</div>
                    <h1 className="mt-3 text-[clamp(1.65rem,3.2vw,2.35rem)] font-semibold tracking-[-0.045em]">Station de surveillance SEO</h1>
                    <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/48">
                        Fil unique sans rail latéral : vitres empilées (synthèse → lanceur d’audit → contrôles → problèmes triés → signaux).
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <SeoActionLink href={`${baseHref}/seo/correction-prompts`} variant="secondary" className="rounded-xl">Prompt IA</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/visibility`} variant="secondary" className="rounded-xl">Visibilité SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/on-page`} variant="primary" className="rounded-xl">Optimisation on-page</SeoActionLink>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1200px] space-y-10 px-4 py-10 md:px-8 pb-16">
                <section className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Synthèse technique</div>
                    <div className="flex gap-3 overflow-x-auto pb-1 geo-scrollbar md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
                        {(data?.summaryCards || []).map((card) => (
                            <div key={card.id} className="min-w-[220px] shrink-0 md:min-w-0">
                                <SeoStatCard
                                    label={card.label}
                                    value={card.value}
                                    detail={card.detail}
                                    reliability={card.reliability}
                                    accent={card.accent}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-[28px] border border-cyan-400/25 bg-[#243045] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/70 mb-3">Relance audit</div>
                    <SeoPanel title="Relancer l'audit technique" subtitle="Utilise l'URL active du site pour régénérer preuves, problèmes et indicateurs." reliability="measured" tone="info">
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
                                className={`${getSeoActionClasses('primary')} shrink-0 rounded-2xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {scanning ? 'Audit en cours...' : "Relancer l'audit"}
                            </button>
                        </div>
                        {scanError ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-[12px] text-red-100">{scanError}</div> : null}
                    </SeoPanel>
                </section>

                {data?.emptyState ? (
                    <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} />
                ) : (
                    <>
                        <section className="space-y-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Contrôles et preuves</div>
                            <div className="space-y-4">
                                {(data?.checks || []).map((check) => (
                                    <SeoPanel
                                        key={check.id}
                                        title={check.label}
                                        subtitle={check.detail}
                                        reliability={check.reliability}
                                        tone={getPanelToneFromStatus(check.status)}
                                        action={<SeoStatusBadge status={check.status} />}
                                    >
                                        <div className="rounded-[22px] border border-slate-400/12 bg-[#323845] p-4 text-[12px] leading-relaxed text-white/78">
                                            {check.evidence}
                                        </div>
                                        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4 text-[12px] leading-relaxed text-white/62">
                                            {check.action}
                                        </div>
                                    </SeoPanel>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Problèmes · flux priorisé</div>
                                <SeoActionLink href={`${baseHref}/seo/correction-prompts`} variant="secondary" className="rounded-xl px-3.5 py-2 text-[11px]">
                                    Prompts IA
                                </SeoActionLink>
                            </div>
                            <SeoPanel
                                title="Problèmes techniques prioritaires"
                                subtitle="Tri brut critique → faible, sans files séparées par voie."
                                reliability="measured"
                                tone="default"
                            >
                                {sortedIssues.length === 0 ? (
                                    <SeoEmptyState title="Aucun problème technique majeur" description="Le dernier audit ne remonte pas de problème technique prioritaire dans la lecture SEO actuelle." />
                                ) : (
                                    <div className="space-y-4">
                                        {sortedIssues.map((issue) => (
                                            <IssueCard
                                                key={issue.id || issue.key || issue.title || issue.label}
                                                issue={issue}
                                                actionHref={`${baseHref}/seo/opportunities`}
                                                clientId={clientId}
                                            />
                                        ))}
                                    </div>
                                )}
                            </SeoPanel>
                        </section>

                        <section className="space-y-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Signaux observés</div>
                            <SeoPanel title="Signaux techniques observés" subtitle={`Audit actif : ${formatDateTimeLabel(data.auditMeta?.createdAt)}${data.auditMeta?.sourceUrl ? ` · ${data.auditMeta.sourceUrl}` : ''}`} reliability="calculated" tone="default">
                                <div className="space-y-3">
                                    {(data?.indicators || []).map((indicator) => (
                                        <IndicatorRow key={indicator.id} indicator={indicator} />
                                    ))}
                                </div>
                            </SeoPanel>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
