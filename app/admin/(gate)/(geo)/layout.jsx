'use client';

import { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GeoClientProvider } from './context/GeoClientContext';
import GeoSidebar from './components/GeoSidebar';

function TopbarDropdown({ icon, label, options, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/[0.03] border border-white/8 rounded-[7px] text-[11px] font-medium text-white/55 cursor-pointer transition-all hover:border-white/15 hover:text-white/85 whitespace-nowrap"
            >
                {icon}
                {selected?.label || label}
                <svg className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 py-1 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] z-50 min-w-[160px]">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors ${opt.value === value ? 'text-white/90 bg-white/[0.06]' : 'text-white/55 hover:bg-white/[0.04] hover:text-white/80'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const DATE_RANGE_DAYS = { '7d': 7, '14d': 14, '30d': 30, '90d': 90, '1y': 365 };

export default function GeoLayout({ children }) {
    const [dateRange, setDateRange] = useState('30d');
    const [source, setSource] = useState('all');
    const [model, setModel] = useState('all');

    const filters = useMemo(() => ({
        dateRange,
        days: DATE_RANGE_DAYS[dateRange] || 30,
        source,
        model,
    }), [dateRange, source, model]);

    const handleExport = () => {
        const data = {
            exportedAt: new Date().toISOString(),
            filters: { dateRange, source, model },
            note: 'Export GEO Dashboard — données filtrées',
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geo-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <GeoClientProvider clients={[]} filters={filters}>
            <div className="geo-shell bg-[var(--geo-bg)] text-[var(--geo-t1)]">
                <Suspense fallback={
                    <nav className="geo-sb animate-pulse">
                        <div className="p-4 h-24 bg-[var(--geo-s1)]" />
                        <div className="flex-1 p-2" />
                    </nav>
                }>
                    <GeoSidebar />
                </Suspense>

                <div className="geo-main">
                    <div className="h-[46px] border-b border-white/8 flex items-center px-[18px] gap-1.5 flex-shrink-0 bg-[#0a0a0a] z-10">
                        <TopbarDropdown
                            icon={<svg className="w-3 h-3 opacity-60" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="14" height="14" rx="2" /><path d="M1 6h14" /></svg>}
                            label="Derniers 30 jours"
                            value={dateRange}
                            onChange={setDateRange}
                            options={[
                                { value: '7d', label: 'Derniers 7 jours' },
                                { value: '14d', label: 'Derniers 14 jours' },
                                { value: '30d', label: 'Derniers 30 jours' },
                                { value: '90d', label: 'Derniers 90 jours' },
                                { value: '1y', label: 'Dernière année' },
                            ]}
                        />
                        <TopbarDropdown
                            icon={<svg className="w-3 h-3 opacity-60" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 4h12M4 8h8M6 12h4" /></svg>}
                            label="Toutes sources"
                            value={source}
                            onChange={setSource}
                            options={[
                                { value: 'all', label: 'Toutes sources' },
                                { value: 'reddit', label: 'Reddit' },
                                { value: 'quora', label: 'Quora' },
                                { value: 'editorial', label: 'Éditorial' },
                                { value: 'ugc', label: 'UGC' },
                                { value: 'corporate', label: 'Corporate' },
                            ]}
                        />
                        <TopbarDropdown
                            icon={<svg className="w-3 h-3 opacity-60" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="5" /><path d="M8 5v3l2 1.5" /></svg>}
                            label="Tous les modèles"
                            value={model}
                            onChange={setModel}
                            options={[
                                { value: 'all', label: 'Tous les modèles' },
                                { value: 'chatgpt', label: 'ChatGPT' },
                                { value: 'gemini', label: 'Gemini' },
                                { value: 'claude', label: 'Claude' },
                                { value: 'perplexity', label: 'Perplexity' },
                                { value: 'copilot', label: 'Copilot' },
                            ]}
                        />
                        <div className="ml-auto flex items-center gap-2">
                            <button onClick={handleExport} className="geo-btn geo-btn-ghost">
                                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v8M5 7l3 3 3-3M2 12h12" /></svg>
                                Export
                            </button>
                            <Link href="/admin/dashboard/new" className="geo-btn geo-btn-pri">+ Nouveau client</Link>
                        </div>
                    </div>
                    <div className="geo-content">
                        {children}
                    </div>
                </div>
            </div>
        </GeoClientProvider>
    );
}
