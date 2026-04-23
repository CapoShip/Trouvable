'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Building2, Shield, User } from 'lucide-react';

import { useGeoClient } from '../context/ClientContext';
import { SITE_CONTACT_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from '@/lib/site-contact';
import { COMMAND_BUTTONS, cn } from '../components/command';

function Row({ label, children }) {
    return (
        <div className="flex flex-col gap-2 border-b border-white/[0.06] py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] font-medium text-white/80">{label}</span>
            <div className="text-[12px] font-medium text-white/70 sm:max-w-[58%] sm:text-right">{children}</div>
        </div>
    );
}

export default function GeoSettingsView() {
    const { user, isLoaded } = useUser();
    const { client, clientId } = useGeoClient();
    const [zone, setZone] = useState('operator');

    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';
    const editHref = clientId ? `/admin/clients/${clientId}/edit` : '/admin/clients';
    const portalHref = clientId ? `/admin/clients/${clientId}/portal` : '/admin/clients';
    const adminDisplayName =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.username ||
        'Administrateur';
    const adminEmail = user?.primaryEmailAddress?.emailAddress || 'n.d.';

    const tabs = [
        { id: 'operator', label: 'Opérateur', icon: User },
        { id: 'mandate', label: 'Mandat', icon: Building2 },
    ];

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#1a1d24] text-white">
            <div className="border-b border-white/[0.06] bg-[linear-gradient(95deg,rgba(99,102,241,0.12)_0%,transparent_50%)]">
                <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between md:px-8">
                    <div className="space-y-3 max-w-2xl">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-200/65">settings.dual_plane</div>
                        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-0.04em]">Réglages — deux plans</h1>
                        <p className="text-[14px] leading-relaxed text-white/45">
                            Navigation par plan vertical : opérateur d’un côté, mandat de l’autre — sans en-tête « command » ni coquille générique.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={editHref} className={cn(COMMAND_BUTTONS.primary, 'rounded-xl')}>Éditer le profil mandat</Link>
                        <Link href="/admin/clients/new" className={cn(COMMAND_BUTTONS.secondary, 'rounded-xl')}>Nouveau client</Link>
                        <Link href={dossierBase} className={cn(COMMAND_BUTTONS.subtle, 'rounded-xl')}>Dossier</Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[220px_minmax(0,1fr)] md:px-8 pb-16">
                <nav className="flex flex-row gap-2 md:flex-col md:gap-1">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = zone === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setZone(t.id)}
                                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-[13px] font-semibold transition-colors ${
                                    active
                                        ? 'border-indigo-400/35 bg-indigo-500/15 text-white'
                                        : 'border-transparent bg-white/[0.02] text-white/50 hover:border-white/[0.08] hover:text-white/80'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                                {t.label}
                            </button>
                        );
                    })}
                    <div className="mt-4 hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:block">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                            <Shield className="h-3.5 w-3.5" />
                            Sécurité
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-white/38">
                            Authentification Clerk : mots de passe et 2FA hors de cet écran.
                        </p>
                    </div>
                </nav>

                <div className="min-w-0 space-y-6">
                    {zone === 'operator' ? (
                        <div className="rounded-[28px] border border-slate-400/15 bg-[#252a35] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Plan opérateur</div>
                            <p className="mt-2 text-[13px] text-white/48">
                                Informations de votre compte Trouvable. Indépendant du mandat affiché.
                            </p>
                            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-400/12 bg-[#2a2f3a] p-5">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Compte administrateur</div>
                                    <div className="mt-4 space-y-0">
                                        <Row label="Nom affiché">{!isLoaded ? 'Chargement…' : adminDisplayName}</Row>
                                        <Row label="Courriel de connexion">{!isLoaded ? 'Chargement…' : adminEmail}</Row>
                                        <Row label="Sécurité">Mots de passe, 2FA et sessions via Clerk.</Row>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-400/12 bg-[#2a2f3a] p-5">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Support Trouvable</div>
                                    <div className="mt-4 space-y-0">
                                        <Row label="Courriel">
                                            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-indigo-300 hover:underline">
                                                {SITE_CONTACT_EMAIL}
                                            </a>
                                        </Row>
                                        <Row label="Téléphone">
                                            <a href={`tel:${SITE_PHONE_TEL}`} className="text-indigo-300 hover:underline tabular-nums">
                                                {SITE_PHONE_DISPLAY}
                                            </a>
                                        </Row>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[28px] border border-slate-400/15 bg-[#252a35] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Plan mandat</div>
                            <p className="mt-2 text-[13px] text-white/48">
                                {client
                                    ? `Configuration de ${client.client_name} : profil, portail, publication.`
                                    : 'Aucun mandat actif. Sélectionnez un client pour voir ses paramètres.'}
                            </p>
                            {client ? (
                                <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">Nom</div>
                                            <div className="mt-1 text-[15px] font-semibold text-white/92">{client.client_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">Type</div>
                                            <div className="mt-1 text-[15px] font-semibold text-white/92">{client.business_type || 'LocalBusiness'}</div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">Site web</div>
                                            <a
                                                href={client.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 block text-[14px] font-semibold text-emerald-200/90 hover:underline break-all"
                                            >
                                                {client.website_url}
                                            </a>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">Statut</div>
                                            <span
                                                className={cn(
                                                    'mt-2 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold',
                                                    client.is_published
                                                        ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                                                        : 'border-white/[0.1] bg-white/[0.04] text-white/70'
                                                )}
                                            >
                                                {client.is_published ? 'Publié' : 'Brouillon'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
                                        <Link href={editHref} className={cn(COMMAND_BUTTONS.secondary, 'rounded-xl')}>Éditer le profil</Link>
                                        <Link href={portalHref} className={cn(COMMAND_BUTTONS.subtle, 'rounded-xl')}>Portail client</Link>
                                        <Link href={dossierBase} className={cn(COMMAND_BUTTONS.subtle, 'rounded-xl')}>Dossier complet</Link>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
