'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListFilter, Sparkles } from 'lucide-react';

import ReliabilityPill from '@/components/ui/ReliabilityPill';
import { problemRefFromSearchParams } from '@/lib/correction-prompts/problem-ref';

import CorrectionPromptGenerator from '../components/seo/CorrectionPromptGenerator';
import { OperatorNarrativeHeader, OperatorWorkbenchFrame } from '../components/operator/OperatorScene';
import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import { useIssueHandoff } from '../context/IssueHandoffContext';
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
    if (normalized === 'observed') return 'observé';
    if (normalized === 'derived') return 'calculé';
    if (normalized === 'inferred') return 'inféré';
    if (normalized === 'recommended') return 'recommandé';
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
                <SeoStatusBadge status={getPriorityStatus(issue?.priority)} label={`Priorité ${String(issue?.priority || 'medium').toLowerCase()}`} />
                <ReliabilityPill value={issue?.reliability || 'unavailable'} />
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/56">
                    Vérité {truthLabel}
                </span>
            </div>
            <div className="mt-3 text-[14px] font-semibold leading-relaxed text-white/92">{compactText(issue?.title, 'Problème technique')}</div>
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
    const autoGenerate = searchParams.get('auto') === '1';

    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useSeoWorkspaceSlice('health');
    const { openHandoff } = useIssueHandoff();

    // Si l'URL contient un ProblemRef (source != seo_health_issue),
    // on ouvre directement le drawer universel avec ce ref. Cela permet
    // aux handoffs depuis Lab L1/L2, opportunités, GEO, etc. de converger
    // vers la même UX « génère depuis n'importe où ».
    // handoffUi=page : lien « Page complète » / navigation explicite vers cette
    // vue — ne pas rouvrir le drawer (le contexte reste dans l'URL pour la page).
    useEffect(() => {
        if (!clientId) return;
        if (searchParams.get('handoffUi') === 'page') return;
        const ref = problemRefFromSearchParams(clientId, searchParams);
        if (!ref) return;
        if (ref.source === 'seo_health_issue') return; // déjà géré par la page
        openHandoff(ref);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, searchParams]);

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
        return <SeoLoadingState title="Chargement des prompts de correction SEO…" description="Récupération des problèmes SEO Health éligibles, de la preuve associée et des repères de génération." />;
    }

    if (error) {
        return (
            <SeoPageShell>
                <SeoEmptyState
                    title="Prompts de correction indisponibles"
                    description={error}
                    action={<SeoActionLink href={`${baseHref}/seo/health`}>Retour santé SEO</SeoActionLink>}
                />
            </SeoPageShell>
        );
    }

    return (
        <SeoPageShell>
            <SeoPageHeader
                eyebrow="SEO Ops"
                title="Prompts de correction IA"
                subtitle={`Section pilote SEO : sélectionner un problème réel, générer une variante standard ou stricte, puis lancer la correction dans le dépôt pour ${client?.client_name || 'ce mandat'}.`}
                actions={(
                    <>
                        <SeoActionLink href={`${baseHref}/seo/health`} variant="secondary">Santé SEO</SeoActionLink>
                        <SeoActionLink href={`${baseHref}/seo/opportunities`} variant="secondary">Opportunités</SeoActionLink>
                    </>
                )}
            />

            <OperatorNarrativeHeader
                accent="emerald"
                eyebrow="Établi opérateur"
                title="Sélection → preuve → prompt exécutable"
                description="Disposition atelier : liste des problèmes à gauche (scroll dédié), générateur au centre, guide de discipline à droite. Même flux qu’avant, mais hiérarchisé pour enchaîner vite."
            />

            <SeoPanel
                title="Fonction pilote SEO"
                subtitle="Trouvable assemble le contexte réel du problème SEO Health, puis génère via Mistral un prompt exploitable pour un agent de code."
                reliability="measured"
                tone="info"
            >
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Problèmes éligibles</div>
                        <div className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white/92">{promptableIssues.length}</div>
                        <div className="mt-1 text-[12px] text-white/58">Issues SEO Health avec preuve exploitable pour génération.</div>
                    </div>
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">Portee active</div>
                        <div className="mt-2 text-[14px] font-semibold text-white/90">SEO uniquement</div>
                        <div className="mt-1 text-[12px] text-white/58">Pas de propagation hors surface pilote tant que la stabilité n&apos;est pas validée.</div>
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
                <SeoEmptyState title={data.emptyState.title} description={data.emptyState.description} action={<SeoActionLink href={`${baseHref}/seo/health`}>Voir la santé SEO</SeoActionLink>} />
            ) : promptableIssues.length === 0 ? (
                <SeoEmptyState
                    title="Aucun problème éligible pour prompt"
                    description="Le dernier audit ne fournit pas encore de problème technique SEO exploitable pour la génération de prompt de correction."
                    action={<SeoActionLink href={`${baseHref}/seo/health`}>Retour à la santé SEO</SeoActionLink>}
                />
            ) : (
                <OperatorWorkbenchFrame
                    left={(
                        <div className="flex h-full max-h-[min(72vh,820px)] flex-col rounded-[26px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(10,12,16,0.96)_0%,rgba(7,8,10,0.92)_100%)] shadow-[0_24px_56px_rgba(0,0,0,0.35)]">
                            <div className="shrink-0 border-b border-white/[0.06] px-4 py-4">
                                <div className="text-[15px] font-semibold text-white/95">Problèmes SEO éligibles</div>
                                <div className="mt-1 text-[12px] text-white/48">Sélection ancrée dans la preuve observée.</div>
                                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/42">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    {promptableIssues.length} problème(s)
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2 geo-scrollbar">
                                <div className="space-y-3 pr-1">
                                    {promptableIssues.map((issue) => (
                                        <IssueSelectorCard
                                            key={issue.id || issue.key || issue.title || issue.label}
                                            issue={issue}
                                            active={issue.id === selectedIssueId}
                                            onSelect={() => setSelectedIssueId(issue.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    center={(
                        <SeoPanel
                            title="Génération du prompt"
                            subtitle={selectedIssue
                                ? 'Prompt ancré dans la preuve observée, avec contraintes et validations dérivées du contexte dépôt.'
                                : 'Sélectionner un problème pour générer un prompt.'}
                            reliability="calculated"
                            tone="default"
                        >
                            {selectedIssue ? (
                                <CorrectionPromptGenerator clientId={clientId} issue={selectedIssue} autoGenerate={autoGenerate} />
                            ) : (
                                <SeoEmptyState
                                    title="Aucun problème sélectionné"
                                    description="Sélectionner un problème dans la colonne de gauche pour activer la génération standard / stricte."
                                />
                            )}
                        </SeoPanel>
                    )}
                    right={(
                        <div className="xl:sticky xl:top-20 space-y-3">
                            <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
                                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200/90">Discipline</div>
                                <p className="mt-2 text-[12px] leading-relaxed text-white/65">
                                    Standard pour l’exécution courante ; strict lorsque la preuve doit limiter toute extrapolation.
                                </p>
                            </div>
                            <div className="rounded-[22px] border border-white/[0.08] bg-[#0b0d11]/92 p-4 space-y-3">
                                <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/42">Variante standard</div>
                                    <div className="mt-1 text-[11px] leading-relaxed text-white/72">
                                        Contraintes dépôt + validation + correctif minimal.
                                    </div>
                                </div>
                                <div className="rounded-[18px] border border-amber-400/20 bg-amber-400/5 p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-200">Variante stricte</div>
                                    <div className="mt-1 text-[11px] leading-relaxed text-white/72">
                                        Inspect-first, aucune extrapolation, preuve obligatoire.
                                    </div>
                                </div>
                                <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/42">Boucle conseillée</div>
                                    <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-white/72">
                                        <li>1. Générer (standard)</li>
                                        <li>2. Copier dans un agent code</li>
                                        <li>3. Valider le correctif localement</li>
                                        <li>4. Rejouer l&apos;audit pour confirmer</li>
                                    </ul>
                                </div>
                                <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/42">Surfaces reliées</div>
                                    <div className="mt-2 flex flex-col gap-1.5">
                                        <SeoActionLink href={`${baseHref}/seo/health`} variant="subtle" className="!justify-start !px-3 !py-1.5 !text-[11px]">
                                            ← Santé SEO
                                        </SeoActionLink>
                                        <SeoActionLink href={`${baseHref}/dossier/audit`} variant="subtle" className="!justify-start !px-3 !py-1.5 !text-[11px]">
                                            ← Audit Lab (L1 / L2)
                                        </SeoActionLink>
                                        <SeoActionLink href={`${baseHref}/seo/opportunities`} variant="subtle" className="!justify-start !px-3 !py-1.5 !text-[11px]">
                                            ← Opportunités SEO
                                        </SeoActionLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                />
            )}
        </SeoPageShell>
    );
}


