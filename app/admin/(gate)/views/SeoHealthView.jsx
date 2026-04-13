'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import {
    formatDateTimeLabel,
    getSeoActionClasses,
    getPanelToneFromStatus,
    SeoActionLink,
    SeoEmptyState,
    SeoLoadingState,
    SeoPageHeader,
    SeoPanel,
    SeoPageShell,
    SeoStatCard,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

const PROMPT_LABELS = {
    missing_faq_for_intent: 'Générer un prompt FAQ',
    weak_local_clarity: 'Générer un prompt de clarté locale',
    schema_missing_or_incoherent: 'Générer un prompt Schema',
    llms_txt_missing: 'Générer un prompt llms.txt',
    ai_crawlers_blocked: 'Générer un prompt robots/crawlers',
};

function CorrectionPromptButton({ clientId, promptType }) {
    const [state, setState] = useState('idle');
    const [result, setResult] = useState('');
    const [error, setError] = useState(null);

    async function handleGenerate() {
        setState('loading');
        setError(null);

        try {
            const response = await fetch(`/api/admin/remediation/generate/${encodeURIComponent(clientId)}?type=${encodeURIComponent(promptType)}`, {
                method: 'POST',
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.error || `Erreur ${response.status}`);
            }

            const suggestion = payload.suggestions?.[0] || payload;
            setResult(suggestion.ai_output || suggestion.text || 'Aucun contenu de correction renvoyé.');
            setState('done');
        } catch (requestError) {
            setError(requestError.message || 'Erreur de génération');
            setState('error');
        }
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={handleGenerate}
                disabled={state === 'loading'}
                className={`${getSeoActionClasses('primary')} px-3.5 py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-50`}
            >
                {state === 'loading' ? 'Génération…' : (PROMPT_LABELS[promptType] || 'Générer un prompt de correction')}
            </button>

            {error ? (
                <div className="rounded-[22px] border border-red-400/20 bg-red-400/10 px-3 py-2 text-[11px] text-red-100">
                    {error}
                </div>
            ) : null}

            {state === 'done' && result ? (
                <div className="rounded-[24px] border border-white/[0.08] bg-black/24 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Prompt généré</div>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-white/72">{result}</pre>
                </div>
            ) : null}
        </div>
    );
}

function IssueCard({ issue, clientId, actionHref }) {
    return (
        <div className="rounded-[26px] border border-white/[0.08] bg-black/24 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{issue.title}</div>
                <SeoStatusBadge status={issue.priority === 'critical' || issue.priority === 'high' ? 'critical' : 'warning'} label={`Priorité ${issue.priority}`} />
                <ReliabilityPill value={issue.reliability} />
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-white/62">{issue.description}</p>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Preuve</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/82">{issue.evidence}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">Action recommandée</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/82">{issue.recommendedFix}</div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <SeoActionLink href={actionHref} variant="geo" className="px-3.5 py-2 text-[11px]">
                    Ouvrir GEO Ops · File d’actions
                </SeoActionLink>
                {issue.promptType ? (
                    <CorrectionPromptButton clientId={clientId} promptType={issue.promptType} />
                ) : (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/50">
                        Prompt non disponible
                    </span>
                )}
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
            setScanError(requestError.message || 'Erreur réseau');
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

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Santé technique SEO"
                subtitle={`Contrôles techniques, preuves d’audit et points d’action structurés pour ${client?.client_name || 'ce mandat'}.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/visibility`} variant="secondary">Visibilité SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/on-page`} variant="primary">Optimisation on-page</SeoActionLink>
                    </>
                )}
            />

            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Synthèse technique
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

            <SeoPanel title="Relancer l’audit technique" subtitle="Utilise l’URL active du site pour regénérer preuves, problèmes et indicateurs." reliability="measured" tone="info">
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
                        {scanning ? 'Audit en cours…' : 'Relancer l’audit'}
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
                        Contrôles et preuves
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
                        Problèmes prioritaires
                    </div>

                    <SeoPanel id="issues" title="Problèmes techniques prioritaires" subtitle="Lecture opérateur: problème, preuve, action, puis entrée de correction quand elle est vraiment prête." reliability="measured" tone="default">
                        {data.issues.length === 0 ? (
                            <SeoEmptyState title="Aucun problème technique majeur" description="Le dernier audit ne remonte pas de problème technique prioritaire dans la lecture SEO actuelle." />
                        ) : (
                            <div className="space-y-3">
                                {data.issues.map((issue) => (
                                    <IssueCard key={issue.id || issue.key || issue.title} issue={issue} clientId={clientId} actionHref={`${baseHref}/opportunities`} />
                                ))}
                            </div>
                        )}
                    </SeoPanel>

                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Signaux observés
                    </div>

                    <SeoPanel title="Signaux techniques observés" subtitle={`Audit actif: ${formatDateTimeLabel(data.auditMeta?.createdAt)}${data.auditMeta?.sourceUrl ? ` · ${data.auditMeta.sourceUrl}` : ''}`} reliability="calculated" tone="default">
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
