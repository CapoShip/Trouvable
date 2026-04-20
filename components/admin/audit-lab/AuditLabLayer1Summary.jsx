'use client';

import {
    LabCollapsible,
    LabDiagnosticSection,
    LabEmptyState,
    LabMetric,
    LabPill,
    LabSectionHeader,
} from './LabPrimitives';
import { getLayer1ViewModel, scoreToneClass } from './audit-lab-model';
import { crawlStrategyFr, humanizeCategoryKey, renderStrategyFr } from './audit-lab-copy';

function pageStatusTone(statusCode) {
    if (statusCode == null) return 'neutral';
    if (statusCode >= 500) return 'bad';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'warn';
    return 'good';
}

/**
 * Section 3 — Résumé de l'analyse technique (couche 1).
 *
 * Vue opérateur de haut niveau : stratégie d'exploration, couverture, rendu,
 * score brut interne et catégories. Les détails par page vivent dans la
 * section suivante (Vérifications détaillées).
 */
export default function AuditLabLayer1Summary({ audit }) {
    const model = getLayer1ViewModel(audit);

    if (!model.hasAny) {
        return (
            <LabDiagnosticSection ribbon="Couche 1 · diagnostic technique">
                <LabSectionHeader
                    eyebrow="Section 3 · Résumé technique"
                    title="Analyse technique indisponible"
                    subtitle="Cette section résume l'exploration du site et les vérifications automatiques. Lancez un audit pour la peupler."
                    variant="diagnostic"
                />
                <LabEmptyState
                    title="Aucune donnée technique enregistrée"
                    description="Le détail technique n'est pas persisté sur cet audit (mode ombre ou audit antérieur). Le résultat Trouvable affiché plus haut reste valide."
                />
            </LabDiagnosticSection>
        );
    }

    const { crawlMetadata, renderStats, siteLevelRawScores, scannedPages, pageArtifacts } = model;
    const sitemapSources = crawlMetadata?.sitemap_sources || [];
    const pagesList = pageArtifacts.length > 0 ? pageArtifacts : scannedPages;
    const overallRaw = siteLevelRawScores?.overall ?? null;

    const strategyLabel = crawlStrategyFr(crawlMetadata?.strategy) || '—';
    const renderLabel = renderStrategyFr(renderStats?.audit_strategy || renderStats?.strategy) || 'Inconnu';

    const categories = siteLevelRawScores?.categories;
    const categoryEntries = categories && typeof categories === 'object'
        ? Object.entries(categories)
        : [];

    return (
        <LabDiagnosticSection ribbon="Couche 1 · diagnostic technique">
            <LabSectionHeader
                eyebrow="Section 3 · Résumé technique"
                title="Exploration du site et vérifications automatiques"
                subtitle="Vue d'ensemble de ce qu'a trouvé le scanner : pages explorées, mode de rendu utilisé, score interne brut. Ce score est un indicateur technique — il ne remplace jamais le score Trouvable final."
                variant="diagnostic"
                right={<LabPill label="diagnostic interne" tone="warn" />}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LabMetric label="Stratégie d'exploration" value={strategyLabel} />
                <LabMetric
                    label="Pages analysées"
                    value={crawlMetadata?.pages_visited ?? scannedPages.length ?? 0}
                    suffix={crawlMetadata?.pages_budget ? `/ ${crawlMetadata.pages_budget}` : null}
                />
                <LabMetric label="Mode de rendu" value={renderLabel} />
                <LabMetric
                    label="Sources sitemap"
                    value={sitemapSources.length}
                    suffix={sitemapSources.length ? 'détectée(s)' : null}
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderStats && (
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Rendu des pages</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <LabPill
                                label={renderLabel}
                                tone={renderStats.audit_strategy === 'static_only' ? 'warn' : 'good'}
                            />
                            {renderStats.playwright_available ? (
                                <LabPill label="Navigateur disponible" tone="good" />
                            ) : (
                                <LabPill label="Navigateur indisponible" tone="warn" />
                            )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-white/55">
                            <div>Rendues : <span className="tabular-nums text-white/75">{renderStats.rendered_pages ?? 0}</span></div>
                            <div>Statiques : <span className="tabular-nums text-white/75">{renderStats.static_pages ?? 0}</span></div>
                            <div>Fallback : <span className="tabular-nums text-white/75">{renderStats.render_fallback_pages ?? 0}</span></div>
                            <div>Échecs : <span className="tabular-nums text-white/75">{renderStats.render_failures ?? 0}</span></div>
                        </div>
                        {renderStats.audit_strategy_message && (
                            <p className="mt-2 text-[10px] text-white/40">{renderStats.audit_strategy_message}</p>
                        )}
                    </div>
                )}

                {siteLevelRawScores && (
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Score technique brut</div>
                            <LabPill label="interne" tone="warn" />
                        </div>
                        <div className={`mt-1 text-2xl font-extrabold tabular-nums ${scoreToneClass(overallRaw)}`}>
                            {overallRaw != null ? overallRaw : '—'}
                            <span className="text-[10px] text-white/25">/100</span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/35">
                            Calculé uniquement sur les vérifications automatiques. Ne pas communiquer au client.
                        </p>
                        {siteLevelRawScores.totals && (
                            <div className="mt-2 text-[10px] text-white/40">
                                <span className="tabular-nums text-emerald-300/80">{siteLevelRawScores.totals.pass ?? 0}</span> OK
                                <span className="mx-1 text-white/20">·</span>
                                <span className="tabular-nums text-red-300/80">{siteLevelRawScores.totals.fail ?? 0}</span> en échec
                                <span className="mx-1 text-white/20">·</span>
                                <span className="tabular-nums text-amber-300/80">{siteLevelRawScores.totals.warn ?? 0}</span> à surveiller
                            </div>
                        )}
                    </div>
                )}
            </div>

            {categoryEntries.length > 0 && (
                <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Scores par catégorie technique</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {categoryEntries.map(([key, value]) => {
                            const score = typeof value?.score === 'number'
                                ? value.score
                                : typeof value === 'number'
                                ? value
                                : null;
                            const tone = scoreToneClass(score);
                            return (
                                <div key={key} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                    <div className="text-[11px] font-medium text-white/60">{humanizeCategoryKey(key)}</div>
                                    <div className={`mt-1 text-lg font-extrabold tabular-nums ${tone}`}>
                                        {score != null ? score : '—'}
                                        <span className="text-[10px] text-white/25">/100</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-4 space-y-2">
                {sitemapSources.length > 0 && (
                    <LabCollapsible
                        label={`Sources sitemap (${sitemapSources.length})`}
                        hint="URLs détectées comme points d'entrée"
                    >
                        <ul className="space-y-0.5">
                            {sitemapSources.slice(0, 12).map((src, idx) => (
                                <li
                                    key={idx}
                                    className="truncate font-mono text-[11px] text-white/60"
                                    title={typeof src === 'string' ? src : src?.url}
                                >
                                    {typeof src === 'string' ? src : src?.url || JSON.stringify(src)}
                                </li>
                            ))}
                            {sitemapSources.length > 12 && (
                                <li className="text-[10px] text-white/35">+ {sitemapSources.length - 12} autres</li>
                            )}
                        </ul>
                    </LabCollapsible>
                )}

                {pagesList.length > 0 && (
                    <LabCollapsible
                        label={`Pages explorées (${pagesList.length})`}
                        hint="Statut HTTP et mode de rendu par URL"
                    >
                        <div className="space-y-1">
                            {pagesList.slice(0, 50).map((page, idx) => {
                                const statusCode = page.status_code;
                                const tone = pageStatusTone(statusCode);
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between gap-2 rounded-md border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate font-mono text-[11px] text-white/70" title={page.url}>
                                                {page.url}
                                            </div>
                                            {page.title && (
                                                <div className="truncate text-[10px] text-white/40">{page.title}</div>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            {statusCode != null && <LabPill label={String(statusCode)} tone={tone} />}
                                            {page.page_type && <LabPill label={humanizeCategoryKey(page.page_type)} />}
                                            {page.render_mode && <LabPill label={humanizeCategoryKey(page.render_mode)} />}
                                        </div>
                                    </div>
                                );
                            })}
                            {pagesList.length > 50 && (
                                <p className="text-[10px] text-white/35">+ {pagesList.length - 50} autres pages</p>
                            )}
                        </div>
                    </LabCollapsible>
                )}
            </div>
        </LabDiagnosticSection>
    );
}
