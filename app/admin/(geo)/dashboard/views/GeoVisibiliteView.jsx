'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import GeoChart, { generateData, getDates } from '../components/GeoChart';
import { useGeoClient, useGeoFilters } from '../../context/GeoClientContext';
import { AIModelLogo, AI_MODELS } from '../components/AIModelLogos';

export default function GeoVisibiliteView() {
    const { client, audit, clientId } = useGeoClient();
    const filters = useGeoFilters();
    const days = filters?.days || 30;
    const labels = useMemo(() => getDates(days), [days]);
    const dataYou = useMemo(() => generateData(days, 55, 4, 0.5), [days]);
    const [topicTab, setTopicTab] = useState('topics');

    const geoScore = audit?.geo_score ?? 66;
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Visibilité IA</div>
                    <div className="text-[13px] text-white/40">Suivi complet de votre présence dans les moteurs génératifs{client ? ` — ${client.client_name}` : ''}</div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">
                    Améliorer le score →
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'Score Global', value: String(geoScore), unit: '%', sub: '↑ +5.2% ce mois', subClass: 'geo-delta-up' },
                    { label: 'Rang Industrie', value: '#4', sub: '↑ +1 position', subClass: 'geo-delta-up' },
                    { label: 'Réponses Analysées', value: '500', sub: '30 derniers jours', subClass: 'geo-pill-n' },
                    { label: 'Citations Détectées', value: '125', sub: '↑ +18 vs hier', subClass: 'geo-delta-up' }
                ].map((k, i) => (
                    <div key={i} className="geo-card p-4">
                        <div className="text-[10px] text-white/25 font-bold uppercase tracking-[0.06em] mb-1.5">{k.label}</div>
                        <div className="text-[34px] font-bold tracking-[-0.04em] text-white/90">{k.value}{k.unit}</div>
                        <span className={`${k.subClass} text-[10px] mt-1`}>{k.sub}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="geo-card flex flex-col">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Évolution du Score de Visibilité</div>
                            <div className="geo-csub">Tendance 30 jours vs concurrents</div>
                        </div>
                    </div>
                    <div className="geo-cb flex-1 pb-3">
                        <GeoChart id="cv-vis" series={[{ data: dataYou, color: '#8b5cf6', label: 'Score Global' }]} options={{ interactive: true, grid: true, labels, showLabels: true }} />
                    </div>
                </div>
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Visibilité par Topic</div>
                            <div className="geo-csub">Thèmes où vous êtes le plus mentionné</div>
                        </div>
                        <div className="geo-tabs">
                            <button onClick={() => setTopicTab('topics')} className={`geo-tab ${topicTab === 'topics' ? 'on' : ''}`}>Topics</button>
                            <button onClick={() => setTopicTab('modeles')} className={`geo-tab ${topicTab === 'modeles' ? 'on' : ''}`}>Modèles</button>
                        </div>
                    </div>
                    <div className="geo-cb flex flex-col gap-2">
                        {topicTab === 'topics' ? (
                            [
                                { topic: client?.business_type === 'Restaurant' ? 'restaurant gastronomique' : 'pain au levain artisanal', pct: 84, color: '#8b5cf6' },
                                { topic: client?.business_type === 'Restaurant' ? 'brunch Montréal' : 'viennoiserie maison', pct: 69, color: '#22c55e' },
                                { topic: `${client?.business_type || 'boulangerie'} ${client?.address?.city || 'Plateau-Mont-Royal'}`, pct: 61, color: '#3b82f6' }
                            ].map((t, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <span className="text-xs text-[var(--geo-t1)] font-medium flex-1">{t.topic}</span>
                                    <div className="geo-btr w-24">
                                        <div className="geo-bfill" style={{ width: t.pct + '%', background: t.color }} />
                                    </div>
                                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold min-w-[30px] text-right">{t.pct}%</span>
                                </div>
                            ))
                        ) : (
                            AI_MODELS.filter((m) => !filters?.model || filters.model === 'all' || m.id === filters.model).map((m) => (
                                <div key={m.id} className="flex items-center gap-2.5">
                                    <AIModelLogo modelId={m.id} size={18} />
                                    <span className="text-xs text-[var(--geo-t1)] font-medium flex-1">{m.name}</span>
                                    <div className="geo-btr w-24">
                                        <div className="geo-bfill" style={{ width: (30 + Math.floor(Math.random() * 50)) + '%', background: m.color }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="geo-card">
                <div className="geo-ch">
                    <div>
                        <div className="geo-ct">Performance par Modèle IA</div>
                        <div className="geo-csub">Comparaison détaillée de votre visibilité</div>
                    </div>
                </div>
                <div className="geo-cb">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { modelId: 'chatgpt', pct: 71, delta: '↑ 2.1%', up: true },
                            { modelId: 'gemini', pct: 62, delta: '↓ 0.3%', up: false },
                            { modelId: 'claude', pct: 58, delta: '↑ 1.4%', up: true },
                            { modelId: 'perplexity', pct: 44, delta: '↑ 0.8%', up: true },
                            { modelId: 'copilot', pct: 38, delta: '→ 0%', up: null },
                        ].filter((m) => !filters?.model || filters.model === 'all' || m.modelId === filters.model).map((m) => {
                            const model = AI_MODELS.find((am) => am.id === m.modelId);
                            return (
                                <Link key={m.modelId} href={`${baseHref}?view=modeles`} className="flex flex-col items-center gap-2 p-3 rounded-[var(--geo-r)] hover:bg-[var(--geo-s2)] transition-colors cursor-pointer">
                                    <AIModelLogo modelId={m.modelId} size={28} />
                                    <span className="text-[11px] font-semibold text-[var(--geo-t2)]">{model?.name}</span>
                                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-extrabold" style={{ color: model?.color }}>{m.pct}%</span>
                                    <span className={m.up === true ? 'geo-delta-up' : m.up === false ? 'geo-delta-down' : 'geo-delta-neutre'} style={{ fontSize: '9px' }}>{m.delta}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
