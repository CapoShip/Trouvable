'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoAuditView() {
    const { client, audit, clientId, refetch } = useGeoClient();
    const [scanUrl, setScanUrl] = useState(client?.website_url || '');
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    useEffect(() => {
        if (client?.website_url) setScanUrl(client.website_url);
    }, [client?.website_url]);

    async function startScan() {
        if (!clientId || !scanUrl.trim()) return;
        setScanning(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/audits/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    websiteUrl: scanUrl.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || data.message || `Erreur ${res.status}`);
                return;
            }
            await refetch();
        } catch (e) {
            setError(e.message || 'Erreur réseau');
        } finally {
            setScanning(false);
        }
    }

    const seoScore = audit?.seo_score ?? null;
    const geoScore = audit?.geo_score ?? null;
    const issues = audit?.issues || [];
    const strengths = audit?.strengths || [];

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Audit SEO / GEO</div>
                    <div className="text-[13px] text-white/40">
                        Analyse réelle du site (crawl, signaux, score déterministe + synthèse IA){' '}
                        {client ? `— ${client.client_name}` : ''}
                    </div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">
                    Voir les recommandations →
                </Link>
            </div>

            <div className="geo-card p-6 mb-5 bg-[var(--geo-s0)]">
                <div className="flex gap-3 flex-col sm:flex-row">
                    <input
                        type="url"
                        className="geo-inp flex-1 text-sm py-3 px-4"
                        value={scanUrl}
                        onChange={(e) => setScanUrl(e.target.value)}
                        placeholder="https://..."
                        disabled={scanning}
                    />
                    <button
                        type="button"
                        onClick={startScan}
                        disabled={scanning || !clientId}
                        className="geo-btn geo-btn-pri py-3 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {scanning ? 'Audit en cours…' : 'Lancer un audit'}
                    </button>
                </div>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <p className="mt-3 text-xs text-white/35">
                    L’audit s’exécute côté serveur (fetch page, analyse, stockage). Patientez jusqu’à la fin du traitement.
                </p>
            </div>

            <div className="opacity-100">
                <h3 className="text-sm font-semibold mb-4">Dernier résultat en base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card p-5 border-[var(--geo-green-bd)]">
                        <div className="text-[11px] text-[var(--geo-t3)] uppercase font-bold mb-2">Score technique SEO</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-[var(--geo-green)]">
                            {seoScore != null ? seoScore : '—'}
                            <span className="text-xl text-[var(--geo-t3)]">{seoScore != null ? '/100' : ''}</span>
                        </div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">
                            {audit ? 'Basé sur le dernier audit exécuté' : 'Aucun audit — lancez une analyse ci-dessus'}
                        </div>
                    </div>
                    <div className="geo-card p-5 border-[var(--geo-violet-bd)]">
                        <div className="text-[11px] text-[var(--geo-t3)] uppercase font-bold mb-2">Score GEO (audit)</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-[#a78bfa]">
                            {geoScore != null ? geoScore : '—'}
                            <span className="text-xl text-[var(--geo-t3)]">{geoScore != null ? '/100' : ''}</span>
                        </div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">
                            {audit ? 'Indicateur agrégé (pas un classement officiel de modèle)' : '—'}
                        </div>
                    </div>
                </div>

                {issues.length > 0 && (
                    <div className="geo-card mb-4">
                        <div className="geo-ch bg-[var(--geo-red-bg)]">
                            <div>
                                <div className="geo-ct text-[var(--geo-red)]">Problèmes détectés ({issues.length})</div>
                            </div>
                        </div>
                        <div className="p-3 space-y-0">
                            {issues.slice(0, 5).map((issue, i) => (
                                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[var(--geo-bd)] last:border-0">
                                    <div className="w-6 h-6 rounded-md bg-[var(--geo-red-bg)] text-[var(--geo-red)] flex items-center justify-center font-bold text-xs flex-shrink-0">!</div>
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-[var(--geo-t1)]">
                                            {typeof issue === 'string' ? issue : issue.title || issue.description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {strengths.length > 0 && (
                    <div className="geo-card mb-4">
                        <div className="geo-ch bg-[var(--geo-green-bg)]">
                            <div>
                                <div className="geo-ct text-[var(--geo-green)]">Points forts ({strengths.length})</div>
                            </div>
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

                <div className="flex gap-2 flex-wrap">
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri py-2 px-4">
                        Actions recommandées →
                    </Link>
                    <Link href={`${baseHref}?view=cockpit`} className="geo-btn geo-btn-ghost py-2 px-4">
                        Cockpit →
                    </Link>
                </div>
            </div>
        </div>
    );
}
