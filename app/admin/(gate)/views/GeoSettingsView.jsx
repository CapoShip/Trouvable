'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

import { useGeoClient } from '../context/ClientContext';
import { SITE_CONTACT_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from '@/lib/site-contact';

export default function GeoSettingsView() {
    const { user, isLoaded } = useUser();
    const { client, clientId } = useGeoClient();
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';
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
                    <div className="text-[13px] text-white/40">Compte admin, préférences locales et pilotage d’exécution pour ce client.</div>
                </div>
                <Link href="/admin/clients/new" className="geo-btn geo-btn-pri">+ Nouveau client</Link>
            </div>

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
                    <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Support Trouvable</div>
                    <p className="text-[11px] text-[var(--geo-t3)] mb-3 leading-relaxed">
                        Contact de l&apos;équipe Trouvable — non lié à ce mandat client.
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[var(--geo-bd)]">
                            <span className="text-sm font-medium text-[var(--geo-t1)]">Courriel</span>
                            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-[12px] font-medium text-[#a78bfa] hover:underline truncate max-w-full sm:max-w-[240px] text-right">
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
                <Link href={dossierBase} className="geo-btn geo-btn-ghost py-2 px-5">Retour au dossier</Link>
                <Link href="/" className="geo-btn geo-btn-ghost py-2 px-5">Voir le site public</Link>
            </div>
        </div>
    );
}
