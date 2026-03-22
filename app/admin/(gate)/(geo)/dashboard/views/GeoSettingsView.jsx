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
        audit_done: true,
        opportunity_updates: true,
        weekly_report: false,
        score_drop: true,
    });
    const [saved, setSaved] = useState(false);

    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const adminDisplayName =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.username ||
        'Administrateur';
    const adminEmail = user?.primaryEmailAddress?.emailAddress || '—';

    const notificationOptions = [
        { key: 'audit_done', label: 'Audit terminé', desc: 'Notification locale quand un audit se termine.' },
        { key: 'opportunity_updates', label: 'Mises à jour de la queue', desc: "Quand de nouvelles opportunités observées, inférées ou dérivées apparaissent." },
        { key: 'weekly_report', label: 'Rapport hebdomadaire', desc: 'Résumé local de la performance operateur chaque semaine.' },
        { key: 'score_drop', label: 'Alerte baisse de score', desc: "Si un score d'audit baisse de façon notable." },
    ];

    function toggle(key) {
        setToggles((current) => ({ ...current, [key]: !current[key] }));
    }

    function handleSave() {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Parametrès</div>
                    <div className="text-[13px] text-white/40">Compte admin, preferences locales et copie produit honnete.</div>
                </div>
                <Link href="/admin/clients/new" className="geo-btn geo-btn-pri">+ Nouveau client</Link>
            </div>

            {saved && (
                <div className="p-3 mb-4 bg-[var(--geo-green-bg)] border border-[var(--geo-green-bd)] rounded-[var(--geo-r)] text-[var(--geo-green)] text-sm font-medium">
                    Preferences enregistrees localement.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="geo-card p-4">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Compte administrateur</div>
                    <p className="text-[11px] text-[var(--geo-t3)] mb-3 leading-relaxed">
                        Authentification gérée par Clerk. Les sessions et mots de passe restent hors de ce panneau.
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Nom affiché</span>
                            <div className="geo-inp w-full sm:w-60 text-[11px] py-2 px-2.5 bg-white/[0.02] text-white/80 border-white/8 cursor-default">
                                {!isLoaded ? 'Chargement…' : adminDisplayName}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Courriel de connexion</span>
                            <div className="geo-inp w-full sm:w-60 text-[11px] py-2 px-2.5 bg-white/[0.02] text-white/80 border-white/8 cursor-default truncate" title={adminEmail}>
                                {!isLoaded ? 'Chargement…' : adminEmail}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 py-3">
                            <div>
                                <span className="text-sm font-medium text-[var(--geo-t1)] block">Securite</span>
                                <span className="text-[11px] text-[var(--geo-t3)]">Mots de passe, 2FA et sessions : via Clerk uniquement.</span>
                            </div>
                            <span className="text-[11px] text-violet-300/90 font-medium shrink-0">Clerk · actif</span>
                        </div>
                    </div>
                </div>

                <div className="geo-card p-4">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Contact public</div>
                    <p className="text-[11px] text-[var(--geo-t3)] mb-3 leading-relaxed">
                        Coordonnées visibles sur le site public Trouvable.
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Courriel</span>
                            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-[12px] font-medium text-[#a78bfa] hover:underline truncate max-w-full sm:max-w-[240px] text-right">
                                {SITE_CONTACT_EMAIL}
                            </a>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Telephone</span>
                            <a href={`tel:${SITE_PHONE_TEL}`} className="text-[12px] font-medium text-[#a78bfa] hover:underline tabular-nums">
                                {SITE_PHONE_DISPLAY}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="geo-card p-4 lg:col-span-2">
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Notifications (apercu local)</div>
                    <div className="space-y-0">
                        {notificationOptions.map(({ key, label, desc }) => (
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
                    <div className="text-[11px] text-white/35 mt-3">
                        Aucun connecteur externe n'est active ici. Ces preferences restent un apercu local de l'interface.
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
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Site web</div>
                                <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#a78bfa] hover:underline break-all">
                                    {client.website_url}
                                </a>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Type</div>
                                <div className="text-sm font-semibold text-[var(--geo-t1)]">{client.business_type || 'LocalBusiness'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--geo-t3)] mb-1">Statut</div>
                                <span className={client.is_published ? 'geo-pill-pg' : 'geo-pill-a'}>
                                    {client.is_published ? 'Publie' : 'Brouillon'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={handleSave} className="geo-btn geo-btn-pri py-2 px-5">Sauvegarder</button>
                <Link href={baseHref} className="geo-btn geo-btn-ghost py-2 px-5">Retour au tableau de bord</Link>
                <Link href="/" className="geo-btn geo-btn-ghost py-2 px-5">Voir le site public</Link>
            </div>
        </div>
    );
}
