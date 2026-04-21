'use client';

import { useMemo, useState } from 'react';

import {
    LabDiagnosticSection,
    LabPill,
    LabSectionHeader,
} from './LabPrimitives';
import { formatMs, scoreToneClass } from './audit-lab-model';
import { humanizeCategoryKey, severityFr, severityTone } from './audit-lab-copy';

const DIMENSION_LABELS = {
    technical_seo: 'SEO technique',
    local_readiness: 'GEO / local',
    ai_answerability: 'Réponse IA',
    trust_signals: 'Signaux de confiance',
    identity_completeness: 'Identité complète',
};

function ScoreCell({ label, value, secondary, suffix = '/100', highlight = false }) {
    return (
        <div className={`rounded-xl border px-3 py-2.5 ${highlight ? 'border-violet-400/25 bg-violet-500/[0.05]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">{label}</div>
            <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-lg font-extrabold tabular-nums ${scoreToneClass(value)}`}>
                    {value == null ? '—' : value}
                </span>
                {value != null && <span className="text-[10px] text-white/30">{suffix}</span>}
            </div>
            {secondary && <div className="mt-0.5 text-[10px] text-white/40">{secondary}</div>}
        </div>
    );
}

function DeltaPill({ a, b }) {
    if (a == null || b == null) return <LabPill label="—" tone="neutral" />;
    const delta = Math.round(a - b);
    if (delta === 0) return <LabPill label="Égalité" tone="neutral" />;
    const label = `${delta > 0 ? '+' : ''}${delta} pts`;
    const tone = delta > 0 ? 'good' : 'bad';
    return <LabPill label={label} tone={tone} />;
}

function SiteBlock({ side, site, highlight = false }) {
    if (!site) return null;
    const l1 = site.layer1 || null;
    const l2 = site.layer2 || null;
    const expertScore = l2?.summary_score ?? null;

    return (
        <div className={`flex flex-col gap-3 rounded-2xl border p-4 ${highlight ? 'border-violet-400/25 bg-violet-500/[0.03]' : 'border-white/[0.08] bg-white/[0.015]'}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">Site {side}</div>
                    <div className="truncate text-[12px] font-semibold text-white/85" title={site.resolvedUrl || site.url}>
                        {site.resolvedUrl || site.url}
                    </div>
                </div>
                {site.classification?.label && (
                    <LabPill label={site.classification.label} tone="info" />
                )}
            </div>

            {site.error ? (
                <div className="rounded-md border border-red-400/20 bg-red-400/[0.04] px-2.5 py-1.5 text-[11px] text-red-300">
                    {site.error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-2">
                        <ScoreCell label="Score Trouvable" value={site.scores?.finalScore} highlight />
                        <ScoreCell label="SEO" value={site.scores?.seoScore} />
                        <ScoreCell label="GEO" value={site.scores?.geoScore} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Pages</div>
                            <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-white/80">
                                {site.pagesSuccessful} / {site.pagesScanned}
                            </div>
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Score brut couche 1</div>
                            <div className={`mt-0.5 text-[13px] font-semibold tabular-nums ${scoreToneClass(l1?.overall)}`}>
                                {l1?.overall ?? '—'}{l1?.overall != null && <span className="text-[9px] text-white/25">/100</span>}
                            </div>
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Indicateur expert</div>
                            <div className={`mt-0.5 text-[13px] font-semibold tabular-nums ${scoreToneClass(expertScore)}`}>
                                {expertScore ?? '—'}{expertScore != null && <span className="text-[9px] text-white/25">/100</span>}
                            </div>
                        </div>
                    </div>

                    {Array.isArray(site.issues) && site.issues.length > 0 && (
                        <div>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-300/80">Points faibles principaux</div>
                            <ul className="space-y-1">
                                {site.issues.slice(0, 5).map((issue, index) => (
                                    <li
                                        key={`${issue.id || 'issue'}-${index}`}
                                        className="flex items-start gap-1.5 rounded-md border border-white/[0.04] bg-white/[0.01] px-2.5 py-1.5"
                                    >
                                        {issue.severity && (
                                            <LabPill label={severityFr(issue.severity) || 'Info'} tone={severityTone(issue.severity)} />
                                        )}
                                        <span className="text-[11px] leading-snug text-white/70">
                                            {issue.title || humanizeCategoryKey(issue.id || issue.category || 'point')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {Array.isArray(site.strengths) && site.strengths.length > 0 && (
                        <div>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-300/80">Points forts principaux</div>
                            <ul className="space-y-1">
                                {site.strengths.slice(0, 4).map((strength, index) => (
                                    <li
                                        key={`${strength.id || 'strength'}-${index}`}
                                        className="rounded-md border border-emerald-400/10 bg-emerald-400/[0.02] px-2.5 py-1.5 text-[11px] leading-snug text-emerald-200/85"
                                    >
                                        {strength.title || humanizeCategoryKey(strength.id || strength.category || 'point')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            <div className="mt-auto text-[10px] text-white/35">Audit exécuté en {formatMs(site.durationMs)}</div>
        </div>
    );
}

function DimensionTable({ siteA, siteB }) {
    const dims = useMemo(() => {
        const byKeyA = new Map((siteA?.dimensions || []).map((d) => [d.key, d]));
        const byKeyB = new Map((siteB?.dimensions || []).map((d) => [d.key, d]));
        const keys = Array.from(new Set([...byKeyA.keys(), ...byKeyB.keys()]));
        return keys.map((key) => ({
            key,
            label: DIMENSION_LABELS[key] || humanizeCategoryKey(key),
            a: byKeyA.get(key)?.score ?? null,
            b: byKeyB.get(key)?.score ?? null,
        }));
    }, [siteA, siteB]);

    if (dims.length === 0) return null;

    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015]">
            <div className="border-b border-white/[0.05] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                Dimensions · site A vs site B
            </div>
            <div className="divide-y divide-white/[0.04]">
                {dims.map((dim) => (
                    <div key={dim.key} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 text-[11.5px]">
                        <div className="truncate text-white/75">{dim.label}</div>
                        <div className={`text-right font-semibold tabular-nums ${scoreToneClass(dim.a)}`}>
                            {dim.a ?? '—'}
                        </div>
                        <div className={`text-right font-semibold tabular-nums ${scoreToneClass(dim.b)}`}>
                            {dim.b ?? '—'}
                        </div>
                        <div className="min-w-[64px] text-right">
                            <DeltaPill a={dim.a} b={dim.b} />
                        </div>
                    </div>
                ))}
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] text-white/30">
                    <div />
                    <div className="text-right">A</div>
                    <div className="text-right">B</div>
                    <div className="text-right">Δ</div>
                </div>
            </div>
        </div>
    );
}

/**
 * Section E — Comparaison de sites (dry-run).
 *
 * Lance deux pipelines d'audit **sans persistence** (crawl → classif →
 * scoring déterministe + enrichissements experts quand disponibles) pour
 * comparer un site A à un site B. Le LLM n'est pas exécuté : cette section
 * sert au diagnostic comparé, pas à la production de la vérité client.
 */
export default function AuditLabCompare({ defaultUrlA = '' }) {
    const [urlA, setUrlA] = useState(defaultUrlA || '');
    const [urlB, setUrlB] = useState('');
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    async function handleCompare() {
        if (!urlA.trim() || !urlB.trim() || running) return;
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const response = await fetch('/api/admin/audits/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urlA: urlA.trim(), urlB: urlB.trim() }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.error || `Erreur ${response.status}`);
                return;
            }
            setResult(payload);
        } catch (err) {
            setError(err?.message || 'Erreur réseau');
        } finally {
            setRunning(false);
        }
    }

    const siteA = result?.siteA || null;
    const siteB = result?.siteB || null;

    return (
        <LabDiagnosticSection ribbon="Section E · comparaison de sites">
            <LabSectionHeader
                eyebrow="Section E · Comparaison"
                title="Comparer deux sites (interne)"
                subtitle="Lance les deux audits en parallèle sans les enregistrer (dry-run). L'analyse IA narrative est volontairement sautée pour garder la comparaison reproductible et rapide."
                variant="diagnostic"
                right={<LabPill label="dry-run — non persisté" tone="warn" />}
            />

            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Site A (référence)</div>
                    <input
                        type="url"
                        value={urlA}
                        onChange={(event) => setUrlA(event.target.value)}
                        placeholder="https://site-a.fr"
                        className="geo-inp mt-1 w-full px-3 py-1.5 text-[12px]"
                        disabled={running}
                    />
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Site B (comparaison)</div>
                    <input
                        type="url"
                        value={urlB}
                        onChange={(event) => setUrlB(event.target.value)}
                        placeholder="https://concurrent.fr"
                        className="geo-inp mt-1 w-full px-3 py-1.5 text-[12px]"
                        disabled={running}
                    />
                </div>
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={handleCompare}
                        disabled={running || !urlA.trim() || !urlB.trim()}
                        className="geo-btn geo-btn-vio w-full whitespace-nowrap px-4 py-1.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                    >
                        {running ? 'Comparaison en cours…' : 'Lancer la comparaison'}
                    </button>
                </div>
            </div>

            <p className="mt-2 text-[10.5px] leading-relaxed text-white/40">
                Les deux sites sont explorés en parallèle (~60–120 s au total selon la taille). L'audit n'est pas enregistré dans la base —
                cette vue ne remplace pas un audit client officiel.
            </p>

            {error && (
                <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-[12px] text-red-300">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <SiteBlock side="A" site={siteA} highlight />
                        <SiteBlock side="B" site={siteB} />
                    </div>

                    <DimensionTable siteA={siteA} siteB={siteB} />

                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] px-3 py-2 text-[10.5px] text-white/40">
                        <span>Durée totale : {formatMs(result.totalDurationMs)}</span>
                        <span className="text-white/15">·</span>
                        <span>Mode pipeline : {result.pipelineMode?.layered ? 'complet' : 'hérité'}{result.pipelineMode?.layer2 ? ' + couche 2' : ''}</span>
                        <span className="text-white/15">·</span>
                        <span>LLM non exécuté (par conception)</span>
                    </div>
                </div>
            )}
        </LabDiagnosticSection>
    );
}
