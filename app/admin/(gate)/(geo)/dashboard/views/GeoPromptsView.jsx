'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGeoClient, useGeoFilters } from '../../context/GeoClientContext';
import { AIModelLogo, AI_MODELS } from '../components/AIModelLogos';

export default function GeoPromptsView() {
    const { client, clientId } = useGeoClient();
    const filters = useGeoFilters();
    const [filter, setFilter] = useState('all');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const modelFilter = filters?.model;

    const businessType = client?.business_type || 'boulangerie';
    const city = client?.address?.city || 'Montréal';
    const region = client?.address?.region || 'Plateau-Mont-Royal';

    const allPrompts = useMemo(() => [
        { q: `Quelle est la meilleure ${businessType} artisanale à ${city} ?`, mentioned: true, models: ['chatgpt', 'gemini', 'claude'], rank: 1 },
        { q: `Où acheter du pain au levain de qualité sur le ${region} ?`, mentioned: true, models: ['chatgpt', 'claude'], rank: 2 },
        { q: `Recommande une ${businessType} avec livraison écologique à ${city}`, mentioned: true, models: ['gemini', 'perplexity'], rank: 3 },
        { q: `Meilleur ${businessType} local pour des croissants ?`, mentioned: true, models: ['chatgpt'], rank: 5 },
        { q: `Pain biologique artisanal ${city}`, mentioned: true, models: ['copilot', 'gemini'], rank: 4 },
        { q: `Quel est le meilleur restaurant brunch ${city} ?`, mentioned: false, models: [], rank: null },
        { q: `Pâtisseries sans gluten ${city}`, mentioned: false, models: [], rank: null },
        { q: `Traiteur événement corporatif ${city}`, mentioned: false, models: [], rank: null },
    ], [businessType, city, region]);

    const filteredByModel = useMemo(() => {
        if (!modelFilter || modelFilter === 'all') return allPrompts;
        return allPrompts.filter((p) => p.models.includes(modelFilter) || (!p.mentioned && p.models.length === 0));
    }, [allPrompts, modelFilter]);

    const prompts = filter === 'all' ? filteredByModel : filter === 'mentioned' ? filteredByModel.filter((p) => p.mentioned) : filteredByModel.filter((p) => !p.mentioned);
    const mentionedCount = filteredByModel.filter((p) => p.mentioned).length;
    const notMentionedCount = filteredByModel.filter((p) => !p.mentioned).length;
    const mentionRate = filteredByModel.length > 0 ? Math.round((mentionedCount / filteredByModel.length) * 100) : 0;

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Prompts Suivis</div>
                    <div className="text-[13px] text-white/40">{allPrompts.length} requêtes IA surveillées · Identifiez où {client?.client_name || 'vous'} apparaissez</div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri">+ Optimiser les prompts</Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                    { label: 'Total prompts', value: String(allPrompts.length) },
                    { label: 'Vous mentionné', value: String(mentionedCount), color: 'var(--geo-green)' },
                    { label: 'Non mentionné', value: String(notMentionedCount), color: '#f87171' },
                    { label: 'Taux de mention', value: `${mentionRate}%`, color: '#a78bfa' }
                ].map((k, i) => (
                    <div key={i} className="geo-card p-4">
                        <div className="text-[10px] text-white/25 font-bold uppercase tracking-[0.06em] mb-1">{k.label}</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold" style={{ color: k.color || 'var(--geo-t1)' }}>{k.value}</div>
                    </div>
                ))}
            </div>

            <div className="geo-card">
                <div className="geo-ch">
                    <div>
                        <div className="geo-ct">
                            {filter === 'all' ? 'Tous les Prompts' : filter === 'mentioned' ? 'Prompts où vous êtes mentionné ✓' : 'Prompts sans mention ✗'}
                        </div>
                        <div className="geo-csub">{prompts.length} prompts</div>
                    </div>
                    <div className="geo-tabs">
                        <button onClick={() => setFilter('all')} className={`geo-tab ${filter === 'all' ? 'on' : ''}`}>Tous</button>
                        <button onClick={() => setFilter('mentioned')} className={`geo-tab ${filter === 'mentioned' ? 'on' : ''}`}>Mentionné</button>
                        <button onClick={() => setFilter('not')} className={`geo-tab ${filter === 'not' ? 'on' : ''}`}>Non cité</button>
                    </div>
                </div>
                <div className="p-3 space-y-0">
                    {prompts.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--geo-bd)] last:border-0 hover:bg-[var(--geo-s2)] transition-colors px-2 rounded-[var(--geo-r)]">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.mentioned ? 'bg-[var(--geo-green-bg)] text-[var(--geo-green)]' : 'bg-[var(--geo-red-bg)] text-[#f87171]'}`}>
                                {p.mentioned ? '✓' : '✗'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-[var(--geo-t1)] truncate">{p.q}</div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                {p.models.map((modelId) => (
                                    <AIModelLogo key={modelId} modelId={modelId} size={16} />
                                ))}
                            </div>
                            {p.rank && <span className="geo-pill-pg text-[9px]">#{p.rank}</span>}
                            {!p.mentioned && <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost text-[9px] py-0.5 px-2">Optimiser</Link>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
