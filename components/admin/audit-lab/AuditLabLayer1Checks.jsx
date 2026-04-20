'use client';

import { useMemo, useState } from 'react';

import {
    LabCollapsible,
    LabDiagnosticSection,
    LabEmptyState,
    LabPill,
    LabSectionHeader,
} from './LabPrimitives';
import { getLayer1ViewModel, groupPageChecksByUrl } from './audit-lab-model';
import { checkStatusFr, humanizeCategoryKey, severityFr, severityTone } from './audit-lab-copy';

function statusDotClass(tone) {
    if (tone === 'good') return 'bg-emerald-400/80';
    if (tone === 'warn') return 'bg-amber-400/80';
    if (tone === 'bad') return 'bg-red-400/80';
    return 'bg-white/30';
}

function PageChecksRow({ group }) {
    const [open, setOpen] = useState(false);

    const statusSummary = useMemo(() => {
        let ok = 0;
        let watch = 0;
        let problem = 0;
        let unknown = 0;
        for (const check of group.checks) {
            const { tone } = checkStatusFr(check);
            if (tone === 'good') ok++;
            else if (tone === 'warn') watch++;
            else if (tone === 'bad') problem++;
            else unknown++;
        }
        return { ok, watch, problem, unknown };
    }, [group.checks]);

    const worstTone = statusSummary.problem > 0
        ? 'bad'
        : statusSummary.watch > 0
        ? 'warn'
        : statusSummary.ok > 0
        ? 'good'
        : 'neutral';

    return (
        <div className="rounded-lg border border-white/[0.05] bg-white/[0.015]">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/[0.02]"
            >
                <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(worstTone)}`} />
                    <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium text-white/80" title={group.url}>
                            {group.url}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/40">
                            <span>{group.total} vérification{group.total > 1 ? 's' : ''}</span>
                            {statusSummary.ok > 0 && (
                                <>
                                    <span className="text-white/20">·</span>
                                    <span className="text-emerald-300/70">{statusSummary.ok} OK</span>
                                </>
                            )}
                            {statusSummary.watch > 0 && (
                                <>
                                    <span className="text-white/20">·</span>
                                    <span className="text-amber-300/70">{statusSummary.watch} à surveiller</span>
                                </>
                            )}
                            {statusSummary.problem > 0 && (
                                <>
                                    <span className="text-white/20">·</span>
                                    <LabPill label={`${statusSummary.problem} problème${statusSummary.problem > 1 ? 's' : ''}`} tone="bad" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <span className={`text-xs text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {open && (
                <div className="border-t border-white/[0.05] p-3">
                    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                        {group.checks.map((check, index) => {
                            const status = checkStatusFr(check);
                            const borderClass = status.tone === 'good'
                                ? 'border-emerald-400/15 bg-emerald-400/[0.03]'
                                : status.tone === 'warn'
                                ? 'border-amber-400/15 bg-amber-400/[0.03]'
                                : status.tone === 'bad'
                                ? 'border-red-400/15 bg-red-400/[0.03]'
                                : 'border-white/[0.06] bg-white/[0.02]';
                            const severityLabel = severityFr(check.severity);
                            const checkLabel = check.title
                                || check.label
                                || humanizeCategoryKey(check.check_id || check.id || 'vérification');
                            return (
                                <div
                                    key={`${check.check_id || check.id || 'check'}-${index}`}
                                    className={`rounded-md border px-2.5 py-1.5 ${borderClass}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-[11px] font-medium text-white/80" title={check.check_id || check.id}>
                                            {checkLabel}
                                        </span>
                                        <div className="flex shrink-0 items-center gap-1">
                                            {severityLabel && status.tone !== 'good' && (
                                                <LabPill label={severityLabel} tone={severityTone(check.severity)} />
                                            )}
                                            <LabPill label={status.label} tone={status.tone} />
                                        </div>
                                    </div>
                                    {check.evidence && (
                                        <p className="mt-1 line-clamp-2 text-[10px] text-white/45">
                                            {typeof check.evidence === 'string' ? check.evidence : JSON.stringify(check.evidence)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Section 4 — Vérifications détaillées (couche 1).
 *
 * Regroupe les checks déterministes par URL avec des statuts lisibles
 * (OK / À surveiller / Problème). Reste diagnostique : pas de score, pas
 * de vérité produit.
 */
export default function AuditLabLayer1Checks({ audit }) {
    const model = getLayer1ViewModel(audit);
    const checks = model.pageLevelChecks;
    const groupedChecks = useMemo(() => groupPageChecksByUrl(checks), [checks]);

    const totals = useMemo(() => {
        let ok = 0;
        let watch = 0;
        let problem = 0;
        for (const group of groupedChecks) {
            for (const check of group.checks) {
                const { tone } = checkStatusFr(check);
                if (tone === 'good') ok++;
                else if (tone === 'warn') watch++;
                else if (tone === 'bad') problem++;
            }
        }
        return { ok, watch, problem, total: ok + watch + problem };
    }, [groupedChecks]);

    if (groupedChecks.length === 0) {
        return (
            <LabDiagnosticSection ribbon="Couche 1 · vérifications détaillées">
                <LabSectionHeader
                    eyebrow="Section 4 · Vérifications détaillées"
                    title="Aucune vérification par page"
                    subtitle="Les vérifications automatiques par URL apparaîtront ici après un audit complet. Le résultat Trouvable reste valide sans cette section."
                    variant="diagnostic"
                />
                <LabEmptyState
                    title="Données de vérifications absentes"
                    description="Cet audit ne contient pas le détail des checks par page (mode ombre ou audit antérieur)."
                />
            </LabDiagnosticSection>
        );
    }

    const pagesWithProblem = groupedChecks.filter((g) => g.checks.some((c) => {
        const { tone } = checkStatusFr(c);
        return tone === 'bad';
    }));
    const pagesToWatch = groupedChecks.filter((g) => g.checks.some((c) => {
        const { tone } = checkStatusFr(c);
        return tone === 'warn';
    }) && !g.checks.some((c) => checkStatusFr(c).tone === 'bad'));
    const pagesOk = groupedChecks.filter((g) => !pagesWithProblem.includes(g) && !pagesToWatch.includes(g));

    return (
        <LabDiagnosticSection ribbon="Couche 1 · vérifications détaillées">
            <LabSectionHeader
                eyebrow="Section 4 · Vérifications détaillées"
                title="Vérifications automatiques par page"
                subtitle="Chaque page explorée est testée sur un ensemble de points techniques. Les regroupements ci-dessous permettent de voir rapidement où agir en priorité."
                variant="diagnostic"
                right={<LabPill label="diagnostic interne" tone="warn" />}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Pages testées</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-white/85">{groupedChecks.length}</div>
                </div>
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-300/80">Problèmes</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-red-300">{totals.problem}</div>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300/80">À surveiller</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-amber-200">{totals.watch}</div>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-300/80">OK</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-emerald-300">{totals.ok}</div>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {pagesWithProblem.length > 0 && (
                    <div>
                        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-red-300/80">
                            Pages avec problèmes ({pagesWithProblem.length})
                        </div>
                        <div className="space-y-1.5">
                            {pagesWithProblem.slice(0, 20).map((group) => (
                                <PageChecksRow key={group.url} group={group} />
                            ))}
                            {pagesWithProblem.length > 20 && (
                                <p className="text-[10px] text-white/35">+ {pagesWithProblem.length - 20} autres pages avec problèmes</p>
                            )}
                        </div>
                    </div>
                )}

                {pagesToWatch.length > 0 && (
                    <LabCollapsible
                        label={`Pages à surveiller (${pagesToWatch.length})`}
                        hint="Vérifications de gravité faible à moyenne"
                        defaultOpen={pagesWithProblem.length === 0}
                    >
                        <div className="space-y-1.5">
                            {pagesToWatch.slice(0, 30).map((group) => (
                                <PageChecksRow key={group.url} group={group} />
                            ))}
                            {pagesToWatch.length > 30 && (
                                <p className="text-[10px] text-white/35">+ {pagesToWatch.length - 30} autres</p>
                            )}
                        </div>
                    </LabCollapsible>
                )}

                {pagesOk.length > 0 && (
                    <LabCollapsible
                        label={`Pages sans anomalie (${pagesOk.length})`}
                        hint="Toutes les vérifications sont passées"
                    >
                        <div className="space-y-1.5">
                            {pagesOk.slice(0, 50).map((group) => (
                                <PageChecksRow key={group.url} group={group} />
                            ))}
                            {pagesOk.length > 50 && (
                                <p className="text-[10px] text-white/35">+ {pagesOk.length - 50} autres</p>
                            )}
                        </div>
                    </LabCollapsible>
                )}
            </div>
        </LabDiagnosticSection>
    );
}
