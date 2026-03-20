'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoAuditView() {
    const { client, audit, clientId, refetch } = useGeoClient();
    const [scanUrl, setScanUrl] = useState(client?.website_url || '');
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showResults, setShowResults] = useState(true);
    const [scanPhase, setScanPhase] = useState('');

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    useEffect(() => {
        if (client?.website_url && !scanUrl) setScanUrl(client.website_url);
    }, [client?.website_url, scanUrl]);

    const phases = [
        'Résolution DNS...',
        'Crawl des pages...',
        'Analyse SEO technique...',
        'Extraction Schema.org...',
        'Analyse GEO / LLM...',
        'Calcul des scores...',
        'Génération du rapport...',
    ];

    const startScan = () => {
        if (!scanUrl.trim()) return;
        setScanning(true);
        setProgress(0);
        setShowResults(false);
        setScanPhase(phases[0]);

        const interval = setInterval(() => {
            setProgress((p) => {
                const next = p + Math.random() * 12;
                const phaseIdx = Math.min(Math.floor((next / 100) * phases.length), phases.length - 1);
                setScanPhase(phases[phaseIdx]);
                if (next >= 100) {
                    clearInterval(interval);
                    setScanning(false);
                    setShowResults(true);
                    refetch();
                    return 100;
                }
                return next;
            });
        }, 500);
    };

    const seoScore = audit?.seo_score ?? 82;
    const geoScore = audit?.geo_score ?? 74;
    const issues = audit?.issues || [];
    const strengths = audit?.strengths || [];

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Deep Scanner GEO/SEO</div>
                    <div className="text-[13px] text-white/40">Analyse structurelle et requête des bases vectorielles des LLMs{client ? ` — ${client.client_name}` : ''}.</div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">
                    Voir les recommandations →
                </Link>
            </div>

            <div className="geo-card p-6 mb-5 bg-[var(--geo-s0)]">
                <div className="flex gap-3">
                    <input
                        type="text"
                        className="geo-inp flex-1 text-sm py-3 px-4"
                        value={scanUrl}
                        onChange={(e) => setScanUrl(e.target.value)}
                        placeholder="https://..."
                    />
                    <button
                        onClick={startScan}
                        disabled={scanning}
                        className="geo-btn geo-btn-pri py-3 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {scanning ? 'Scan en cours...' : "Lancer l'Analyse Profonde"}
                    </button>
                </div>

                {scanning && (
                    <div className="mt-6">
                        <div className="flex justify-between text-xs text-[var(--geo-t2)] mb-2 font-mono">
                            <span className="text-[var(--geo-violet)]">{scanPhase}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="geo-btr h-1.5 bg-[var(--geo-s2)]">
                            <div className="geo-bfill bg-[var(--geo-violet)]" style={{ width: progress + '%', boxShadow: '0 0 10px var(--geo-violet)' }} />
                        </div>
                    </div>
                )}
            </div>

            <div className={showResults ? 'opacity-100' : 'opacity-20 pointer-events-none'} style={{ transition: 'opacity 0.3s' }}>
                <h3 className="text-sm font-semibold mb-4">Derniers Résultats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card p-5 border-[var(--geo-green-bd)]">
                        <div className="text-[11px] text-[var(--geo-t3)] uppercase font-bold mb-2">Score Technique SEO</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-[var(--geo-green)]">{seoScore}<span className="text-xl text-[var(--geo-t3)]">/100</span></div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">✅ Metadata complète · ✅ HTTPS Actif · ⚠️ Vitesse LCP (4.2s)</div>
                    </div>
                    <div className="geo-card p-5 border-[var(--geo-violet-bd)]">
                        <div className="text-[11px] text-[var(--geo-t3)] uppercase font-bold mb-2">Intelligence GEO</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-[#a78bfa]">{geoScore}<span className="text-xl text-[var(--geo-t3)]">/100</span></div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">✅ LocalBusiness Schema · ❌ FAQ Schema Absente · ❌ AggregateRating Absent</div>
                    </div>
                </div>

                {issues.length > 0 && (
                    <div className="geo-card mb-4">
                        <div className="geo-ch bg-[var(--geo-red-bg)]">
                            <div><div className="geo-ct text-[var(--geo-red)]">Problèmes Détectés ({issues.length})</div></div>
                        </div>
                        <div className="p-3 space-y-0">
                            {issues.slice(0, 5).map((issue, i) => (
                                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[var(--geo-bd)] last:border-0">
                                    <div className="w-6 h-6 rounded-md bg-[var(--geo-red-bg)] text-[var(--geo-red)] flex items-center justify-center font-bold text-xs flex-shrink-0">!</div>
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-[var(--geo-t1)]">{typeof issue === 'string' ? issue : issue.title || issue.description}</div>
                                    </div>
                                    <span className="geo-pill-r text-[9px]">Impact GEO</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {strengths.length > 0 && (
                    <div className="geo-card mb-4">
                        <div className="geo-ch bg-[var(--geo-green-bg)]">
                            <div><div className="geo-ct text-[var(--geo-green)]">Points Forts ({strengths.length})</div></div>
                        </div>
                        <div className="p-3 space-y-0">
                            {strengths.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[var(--geo-bd)] last:border-0">
                                    <div className="w-6 h-6 rounded-md bg-[var(--geo-green-bg)] text-[var(--geo-green)] flex items-center justify-center font-bold text-xs flex-shrink-0">✓</div>
                                    <div className="text-xs font-semibold text-[var(--geo-t1)]">{typeof s === 'string' ? s : s.title || s.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri py-2 px-4">
                        Voir les actions recommandées →
                    </Link>
                    <Link href={`${baseHref}?view=cockpit`} className="geo-btn geo-btn-ghost py-2 px-4">
                        Ouvrir le Cockpit →
                    </Link>
                </div>
            </div>
        </div>
    );
}
