'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListFilter, Sparkles } from 'lucide-react';

import ReliabilityPill from '@/components/ui/ReliabilityPill';

import CorrectionPromptGenerator from '../components/seo/CorrectionPromptGenerator';
import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import {
    SeoActionLink,
    SeoEmptyState,
    SeoLoadingState,
    SeoPageHeader,
    SeoPageShell,
    SeoPanel,
    SeoStatusBadge,
} from '../components/SeoOpsPrimitives';

function getPriorityStatus(value) {
    const normalized = String(value || 'medium').toLowerCase();
    if (normalized === 'critical' || normalized === 'high') return 'critical';
    if (normalized === 'low') return 'ok';
    return 'warning';
}

function toTruthLabel(value) {
    const normalized = String(value || 'unavailable').toLowerCase();
    if (normalized === 'observed') return 'observe';
    if (normalized === 'derived') return 'calcule';
    if (normalized === 'inferred') return 'infere';
    if (normalized === 'recommended') return 'recommande';
    return 'indisponible';
}

function compactText(value, fallback) {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed || fallback;
}

function IssueSelectorCard({ issue, active, onSelect }) {
    const evidence = compactText(issue?.evidence, 'Preuve indisponible.');
    const truthLabel = toTruthLabel(issue?.truth_class);

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-[22px] border p-4 text-left transition-all duration-200 ${
                active
                    ? 'border-sky-300/24 bg-sky-400/10 shadow-[0_16px_36px_rgba(0,0,0,0.26)]'
                    : 'border-white/[0.08] bg-black/22 hover:border-white/[0.16] hover:bg-white/[0.04]'
            }`}
            aria-pressed={active}
        >
            <div className="flex flex-wrap items-center gap-2">
                <SeoStatusBadge status={getPriorityStatus(issue?.priority)} label={`Priorite ${String(issue?.priority || 'medium').toLowerCase()}`} />
                <ReliabilityPill value={issue?.reliability || 'unavailable'} />
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/56">
                    Verite {truthLabel}
                </span>
            </div>
            <div className="mt-3 text-[14px] font-semibold leading-relaxed text-white/92">{compactText(issue?.title, 'Probleme technique')}</div>
            <div className="mt-2 text-[12px] leading-relaxed text-white/62 line-clamp-2">{compactText(issue?.description, issue?.title || 'Description indisponible.')}</div>
            <div className="mt-3 rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-white/78 line-clamp-3">
                {evidence}
            </div>
        </button>
    );
}

export default function SeoCorrectionPromptsView() {
    const searchParams = useSearchParams();
    const preferredIssueId = searchParams.get('issueId');

    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useSeoWorkspaceSlice('health');

    const [selectedIssueId, setSelectedIssueId] = useState(null);

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    const promptableIssues = useMemo(
        () => (data?.issues || []).filter((issue) => issue?.promptAvailable !== false),
        [data?.issues],
    );

    useEffect(() => {
        if (!promptableIssues.length) {
            setSelectedIssueId(null);
            return;
        }

        const hasPreferred = preferredIssueId && promptableIssues.some((issue) => issue.id === preferredIssueId);
        if (hasPreferred) {
            setSelectedIssueId(preferredIssueId);
            return;
        }

        setSelectedIssueId((current) => {
            if (current && promptableIssues.some((issue) => issue.id === current)) {
                return current;
            }
            return promptableIssues[0].id;
        });
    }, [preferredIssueId, promptableIssues]);

    const selectedIssue = useMemo(
        () => promptableIssues.find((issue) => issue.id === selectedIssueId) || null,
        [promptableIssues, selectedIssueId],
    );

    if (loading) {
        return <SeoLoadingState title="Chargement des prompts de correction SEO..." description="Recuperation des problemes SEO Health eligibles, de la preuve associee et des reperes de generation." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Prompts de correction indisponibles"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/health`}>Retour sante SEO</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Prompts de correction IA"
                subtitle={`Section pilote SEO: selectionner un probleme reel, generer une variante standard ou strict, puis lancer la correction dans le repo pour ${client?.client_name || 'ce mandat'}.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/health`} variant="secondary">Sante SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/opportunities`} variant="secondary">Opportunites</SeoActionLink>
                    </>
                )}
            />

            <SeoPanel
                title="Feature pilote SEO"
                subtitle="Trouvable assemble le contexte reel du probleme SEO Health, puis genere via Mistral un prompt exploitable pour un agent de code."
                reliability="measured"
                tone="info"
            >
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Problemes eligibles</div>
                        <div className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white/92">{promptableIssues.length}</div>
                        <div className="mt-1 text-[12px] text-white/58">Issues SEO Health avec preuve exploitable pour generation.</div>
                    </div>
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Portee active</div>
                        <div className="mt-2 text-[14px] font-semibold text-white/90">SEO uniquement</div>
                        <div className="mt-1 text-[12px] text-white/58">Pas de propagation hors surface pilote tant que la stabilite n'est pas validee.</div>
                    </div>
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                            <Sparkles className="h-3.5 w-3.5" />
                            Workflow operateur
                        </div>
                        <div className="mt-2 text-[12px] leading-relaxed text-white/72">
                            1. Choisir un probleme
                            <br />
                            2. Generer standard ou strict
                            <br />
                            3. Copier et executer le prompt
                        </div>
                    </div>
                </div>
            </SeoPanel>

            {data?.emptyState ? (
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} action={<SeoActionLink href={`${baseHref}/seo/health`}>Voir la sante SEO</SeoActionLink>} />
            ) : promptableIssues.length === 0 ? (
                <SeoEmptyState
                    title="Aucun probleme eligible pour prompt"
                    description="Le dernier audit ne fournit pas encore de probleme technique SEO exploitable pour la generation de prompt de correction."
                    action={<SeoActionLink href={`${baseHref}/seo/health`}>Retour a la sante SEO</SeoActionLink>}
                />
            ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
                    <SeoPanel
                        title="Problemes SEO eligibles"
                        subtitle="Selectionner un probleme prioritaire pour construire le prompt sur une preuve reelle."
                        reliability="measured"
                        tone="default"
                    >
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/42">
                            <ListFilter className="h-3.5 w-3.5" />
                            {promptableIssues.length} probleme(s) disponible(s)
                        </div>
                        <div className="space-y-3">
                            {promptableIssues.map((issue) => (
                                <IssueSelectorCard
                                    key={issue.id || issue.key || issue.title || issue.label}
                                    issue={issue}
                                    active={issue.id === selectedIssueId}
                                    onSelect={() => setSelectedIssueId(issue.id)}
                                />
                            ))}
                        </div>
                    </SeoPanel>

                    <SeoPanel
                        title="Generation du prompt"
                        subtitle={selectedIssue
                            ? 'Prompt ancre dans la preuve observee, avec contraintes et validations derivees du contexte repo.'
                            : 'Selectionner un probleme pour generer un prompt.'}
                        reliability="calculated"
                        tone="default"
                    >
                        {selectedIssue ? (
                            <CorrectionPromptGenerator clientId={clientId} issue={selectedIssue} />
                        ) : (
                            <SeoEmptyState
                                title="Aucun probleme selectionne"
                                description="Selectionner un probleme dans la colonne de gauche pour activer la generation standard/strict."
                            />
                        )}
                    </SeoPanel>
                </div>
            )}
        </SeoPageShell>
    );
}


