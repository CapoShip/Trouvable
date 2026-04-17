'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Cable, Radar, ScanSearch, Sparkles } from 'lucide-react';

import { GeoEmptyPanel } from '../components/GeoPremium';
import CommandActionCard from '../components/command/CommandActionCard';
import CommandBrandLockup from '../components/command/CommandBrandLockup';
import CommandChartCard from '../components/command/CommandChartCard';
import CommandDrawer from '../components/command/CommandDrawer';
import CommandEvidenceCard from '../components/command/CommandEvidenceCard';
import CommandHeader from '../components/command/CommandHeader';
import CommandHero from '../components/command/CommandHero';
import CommandPageShell from '../components/command/CommandPageShell';
import CommandSkeleton from '../components/command/CommandSkeleton';
import CommandTimeline from '../components/command/CommandTimeline';
import CommandHealthMap from '../components/command/charts/CommandHealthMap';
import CommandLineChart from '../components/command/charts/CommandLineChart';
import { commandFadeUp, commandStagger } from '../components/command/motion';
import { COMMAND_BUTTONS, COMMAND_SURFACE_SOFT, cn } from '../components/command/tokens';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { buildGeoOverviewCommandModel } from './geo-overview-model';

function SectionFrame({ eyebrow, title, description, children, action = null }) {
    return (
        <section className={cn(COMMAND_SURFACE_SOFT, 'p-5 sm:p-6')}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.38]">{eyebrow}</div>
                    <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">{title}</div>
                    {description ? <p className="mt-2 text-[13px] leading-relaxed text-white/[0.62]">{description}</p> : null}
                </div>
                {action}
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}

function ToneMeta({ children }) {
    return (
        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.65]">
            {children}
        </span>
    );
}

function EmptyTrendState({ title, description, href }) {
    return (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/[0.10] bg-white/[0.02] p-6 text-center">
            <div className="text-[16px] font-semibold tracking-[-0.02em] text-white/[0.86]">{title}</div>
            <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-white/[0.58]">{description}</p>
            {href ? (
                <Link href={href} className={cn(COMMAND_BUTTONS.secondary, 'mt-5')}>
                    Ouvrir les signaux
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            ) : null}
        </div>
    );
}

function EvidenceDrawerContent({ evidence }) {
    if (!evidence) return null;

    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Synthèse</div>
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-sm">
                    <p className="text-[15px] leading-relaxed text-white/80">{evidence.summary}</p>
                </div>
            </section>

            <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Détails techniques</div>
                <div className="rounded-[24px] border border-white/[0.08] bg-black/40 p-6">
                    <p className="text-[14px] leading-relaxed text-white/60">{evidence.detail}</p>
                </div>
            </section>

            <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Provenance & Intégrité</div>
                <div className="rounded-[24px] border border-white/[0.05] bg-white/[0.015] p-5">
                    <p className="text-[13px] leading-relaxed text-white/40">
                        Cette preuve est extraite dynamiquement du slice <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/70">overview</code>. 
                        Aucune modification manuelle n'a été apportée à ce signal brut.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default function GeoOverviewView() {
    const { client, clientId, workspace, audit } = useGeoClient();
    const { data, loading, error, refetch } = useGeoWorkspaceSlice('overview');
    const [selectedEvidence, setSelectedEvidence] = useState(null);

    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const seoBase = clientId ? `/admin/clients/${clientId}/seo` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';

    const model = useMemo(() => {
        if (!data) return null;
        return buildGeoOverviewCommandModel({
            clientId,
            client,
            workspace,
            audit,
            data,
        });
    }, [audit, client, clientId, data, workspace]);

    const brand = <CommandBrandLockup />;

    if (loading) {
        return <CommandSkeleton />;
    }

    if (error) {
        return (
            <CommandPageShell
                header={(
                    <CommandHeader
                        brand={brand}
                        eyebrow="Client overview pilote"
                        title="Trouvable Command Center"
                        subtitle="La page pilote reste branchée sur le slice overview, mais le chargement a échoué cette fois-ci."
                    />
                )}
            >
                <SectionFrame
                    eyebrow="État"
                    title="Impossible de charger la synthèse"
                    description="Le shell client est disponible, mais le slice overview n'a pas pu être lu. La navigation globale n'est pas cassée."
                    action={(
                        <button type="button" onClick={() => refetch()} className={COMMAND_BUTTONS.primary}>
                            Réessayer
                        </button>
                    )}
                >
                    <div className="rounded-[22px] border border-rose-300/18 bg-rose-400/10 p-4 text-[13px] leading-relaxed text-rose-100/90">
                        {error}
                    </div>
                </SectionFrame>
            </CommandPageShell>
        );
    }

    if (!data || !model) {
        return (
            <CommandPageShell
                header={(
                    <CommandHeader
                        brand={brand}
                        eyebrow="Client overview pilote"
                        title="Trouvable Command Center"
                        subtitle="La structure Command Center est prête, mais ce mandat ne remonte pas encore de synthèse overview exploitable."
                    />
                )}
            >
                <SectionFrame
                    eyebrow="Disponibilité"
                    title="Situation indisponible"
                    description="La synthèse overview n'est pas encore disponible pour ce mandat. On garde l'UI honnête plutôt que d'inventer des signaux."
                >
                    <GeoEmptyPanel
                        title="Aucune synthèse overview"
                        description="Les éléments du Command Center apparaîtront dès que le workspace overview remontera des données observées."
                    >
                        <div className="flex flex-wrap gap-2">
                            <Link href={`${seoBase}/health`} className={COMMAND_BUTTONS.secondary}>
                                Ouvrir santé SEO
                            </Link>
                            <Link href={`${geoBase}/runs`} className={COMMAND_BUTTONS.secondary}>
                                Voir les runs
                            </Link>
                        </div>
                    </GeoEmptyPanel>
                </SectionFrame>
            </CommandPageShell>
        );
    }

    const evidencePreview = model.evidence.items.slice(0, 3);

    return (
        <motion.div initial="hidden" animate="visible" variants={commandStagger}>
            <CommandPageShell
                header={(
                    <motion.div variants={commandFadeUp}>
                        <CommandHeader
                            brand={brand}
                            eyebrow="Client overview pilote"
                            title="Trouvable Command Center"
                            subtitle="Vue de pilotage premium construite uniquement depuis le shell client et le slice overview existant. Elle répond vite à l'état global, aux blocages, à l'action immédiate, à la preuve disponible et aux changements récents."
                            meta={(
                                <>
                                    <ToneMeta>Page pilote</ToneMeta>
                                    <ToneMeta>Overview only</ToneMeta>
                                    <ToneMeta>Sans nouveau fetch</ToneMeta>
                                </>
                            )}
                            actions={(
                                <>
                                    <Link href={`${geoBase}/opportunities`} className={COMMAND_BUTTONS.secondary}>
                                        Actions
                                    </Link>
                                    <Link href={`${geoBase}/runs`} className={COMMAND_BUTTONS.secondary}>
                                        Runs
                                    </Link>
                                    <Link href={`${dossierBase}/connectors`} className={COMMAND_BUTTONS.secondary}>
                                        Connecteurs
                                    </Link>
                                </>
                            )}
                        />
                    </motion.div>
                )}
                hero={(
                    <CommandHero
                        eyebrow="Mandat actif"
                        title={model.hero.title}
                        subtitle={model.hero.subtitle}
                        websiteLabel={model.hero.websiteLabel}
                        status={model.hero.status}
                        score={model.hero.score}
                        freshness={model.hero.freshness}
                        priorityAction={model.hero.priorityAction}
                        supportingMetrics={model.hero.supportingMetrics}
                        secondaryActions={(
                            <>
                                <Link href={`${geoBase}/signals`} className={COMMAND_BUTTONS.secondary}>
                                    <Radar className="h-4 w-4" />
                                    Signaux
                                </Link>
                                <Link href={`${geoBase}/social`} className={COMMAND_BUTTONS.secondary}>
                                    <Cable className="h-4 w-4" />
                                    Social
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvidence(model.evidence.items[0] || null)}
                                    className={COMMAND_BUTTONS.secondary}
                                >
                                    <ScanSearch className="h-4 w-4" />
                                    Zone de preuve
                                </button>
                            </>
                        )}
                    />
                )}
                drawer={(
                    <CommandDrawer
                        open={Boolean(selectedEvidence)}
                        title={selectedEvidence?.title}
                        subtitle={selectedEvidence?.summary}
                        tone={selectedEvidence?.tone}
                        onClose={() => setSelectedEvidence(null)}
                        footer={selectedEvidence?.href ? (
                            <Link href={selectedEvidence.href} className={COMMAND_BUTTONS.primary}>
                                Ouvrir la page liée
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        ) : null}
                    >
                        <EvidenceDrawerContent evidence={selectedEvidence} />
                    </CommandDrawer>
                )}
            >
                <motion.div variants={commandFadeUp}>
                    <SectionFrame
                        eyebrow="Lecture rapide"
                        title={model.riskMap.title}
                        description={model.riskMap.description}
                        action={<Link href={`${dossierBase}/connectors`} className={COMMAND_BUTTONS.subtle}>Voir les zones détaillées</Link>}
                    >
                        <CommandHealthMap items={model.riskMap.items} />
                    </SectionFrame>
                </motion.div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                    <motion.div variants={commandFadeUp}>
                        <SectionFrame
                            eyebrow="Priorités"
                            title="Top 3 actions prioritaires"
                            description="Chaque carte traduit un blocage ou une opportunité déjà observable dans le workspace overview, avec impact et preuve courte."
                        >
                            <div className="grid gap-3 xl:grid-cols-3">
                                {model.topActions.map((action, index) => (
                                    <CommandActionCard
                                        key={action.id}
                                        title={action.title}
                                        impact={action.impact}
                                        proof={action.proof}
                                        href={action.href}
                                        tone={action.tone}
                                        onInspect={() => setSelectedEvidence(model.evidence.items[index] || model.evidence.items[0] || null)}
                                    />
                                ))}
                            </div>
                        </SectionFrame>
                    </motion.div>

                    <motion.div variants={commandFadeUp}>
                        <SectionFrame
                            eyebrow="Preuve"
                            title={model.evidence.title}
                            description={model.evidence.description}
                            action={(
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvidence(model.evidence.items[0] || null)}
                                    className={COMMAND_BUTTONS.secondary}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Ouvrir le drawer
                                </button>
                            )}
                        >
                            <div className="grid gap-3">
                                {evidencePreview.map((item) => (
                                    <CommandEvidenceCard
                                        key={item.id}
                                        title={item.title}
                                        summary={item.summary}
                                        detail={item.detail}
                                        meta={item.meta}
                                        href={item.href}
                                        tone={item.tone}
                                        onOpen={() => setSelectedEvidence(item)}
                                    />
                                ))}
                            </div>
                        </SectionFrame>
                    </motion.div>
                </div>

                <motion.div variants={commandFadeUp}>
                    <CommandChartCard
                        eyebrow="Évolution"
                        title={model.trend.title}
                        description={model.trend.description}
                        action={<Link href={`${geoBase}/signals`} className={COMMAND_BUTTONS.subtle}>Ouvrir les signaux</Link>}
                        legend={model.trend.state === 'ready' ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {model.trend.series.map((series) => (
                                    <span key={series.id} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.7]">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                                        {series.label}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                        empty={model.trend.state === 'empty' ? (
                            <EmptyTrendState
                                title="Historique encore trop court"
                                description={model.trend.description}
                                href={`${geoBase}/signals`}
                            />
                        ) : null}
                    >
                        {model.trend.state === 'ready' ? (
                            <div className="h-[280px]">
                                <CommandLineChart labels={model.trend.labels} series={model.trend.series} />
                            </div>
                        ) : null}
                    </CommandChartCard>
                </motion.div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
                    <motion.div variants={commandFadeUp}>
                        <SectionFrame
                            eyebrow="Sources"
                            title={model.connectorHealth.title}
                            description={model.connectorHealth.description}
                            action={<Link href={`${dossierBase}/connectors`} className={COMMAND_BUTTONS.subtle}>Voir les connecteurs</Link>}
                        >
                            <CommandHealthMap items={model.connectorHealth.items} />
                        </SectionFrame>
                    </motion.div>

                    <motion.div variants={commandFadeUp}>
                        <CommandTimeline
                            title={model.timeline.title}
                            description={model.timeline.description}
                            items={model.timeline.items}
                            emptyTitle={model.timeline.empty.title}
                            emptyDescription={model.timeline.empty.description}
                        />
                    </motion.div>
                </div>
            </CommandPageShell>
        </motion.div>
    );
}
