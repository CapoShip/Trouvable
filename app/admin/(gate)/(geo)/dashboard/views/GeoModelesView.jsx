'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import GeoChart, { generateData, getDates } from '../components/GeoChart';
import { useGeoClient, useGeoFilters } from '../../context/GeoClientContext';
import { AIModelLogo, AI_MODELS } from '../components/AIModelLogos';

export default function GeoModelesView() {
    const { clientId } = useGeoClient();
    const filters = useGeoFilters();
    const days = filters?.days || 30;
    const labels = useMemo(() => getDates(days), [days]);
    const topbarModel = filters?.model;
    const [localActiveModel, setLocalActiveModel] = useState(null);
    const activeModel = (topbarModel && topbarModel !== 'all') ? topbarModel : localActiveModel;
    const setActiveModel = setLocalActiveModel;

    const modelsData = useMemo(() => [
        { id: 'chatgpt', value: '71%', delta: '↑ 2.1%', up: true, data: generateData(days, 70, 3, 0.2) },
        { id: 'gemini', value: '62%', delta: '↓ 0.3%', up: false, data: generateData(days, 60, 4, -0.1) },
        { id: 'claude', value: '58%', delta: '↑ 1.4%', up: true, data: generateData(days, 55, 3, 0.3) },
        { id: 'perplexity', value: '44%', delta: '↑ 0.8%', up: true, data: generateData(days, 44, 3, 0.1) },
        { id: 'copilot', value: '38%', delta: '→ 0%', up: null, data: generateData(days, 38, 3, 0) },
    ], [days]);

    const chartSeries = useMemo(() => {
        if (activeModel) {
            const m = modelsData.find((md) => md.id === activeModel);
            const model = AI_MODELS.find((am) => am.id === activeModel);
            return m ? [{ data: m.data, color: model?.color || '#8b5cf6', label: model?.name || activeModel }] : [];
        }
        return modelsData.slice(0, 3).map((md) => {
            const model = AI_MODELS.find((am) => am.id === md.id);
            return { data: md.data, color: model?.color || '#8b5cf6', label: model?.name || md.id };
        });
    }, [activeModel, modelsData]);

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Modèles IA</div>
                    <div className="text-[13px] text-white/40">Performance détaillée par moteur génératif</div>
                </div>
                <Link href={`${baseHref}?view=visibilite`} className="geo-btn geo-btn-ghost">
                    Voir la visibilité complète →
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {modelsData.map((md) => {
                    const model = AI_MODELS.find((am) => am.id === md.id);
                    const isActive = activeModel === md.id;
                    return (
                        <button
                            key={md.id}
                            onClick={() => setActiveModel(isActive ? null : md.id)}
                            className={`geo-card p-4 cursor-pointer transition-all text-left ${isActive ? 'border-[var(--geo-bd3)] bg-[var(--geo-s2)]' : 'hover:border-[var(--geo-bd2)]'}`}
                        >
                            <AIModelLogo modelId={md.id} size={32} className="mb-2.5" />
                            <div className="text-[11px] font-semibold text-[var(--geo-t2)] mb-1">{model?.name}</div>
                            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold" style={{ color: model?.color }}>{md.value}</div>
                            <span className={md.up === true ? 'geo-delta-up' : md.up === false ? 'geo-delta-down' : 'geo-delta-neutre'} style={{ fontSize: '9px', display: 'inline-flex', marginTop: 4 }}>{md.delta}</span>
                        </button>
                    );
                })}
            </div>

            <div className="geo-card">
                <div className="geo-ch">
                    <div>
                        <div className="geo-ct">Évolution par modèle {activeModel ? `— ${AI_MODELS.find((am) => am.id === activeModel)?.name}` : ''}</div>
                        <div className="geo-csub">{activeModel ? 'Cliquez une carte ci-dessus pour comparer' : 'Comparaison des 3 principaux modèles'}</div>
                    </div>
                    {activeModel && (
                        <button onClick={() => setActiveModel(null)} className="geo-btn geo-btn-ghost text-[10px] py-1 px-2">Voir tous →</button>
                    )}
                </div>
                <div className="geo-cb pb-3">
                    <GeoChart id="cv-models" series={chartSeries} options={{ interactive: true, grid: true, labels, showLabels: true, gridVals: [20, 40, 60, 80] }} />
                </div>
            </div>
        </div>
    );
}
