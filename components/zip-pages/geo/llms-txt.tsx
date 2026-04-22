// @ts-nocheck
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2Icon,
    CopyIcon,
    FileCodeIcon,
    RefreshCwIcon,
    SaveIcon,
    AlertTriangleIcon,
} from 'lucide-react';

import { CommandHeader, CommandPageShell } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import CommandEmptyState from '@/app/admin/(gate)/components/command/CommandEmptyState';
import { useGeoClient } from '@/app/admin/(gate)/context/ClientContext';

function splitSections(content) {
    const text = String(content || '');
    return [
        { label: 'Identity & facts', present: /identity|core facts|identite/i.test(text) },
        { label: 'Pricing', present: /pricing|plans|tarif/i.test(text) },
        { label: 'Agent guidelines', present: /agent guidelines|instructions for ai|guidelines/i.test(text) },
        { label: 'Support & contact', present: /support|contact|documentation/i.test(text) },
    ];
}

export default function GeoLlmsTxtPage() {
    const { client, clientId, audit } = useGeoClient();
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [content, setContent] = useState('');

    const llmsFound = useMemo(() => {
        const strengths = Array.isArray(audit?.strengths) ? audit.strengths : [];
        return strengths.some((item) => String(item?.title || '').toLowerCase().includes('llms.txt'));
    }, [audit]);

    const fetchDrafts = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/remediation/suggestions/${clientId}?type=llms_txt_missing`, { cache: 'no-store' });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
            const suggestions = json.suggestions || [];
            const latest = suggestions.find((item) => item.ai_output && item.status === 'draft') || null;
            setDraft(latest);
            setContent(latest?.ai_output || '');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    async function handleGenerate() {
        if (!clientId || generating) return;
        setGenerating(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/remediation/generate/${clientId}?type=llms_txt_missing`, { method: 'POST' });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
            await fetchDrafts();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setGenerating(false);
        }
    }

    async function handleCopy() {
        if (!content) return;
        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    function handleDownload() {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'llms.txt';
        link.click();
        URL.revokeObjectURL(url);
    }

    const statusTone = llmsFound ? 'valid' : content ? 'warning' : 'error';
    const sectionRows = splitSections(content);
    const recommendations = [
        !client?.website_url ? 'Le domaine public du client manque encore dans le profil.' : null,
        !client?.business_description && !client?.short_description ? 'La description metier du client n est pas renseignee.' : null,
        !sectionRows.find((item) => item.label === 'Pricing')?.present ? 'Le brouillon ne contient pas encore de section prix clairement detectable.' : null,
        !sectionRows.find((item) => item.label === 'Agent guidelines')?.present ? 'Aucune instruction explicite pour les agents n a ete detectee dans le brouillon courant.' : null,
    ].filter(Boolean);

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="llms.txt"
                    subtitle="Brouillon reel issu du moteur de remediation du dossier courant, avec verification audit et export operateur."
                    actions={(
                        <>
                            <button type="button" onClick={handleGenerate} disabled={generating} className={COMMAND_BUTTONS.secondary}>
                                <RefreshCwIcon className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
                                {generating ? 'Generation...' : 'Generer via IA'}
                            </button>
                            <button type="button" onClick={handleDownload} disabled={!content} className={COMMAND_BUTTONS.primary}>
                                <SaveIcon className="h-3.5 w-3.5" />
                                Exporter le brouillon
                            </button>
                        </>
                    )}
                />
            )}
        >
            {loading ? (
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-8 text-[13px] text-white/55">Chargement du brouillon llms.txt...</div>
            ) : error ? (
                <CommandEmptyState title="llms.txt indisponible" description={error} />
            ) : (
                <div className="mt-4 flex min-h-[600px] flex-col gap-6 lg:h-[calc(100vh-220px)] lg:flex-row">
                    <div className={cn(COMMAND_PANEL, 'flex-1 flex flex-col p-0 overflow-hidden border-indigo-500/20')}>
                        <div className="h-12 shrink-0 border-b border-white/[0.05] bg-black/40 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileCodeIcon className="h-4 w-4 text-indigo-400" />
                                <span className="font-mono text-[12px] text-white/80">/llms.txt</span>
                            </div>
                            <button type="button" onClick={handleCopy} className="text-white/40 transition-colors hover:text-white" title="Copier tout">
                                {copied ? <CheckCircle2Icon className="h-4 w-4 text-emerald-400" /> : <CopyIcon className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="relative flex-1 bg-[#0d1117]">
                            <div className="absolute bottom-0 left-0 top-0 w-10 select-none border-r border-white/5 bg-black/40 py-4 pr-2 flex flex-col items-end">
                                {Array.from({ length: Math.max(18, String(content || '').split('\n').length + 2) }).map((_, index) => (
                                    <span key={index} className="font-mono text-[10px] leading-[21px] text-white/20">{index + 1}</span>
                                ))}
                            </div>

                            <textarea
                                value={content}
                                readOnly
                                className="absolute inset-0 h-full w-full resize-none bg-transparent py-4 pl-14 pr-4 font-mono text-[13px] leading-[21px] text-white/80 focus:outline-none"
                                placeholder="Aucun brouillon disponible pour ce dossier."
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] flex flex-col gap-6">
                        <div className={cn(
                            'rounded-xl border p-4 flex items-start gap-3',
                            statusTone === 'valid' ? 'border-emerald-500/20 bg-emerald-500/5'
                                : statusTone === 'warning' ? 'border-amber-500/20 bg-amber-500/5'
                                    : 'border-rose-500/20 bg-rose-500/5',
                        )}>
                            {statusTone === 'valid' ? <CheckCircle2Icon className="h-5 w-5 text-emerald-500 shrink-0" /> : <AlertTriangleIcon className="h-5 w-5 text-amber-400 shrink-0" />}
                            <div>
                                <h4 className="text-[13px] font-bold text-white/90">
                                    {llmsFound ? 'Fichier detecte sur le site' : content ? 'Brouillon disponible' : 'Aucun brouillon pour le moment'}
                                </h4>
                                <p className="mt-1 text-[11px] text-white/60">
                                    {llmsFound
                                        ? 'Le dernier audit a deja observe un llms.txt sur le site.'
                                        : content
                                            ? 'Le moteur de remediation a genere un brouillon exploitable pour ce client.'
                                            : 'Generez un brouillon a partir des donnees du client et de l audit.'}
                                </p>
                            </div>
                        </div>

                        <div className={cn(COMMAND_PANEL, 'p-0 flex-1 flex flex-col overflow-hidden')}>
                            <div className="border-b border-white/[0.05] bg-white/[0.01] p-4">
                                <h3 className="text-[12px] font-semibold text-white/90">Structure analysee</h3>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                                <div>
                                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Sections detectees</h4>
                                    <div className="space-y-2">
                                        {sectionRows.map((section) => (
                                            <div key={section.label} className={cn(
                                                'flex items-center justify-between rounded border p-2 text-[11px]',
                                                section.present ? 'border-white/[0.05] bg-white/[0.02]' : 'border-rose-500/20 bg-rose-500/5',
                                            )}>
                                                <span className={section.present ? 'text-white/80' : 'text-rose-200/80'}>{section.label}</span>
                                                <span className={section.present ? 'text-emerald-400' : 'text-rose-400'}>{section.present ? 'Present' : 'Manquant'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                        <AlertTriangleIcon className="h-3 w-3" />
                                        Recommandations operateur
                                    </h4>
                                    <ul className="space-y-2 pl-4 text-[11px] text-amber-200/70 list-disc">
                                        {recommendations.length > 0 ? recommendations.map((item) => <li key={item}>{item}</li>) : <li>Aucune alerte additionnelle a ce stade.</li>}
                                    </ul>
                                </div>

                                <div className="rounded border border-white/[0.05] bg-white/[0.02] p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Contexte client</div>
                                    <div className="mt-2 text-[11px] text-white/65">Entreprise: {client?.client_name || 'n.d.'}</div>
                                    <div className="mt-1 text-[11px] text-white/50">Site: {client?.website_url || 'n.d.'}</div>
                                    <div className="mt-1 text-[11px] text-white/50">Description: {client?.business_description || client?.short_description || 'n.d.'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CommandPageShell>
    );
}
