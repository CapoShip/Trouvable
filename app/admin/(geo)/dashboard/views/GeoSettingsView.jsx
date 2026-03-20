'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoSettingsView() {
    const { client, clientId } = useGeoClient();
    const [toggles, setToggles] = useState({
        alertes: true,
        opportunites: true,
        rapport: false,
        alerteBaisse: true
    });
    const [saved, setSaved] = useState(false);

    const toggle = (key) => setToggles((t) => ({ ...t, [key]: !t[key] }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Paramètres</div>
                    <div className="text-[13px] text-white/40">Configuration du compte et de la plateforme</div>
                </div>
                {client && (
                    <Link href={`/admin/dashboard/new`} className="geo-btn geo-btn-pri">+ Nouveau client</Link>
                )}
            </div>

            {saved && (
                <div className="p-3 mb-4 bg-[var(--geo-green-bg)] border border-[var(--geo-green-bd)] rounded-[var(--geo-r)] text-[var(--geo-green)] text-sm font-medium">
                    Paramètres sauvegardés avec succès !
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="geo-card p-4">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Compte Administrateur</div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Nom d&apos;utilisateur</span>
                            <input className="geo-inp w-52 text-[11px] py-1.5 px-2.5" defaultValue="Admin Trouvable" />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Email admin</span>
                            <input className="geo-inp w-52 text-[11px] py-1.5 px-2.5" defaultValue="admin@trouvable.ca" />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <span className="text-sm font-medium text-[var(--geo-t1)] block">Mot de passe</span>
                                <span className="text-[11px] text-[var(--geo-t3)]">Dernière modification : 12 jan. 2026</span>
                            </div>
                            <button className="geo-btn geo-btn-ghost text-[11px]">Changer →</button>
                        </div>
                    </div>
                </div>

                <div className="geo-card p-4">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Notifications</div>
                    <div className="space-y-0">
                        {[
                            { key: 'alertes', label: 'Alertes audit terminé', desc: 'Notifier quand un audit se termine' },
                            { key: 'opportunites', label: 'Nouvelles opportunités', desc: 'Quand de nouveaux fils Reddit/Quora sont détectés' },
                            { key: 'rapport', label: 'Rapport hebdomadaire', desc: 'Résumé des performances chaque lundi' },
                            { key: 'alerteBaisse', label: 'Alerte score en baisse', desc: 'Si le score GEO baisse de plus de 5pts' }
                        ].map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between py-3 border-b border-[var(--geo-bd)] last:border-0">
                                <div>
                                    <div className="text-sm font-medium text-[var(--geo-t1)]">{label}</div>
                                    <div className="text-[11px] text-[var(--geo-t3)]">{desc}</div>
                                </div>
                                <button
                                    onClick={() => toggle(key)}
                                    className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${toggles[key] ? 'bg-[var(--geo-violet)]' : 'bg-[var(--geo-s4)]'}`}
                                >
                                    <span
                                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200"
                                        style={{ transform: toggles[key] ? 'translateX(16px)' : 'translateX(0)' }}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {client && (
                    <div className="geo-card p-4 lg:col-span-2">
                        <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Client Actif — {client.client_name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Nom</div>
                                <div className="text-sm font-semibold text-[var(--geo-t1)]">{client.client_name}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Site Web</div>
                                <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#a78bfa] hover:underline">{client.website_url}</a>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Type</div>
                                <div className="text-sm font-semibold text-[var(--geo-t1)]">{client.business_type || 'LocalBusiness'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Statut</div>
                                <span className={client.is_published ? 'geo-pill-pg' : 'geo-pill-a'}>{client.is_published ? 'Publié' : 'Brouillon'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-2">
                <button onClick={handleSave} className="geo-btn geo-btn-pri py-2 px-5">Sauvegarder les paramètres</button>
                <Link href={baseHref} className="geo-btn geo-btn-ghost py-2 px-5">Annuler</Link>
            </div>
        </div>
    );
}
