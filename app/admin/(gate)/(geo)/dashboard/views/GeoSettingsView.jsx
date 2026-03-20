'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useGeoClient } from '../../context/GeoClientContext';
import { SITE_CONTACT_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from '@/lib/site-contact';

export default function GeoSettingsView() {
    const { user, isLoaded } = useUser();
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

    const adminDisplayName =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.username ||
        'Administrateur';

    const adminEmail = user?.primaryEmailAddress?.emailAddress || '—';

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Paramètres</div>
                    <div className="text-[13px] text-white/40">Votre compte admin (Clerk) et préférences de la plateforme</div>
                </div>
                {client && (
                    <Link href={`/admin/dashboard/new`} className="geo-btn geo-btn-pri">+ Nouveau client</Link>
                )}
            </div>

            {saved && (
                <div className="p-3 mb-4 bg-[var(--geo-green-bg)] border border-[var(--geo-green-bd)] rounded-[var(--geo-r)] text-[var(--geo-green)] text-sm font-medium">
                    Préférences enregistrées (affichage local).
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="geo-card p-4">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Compte administrateur</div>
                    <p className="text-[11px] text-[var(--geo-t3)] mb-3 leading-relaxed">
                        Connexion sécurisée via <span className="text-white/50">Clerk</span>. Les identifiants et le mot de passe se gèrent dans le menu profil (coin bas de la barre latérale).
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Nom affiché</span>
                            <div className="geo-inp w-full sm:w-60 text-[11px] py-2 px-2.5 bg-white/[0.02] text-white/80 border-white/8 cursor-default">
                                {!isLoaded ? 'Chargement…' : adminDisplayName}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Courriel (connexion)</span>
                            <div className="geo-inp w-full sm:w-60 text-[11px] py-2 px-2.5 bg-white/[0.02] text-white/80 border-white/8 cursor-default truncate" title={adminEmail}>
                                {!isLoaded ? 'Chargement…' : adminEmail}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 py-3">
                            <div>
                                <span className="text-sm font-medium text-[var(--geo-t1)] block">Sécurité</span>
                                <span className="text-[11px] text-[var(--geo-t3)]">Mot de passe, 2FA et sessions : via Clerk (icône profil)</span>
                            </div>
                            <span className="text-[11px] text-violet-300/90 font-medium shrink-0">Clerk · actif</span>
                        </div>
                    </div>
                </div>

                <div className="geo-card p-4">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Contact public (site)</div>
                    <p className="text-[11px] text-[var(--geo-t3)] mb-3 leading-relaxed">
                        Coordonnées affichées sur le landing page (footer). Utiles pour rappel ou support client.
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Courriel</span>
                            <a
                                href={`mailto:${SITE_CONTACT_EMAIL}`}
                                className="text-[12px] font-medium text-[#a78bfa] hover:underline truncate max-w-full sm:max-w-[240px] text-right"
                            >
                                {SITE_CONTACT_EMAIL}
                            </a>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Téléphone</span>
                            <a href={`tel:${SITE_PHONE_TEL}`} className="text-[12px] font-medium text-[#a78bfa] hover:underline tabular-nums">
                                {SITE_PHONE_DISPLAY}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="geo-card p-4 lg:col-span-2">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Notifications (aperçu)</div>
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
                                    type="button"
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
                        <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Client actif — {client.client_name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Nom</div>
                                <div className="text-sm font-semibold text-[var(--geo-t1)]">{client.client_name}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Site Web</div>
                                <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#a78bfa] hover:underline break-all">{client.website_url}</a>
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

            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={handleSave} className="geo-btn geo-btn-pri py-2 px-5">Sauvegarder les préférences</button>
                <Link href={baseHref} className="geo-btn geo-btn-ghost py-2 px-5">Retour au tableau de bord</Link>
                <Link href="/" className="geo-btn geo-btn-ghost py-2 px-5">Voir le site public</Link>
            </div>
        </div>
    );
}
