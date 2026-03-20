'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import GeoChart, { generateData, getDates } from '../components/GeoChart';
import { useGeoClient, useGeoFilters } from '../../context/GeoClientContext';
import { AIModelLogo, AI_MODELS } from '../components/AIModelLogos';

export default function GeoOverviewView() {
    const { client, audit, clientId } = useGeoClient();
    const filters = useGeoFilters();
    const effectiveDays = filters?.days || 30;

    const labels = useMemo(() => getDates(effectiveDays), [effectiveDays]);
    const dataYou = useMemo(() => generateData(effectiveDays, 55, 4, 0.5), [effectiveDays]);
    const dataA = useMemo(() => generateData(effectiveDays, 50, 4, 0.1), [effectiveDays]);
    const dataB = useMemo(() => generateData(effectiveDays, 45, 4, -0.1), [effectiveDays]);
    const dataC = useMemo(() => generateData(effectiveDays, 40, 4, 0), [effectiveDays]);

    const auditScore = audit?.geo_score;
    const mainScore = auditScore ?? dataYou[dataYou.length - 1];
    const mainDiff = mainScore - dataYou[0];
    const mainTrendClass = mainDiff >= 0 ? 'geo-delta-up' : 'geo-delta-down';
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    const rankData = [
        { rank: 1, name: client?.client_name || 'Vous', you: true, score: 82, change: '+3', up: true, color: '#8b5cf6' },
        { rank: 2, name: "Pain d'Épice", you: false, score: 74, change: '+1', up: true, color: '#f97316' },
        { rank: 3, name: "Boulange Dorée", you: false, score: 62, change: '-1', up: false, color: '#3b82f6' },
        { rank: 4, name: "Maison Moulins", you: false, score: 54, change: '-2', up: false, color: '#ec4899' },
        { rank: 5, name: "Aux Délices", you: false, score: 41, change: '–', up: null, color: '#475569' },
    ];

    const yourRank = rankData.find((r) => r.you);
    const yourRankIndex = rankData.findIndex((r) => r.you);

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em] mb-0.5">
                        {client ? client.client_name : 'Dashboard'}
                    </div>
                    <div className="text-[13px] text-white/40">Progression de visibilité IA · {effectiveDays} derniers jours{client ? ` · ${client.business_type || 'LocalBusiness'}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[11px] text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)] inline-block" />
                    Prochain check : <b className="text-white/80">20h 20m</b>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_170px] gap-4 mb-4">
                {/* LLM Visibility Score */}
                <div className="geo-card p-5 relative overflow-hidden">
                    <div className="absolute -bottom-14 -right-14 w-[140px] h-[140px] bg-[radial-gradient(circle,rgba(139,92,246,.12),transparent_65%)] pointer-events-none" />
                    <div className="text-[10px] font-bold text-white/25 uppercase tracking-[0.08em] mb-3">LLM Visibility Score</div>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[46px] font-bold tracking-[-0.04em] text-white/95">
                            {mainScore}<span className="text-lg text-white/30">%</span>
                        </span>
                        <span className={mainTrendClass}>{mainDiff >= 0 ? '↑' : '↓'} {mainDiff >= 0 ? '+' : ''}{mainDiff}%</span>
                    </div>
                    <div className="text-[11px] text-white/35 mb-4">% réponses IA mentionnant votre marque</div>

                    {/* Industry rank mini */}
                    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <span className="text-[28px] font-bold tracking-[-0.04em] text-violet-300">#{yourRank?.rank ?? '–'}</span>
                            <div className="text-[10px] text-white/35 leading-tight">Votre rang<br />industrie locale</div>
                        </div>
                        <div className="flex gap-1 items-end">
                            {rankData.map((r, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full rounded-sm transition-all"
                                        style={{
                                            height: `${Math.max(8, r.score * 0.35)}px`,
                                            background: i === yourRankIndex
                                                ? `linear-gradient(to top, ${r.color}cc, ${r.color})`
                                                : 'rgba(255,255,255,0.06)',
                                        }}
                                    />
                                    <span className={`text-[8px] font-bold ${i === yourRankIndex ? 'text-violet-300' : 'text-white/20'}`}>#{r.rank}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main chart */}
                <div className="geo-card flex flex-col">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Tendance Visibilité IA</div>
                            <div className="geo-csub">% réponses IA mentionnant votre marque</div>
                        </div>
                        <div className="flex gap-2.5 items-center flex-wrap">
                            {[client?.client_name || 'Vous', 'Concurrent A', 'Concurrent B', 'Concurrent C'].map((label, i) => (
                                <div key={i} className="flex items-center gap-1 text-[10px] text-white/35">
                                    <span className="w-4 h-0.5 rounded-sm inline-block" style={{ background: ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'][i] }} />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="geo-cb flex-1 pb-3 flex flex-col">
                        <GeoChart
                            id="cv-big"
                            series={[
                                { data: dataYou, color: '#8b5cf6', label: client?.client_name || 'Vous' },
                                { data: dataA, color: '#3b82f6', label: 'Concurrent A' },
                                { data: dataB, color: '#22c55e', label: 'Concurrent B' },
                                { data: dataC, color: '#f59e0b', label: 'Concurrent C' }
                            ]}
                            options={{ interactive: true, grid: true, labels, showLabels: true, gridVals: [20, 50, 80] }}
                        />
                    </div>
                </div>

                {/* Citation Coverage */}
                <div className="geo-card flex flex-col">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Citation Coverage</div>
                            <div className="geo-csub">% réponses IA vous citant</div>
                        </div>
                    </div>
                    <div className="geo-cb flex-1 flex flex-col items-center justify-center">
                        <div className="relative w-[88px] h-[88px] mx-auto mb-2.5">
                            <svg width="88" height="88" viewBox="0 0 88 88">
                                <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                <circle cx="44" cy="44" r="34" fill="none" stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset="160" transform="rotate(-90 44 44)" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold tracking-[-0.02em]">25%</span>
                            </div>
                        </div>
                        <div className="text-[11px] text-white/40 text-center mb-2">Citée dans <b className="text-white/80">125</b> / 500 réponses</div>
                        <div className="flex gap-1.5 justify-center">
                            {AI_MODELS.slice(0, 4).map((m) => (
                                <AIModelLogo key={m.id} modelId={m.id} size={20} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Share of Voice */}
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Share of Voice</div>
                            <div className="geo-csub">Votre marque vs concurrents</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[17px] font-bold tracking-[-0.02em]">5.6%</span>
                            <span className="geo-delta-up text-[9px]">↑ +2.5%</span>
                        </div>
                    </div>
                    <div className="geo-cb space-y-3">
                        {[
                            { name: `● ${client?.client_name || 'Vous'} (Vous)`, pct: 66, color: 'linear-gradient(to right,#6d28d9,#8b5cf6)' },
                            { name: 'Concurrent A', pct: 58, color: '#3b82f6' },
                            { name: 'Concurrent B', pct: 51, color: '#22c55e' },
                            { name: 'Concurrent C', pct: 46, color: '#f59e0b' },
                            { name: 'Concurrent D', pct: 39, color: '#ef4444' }
                        ].map((r, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xs font-medium ${i === 0 ? 'text-white/90 font-semibold' : 'text-white/55'}`}>{r.name}</span>
                                    <span className="text-xs font-bold text-white/80">{r.pct}%</span>
                                </div>
                                <div className="geo-btr"><div className="geo-bfill" style={{ width: r.pct + '%', background: r.color }} /></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Industry Ranking */}
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Classement Industrie</div>
                            <div className="geo-csub">{client?.business_type || 'LocalBusiness'} · {client?.address?.city || 'Local'}</div>
                        </div>
                    </div>
                    <div className="geo-cb px-3 py-1 space-y-0">
                        {rankData.map((r) => (
                            <div key={r.rank} className={`flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0 transition-colors ${r.you ? 'bg-white/[0.02] -mx-3 px-3 rounded-lg' : ''}`}>
                                <span className={`text-[11px] font-bold w-4 text-center flex-shrink-0 ${r.you ? 'text-violet-300' : 'text-white/20'}`}>{r.rank}</span>
                                <div
                                    className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}dd)` }}
                                >
                                    {r.name.trim().charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[12px] font-semibold truncate ${r.you ? 'text-white' : 'text-white/70'}`}>{r.name}</span>
                                        {r.you && <span className="text-[8px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded px-1 py-px">(Vous)</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: r.score + '%', background: `linear-gradient(90deg, ${r.color}99, ${r.color})` }} />
                                        </div>
                                        <span className={`text-[11px] font-bold tabular-nums flex-shrink-0 ${r.you ? 'text-violet-300' : 'text-white/55'}`}>{r.score}%</span>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold flex-shrink-0 ${r.up === true ? 'text-emerald-400' : r.up === false ? 'text-red-400' : 'text-white/20'}`}>
                                    {r.up === true ? '▲' : r.up === false ? '▼' : '—'} {r.change.replace('+', '').replace('-', '').replace('–', '')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Engagement Opportunities */}
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Opportunités d&apos;Engagement</div>
                            <div className="geo-csub">Actions pour booster le score IA</div>
                        </div>
                        <span className="geo-pill-a">4 nouvelles</span>
                    </div>
                    <div className="p-1.5 px-4 space-y-0">
                        {[
                            { icon: '🔴', title: '10 fils Reddit', meta: 'r/montreal · Màj 6h', pill: 'Haut impact', pillClass: 'geo-pill-r', href: `${baseHref}?view=social` },
                            { icon: '🔵', title: '23 fils Quora', meta: 'Boulangerie MTL · 6h', pill: 'Haut impact', pillClass: 'geo-pill-r', href: `${baseHref}?view=social` },
                            { icon: '📝', title: 'FAQ absente — GEO', meta: '5 questions à structurer', pill: 'Impact moyen', pillClass: 'geo-pill-a', href: `${baseHref}?view=ameliorer` },
                            { icon: '🌐', title: '35 autres opport.', meta: 'Google AI Overview · Bing', pill: 'Explorer', pillClass: 'geo-pill-n', href: `${baseHref}?view=visibilite` }
                        ].map((o, i) => (
                            <div key={i} className="flex items-center gap-2 py-2.5 border-b border-white/[0.06] last:border-0">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0" style={{ background: i === 0 ? 'rgba(239,68,68,.08)' : i === 1 ? 'rgba(91,115,255,.08)' : i === 2 ? 'rgba(245,158,11,.08)' : 'rgba(255,255,255,.04)' }}>{o.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-white/85">{o.title}</div>
                                    <div className="text-[10px] text-white/30">{o.meta}</div>
                                </div>
                                <span className={o.pillClass}>{o.pill}</span>
                                <Link href={o.href} className="geo-btn geo-btn-ghost text-[10px] py-1 px-2">Engager →</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Citation Sources */}
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Sources de Citations</div>
                            <div className="geo-csub">Domaines les plus utilisés par les LLMs</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-[1.8fr_80px_65px_65px] items-center px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/25 border-b border-white/[0.06]">
                        <span>Domaine</span><span>Type</span><span>Utilisé</span><span>Moy.</span>
                    </div>
                    {[
                        { favicon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=32', name: 'reddit.com', type: 'UGC', sourceKey: 'reddit', used: '32%', moy: '41%', typeColor: '#818cf8', typeBg: 'rgba(129,140,248,0.08)', typeBorder: 'rgba(129,140,248,0.18)' },
                        { favicon: 'https://www.google.com/s2/favicons?domain=techradar.com&sz=32', name: 'techradar.com', type: 'Éditorial', sourceKey: 'editorial', used: '29%', moy: '46%', typeColor: '#fbbf24', typeBg: 'rgba(251,191,36,0.08)', typeBorder: 'rgba(251,191,36,0.18)' },
                        { favicon: 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32', name: 'wikipedia.org', type: 'Corporate', sourceKey: 'corporate', used: '24%', moy: '52%', typeColor: '#94a3b8', typeBg: 'rgba(148,163,184,0.06)', typeBorder: 'rgba(148,163,184,0.15)' },
                        { favicon: 'https://www.google.com/s2/favicons?domain=quora.com&sz=32', name: 'quora.com', type: 'UGC', sourceKey: 'quora', used: '15%', moy: '29%', typeColor: '#818cf8', typeBg: 'rgba(129,140,248,0.08)', typeBorder: 'rgba(129,140,248,0.18)' }
                    ].filter((d) => !filters?.source || filters.source === 'all' || d.sourceKey === filters.source || (filters.source === 'ugc' && d.type === 'UGC')).map((d, i) => (
                        <div key={i} className="grid grid-cols-[1.8fr_80px_65px_65px] items-center px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                            <div className="flex items-center gap-2.5">
                                <img src={d.favicon} alt={d.name} className="w-[18px] h-[18px] rounded flex-shrink-0" />
                                <span className="text-[12px] font-medium text-white/75">{d.name}</span>
                            </div>
                            <span
                                className="inline-flex items-center justify-center px-2 py-[3px] rounded-[5px] text-[10px] font-semibold tracking-[0.01em] w-fit"
                                style={{ color: d.typeColor, background: d.typeBg, border: `1px solid ${d.typeBorder}` }}
                            >
                                {d.type}
                            </span>
                            <span className="text-[12px] font-medium text-white/55 tabular-nums">{d.used}</span>
                            <span className="text-[12px] font-medium text-white/55 tabular-nums">{d.moy}</span>
                        </div>
                    ))}
                </div>

                {/* Performance by AI Model */}
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Performance par Modèle IA</div>
                            <div className="geo-csub">Visibilité dans chaque LLM</div>
                        </div>
                    </div>
                    <div className="geo-cb flex flex-col gap-3">
                        {[
                            { modelId: 'chatgpt', pct: 71, delta: '↑ 2.1%', deltaUp: true },
                            { modelId: 'gemini', pct: 62, delta: '↓ 0.3%', deltaUp: false },
                            { modelId: 'claude', pct: 58, delta: '↑ 1.4%', deltaUp: true },
                            { modelId: 'perplexity', pct: 44, delta: '↑ 0.8%', deltaUp: true },
                            { modelId: 'copilot', pct: 38, delta: '– 0%', deltaUp: null }
                        ].filter((m) => !filters?.model || filters.model === 'all' || m.modelId === filters.model).map((m) => {
                            const model = AI_MODELS.find((am) => am.id === m.modelId);
                            return (
                                <div key={m.modelId} className="flex items-center gap-2.5">
                                    <AIModelLogo modelId={m.modelId} size={22} />
                                    <span className="text-xs font-medium min-w-[75px] text-white/65">{model?.name}</span>
                                    <div className="geo-btr flex-1">
                                        <div className="geo-bfill" style={{ width: m.pct + '%', background: model?.color }} />
                                    </div>
                                    <span className="text-xs font-bold min-w-[32px] text-right tracking-tight">{m.pct}%</span>
                                    <span className={m.deltaUp === true ? 'geo-delta-up' : m.deltaUp === false ? 'geo-delta-down' : 'geo-delta-neutre'} style={{ fontSize: '9px' }}>{m.delta}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
