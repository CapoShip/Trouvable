'use client';

import {
    JsonInspect,
    LabCollapsible,
    LabDiagnosticSection,
    LabEmptyState,
    LabPill,
    LabSectionHeader,
} from './LabPrimitives';
import { getLayer2ViewModel, scoreToneClass } from './audit-lab-model';
import { humanizeCategoryKey, severityFr, severityTone } from './audit-lab-copy';

function Findings({ findings }) {
    if (!Array.isArray(findings) || findings.length === 0) return null;
    return (
        <div className="mt-2 space-y-1">
            {findings.slice(0, 6).map((finding, idx) => {
                const severityLabel = severityFr(finding.severity) || 'Info';
                const tone = severityTone(finding.severity);
                return (
                    <div key={idx} className="rounded-md border border-white/[0.05] bg-white/[0.015] px-2.5 py-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <LabPill label={severityLabel} tone={tone} />
                            <span className="text-[11px] font-semibold text-white/80">
                                {finding.title || finding.label || finding.message || humanizeCategoryKey(finding.code || 'point')}
                            </span>
                        </div>
                        {finding.detail && (
                            <p className="mt-1 line-clamp-2 text-[10px] text-white/45">{finding.detail}</p>
                        )}
                    </div>
                );
            })}
            {findings.length > 6 && (
                <p className="text-[10px] text-white/35">+ {findings.length - 6} autres points</p>
            )}
        </div>
    );
}

function ModuleCard({ label, data }) {
    if (!data) return null;
    const score = typeof data.score === 'number'
        ? data.score
        : typeof data.summary_score === 'number'
        ? data.summary_score
        : null;
    const status = data.status || data.state || null;
    const findings = Array.isArray(data.findings)
        ? data.findings
        : Array.isArray(data.issues)
        ? data.issues
        : [];

    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-[12px] font-semibold text-white/85">{label}</div>
                    {status && <div className="mt-0.5 text-[10px] text-white/45">{status}</div>}
                </div>
                {score != null && (
                    <div className="shrink-0 text-right">
                        <div className={`text-sm font-semibold tabular-nums ${scoreToneClass(score)}`}>
                            {score}<span className="text-[9px] text-white/25">/100</span>
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-white/25">indicateur interne</div>
                    </div>
                )}
            </div>

            {data.summary && (
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">{data.summary}</p>
            )}

            <Findings findings={findings} />

            <div className="mt-2">
                <LabCollapsible label="Données brutes du module" hint="diagnostic technique">
                    <JsonInspect value={data} maxHeight={260} />
                </LabCollapsible>
            </div>
        </div>
    );
}

/**
 * Section 5 — Enrichissements experts GEO (couche 2).
 *
 * Présente les modules spécialisés (llms.txt, découverte IA, marque/entité,
 * confiance, signaux négatifs). Les scores ne sont pas mis en avant : ce sont
 * des indicateurs internes qui alimentent la section 2 mais ne doivent pas
 * être communiqués comme tels au client.
 */
export default function AuditLabLayer2Diagnostic({ audit }) {
    const model = getLayer2ViewModel(audit);

    if (!model.hasAny) {
        return (
            <LabDiagnosticSection ribbon="Couche 2 · enrichissements experts">
                <LabSectionHeader
                    eyebrow="Section 5 · Enrichissements experts GEO"
                    title="Aucun enrichissement expert"
                    subtitle="Les modules spécialisés GEO (fichier llms.txt, endpoints de découverte IA, marque, confiance, signaux négatifs) ne sont pas disponibles sur ce dernier audit."
                    variant="diagnostic"
                />
                <LabEmptyState
                    title="Couche experte indisponible"
                    description="Cet audit n'a pas été exécuté avec le pipeline complet, ou les modules experts n'ont pas été persistés. Le score Trouvable reste valide sans ces enrichissements."
                />
            </LabDiagnosticSection>
        );
    }

    const summaryScore = typeof model.summary?.summary_score === 'number' ? model.summary.summary_score : null;
    const counts = model.summary?.finding_counts || null;

    return (
        <LabDiagnosticSection ribbon="Couche 2 · enrichissements experts">
            <LabSectionHeader
                eyebrow="Section 5 · Enrichissements experts GEO"
                title="Modules experts — analyse spécialisée IA"
                subtitle="Chaque module se concentre sur un signal spécifique utile aux moteurs IA (llms.txt, découverte IA, marque, confiance, signaux négatifs). Les indicateurs affichés sont internes : ils aident l'opérateur, ils ne remplacent pas le score Trouvable."
                variant="diagnostic"
                right={<LabPill label="diagnostic interne" tone="warn" />}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Modules exécutés</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-white/85">{model.modules.length}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Points relevés</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-white/85">{counts?.total ?? 0}</div>
                </div>
                <div className="rounded-xl border border-red-400/15 bg-red-400/[0.03] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-300/70">Gravité élevée</div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-red-300/90">{counts?.high ?? 0}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Indicateur global</div>
                    <div className={`mt-1 text-sm font-semibold tabular-nums ${scoreToneClass(summaryScore)}`}>
                        {summaryScore != null ? summaryScore : '—'}
                        {summaryScore != null && <span className="text-[9px] text-white/25">/100</span>}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-white/30">usage interne</div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {model.modules.map((module) => (
                    <ModuleCard key={module.key} label={module.label} data={module.data} />
                ))}
            </div>
        </LabDiagnosticSection>
    );
}
