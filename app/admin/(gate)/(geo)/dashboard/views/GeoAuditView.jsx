'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import AuditExplainabilityPanel from '@/components/audit/AuditExplainabilityPanel';

import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoAuditView() {
    const { client, audit, clientId, refetch } = useGeoClient();
    const [scanUrl, setScanUrl] = useState(client?.website_url || '');
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const seoScore = audit?.seo_score ?? null;
    const geoScore = audit?.geo_score ?? null;
    const hybridScore = audit?.geo_breakdown?.overall?.hybrid_score ?? null;
    const siteType = audit?.geo_breakdown?.site_classification?.label || audit?.seo_breakdown?.site_classification?.label || null;

    useEffect(() => {
        if (client?.website_url) setScanUrl(client.website_url);
    }, [client?.website_url]);

    async function startScan() {
        if (!clientId || !scanUrl.trim()) return;
        setScanning(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/audits/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    websiteUrl: scanUrl.trim(),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error || data.message || `Erreur ${response.status}`);
                return;
            }
            await refetch();
        } catch (requestError) {
            setError(requestError.message || 'Erreur reseau');
        } finally {
            setScanning(false);
        }
    }

    return (
        <div className="p-5">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Audit SEO / GEO</div>
                    <div className="text-[13px] text-white/40">
                        Audit observé du site avec extraction réelle, scoring déterministe adapté au profil et synthèse IA défensive.
                        {client ? ` - ${client.client_name}` : ''}
                    </div>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">
                    Voir les recommandations {'->'}
                </Link>
            </div>

            <div className="geo-card mb-5 bg-[var(--geo-s0)] p-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="url"
                        className="geo-inp flex-1 px-4 py-3 text-sm"
                        value={scanUrl}
                        onChange={(event) => setScanUrl(event.target.value)}
                        placeholder="https://..."
                        disabled={scanning}
                    />
                    <button
                        type="button"
                        onClick={startScan}
                        disabled={scanning || !clientId}
                        className="geo-btn geo-btn-pri shrink-0 px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {scanning ? 'Audit en cours...' : 'Lancer un audit'}
                    </button>
                </div>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <p className="mt-3 text-xs text-white/35">
                    Audit exécuté cote serveur (crawl, extraction, scoring, stockage). Patientez jusqu'à la fin du traitement.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Dernier résultat en base</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="geo-card border-[var(--geo-green-bd)] p-5">
                        <div className="mb-2 text-[11px] font-bold uppercase text-[var(--geo-t3)]">SEO technique</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-[var(--geo-green)]">
                            {seoScore != null ? seoScore : '-'}
                            <span className="text-xl text-[var(--geo-t3)]">{seoScore != null ? '/100' : ''}</span>
                        </div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">
                            {audit ? 'Observé via crawl + règles déterministes' : 'Aucun audit - lancez une analyse ci-dessus'}
                        </div>
                    </div>

                    <div className="geo-card border-[var(--geo-violet-bd)] p-5">
                        <div className="mb-2 text-[11px] font-bold uppercase text-[var(--geo-t3)]">Score GEO Inféré</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-[#a78bfa]">
                            {geoScore != null ? geoScore : '-'}
                            <span className="text-xl text-[var(--geo-t3)]">{geoScore != null ? '/100' : ''}</span>
                        </div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">
                            {audit ? 'Dérivé à partir des observables (sans garantie sur le positionnement final)' : '-'}
                        </div>
                    </div>

                    <div className="geo-card border-white/10 p-5">
                        <div className="mb-2 text-[11px] font-bold uppercase text-[var(--geo-t3)]">Vue audit hybride</div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl font-extrabold text-white/90">
                            {hybridScore != null ? hybridScore : '-'}
                            <span className="text-xl text-[var(--geo-t3)]">{hybridScore != null ? '/100' : ''}</span>
                        </div>
                        <div className="mt-3 text-xs text-[var(--geo-t2)]">
                            {siteType ? `Profil détecté: ${siteType}` : "En attente d'un audit classé"}
                        </div>
                    </div>
                </div>

                {audit ? (
                    <AuditExplainabilityPanel audit={audit} />
                ) : (
                    <div className="geo-card border border-dashed border-white/15 p-6">
                        <div className="text-sm font-semibold text-white/80">Aucun audit pour le moment</div>
                        <p className="mt-2 text-xs text-white/45">
                            Lancez un audit pour générer les preuves détectées, le scoring adapté au type de site et les priorités opérateur.
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri px-4 py-2">
                        Actions recommandées {'->'}
                    </Link>
                    <Link href={`${baseHref}?view=cockpit`} className="geo-btn geo-btn-ghost px-4 py-2">
                        Cockpit {'->'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

