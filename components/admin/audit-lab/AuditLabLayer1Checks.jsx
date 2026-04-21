'use client';

import { useMemo, useState } from 'react';

import {
    LabDiagnosticSection,
    LabEmptyState,
    LabPill,
    LabSectionHeader,
} from './LabPrimitives';
import { getLayer1ViewModel, groupPageChecksByUrl, summarizePageGroups } from './audit-lab-model';
import {
    checkIdFr,
    checkStatusFr,
    humanizeCategoryKey,
    pageStatusFr,
} from './audit-lab-copy';

const FILTER_TABS = [
    { key: 'all', label: 'Tous' },
    { key: 'problem', label: 'Problèmes', tone: 'bad' },
    { key: 'watch', label: 'À surveiller', tone: 'warn' },
    { key: 'ok', label: 'OK', tone: 'good' },
    { key: 'skip', label: 'Non applicable', tone: 'neutral' },
    { key: 'unknown', label: 'Indéterminé', tone: 'neutral' },
];

function statusDotClass(tone) {
    if (tone === 'good') return 'bg-emerald-400/80';
    if (tone === 'warn') return 'bg-amber-400/80';
    if (tone === 'bad') return 'bg-red-400/80';
    return 'bg-white/30';
}

function matchesSearch(group, needle) {
    if (!needle) return true;
    const lower = needle.toLowerCase();
    if (group.url.toLowerCase().includes(lower)) return true;
    for (const check of group.checks) {
        if (String(check?.category || '').toLowerCase().includes(lower)) return true;
        if (String(check?.check_id || '').toLowerCase().includes(lower)) return true;
    }
    return false;
}

function matchesFilter(group, filter) {
    if (filter === 'all') return true;
    if (filter === 'problem') return group.fail > 0;
    if (filter === 'watch') return group.fail === 0 && group.warn > 0;
    if (filter === 'ok') return group.fail === 0 && group.warn === 0 && group.pass > 0;
    if (filter === 'skip') return group.total > 0 && group.pass === 0 && group.warn === 0 && group.fail === 0 && group.skip > 0;
    if (filter === 'unknown') return group.total === 0 || group.unknown === group.total;
    return true;
}

function PageChecksRow({ group, checkFilter }) {
    const [open, setOpen] = useState(false);
    const status = pageStatusFr(group.pageStatus);

    const visibleChecks = useMemo(() => {
        if (checkFilter === 'all') return group.checks;
        return group.checks.filter((check) => {
            const s = checkStatusFr(check);
            if (checkFilter === 'problem') return s.key === 'problem';
            if (checkFilter === 'watch') return s.key === 'watch';
            if (checkFilter === 'ok') return s.key === 'ok';
            if (checkFilter === 'skip') return s.key === 'skip';
            if (checkFilter === 'unknown') return s.key === 'unknown';
            return true;
        });
    }, [group.checks, checkFilter]);

    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.025]"
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(status.tone)}`} />
                    <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium text-white/85" title={group.url}>
                            {group.url}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/40">
                            {group.pageType && (
                                <>
                                    <span className="text-white/55">{group.pageType}</span>
                                    <span className="text-white/15">·</span>
                                </>
                            )}
                            <span>{group.total} vérification{group.total > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    {group.fail > 0 && <LabPill label={`${group.fail} problème${group.fail > 1 ? 's' : ''}`} tone="bad" />}
                    {group.warn > 0 && <LabPill label={`${group.warn} à surveiller`} tone="warn" />}
                    {group.pass > 0 && group.fail === 0 && group.warn === 0 && <LabPill label={`${group.pass} OK`} tone="good" />}
                    {group.pageStatus === 'unknown' && <LabPill label="Indéterminé" tone="neutral" />}
                    <span className={`ml-1 text-xs text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                </div>
            </button>

            {open && (
                <div className="border-t border-white/[0.05] p-3">
                    {visibleChecks.length === 0 ? (
                        <p className="text-[11px] italic text-white/40">Aucune vérification ne correspond au filtre courant.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                            {visibleChecks.map((check, index) => {
                                const s = checkStatusFr(check);
                                const borderClass = s.tone === 'good'
                                    ? 'border-emerald-400/15 bg-emerald-400/[0.03]'
                                    : s.tone === 'warn'
                                    ? 'border-amber-400/15 bg-amber-400/[0.03]'
                                    : s.tone === 'bad'
                                    ? 'border-red-400/15 bg-red-400/[0.03]'
                                    : 'border-white/[0.06] bg-white/[0.02]';
                                const label = checkIdFr(check.check_id || check.id) || humanizeCategoryKey(check.category || 'vérification');
                                return (
                                    <div
                                        key={`${check.check_id || check.id || 'check'}-${index}`}
                                        className={`rounded-md border px-2.5 py-1.5 ${borderClass}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div
                                                    className="truncate text-[11px] font-medium text-white/85"
                                                    title={check.check_id || check.id || ''}
                                                >
                                                    {label}
                                                </div>
                                                {check.category && (
                                                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                                                        {humanizeCategoryKey(check.category)}
                                                    </div>
                                                )}
                                            </div>
                                            <LabPill label={s.label} tone={s.tone} />
                                        </div>
                                        {check.evidence && (
                                            <p className="mt-1 line-clamp-2 text-[10px] text-white/50">
                                                {typeof check.evidence === 'string' ? check.evidence : JSON.stringify(check.evidence)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Section C — Vérifications détaillées (couche 1).
 *
 * Les checks sont regroupés par URL, avec un statut **dérivé** à partir des
 * compteurs (`fail`, `warn`, `pass`, `skip`, `unknown`). Onglets et recherche
 * laissent l'opérateur isoler rapidement les pages à traiter.
 */
export default function AuditLabLayer1Checks({ audit }) {
    const model = getLayer1ViewModel(audit);
    const groups = useMemo(() => groupPageChecksByUrl(model.pageLevelChecks), [model.pageLevelChecks]);
    const totals = useMemo(() => summarizePageGroups(groups), [groups]);

    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () => groups.filter((group) => matchesFilter(group, filter) && matchesSearch(group, search.trim())),
        [groups, filter, search],
    );

    if (groups.length === 0) {
        return (
            <LabDiagnosticSection ribbon="Section C · vérifications détaillées">
                <LabSectionHeader
                    eyebrow="Section C · Vérifications détaillées"
                    title="Aucune vérification par page"
                    subtitle="Les vérifications automatiques par URL apparaîtront ici après un audit complet. Le résultat Trouvable reste valide sans cette section."
                    variant="diagnostic"
                />
                <LabEmptyState
                    title="Données de vérifications absentes"
                    description="Cet audit ne contient pas le détail des checks par page (mode ombre ou audit antérieur au pipeline en couches)."
                />
            </LabDiagnosticSection>
        );
    }

    const tabCounts = {
        all: totals.pages.total,
        problem: totals.pages.problem || 0,
        watch: totals.pages.watch || 0,
        ok: totals.pages.ok || 0,
        skip: groups.filter((g) => matchesFilter(g, 'skip')).length,
        unknown: totals.pages.unknown || 0,
    };

    return (
        <LabDiagnosticSection ribbon="Section C · vérifications détaillées">
            <LabSectionHeader
                eyebrow="Section C · Vérifications détaillées"
                title="Vérifications automatiques par page"
                subtitle="Chaque page explorée est testée sur un ensemble de points techniques. Filtrez par statut ou recherchez une URL pour isoler les priorités."
                variant="diagnostic"
                right={<LabPill label="diagnostic interne" tone="warn" />}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Pages testées</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-white/85">{totals.pages.total}</div>
                </div>
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-300/80">Pages en problème</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-red-300">{totals.pages.problem || 0}</div>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-300/80">À surveiller</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-amber-200">{totals.pages.watch || 0}</div>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-300/80">Pages OK</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-emerald-300">{totals.pages.ok || 0}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Vérifications</div>
                    <div className="mt-1 flex items-baseline gap-1 text-[12px] text-white/80">
                        <span className="font-semibold tabular-nums text-emerald-300/90">{totals.checks.pass}</span>
                        <span className="text-white/25">·</span>
                        <span className="font-semibold tabular-nums text-amber-200/90">{totals.checks.warn}</span>
                        <span className="text-white/25">·</span>
                        <span className="font-semibold tabular-nums text-red-300/90">{totals.checks.fail}</span>
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-white/30">OK · surv. · pb</div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                {FILTER_TABS.map((tab) => {
                    const isActive = filter === tab.key;
                    const count = tabCounts[tab.key] ?? 0;
                    const toneClass = isActive
                        ? tab.tone === 'bad'
                            ? 'border-red-400/40 bg-red-400/[0.08] text-red-200'
                            : tab.tone === 'warn'
                            ? 'border-amber-400/40 bg-amber-400/[0.08] text-amber-200'
                            : tab.tone === 'good'
                            ? 'border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-200'
                            : 'border-white/25 bg-white/[0.06] text-white/85'
                        : 'border-white/[0.08] bg-white/[0.015] text-white/55 hover:text-white/80';
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setFilter(tab.key)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${toneClass}`}
                        >
                            <span>{tab.label}</span>
                            <span className="rounded-full bg-white/[0.06] px-1.5 py-px text-[9px] tabular-nums text-white/70">
                                {count}
                            </span>
                        </button>
                    );
                })}
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher une URL ou une catégorie…"
                    className="geo-inp ml-auto min-w-[220px] flex-1 px-3 py-1.5 text-[12px] sm:max-w-sm sm:flex-none"
                />
            </div>

            <div className="mt-4 space-y-1.5">
                {filtered.length === 0 ? (
                    <LabEmptyState
                        title="Aucune page ne correspond"
                        description="Essayez un autre onglet ou videz le filtre de recherche."
                    />
                ) : (
                    filtered.slice(0, 80).map((group) => (
                        <PageChecksRow key={group.url} group={group} checkFilter={filter} />
                    ))
                )}
                {filtered.length > 80 && (
                    <p className="pt-1 text-[10px] text-white/35">
                        + {filtered.length - 80} autres pages masquées (affinez la recherche pour les faire apparaître).
                    </p>
                )}
            </div>
        </LabDiagnosticSection>
    );
}
