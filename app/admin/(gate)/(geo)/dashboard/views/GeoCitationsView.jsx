'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import GeoChart, { generateData, getDates } from '../components/GeoChart';
import { useGeoClient, useGeoFilters } from '../../context/GeoClientContext';
import { AIModelLogo, AI_MODELS } from '../components/AIModelLogos';

export default function GeoCitationsView() {
    const { client, clientId } = useGeoClient();
    const filters = useGeoFilters();
    const days = filters?.days || 30;
    const labels = useMemo(() => getDates(days), [days]);
    const citData = useMemo(() => generateData(days, 8, 2, 0.1), [days]);
    const [sourceTab, setSourceTab] = useState('domaines');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Citations</div>
                    <div className="text-[13px] text-white/40">Toutes les sources utilisées par les LLMs pour mentionner {client?.client_name || 'votre marque'}</div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">Améliorer les citations →</Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                    { label: 'Total citations', value: '125', sub: '↑ +18 vs hier', subClass: 'geo-delta-up' },
                    { label: 'Domaines sources', value: '34', sub: 'domaines uniques', subClass: 'geo-pill-n' },
                    { label: 'Sources UGC', value: '48%', sub: 'Reddit · Quora', subClass: 'geo-pill-b' },
                    { label: 'Sources Éditoriales', value: '38%', sub: 'Articles · Presse', subClass: 'geo-pill-c' }
                ].map((k, i) => (
                    <div key={i} className="geo-card p-4">
                        <div className="text-[10px] text-white/25 font-bold uppercase tracking-[0.06em] mb-1">{k.label}</div>
                        <div className="text-[28px] font-bold tracking-[-0.04em] text-white/90">{k.value}</div>
                        <span className={`${k.subClass} text-[10px]`}>{k.sub}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Évolution des citations</div>
                            <div className="geo-csub">Nombre de citations par jour</div>
                        </div>
                    </div>
                    <div className="geo-cb pb-3">
                        <GeoChart id="cv-cit" series={[{ data: citData, color: '#a78bfa', label: 'Citations' }]} options={{ interactive: true, grid: true, labels, showLabels: true, min: 0, max: 20, unit: '', gridVals: [5, 10, 15] }} />
                    </div>
                </div>

                <div className="geo-card">
                    <div className="geo-ch">
                        <div>
                            <div className="geo-ct">Sources par Modèle IA</div>
                            <div className="geo-csub">Qui cite votre marque le plus</div>
                        </div>
                        <div className="geo-tabs">
                            <button onClick={() => setSourceTab('domaines')} className={`geo-tab ${sourceTab === 'domaines' ? 'on' : ''}`}>Domaines</button>
                            <button onClick={() => setSourceTab('modeles')} className={`geo-tab ${sourceTab === 'modeles' ? 'on' : ''}`}>Modèles</button>
                        </div>
                    </div>
                    <div className="geo-cb flex flex-col gap-2.5">
                        {sourceTab === 'domaines' ? (
                            [
                                { name: 'reddit.com', pct: 32, color: '#ff4500', sourceKey: 'reddit', type: 'ugc' },
                                { name: 'quora.com', pct: 24, color: '#7c3aed', sourceKey: 'quora', type: 'ugc' },
                                { name: 'wikipedia.org', pct: 18, color: '#2563eb', sourceKey: 'corporate', type: 'corporate' },
                                { name: 'yelp.com', pct: 14, color: '#d32323', sourceKey: 'ugc', type: 'ugc' },
                                { name: 'tripadvisor.com', pct: 12, color: '#00af87', sourceKey: 'ugc', type: 'ugc' },
                            ].filter((s) => !filters?.source || filters.source === 'all' || s.sourceKey === filters.source || s.type === filters.source).map((s, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <img src={`https://www.google.com/s2/favicons?domain=${s.name}&sz=32`} alt={s.name} className="w-4 h-4 rounded flex-shrink-0" />
                                    <span className="text-xs text-[var(--geo-t1)] font-medium flex-1 min-w-[100px]">{s.name}</span>
                                    <div className="geo-btr flex-1">
                                        <div className="geo-bfill" style={{ width: s.pct + '%', background: s.color }} />
                                    </div>
                                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold min-w-[30px] text-right">{s.pct}%</span>
                                </div>
                            ))
                        ) : (
                            AI_MODELS.filter((m) => !filters?.model || filters.model === 'all' || m.id === filters.model).map((m, i) => (
                                <div key={m.id} className="flex items-center gap-2.5">
                                    <AIModelLogo modelId={m.id} size={18} />
                                    <span className="text-xs text-[var(--geo-t1)] font-medium flex-1 min-w-[70px]">{m.name}</span>
                                    <div className="geo-btr flex-1">
                                        <div className="geo-bfill" style={{ width: [38, 28, 18, 10, 6][i] + '%', background: m.color }} />
                                    </div>
                                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold min-w-[30px] text-right">{[38, 28, 18, 10, 6][i]}%</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
