'use client';

import { GeoEmptyPanel, GeoSectionTitle } from '../components/GeoPremium';
import { GeoFoundationPageShell, GeoFoundationPanel, GeoFoundationStatCard, GeoReliabilityLegend, GeoStatusBadge } from '../components/GeoFoundationPrimitives';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import ReliabilityPill from '@/components/ui/ReliabilityPill';

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

const SEVERITY_META = {
    critique: { label: 'Critique', color: 'border-red-400/20 bg-red-400/10 text-red-200', accent: 'amber', dotColor: 'bg-red-400' },
    avertissement: { label: 'Avertissement', color: 'border-amber-400/20 bg-amber-400/10 text-amber-100', accent: 'blue', dotColor: 'bg-amber-400' },
    info: { label: 'Information', color: 'border-sky-400/20 bg-sky-400/10 text-sky-200', accent: 'violet', dotColor: 'bg-sky-400' },
    ok: { label: 'OK', color: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200', accent: 'emerald', dotColor: 'bg-emerald-400' },
};

function SeverityBadge({ severity }) {
    const meta = SEVERITY_META[severity] || SEVERITY_META.info;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
            {meta.label}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Freshness helpers
// ---------------------------------------------------------------------------

function FreshnessIndicator({ state, hours, label }) {
    const stateClass = state === 'fresh'
        ? 'text-emerald-200'
        : state === 'warning'
            ? 'text-amber-100'
            : state === 'stale'
                ? 'text-red-200'
                : 'text-white/40';

    const stateLabel = state === 'fresh'
        ? 'Frais'
        : state === 'warning'
            ? 'Vieillissant'
            : state === 'stale'
                ? 'En retard'
                : 'Indisponible';

    return (
        <div className="flex items-center justify-between gap-2 py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-[12px] text-white/50">{label}</span>
            <div className="flex items-center gap-2">
                {hours != null && <span className="text-[11px] font-mono text-white/40">{hours}h</span>}
                <span className={`text-[11px] font-semibold ${stateClass}`}>{stateLabel}</span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function LoadingState() {
    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel
                title="Chargement des alertes GEO"
                description="Agrégation des signaux crawlers, schema, cohérence, préparation, fraîcheur et connecteurs."
            />
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

// ---------------------------------------------------------------------------
// Alert Card
// ---------------------------------------------------------------------------

function AlertCard({ alert }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4 sm:p-5 transition-colors hover:bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{alert.title}</div>
                <SeverityBadge severity={alert.severity} />
                <ReliabilityPill value={alert.reliability} />
            </div>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30 mb-1.5">Preuve</div>
                <div className="text-[12px] leading-relaxed text-white/72">{alert.evidence}</div>
            </div>
            <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30 mb-1.5">Action recommandée</div>
                <p className="text-[12px] leading-relaxed text-white/60">{alert.suggestedAction}</p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Family Section
// ---------------------------------------------------------------------------

function FamilySection({ family }) {
    return (
        <GeoFoundationPanel
            title={family.label}
            subtitle={`${family.alerts.length} alerte(s) dans cette famille`}
            reliability={family.alerts[0]?.reliability || 'calculated'}
        >
            <div className="space-y-3">
                {family.alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                ))}
            </div>
        </GeoFoundationPanel>
    );
}

// ---------------------------------------------------------------------------
// System Status Section
// ---------------------------------------------------------------------------

function SystemStatusSection({ systemStatus }) {
    return (
        <div className="grid gap-3 xl:grid-cols-3">
            <GeoFoundationPanel
                title="Connecteurs"
                reliability={systemStatus.connectors.reliability}
            >
                <div className="space-y-1">
                    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                        <span className="text-[12px] text-white/50">Configurés</span>
                        <span className="text-[12px] font-semibold text-white/80">{systemStatus.connectors.configured}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                        <span className="text-[12px] text-white/50">En erreur</span>
                        <span className={`text-[12px] font-semibold ${systemStatus.connectors.error > 0 ? 'text-red-300' : 'text-white/80'}`}>
                            {systemStatus.connectors.error}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                        <span className="text-[12px] text-white/50">Non connectés</span>
                        <span className="text-[12px] font-semibold text-white/80">{systemStatus.connectors.notConnected}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-[12px] text-white/50">Désactivés</span>
                        <span className="text-[12px] font-semibold text-white/80">{systemStatus.connectors.disabled}</span>
                    </div>
                </div>
            </GeoFoundationPanel>

            <GeoFoundationPanel
                title="Jobs récurrents"
                reliability={systemStatus.jobs.reliability}
            >
                <div className="space-y-1">
                    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                        <span className="text-[12px] text-white/50">Total</span>
                        <span className="text-[12px] font-semibold text-white/80">{systemStatus.jobs.total}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                        <span className="text-[12px] text-white/50">Actifs</span>
                        <span className="text-[12px] font-semibold text-white/80">{systemStatus.jobs.active}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-[12px] text-white/50">En échec</span>
                        <span className={`text-[12px] font-semibold ${systemStatus.jobs.failed > 0 ? 'text-red-300' : 'text-white/80'}`}>
                            {systemStatus.jobs.failed}
                        </span>
                    </div>
                </div>
            </GeoFoundationPanel>

            <GeoFoundationPanel
                title="Fraîcheur"
                reliability={systemStatus.freshness.reliability}
            >
                <div className="space-y-0">
                    <FreshnessIndicator
                        label="Dernier audit"
                        state={systemStatus.freshness.audit.state}
                        hours={systemStatus.freshness.audit.hours}
                    />
                    <FreshnessIndicator
                        label="Dernière exécution"
                        state={systemStatus.freshness.runs.state}
                        hours={systemStatus.freshness.runs.hours}
                    />
                    {systemStatus.freshness.mode && (
                        <div className="flex items-center justify-between py-2 mt-1 pt-2 border-t border-white/[0.06]">
                            <span className="text-[12px] text-white/50">Mode</span>
                            <span className="text-[11px] font-medium text-violet-200/80">{systemStatus.freshness.mode}</span>
                        </div>
                    )}
                </div>
            </GeoFoundationPanel>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Unsupported Alerts Section
// ---------------------------------------------------------------------------

function UnsupportedAlertsSection({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="rounded-[24px] border border-dashed border-white/[0.10] bg-white/[0.015] p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.10em] text-white/25 mb-4">
                Non disponible dans l'état actuel du système
            </div>
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[12px] font-semibold text-white/50">{item.title}</span>
                            <ReliabilityPill value="unavailable" />
                        </div>
                        <p className="text-[11px] leading-relaxed text-white/35">{item.reason}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Recommendation Card
// ---------------------------------------------------------------------------

function RecommendationCard({ item }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/18 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white/92">{item.title}</div>
                <SeverityBadge severity={item.severity} />
                <ReliabilityPill value={item.reliability} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/62">{item.action}</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main View
// ---------------------------------------------------------------------------

export default function GeoAlertsView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('alerts');

    if (loading) return <LoadingState />;
    if (error) return <EmptyState title="Alertes GEO indisponibles" description={error} />;
    if (data?.emptyState) return <EmptyState title={data.emptyState.title} description={data.emptyState.description} />;
    if (!data) return <EmptyState title="Alertes GEO indisponibles" description="La lecture des alertes GEO n'a pas pu être chargée." />;

    const { summary, alerts, families, systemStatus, recommendations, unsupportedAlerts } = data;
    const hasAlerts = alerts && alerts.length > 0;

    return (
        <GeoFoundationPageShell className="flex flex-col gap-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-rose-500/10 via-[#0c0d11] to-[#07080a] p-5 sm:p-7">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-200/70">GEO · Nerve center</div>
                    <h1 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.04em] text-white">Alertes &amp; risques</h1>
                    <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/55">
                        Agrégat crawlers, schema, cohérence, préparation et connecteurs pour {client?.client_name || 'ce mandat'}. Rien n’est affiché sans signal disponible.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#090a0c] p-4 self-start">
                    <GeoReliabilityLegend />
                </div>
            </div>

            <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-white/74">
                Cette surface agrège les alertes issues des crawlers, du schema, de la cohérence, de la préparation, de la fraîcheur des données, des connecteurs et des signaux de citation. Seuls les signaux réellement disponibles sont utilisés. Les catégories non couvertes sont explicitement listées en fin de page.
            </div>

            {/* Vue d'ensemble */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <GeoFoundationStatCard
                    label="Alertes actives"
                    value={summary.total}
                    detail={summary.description}
                    reliability={summary.reliability}
                    status={summary.globalSeverity === 'ok' ? 'autorisé' : summary.globalSeverity === 'critique' ? 'bloqué' : 'ambigu'}
                    accent={summary.globalSeverity === 'ok' ? 'emerald' : summary.globalSeverity === 'critique' ? 'amber' : 'blue'}
                />
                <GeoFoundationStatCard
                    label="Critiques"
                    value={summary.criticalCount}
                    detail={summary.criticalCount > 0 ? 'Intervention prioritaire requise.' : 'Aucune alerte critique active.'}
                    reliability="calculated"
                    accent="amber"
                />
                <GeoFoundationStatCard
                    label="Avertissements"
                    value={summary.warningCount}
                    detail={summary.warningCount > 0 ? 'Points de vigilance à surveiller.' : 'Aucun avertissement actif.'}
                    reliability="calculated"
                    accent="blue"
                />
                <GeoFoundationStatCard
                    label="Fiabilité"
                    value={`${summary.measuredCount}M / ${summary.calculatedCount}C`}
                    detail={`${summary.measuredCount} alerte(s) mesurée(s) directement, ${summary.calculatedCount} calculée(s) depuis les données.`}
                    reliability="calculated"
                    accent="violet"
                />
            </div>

            {/* Alertes actives */}
            {hasAlerts ? (
                <>
                    <GeoSectionTitle
                        title="Alertes actives"
                        subtitle="Liste complète des alertes ordonnées par criticité, avec preuve et action recommandée."
                    />
                    <div className="grid gap-3 xl:grid-cols-2">
                        {alerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))}
                    </div>
                </>
            ) : (
                <GeoFoundationPanel
                    title="Aucune alerte active"
                    subtitle="Les signaux actuellement disponibles ne remontent pas d'incident ou de risque nécessitant une intervention."
                    reliability="calculated"
                    status="autorisé"
                >
                    <div className="text-[12px] leading-relaxed text-white/50">
                        La veille continue de fonctionner en arrière-plan via les jobs récurrents et les snapshots. De nouvelles alertes apparaîtront automatiquement si un signal dépasse les seuils observés.
                    </div>
                </GeoFoundationPanel>
            )}

            {/* Alertes par famille */}
            {families && families.length > 0 && (
                <>
                    <GeoSectionTitle
                        title="Alertes par famille"
                        subtitle="Regroupement par domaine de veille pour une lecture ciblée."
                    />
                    <div className="grid gap-3 xl:grid-cols-2">
                        {families.map((family) => (
                            <FamilySection key={family.familyKey} family={family} />
                        ))}
                    </div>
                </>
            )}

            {/* État système */}
            <GeoSectionTitle
                title="État système récent"
                subtitle="Santé des connecteurs, des jobs récurrents et fraîcheur des données au moment de la lecture."
            />
            <SystemStatusSection systemStatus={systemStatus} />

            {/* Alertes non disponibles */}
            <GeoSectionTitle
                title="Alertes non disponibles"
                subtitle="Catégories d'alertes que le système ne peut pas encore surveiller proprement. Aucune de ces catégories n'est activement monitorée."
            />
            <UnsupportedAlertsSection items={unsupportedAlerts} />

            {/* Recommandations */}
            <GeoSectionTitle
                title="Recommandations opérateur"
                subtitle="Prochaines actions suggérées, fondées sur les alertes actives. Sans surpromesse ni automatisation complète."
            />
            <div className="grid gap-3 xl:grid-cols-2">
                {recommendations.map((item, index) => (
                    <RecommendationCard key={`${item.title}-${index}`} item={item} />
                ))}
            </div>
        </GeoFoundationPageShell>
    );
}
