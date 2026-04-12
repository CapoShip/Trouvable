'use client';

import { motion } from 'framer-motion';
import { useGeoClient, useSeoWorkspaceSlice } from '../context/ClientContext';
import ScoreRing from '@/components/ui/ScoreRing';
import {
    GeoEmptyPanel,
    GeoSectionTitle,
    GeoPremiumCard,
} from '../components/GeoPremium';

const EASE = [0.16, 1, 0.3, 1];
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

function formatDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString('fr-CA', { dateStyle: 'medium' }); }
    catch { return '—'; }
}

function severityColor(severity) {
    if (severity === 'critical' || severity === 'high') return 'text-red-400/90';
    if (severity === 'medium') return 'text-amber-400/90';
    return 'text-white/60';
}

function severityLabel(severity) {
    const map = { critical: 'Critique', high: 'Important', medium: 'Moyen', low: 'Mineur' };
    return map[severity] || severity || '—';
}

export default function SeoHealthView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useSeoWorkspaceSlice('health');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data?.available) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoSectionTitle
                    title="Santé technique SEO"
                    subtitle={`Indicateurs de santé technique pour ${client?.client_name || 'ce client'}.`}
                />
                <GeoEmptyPanel
                    title={data?.emptyState?.title || 'Non disponible'}
                    description={data?.emptyState?.description || 'Données de santé technique non disponibles.'}
                />
            </div>
        );
    }

    return (
        <motion.div
            className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto"
            variants={stagger}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={fadeUp}>
                <GeoSectionTitle
                    title="Santé technique SEO"
                    subtitle={`Diagnostic technique basé sur le dernier audit — ${formatDate(data.auditDate)}.`}
                />
            </motion.div>

            {/* Score header */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="geo-card p-5 border border-white/[0.06] flex items-center gap-4">
                    <ScoreRing value={data.seoScore} color="#34d399" size={64} strokeWidth={5} />
                    <div>
                        <div className="text-[22px] font-bold text-white/90 tabular-nums">
                            {data.seoScore ?? '—'}<span className="text-[14px] text-white/35">/100</span>
                        </div>
                        <div className="text-[11px] text-white/40 font-bold uppercase tracking-[0.06em]">
                            {data.seoScoreLabel}
                        </div>
                        <div className="text-[9px] text-white/20 mt-1 max-w-[200px] leading-relaxed">
                            {data.seoScoreProvenance}
                        </div>
                    </div>
                </div>

                <div className="geo-card p-5 border border-white/[0.06]">
                    <div className="text-[10px] text-white/25 font-bold uppercase tracking-[0.08em] mb-2">Problèmes SEO</div>
                    <div className="text-[28px] font-bold text-amber-300/90 tabular-nums">{data.issueCount}</div>
                    <div className="text-[10px] text-white/30 mt-1">sur {data.totalIssueCount} total</div>
                </div>

                <div className="geo-card p-5 border border-white/[0.06]">
                    <div className="text-[10px] text-white/25 font-bold uppercase tracking-[0.08em] mb-2">Forces SEO</div>
                    <div className="text-[28px] font-bold text-emerald-400/90 tabular-nums">{data.strengthCount}</div>
                    <div className="text-[10px] text-white/30 mt-1">points forts détectés</div>
                </div>
            </motion.div>

            {/* Site classification */}
            {data.siteClassification && (
                <motion.div variants={fadeUp} className="geo-card p-4 border border-white/[0.06]">
                    <div className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-2">Classification du site</div>
                    <div className="flex items-center gap-3">
                        <span className="text-[13px] font-semibold text-white/85">{data.siteClassification.label || data.siteClassification.type}</span>
                        {data.siteClassification.confidence && (
                            <span className="text-[10px] text-white/30 border border-white/[0.08] rounded px-1.5 py-0.5">
                                Confiance: {data.siteClassification.confidence}
                            </span>
                        )}
                    </div>
                    {data.siteClassification.reasons?.length > 0 && (
                        <div className="mt-2 text-[10px] text-white/35 leading-relaxed">
                            {data.siteClassification.reasons.join(' · ')}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Issues list */}
            {data.issues?.length > 0 && (
                <motion.div variants={fadeUp}>
                    <GeoPremiumCard className="p-0 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                            <div className="text-sm font-semibold text-white/95">Problèmes techniques</div>
                            <div className="text-[11px] text-white/35">{data.issues.length} problèmes SEO identifiés par l'audit.</div>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                            {data.issues.map((issue, i) => (
                                <div key={issue.key || i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[12px] text-white/80 font-medium">{issue.label || issue.key}</div>
                                            {issue.description && (
                                                <div className="text-[10px] text-white/35 mt-0.5 line-clamp-2">{issue.description}</div>
                                            )}
                                            {issue.evidence && (
                                                <div className="text-[10px] text-white/25 mt-0.5 font-mono truncate max-w-md">{issue.evidence}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {issue.category && (
                                                <span className="text-[9px] text-white/25 border border-white/[0.06] rounded px-1.5 py-0.5 uppercase tracking-wider">
                                                    {issue.category}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-semibold ${severityColor(issue.severity)}`}>
                                                {severityLabel(issue.severity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GeoPremiumCard>
                </motion.div>
            )}

            {/* Strengths list */}
            {data.strengths?.length > 0 && (
                <motion.div variants={fadeUp}>
                    <GeoPremiumCard className="p-0 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                            <div className="text-sm font-semibold text-white/95">Points forts</div>
                            <div className="text-[11px] text-white/35">{data.strengths.length} points forts SEO détectés.</div>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                            {data.strengths.map((strength, i) => (
                                <div key={strength.key || i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="text-[12px] text-emerald-300/80 font-medium">{strength.label || strength.key}</div>
                                    {strength.description && (
                                        <div className="text-[10px] text-white/35 mt-0.5">{strength.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GeoPremiumCard>
                </motion.div>
            )}

            {/* Methodology note */}
            {data.methodology && (
                <motion.div variants={fadeUp} className="geo-card p-4 border border-white/[0.06]">
                    <div className="text-[11px] font-bold text-white/25 uppercase tracking-wider mb-2">Méthodologie</div>
                    <div className="text-[10px] text-white/30 leading-relaxed space-y-1">
                        {data.methodology.notes?.map((note, i) => (
                            <div key={i}>• {note}</div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
