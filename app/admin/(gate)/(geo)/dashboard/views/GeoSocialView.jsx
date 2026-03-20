'use client';

import Link from 'next/link';
import { useGeoClient } from '../../context/GeoClientContext';
import { GeoPremiumCard, GeoKpiCard } from '../components/GeoPremium';

export default function GeoSocialView() {
    const { client, clientId, loading } = useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    const slotColors = ['from-orange-500/20', 'from-violet-500/20', 'from-sky-500/20', 'from-blue-600/20'];

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="text-2xl font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Social listening
                    </div>
                    <p className="text-[13px] text-white/40 mt-1 max-w-xl">
                        Monitoring des conversations autour de {client?.client_name || 'votre marque'} — connecteur non branché : aucune métrique
                        inventée.
                    </p>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio px-4 py-2 text-xs">
                    Engager les fils →
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Mentions totales" value={null} hint="Connecteur requis" />
                <GeoKpiCard label="Sentiment positif" value={null} hint="Non disponible" />
                <GeoKpiCard label="Portée estimée" value={null} hint="Non disponible" />
                <GeoKpiCard label="Fils à impact" value={null} hint="Non disponible" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GeoPremiumCard className="p-6 min-h-[240px] flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Volume des mentions</div>
                            <p className="text-[11px] text-white/35">Évolution quotidienne — 30 jours</p>
                        </div>
                        <div className="geo-tabs opacity-60 pointer-events-none">
                            <span className="geo-tab on">Volume</span>
                            <span className="geo-tab">Sentiment</span>
                        </div>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-white/12 bg-gradient-to-b from-sky-500/5 to-transparent flex items-center justify-center mt-2">
                        <p className="text-xs text-white/35 text-center px-6">
                            Graphique désactivé — aucune série temporelle sociale en base.
                        </p>
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-6 min-h-[240px] flex flex-col">
                    <div className="text-sm font-semibold text-white/95 mb-1">Fils à haut impact</div>
                    <p className="text-[11px] text-white/35 mb-4">Conversations récentes à engager</p>
                    <div className="flex-1 rounded-xl border border-dashed border-white/12 flex items-center justify-center">
                        <p className="text-xs text-white/35 text-center px-4">Aucun fil — connecteur requis.</p>
                    </div>
                </GeoPremiumCard>
            </div>

            <div>
                <div className="text-sm font-semibold text-white/95 mb-1">Sources sociales</div>
                <p className="text-[11px] text-white/35 mb-3">Emplacements réservés — aucune plateforme connectée</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                        <GeoPremiumCard
                            key={i}
                            className={`p-4 bg-gradient-to-br ${slotColors[i]} to-transparent border border-white/[0.07]`}
                        >
                            <div className="text-[10px] text-white/40 uppercase font-bold">Slot {i + 1}</div>
                            <div className="text-2xl font-bold text-white/25 mt-2">—</div>
                            <div className="text-[10px] text-white/30 mt-1">Pas de données</div>
                            <div className="mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full w-[0%] bg-white/10 rounded-full opacity-40" />
                            </div>
                        </GeoPremiumCard>
                    ))}
                </div>
            </div>

            <GeoPremiumCard className="p-8 text-center bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
                <h3 className="text-lg font-bold text-white mb-2">Social listening non activé</h3>
                <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
                    Les pourcentages et logos de plateformes s’afficheront lorsque des données réelles seront synchronisées.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                    <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-pri">
                        Audit
                    </Link>
                    <Link href={`${baseHref}?view=visibilite`} className="geo-btn geo-btn-ghost">
                        Visibilité IA
                    </Link>
                </div>
            </GeoPremiumCard>
        </div>
    );
}
