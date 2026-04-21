'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import {
    GeoPremiumCard,
    GeoProvenancePill,
    GeoStatusDot,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    COMMAND_BUTTONS,
    CommandEmptyState,
    CommandMetricCard,
    CommandSkeleton,
    cn,
} from '../components/command';

const VERDICT_META = {
    bon: { label: 'Bon', accent: 'emerald', copy: 'Base exploitable pour la lecture AGENT.' },
    a_consolider: { label: 'À consolider', accent: 'amber', copy: 'Base partielle, certains axes restent faibles.' },
    a_reprendre: { label: 'À reprendre', accent: 'red', copy: 'Base insuffisante pour un pilotage AGENT.' },
    unavailable: { label: 'Indisponible', accent: 'default', copy: 'Pas assez de données pour conclure.' },
};

const CONFIDENCE_LABELS = {
    high: 'Confiance haute',
    medium: 'Confiance moyenne',
    low: 'Confiance basse',
    unavailable: 'Confiance indisponible',
};

const SUBSCORE_LABELS = {
    visibility: 'Visibilité',
    readiness: 'Préparation',
    actionability: 'Actionnabilité',
    advanced_protocols: 'Protocoles avancés',
};

function hoursSince(iso) {
    if (!iso) return null;
    const parsed = new Date(iso).getTime();
    if (Number.isNaN(parsed)) return null;
    return Math.floor((Date.now() - parsed) / 3600000);
}

function formatAge(iso) {
    const h = hoursSince(iso);
    if (h === null) return 'Indisponible';
    if (h < 1) return '< 1h';
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
}

function formatWeightPercent(weight) {
    return `${Math.round(weight * 100)}%`;
}

function ScoreRing({ score, verdict }) {
    const meta = VERDICT_META[verdict] || VERDICT_META.unavailable;
    const value = typeof score === 'number' ? score : null;
    const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
    const circumference = 2 * Math.PI * 46;
    const dash = (pct / 100) * circumference;
    const accentColor = {
        emerald: '#34d399',
        amber: '#fbbf24',
        red: '#f87171',
        default: '#a1a1aa',
    }[meta.accent] || '#a1a1aa';

    return (
        <div className="flex items-center gap-5">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Score AGENT composite</div>
                <div className="mt-1 flex items-end gap-2">
                    <motion.span
                        key={value === null ? 'na' : value}
                        className="text-[44px] font-bold leading-none text-white tabular-nums"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {value === null ? '—' : value}
                    </motion.span>
                    <span className="mb-1 text-[14px] font-semibold text-white/45">/100</span>
                </div>
                <div className="mt-2 text-[12px] font-semibold text-white/75">{meta.label}</div>
                <div className="text-[11px] text-white/45 max-w-sm mt-0.5">{meta.copy}</div>
            </div>
        </div>
    );
}

function SubscoreCard({ subscore, delay = 0 }) {
    const label = SUBSCORE_LABELS[subscore.key] || subscore.key;
    const missing = subscore.score === null;
    const pct = missing ? 0 : Math.max(0, Math.min(100, subscore.score));
    const barColor = missing
        ? 'bg-white/20'
        : pct >= 70
            ? 'bg-emerald-400/75'
            : pct >= 40
                ? 'bg-amber-400/75'
                : 'bg-rose-400/75';
    return (
        <GeoPremiumCard className="p-4">
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">{label}</div>
                <span className="text-[10px] font-semibold text-white/35">Poids {formatWeightPercent(subscore.weight)}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
                <motion.span
                    className={`text-[28px] font-bold tabular-nums leading-none ${missing ? 'text-white/35' : 'text-white/95'}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
                >
                    {missing ? '—' : subscore.score}
                </motion.span>
                {!missing && <span className="text-[12px] font-semibold text-white/40">/100</span>}
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
            {subscore.provisional && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                    Provisoire
                </div>
            )}
            {subscore.reason && (
                <div className="mt-2 text-[11px] text-white/45 leading-snug">{subscore.reason}</div>
            )}
        </GeoPremiumCard>
    );
}

function TopFixRow({ fix, clientId }) {
    const priorityMeta = {
        high: { label: 'Haute', cls: 'text-red-300 bg-red-400/10 border-red-400/20' },
        medium: { label: 'Moyenne', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
        low: { label: 'Basse', cls: 'text-white/40 bg-white/[0.03] border-white/10' },
    }[fix.priority] || { label: fix.priority || '—', cls: 'text-white/50 bg-white/[0.03] border-white/10' };

    return (
        <Link
            href={`/admin/clients/${clientId}/geo/opportunities`}
            className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
        >
            <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/90 truncate">{fix.title}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                    <span className="uppercase tracking-wider">{fix.category || 'seo'}</span>
                    <span className="text-white/15">·</span>
                    <span>{fix.status}</span>
                </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityMeta.cls}`}>
                {priorityMeta.label}
            </span>
        </Link>
    );
}

function BlockerRow({ blocker }) {
    const statusMeta = {
        'bloqué': 'critical',
        'partiel': 'warning',
        'absent': 'critical',
        'à confirmer': 'warning',
        'couvert': 'ok',
    }[blocker.status] || 'idle';

    return (
        <div className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
            <div className="pt-1.5"><GeoStatusDot status={statusMeta} /></div>
            <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/90">{blocker.title}</div>
                {blocker.detail && <div className="text-[11px] text-white/45 leading-snug mt-0.5">{blocker.detail}</div>}
            </div>
        </div>
    );
}

export default function AgentOverviewView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent');

    if (loading) return <CommandSkeleton />;

    if (error) {
        return (
            <div className="mx-auto max-w-[1100px] p-8">
                <CommandEmptyState tone="critical" title="Vue AGENT indisponible" description={error} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="mx-auto max-w-[1100px] p-8">
                <CommandEmptyState title="Vue AGENT indisponible" description="Aucune donnée n’a pu être chargée." />
            </div>
        );
    }

    if (data.emptyState) {
        return (
            <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-10 md:px-8">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70">AGENT · Hub</div>
                    <h1 className="mt-3 text-2xl font-semibold text-white/95">Vue AGENT</h1>
                    <p className="mt-2 text-[13px] text-white/45">{`Mandat ${client?.client_name || ''}`.trim()}</p>
                </div>
                <CommandEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            </div>
        );
    }

    const { score, snapshot, topFixes, topBlockers, links, provenance } = data;
    const subscoreEntries = [
        score.subscores.visibility,
        score.subscores.readiness,
        score.subscores.actionability,
        score.subscores.advanced_protocols,
    ];

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#1f1c18] text-white">
            <div className="border-b border-amber-500/20 bg-[radial-gradient(ellipse_90%_80%_at_10%_-20%,rgba(245,158,11,0.12),transparent)]">
                <div className="mx-auto flex max-w-[1750px] flex-col gap-8 px-4 py-12 md:flex-row md:items-end md:justify-between md:px-10">
                    <div className="max-w-3xl space-y-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/70">agent.war_room.v1</div>
                        <h1 className="text-[clamp(1.9rem,3.4vw,2.85rem)] font-semibold tracking-[-0.055em] leading-tight">
                            Salle de lecture AGENT
                        </h1>
                        <p className="text-[14px] leading-relaxed text-white/48">
                            Composition en <span className="text-white/70">anneau + barres</span> : le score tient la circonférence, les sous-scores sont des colonnes de charge — puis deux bandeaux d’exécution horizontaux.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">
                                {CONFIDENCE_LABELS[score.confidence]}
                            </span>
                            {score.provisional ? (
                                <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-200">
                                    Score provisoire
                                </span>
                            ) : null}
                            <GeoProvenancePill meta={provenance.derived} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={links.fixes} className={`${COMMAND_BUTTONS.primary} rounded-2xl`}>Correctifs</Link>
                        <Link href={links.readiness} className={`${COMMAND_BUTTONS.secondary} rounded-2xl`}>Préparation</Link>
                        <Link href={links.visibility} className={`${COMMAND_BUTTONS.subtle} rounded-2xl`}>Visibilité</Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1750px] space-y-10 px-4 py-10 md:px-10 pb-20">
                <section className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-end">
                    <GeoPremiumCard className="relative overflow-hidden rounded-[28px] border border-amber-500/15 p-6">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
                        <div className="relative">
                            <ScoreRing score={score.agent_score} verdict={score.verdict} />
                        </div>
                    </GeoPremiumCard>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {subscoreEntries.map((subscore, index) => (
                            <SubscoreCard key={subscore.key} subscore={subscore} delay={0.12 + index * 0.06} />
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <CommandMetricCard label="Dernier audit" value={formatAge(snapshot.lastAuditAt)} detail="Âge du dernier crawl audité" />
                    <CommandMetricCard label="Dernière exécution moteur" value={formatAge(snapshot.lastRunAt)} detail="Âge du dernier run LLM" />
                    <CommandMetricCard label="Prompts suivis" value={snapshot.trackedPromptsTotal} detail="Total actif + inactif" />
                    <CommandMetricCard
                        label="Correctifs ouverts"
                        value={snapshot.openOpportunitiesCount}
                        detail={`${snapshot.highPriorityOpen} à haute priorité`}
                        tone={snapshot.highPriorityOpen > 0 ? 'warning' : 'neutral'}
                    />
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Bandeaux d’exécution</div>
                            <p className="mt-1 text-[12px] text-white/42">Défilement horizontal : correctifs puis blocages — lecture type « ticker » opérateur.</p>
                        </div>
                        <div className="flex gap-2 text-[11px] font-semibold">
                            <Link href={links.fixes} className="text-amber-200/90 hover:text-amber-100">Tous les correctifs →</Link>
                            <span className="text-white/15">|</span>
                            <Link href={links.readiness} className="text-sky-300/90 hover:text-sky-200">Préparation →</Link>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 geo-scrollbar">
                        <div className="min-w-[min(100%,420px)] flex-1 rounded-[24px] border border-slate-400/15 bg-[#2a2620]">
                            <div className="border-b border-white/[0.06] px-4 py-3">
                                <div className="text-[13px] font-semibold text-white/95">Correctifs prioritaires</div>
                                <div className="text-[11px] text-white/38">Ouverts · tri par impact</div>
                            </div>
                            {topFixes.length === 0 ? (
                                <div className="px-4 py-8 text-[12px] text-white/40">Aucun correctif ouvert à afficher.</div>
                            ) : (
                                <div className="divide-y divide-white/[0.04]">
                                    {topFixes.map((fix) => (
                                        <TopFixRow key={fix.id} fix={fix} clientId={clientId} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="min-w-[min(100%,420px)] flex-1 rounded-[24px] border border-slate-400/15 bg-[#242220]">
                            <div className="border-b border-white/[0.06] px-4 py-3">
                                <div className="text-[13px] font-semibold text-white/95">Blocages majeurs</div>
                                <div className="text-[11px] text-white/38">Extrait préparation AGENT</div>
                            </div>
                            {topBlockers.length === 0 ? (
                                <div className="px-4 py-8 text-[12px] text-white/40">Aucun blocage majeur détecté.</div>
                            ) : (
                                <div>
                                    {topBlockers.map((blocker, idx) => (
                                        <BlockerRow key={`${blocker.title}-${idx}`} blocker={blocker} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-4 text-[11px] text-white/45 leading-relaxed">
                    Le score AGENT est calculé à la lecture (non persisté). Les 4 sous-scores sont actifs :
                    {' '}<Link href={links.visibility} className="text-amber-200/90 hover:text-amber-100">Visibilité</Link>,
                    {' '}<Link href={links.readiness} className="text-amber-200/90 hover:text-amber-100">Préparation</Link>,
                    {' '}<Link href={links.actionability || `/admin/clients/${clientId}/agent/actionability`} className="text-amber-200/90 hover:text-amber-100">Actionnabilité</Link>,
                    {' '}<Link href={links.protocols || `/admin/clients/${clientId}/agent/protocols`} className="text-amber-200/90 hover:text-amber-100">Protocoles</Link>.
                    Le <Link href={links.competitors || `/admin/clients/${clientId}/agent/competitors`} className="text-amber-200/90 hover:text-amber-100">comparatif</Link> reste informatif et n’affecte pas le score.
                </footer>
            </div>
        </div>
    );
}
