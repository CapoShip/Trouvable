'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import GeoChart, { generateData, getDates } from '../components/GeoChart';
import { useGeoClient, useGeoFilters } from '../../context/GeoClientContext';

export default function GeoSocialView() {
    const { client, clientId } = useGeoClient();
    const filters = useGeoFilters();
    const days = filters?.days || 30;
    const labels = useMemo(() => getDates(days), [days]);
    const socialData = useMemo(() => generateData(days, 15, 5, 0.2), [days]);
    const sentimentData = useMemo(() => generateData(days, 64, 3, 0.1), [days]);
    const [chartMode, setChartMode] = useState('volume');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Social Listening</div>
                    <div className="text-[13px] text-white/40">Monitoring en temps réel des conversations autour de {client?.client_name || 'votre marque'}</div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">Engager les fils →</Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                    { label: 'Mentions Totales', value: '342', sub: '↑ +12% vs sem.', subClass: 'geo-delta-up' },
                    { label: 'Sentiment Positif', value: '64%', sub: '↑ +5%', subClass: 'geo-delta-up' },
                    { label: 'Portée Estimée', value: '1.2M', sub: '↑ +18%', subClass: 'geo-delta-up' },
                    { label: 'Fils à Haut Impact', value: '14', sub: 'Action requise', subClass: 'geo-pill-a' }
                ].map((k, i) => (
                    <div key={i} className="geo-card p-4">
                        <div className="text-[10px] text-white/25 font-bold uppercase tracking-[0.06em] mb-1">{k.label}</div>
                        <div className="text-[28px] font-bold tracking-[-0.04em] text-white/90">{k.value}</div>
                        <span className={`${k.subClass} text-[10px]`}>{k.sub}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">{chartMode === 'volume' ? 'Volume des Mentions' : 'Sentiment Trend'}</div>
                            <div className="geo-csub">Évolution quotidienne · 30 jours</div>
                        </div>
                        <div className="geo-tabs">
                            <button onClick={() => setChartMode('volume')} className={`geo-tab ${chartMode === 'volume' ? 'on' : ''}`}>Volume</button>
                            <button onClick={() => setChartMode('sentiment')} className={`geo-tab ${chartMode === 'sentiment' ? 'on' : ''}`}>Sentiment</button>
                        </div>
                    </div>
                    <div className="geo-cb pb-3">
                        <GeoChart
                            id="cv-social"
                            series={[{
                                data: chartMode === 'volume' ? socialData : sentimentData,
                                color: chartMode === 'volume' ? '#3b82f6' : '#22c55e',
                                label: chartMode === 'volume' ? 'Mentions' : 'Sentiment %'
                            }]}
                            options={{ interactive: true, grid: true, labels, showLabels: true, min: 0, max: chartMode === 'volume' ? 40 : 100, unit: chartMode === 'volume' ? '' : '%', gridVals: chartMode === 'volume' ? [10, 20, 30] : [25, 50, 75] }}
                        />
                    </div>
                </div>

                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Fils à Haut Impact</div>
                            <div className="geo-csub">Conversations récentes à engager</div>
                        </div>
                    </div>
                    <div className="p-3 space-y-0">
                        {[
                            { platform: 'Reddit', sub: 'r/montreal', title: `Meilleur ${client?.business_type || 'commerce'} à Montréal ?`, time: 'Il y a 6h', score: 142, pill: 'Haut impact', pillClass: 'geo-pill-r' },
                            { platform: 'Quora', sub: 'Cuisine', title: `Où trouver du ${client?.business_type === 'Restaurant' ? 'brunch' : 'pain artisanal'} de qualité ?`, time: 'Il y a 12h', score: 89, pill: 'Moyen', pillClass: 'geo-pill-a' },
                            { platform: 'Reddit', sub: 'r/quebec', title: `Recommandation ${client?.business_type || 'commerce local'} écolo ?`, time: 'Il y a 1j', score: 67, pill: 'Nouveau', pillClass: 'geo-pill-b' },
                        ].map((thread, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--geo-bd)] last:border-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0 ${thread.platform === 'Reddit' ? 'bg-[#ff4500]' : 'bg-[#7c3aed]'}`}>
                                    {thread.platform[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-[var(--geo-t1)] truncate">{thread.title}</div>
                                    <div className="text-[10px] text-[var(--geo-t3)]">{thread.sub} · {thread.time} · ↑{thread.score}</div>
                                </div>
                                <span className={`${thread.pillClass} text-[9px]`}>{thread.pill}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="geo-card">
                <div className="geo-ch">
                    <div>
                        <div className="geo-ct">Sources Sociales</div>
                        <div className="geo-csub">Répartition par plateforme</div>
                    </div>
                </div>
                <div className="geo-cb">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { name: 'Reddit', color: '#ff4500', pct: 42, count: 144 },
                            { name: 'Quora', color: '#7c3aed', pct: 28, count: 96 },
                            { name: 'Twitter/X', color: '#1d9bf0', pct: 18, count: 62 },
                            { name: 'LinkedIn', color: '#0a66c2', pct: 12, count: 40 },
                        ].map((s) => (
                            <div key={s.name} className="p-3 bg-[var(--geo-s2)] border border-[var(--geo-bd)] rounded-[var(--geo-r)] hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ background: s.color }}>{s.name[0]}</div>
                                    <span className="text-xs font-semibold text-[var(--geo-t1)]">{s.name}</span>
                                </div>
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-extrabold" style={{ color: s.color }}>{s.pct}%</div>
                                <div className="text-[10px] text-[var(--geo-t3)]">{s.count} mentions</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
