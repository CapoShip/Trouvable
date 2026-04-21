'use client';

import { GeoEmptyPanel, GeoSectionTitle } from '../components/GeoPremium';
import { GeoChipList, GeoFoundationPageShell, GeoFoundationPanel, GeoFoundationStatCard, GeoReliabilityLegend, GeoStatusBadge } from '../components/GeoFoundationPrimitives';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

function LoadingState() {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Chargement du schema" description="Lecture de la couverture d’entité, des propriétés observées et des écarts dossier ↔ schema." />
        </div>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title={title} description={description} />
        </div>
    );
}

function EvidenceLayerGrid({ layers }) {
    return (
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
            {Object.values(layers).map((layer) => (
                <GeoFoundationPanel
                    key={layer.title}
                    title={layer.title}
                    subtitle={layer.description}
                    reliability={layer.reliability}
                >
                    <div className="space-y-2">
                        {layer.items.map((item) => (
                            <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-white/74">
                                {item}
                            </div>
                        ))}
                    </div>
                </GeoFoundationPanel>
            ))}
        </div>
    );
}

function CoverageCard({ item }) {
    return (
        <GeoFoundationPanel
            title={item.label}
            subtitle={item.evidence}
            reliability={item.reliability}
            status={item.operatorStatus}
            className="h-full"
        >
            <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Couverture</div>
                        <div className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-white/92">{item.coveragePercent}%</div>
                        <div className="mt-1 text-[11px] text-white/48">{item.foundCount}/{item.expectedCount} propriété(s) d’ancrage observée(s)</div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Attente métier</div>
                        <div className="mt-2 text-[12px] leading-relaxed text-white/76">
                            {item.shouldExist ? 'Cette couche devrait exister pour ce mandat.' : 'Couche souhaitable, sans obligation forte prouvée par le dossier.'}
                        </div>
                    </div>
                </div>

                {item.observedTypes.length > 0 ? (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Types observés</div>
                        <GeoChipList items={item.observedTypes} tone="success" />
                    </div>
                ) : null}

                {item.missingProperties.length > 0 ? (
                    <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Propriétés absentes</div>
                        <GeoChipList items={item.missingProperties} tone={item.shouldExist ? 'warning' : 'neutral'} />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[12px] text-emerald-100">
                        Aucune lacune d’ancrage prioritaire relevée sur cette famille.
                    </div>
                )}
            </div>
        </GeoFoundationPanel>
    );
}

function GapCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/90">{item.label}</div>
                <GeoStatusBadge status={item.severity === 'high' ? 'absent' : 'partiel'} />
                <ReliabilityPill value={item.reliability} />
            </div>
            <div className="mt-3 text-[13px] leading-relaxed text-white/72">{item.detail}</div>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/56">
                {item.evidence}
            </div>
        </div>
    );
}

function ConsistencyRow({ row }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/88">{row.label}</div>
                <GeoStatusBadge status={row.status} />
                <ReliabilityPill value={row.reliability} />
            </div>
            <div className="mt-3 text-[12px] leading-relaxed text-white/70">{row.detail}</div>
        </div>
    );
}

function SameAsSummaryCard({ sameAs }) {
    return (
        <GeoFoundationPanel
            title="sameAs / profils externes"
            subtitle="Comparaison honnête entre les profils mandatés dans le dossier partagé et les URLs réellement observées dans le schema."
            reliability={sameAs.reliability}
            status={sameAs.status}
        >
            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Profils dossier</div>
                    <div className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-white/92">{sameAs.dossierProfiles.length}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">sameAs observés</div>
                    <div className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-white/92">{sameAs.observedSameAs.length}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Alignés</div>
                    <div className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-emerald-200">{sameAs.matched.length}</div>
                </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Profils mandatés</div>
                    {sameAs.dossierProfiles.length > 0 ? <GeoChipList items={sameAs.dossierProfiles} tone="neutral" /> : <div className="text-[12px] text-white/40">Aucun profil externe mandaté dans le dossier partagé.</div>}
                </div>
                <div className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">sameAs observés</div>
                    {sameAs.observedSameAs.length > 0 ? <GeoChipList items={sameAs.observedSameAs} tone="success" /> : <div className="text-[12px] text-white/40">Aucun sameAs observé dans le dernier audit.</div>}
                </div>
            </div>

            {sameAs.missingFromSchema.length > 0 || sameAs.unexpectedInSchema.length > 0 ? (
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-100/80">Absents du schema</div>
                        <div className="mt-3"><GeoChipList items={sameAs.missingFromSchema} tone="warning" /></div>
                    </div>
                    <div className="rounded-2xl border border-red-400/15 bg-red-400/10 p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-red-100/80">Présents mais non mandatés</div>
                        <div className="mt-3"><GeoChipList items={sameAs.unexpectedInSchema} tone="danger" /></div>
                    </div>
                </div>
            ) : null}
        </GeoFoundationPanel>
    );
}

function RecommendationCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <ReliabilityPill value={item.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/72">{item.description}</p>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/56">
                {item.evidence}
            </div>
        </div>
    );
}

export default function GeoSchemaView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('schema');

    if (loading) return <LoadingState />;
    if (error) return <EmptyState title="Schema indisponible" description={error} />;
    if (data?.emptyState) return <EmptyState title={data.emptyState.title} description={data.emptyState.description} />;
    if (!data) return <EmptyState title="Schema indisponible" description="La lecture de fondation GEO n’a pas pu être chargée." />;

    return (
        <GeoFoundationPageShell className="flex flex-col gap-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
                <div className="rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-sky-500/10 via-[#0b0c10] to-[#07080a] p-5 sm:p-7">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/70">GEO · Entité structurée</div>
                    <h1 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-white">Atelier schema</h1>
                    <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/55">
                        JSON-LD réellement extrait au dernier audit pour {client?.client_name || 'ce mandat'}. Comparaison dossier ↔ schema observé, sans réconciliation externe exhaustive.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#090a0c] p-4">
                    <GeoReliabilityLegend />
                </div>
            </div>

            <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-white/74">
                Lecture limitée à ce que l’audit a prouvé : <strong className="text-white/88">dossier partagé</strong> vs <strong className="text-white/88">schema observé</strong>.
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <GeoFoundationStatCard
                    label="Couverture structurée"
                    value={`${data.summary.coveragePercent}%`}
                    detail="Familles suivies avec présence observée."
                    reliability="calculated"
                    accent="emerald"
                />
                <GeoFoundationStatCard
                    label="Types observés"
                    value={data.summary.observedTypeCount}
                    detail="Types distincts dans le dernier audit."
                    reliability="measured"
                    accent="blue"
                />
                <GeoFoundationStatCard
                    label="Lacunes critiques"
                    value={data.summary.criticalGapCount}
                    detail="Couches attendues mais absentes."
                    reliability={data.summary.criticalGapCount > 0 ? 'calculated' : 'measured'}
                    status={data.summary.criticalGapCount > 0 ? 'absent' : 'couvert'}
                    accent="amber"
                />
                <GeoFoundationStatCard
                    label="Fraîcheur audit"
                    value={data.summary.auditFreshness}
                    detail="Dernier crawl structuré."
                    reliability="measured"
                    accent="violet"
                />
            </div>

            {data.auditContext?.latestSignal ? (
                <GeoFoundationPanel
                    title="Dernier signal audit"
                    subtitle={data.auditContext.latestSignal.title}
                    reliability={data.auditContext.latestSignal.reliability}
                >
                    <div className="text-[12px] leading-relaxed text-white/72">{data.auditContext.latestSignal.evidence || 'Aucune preuve détaillée persistée.'}</div>
                </GeoFoundationPanel>
            ) : null}

            <GeoSectionTitle
                title="Couverture par type"
                subtitle="Organization, LocalBusiness, Service, FAQ — lecture en premier pour arbitrer vite."
            />
            <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                {data.coverageItems.map((item) => <CoverageCard key={item.key} item={item} />)}
            </div>

            <GeoSectionTitle
                title="Couches de preuve"
                subtitle="Observation, synthèse, limites."
            />
            <EvidenceLayerGrid layers={data.evidenceLayers} />

            <GeoSectionTitle
                title="Propriétés manquantes"
                subtitle="Champs absents ou couches faibles dans l’échantillon audité, avec preuve et niveau de fiabilité."
            />
            {data.missingProperties.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                    {data.missingProperties.map((item) => <GapCard key={`${item.label}-${item.detail}`} item={item} />)}
                </div>
            ) : (
                <GeoFoundationPanel title="Aucune lacune critique relevée" reliability="measured">
                    <div className="text-[12px] leading-relaxed text-white/68">Le dernier audit ne remonte pas de manque structurel majeur sur les familles suivies ici.</div>
                </GeoFoundationPanel>
            )}

            <GeoSectionTitle
                title="Alignement entité"
                subtitle="Comparaison dossier partagé ↔ schema observé sur les coordonnées d’identité les plus sensibles."
            />
            <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                {data.consistencyRows.map((row) => <ConsistencyRow key={row.label} row={row} />)}
            </div>

            <GeoSectionTitle
                title="sameAs / profils externes"
                subtitle="Présents, absents ou incohérents, sans prétendre à une réconciliation externe complète quand le repo ne la supporte pas encore."
            />
            <SameAsSummaryCard sameAs={data.sameAsSummary} />

            <GeoSectionTitle
                title="Recommandations opérateur"
                subtitle="Angles de correction pour la prochaine vague, sans surpromesse sur la réconciliation externe."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                {data.recommendations.map((item) => <RecommendationCard key={item.title} item={item} />)}
            </div>
        </GeoFoundationPageShell>
    );
}
