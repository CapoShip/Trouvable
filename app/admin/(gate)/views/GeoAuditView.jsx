'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import AuditScoreBand from '@/components/audit/AuditScoreBand';
import AuditSiteProfile from '@/components/audit/AuditSiteProfile';
import AuditExecutiveSummary from '@/components/audit/AuditExecutiveSummary';
import AuditPriorityProblems from '@/components/audit/AuditPriorityProblems';
import AuditOpportunitySummary from '@/components/audit/AuditOpportunitySummary';
import AuditCitabilitySection from '@/components/audit/AuditCitabilitySection';
import AuditCorrectiveBridge from '@/components/audit/AuditCorrectiveBridge';
import AuditDetailCollapsible from '@/components/audit/AuditDetailCollapsible';

import { useGeoClient } from '../context/ClientContext';

export default function GeoAuditView() {
    const { client, audit, clientId, refetch } = useGeoClient();
    const [scanUrl, setScanUrl] = useState(client?.website_url || '');
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

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
            setError(requestError.message || 'Erreur réseau');
        } finally {
            setScanning(false);
        }
    }

    return (
        <div className="p-5">
            {/* Premium hero zone — header + scores unified */}
            <div className="relative mb-6 rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/30 before:to-transparent">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="text-2xl font-bold tracking-tight">Audit SEO / GEO</div>
                        <div className="text-sm text-white/50">
                            Scoring déterministe adapté au profil, synthèse IA défensive.
                            {client ? ` — ${client.client_name}` : ''}
                        </div>
                    </div>
                    <Link href={`${baseHref}/opportunities`} className="geo-btn geo-btn-vio">
                        File d&apos;actions →
                    </Link>
                </div>
                {audit && <div className="mt-5"><AuditScoreBand audit={audit} /></div>}
            </div>

            {/* Scan control — demoted */}
            <div className="my-3 rounded-xl border border-white/[0.05] bg-white/[0.025] px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="url"
                        className="geo-inp flex-1 px-4 py-2 text-sm"
                        value={scanUrl}
                        onChange={(event) => setScanUrl(event.target.value)}
                        placeholder="https://..."
                        disabled={scanning}
                    />
                    <button
                        type="button"
                        onClick={startScan}
                        disabled={scanning || !clientId}
                        className="geo-btn geo-btn-pri shrink-0 px-6 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {scanning ? 'Audit en cours…' : 'Lancer un audit'}
                    </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            {/* Main audit content */}
            {audit ? (
                <div className="space-y-8">
                    {/* Summary zone */}
                    <AuditSiteProfile audit={audit} />
                    <AuditExecutiveSummary audit={audit} />

                    {/* Detail zone — visual break */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                    <AuditPriorityProblems audit={audit} />
                    <AuditOpportunitySummary audit={audit} />
                    <AuditCitabilitySection audit={audit} />
                    <AuditCorrectiveBridge audit={audit} clientId={clientId} />
                    <AuditDetailCollapsible audit={audit} />
                </div>
            ) : (
                <div className="geo-card border border-dashed border-white/15 p-6">
                    <div className="text-sm font-semibold text-white/80">Aucun audit pour le moment</div>
                    <p className="mt-2 text-xs text-white/45">
                        Lancez un audit pour générer les preuves détectées, le scoring adapté au profil et les priorités opérateur.
                    </p>
                </div>
            )}

            {/* Footer links */}
            <div className="mt-8 flex flex-wrap gap-2">
                <Link href={`${baseHref}/opportunities`} className="geo-btn geo-btn-pri px-4 py-2">
                    File d&apos;actions →
                </Link>
                <Link href={`${baseHref}/overview`} className="geo-btn geo-btn-ghost px-4 py-2">
                    Vue d&apos;ensemble →
                </Link>
            </div>
        </div>
    );
}

