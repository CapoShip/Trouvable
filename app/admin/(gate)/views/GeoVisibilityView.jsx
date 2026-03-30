'use client';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    GeoEmptyPanel,
    GeoKpiCard,
    GeoPremiumCard,
    GeoSectionTitle,
} from '../components/GeoPremium';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function connectorStatusLabel(status) {
    const map = {
        healthy: 'Actif',
        configured: 'Configuré',
        syncing: 'Synchronisation',
        error: 'Erreur',
        disabled: 'Désactivé',
        not_connected: 'Non connecté',
        sample_mode: 'Échantillon',
    };
    return map[status] || status || 'Inconnu';
}

function connectorPillClass(status) {
    if (status === 'healthy' || status === 'configured') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'syncing') return 'border-blue-400/20 bg-blue-400/10 text-blue-300';
    if (status === 'error') return 'border-red-400/20 bg-red-400/10 text-red-300';
    if (status === 'not_connected') return 'border-white/15 bg-white/[0.03] text-white/55';
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
}

function ConnectorBanner({ label, connector }) {
    return (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${connectorPillClass(connector.status)}`}>
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] opacity-80">
                    {connectorStatusLabel(connector.status)}
                </span>
            </div>
            <div className="text-[10px] opacity-60">
                {connector.lastSyncedAt ? `Sync: ${formatDateTime(connector.lastSyncedAt)}` : 'Jamais synchronisé'}
                {connector.status === 'error' && connector.lastError && (
                    <span className="ml-2 text-red-300/80">— {connector.lastError}</span>
                )}
            </div>
        </div>
    );
}

function formatNumber(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('fr-FR');
}

function formatCtr(ctr) {
    if (ctr == null) return '—';
    return `${(Number(ctr) * 100).toFixed(1)}%`;
}

function formatPosition(pos) {
    if (pos == null) return '—';
    return Number(pos).toFixed(1);
}

export default function GeoVisibilityView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('visibility');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data || data.emptyState) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoSectionTitle
                    title="Visibilité Google"
                    subtitle={`Données GA4 et Search Console pour ${client?.client_name || 'ce client'}.`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {data?.connectors?.ga4 && <ConnectorBanner label="GA4" connector={data.connectors.ga4} />}
                    {data?.connectors?.gsc && <ConnectorBanner label="Search Console" connector={data.connectors.gsc} />}
                </div>
                <GeoEmptyPanel
                    title={data?.emptyState?.title || 'Visibilité Google indisponible'}
                    description={data?.emptyState?.description || 'Les connecteurs ne sont pas configurés.'}
                />
            </div>
        );
    }

    const { connectors, kpis, trafficDaily, topPages, gscQueries } = data;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Visibilité Google"
                subtitle={`Trafic GA4 et performance Search Console pour ${client?.client_name || 'ce client'} — 28 derniers jours.`}
            />

            {/* Connector banners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectors?.ga4 && <ConnectorBanner label="GA4" connector={connectors.ga4} />}
                {connectors?.gsc && <ConnectorBanner label="Search Console" connector={connectors.gsc} />}
            </div>

            {/* KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                    <GeoKpiCard label="Sessions" value={formatNumber(kpis.sessions)} hint="28 jours" accent="blue" />
                    <GeoKpiCard label="Utilisateurs" value={formatNumber(kpis.users)} hint="28 jours" accent="violet" />
                    <GeoKpiCard label="Nouveaux" value={formatNumber(kpis.newUsers)} hint="Nouveaux utilisateurs" accent="emerald" />
                    <GeoKpiCard label="Pages vues" value={formatNumber(kpis.pageViews)} hint="28 jours" />
                    <GeoKpiCard label="Clics GSC" value={formatNumber(kpis.totalClicks)} hint="Search Console" accent="blue" />
                    <GeoKpiCard label="Impressions" value={formatNumber(kpis.totalImpressions)} hint="Search Console" accent="amber" />
                    <GeoKpiCard label="Jours trafic" value={kpis.daysWithTraffic} hint="Jours avec données" />
                    <GeoKpiCard label="Requêtes" value={formatNumber(kpis.gscQueryCount)} hint="Requêtes uniques" accent="violet" />
                </div>
            )}

            {/* GA4 Traffic Daily */}
            {trafficDaily.length > 0 && (
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="text-sm font-semibold text-white/95">Trafic quotidien (GA4)</div>
                        <div className="text-[11px] text-white/35">{trafficDaily.length} jours de données — sessions, utilisateurs, pages vues.</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/[0.06] text-white/40 text-[10px] uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                                    <th className="px-4 py-3 text-right font-semibold">Sessions</th>
                                    <th className="px-4 py-3 text-right font-semibold">Utilisateurs</th>
                                    <th className="px-4 py-3 text-right font-semibold">Nouveaux</th>
                                    <th className="px-4 py-3 text-right font-semibold">Pages vues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {trafficDaily.map((row) => (
                                    <tr key={row.date} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-2.5 text-white/75 font-mono">{row.date}</td>
                                        <td className="px-4 py-2.5 text-right text-white/80 tabular-nums">{formatNumber(row.sessions)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/80 tabular-nums">{formatNumber(row.users)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{formatNumber(row.new_users)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{formatNumber(row.page_views)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GeoPremiumCard>
            )}

            {/* GSC Top Queries */}
            {gscQueries.length > 0 && (
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="text-sm font-semibold text-white/95">Requêtes Search Console</div>
                        <div className="text-[11px] text-white/35">{gscQueries.length} requêtes — classées par clics décroissants.</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/[0.06] text-white/40 text-[10px] uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left font-semibold">Requête</th>
                                    <th className="px-4 py-3 text-right font-semibold">Clics</th>
                                    <th className="px-4 py-3 text-right font-semibold">Impressions</th>
                                    <th className="px-4 py-3 text-right font-semibold">CTR</th>
                                    <th className="px-4 py-3 text-right font-semibold">Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {gscQueries.map((row) => (
                                    <tr key={row.query} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-2.5 text-white/80 max-w-[300px] truncate">{row.query}</td>
                                        <td className="px-4 py-2.5 text-right text-white/80 tabular-nums">{formatNumber(row.clicks)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{formatNumber(row.impressions)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{formatCtr(row.ctr)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{formatPosition(row.position)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GeoPremiumCard>
            )}

            {/* GA4 Top Landing Pages */}
            {topPages.length > 0 && (
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="text-sm font-semibold text-white/95">Pages d'atterrissage (GA4)</div>
                        <div className="text-[11px] text-white/35">{topPages.length} pages — classées par sessions décroissantes.</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/[0.06] text-white/40 text-[10px] uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left font-semibold">Page</th>
                                    <th className="px-4 py-3 text-right font-semibold">Sessions</th>
                                    <th className="px-4 py-3 text-right font-semibold">Utilisateurs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {topPages.map((row) => (
                                    <tr key={row.landing_page} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-2.5 text-white/75 max-w-[400px] truncate font-mono text-[11px]">{row.landing_page}</td>
                                        <td className="px-4 py-2.5 text-right text-white/80 tabular-nums">{formatNumber(row.sessions)}</td>
                                        <td className="px-4 py-2.5 text-right text-white/60 tabular-nums">{formatNumber(row.users)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GeoPremiumCard>
            )}

            {/* No data fallback per section */}
            {trafficDaily.length === 0 && gscQueries.length === 0 && topPages.length === 0 && (
                <GeoEmptyPanel
                    title="Aucune donnée de visibilité"
                    description="Les connecteurs sont configurés mais aucune donnée n'a encore été synchronisée. La prochaine synchronisation quotidienne peuplera cet écran."
                />
            )}
        </div>
    );
}
