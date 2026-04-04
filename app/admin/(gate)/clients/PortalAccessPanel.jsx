'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

function statusLabel(status) {
    if (status === 'active') return { text: 'Actif', cls: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' };
    if (status === 'pending') return { text: 'En attente', cls: 'border-amber-400/25 bg-amber-400/10 text-amber-200' };
    if (status === 'revoked') return { text: 'Révoqué', cls: 'border-white/10 bg-white/[0.04] text-white/40' };
    return { text: status || '—', cls: 'border-white/10 bg-white/[0.04] text-white/50' };
}

const PORTAL_READY_STATES = new Set(['active', 'paused']);

export default function PortalAccessPanel({ clientId, clientName, clientSlug, lifecycleStatus, initialMembers = [] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [members, setMembers] = useState(initialMembers);
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        setMembers(initialMembers);
    }, [initialMembers]);

    const portalSignInPath = '/portal/sign-in';
    const portalDashboardPath = `/portal/${clientSlug}`;
    const isPortalReady = PORTAL_READY_STATES.has(lifecycleStatus);

    async function handleSave(event) {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        const trimmed = email.trim();
        if (!trimmed) {
            setError('Saisissez une adresse courriel.');
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch('/api/admin/clients/portal-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'upsert',
                        clientId,
                        contactEmail: trimmed,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

                setMembers(data.members || []);
                setSuccess(`Compte créé et accès activé pour ${data.access?.contact_email || trimmed}.`);
                setEmail('');
                router.refresh();
            } catch (e) {
                setError(e.message);
            }
        });
    }

    async function handleRevoke(accessId) {
        if (!window.confirm('Révoquer l’accès portail pour cette adresse ?')) return;
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            try {
                const res = await fetch('/api/admin/clients/portal-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'revoke',
                        clientId,
                        accessId,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

                setMembers(data.members || []);
                setSuccess('Accès révoqué.');
                router.refresh();
            } catch (e) {
                setError(e.message);
            }
        });
    }

    async function handleActivate(accessId) {
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            try {
                const res = await fetch('/api/admin/clients/portal-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'activate',
                        clientId,
                        accessId,
                    }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

                setMembers(data.members || []);
                setSuccess('Accès activé.');
                router.refresh();
            } catch (e) {
                setError(e.message);
            }
        });
    }

    return (
        <div className="space-y-8">
            {!isPortalReady && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
                    <p className="text-sm font-semibold text-amber-200">
                        Le dossier est en statut «&nbsp;{lifecycleStatus || 'inconnu'}&nbsp;»
                    </p>
                    <p className="mt-1 text-sm text-amber-200/60">
                        Le portail fonctionne, mais certaines données peuvent être incomplètes tant que le dossier n&apos;est pas passé en «&nbsp;active&nbsp;».
                    </p>
                </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <h2 className="text-base font-bold text-white">Ajouter un accès client</h2>
                <p className="mt-2 text-sm text-white/45">
                    Le compte sera créé automatiquement. Le client pourra se connecter sur{' '}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-white/75">/espace</code>{' '}
                    avec cette adresse courriel.
                </p>

                <form onSubmit={handleSave} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                        <label htmlFor="portal-email" className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-white/45">
                            Courriel d’accès au tableau de bord client
                        </label>
                        <input
                            id="portal-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contact@entreprise.com"
                            className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#5b73ff] focus:ring-1 focus:ring-[#5b73ff]"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="shrink-0 rounded-xl bg-[#5b73ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4a62ee] disabled:opacity-50"
                    >
                        {isPending ? 'Création…' : 'Créer l\u2019accès'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-200">{error}</div>
                )}
                {success && (
                    <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">{success}</div>
                )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <h2 className="text-base font-bold text-white">Liens utiles pour {clientName}</h2>
                <ul className="mt-3 space-y-2 text-sm text-white/50">
                    <li>
                        Connexion client :{' '}
                        <code className="text-white/75">/espace</code>
                    </li>
                    <li>
                        Tableau de bord direct (après connexion) :{' '}
                        <code className="text-white/75">{portalDashboardPath}</code>
                    </li>
                </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <h2 className="text-base font-bold text-white">Courriels configurés</h2>
                <p className="mt-1 text-xs text-white/35">
                    Plusieurs adresses possibles ; chacune doit correspondre à un compte invité. Seules les lignes <strong className="text-white/50">actives</strong> peuvent ouvrir le portail.
                </p>

                {members.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
                        Aucun accès enregistré. Ajoutez un courriel ci-dessus.
                    </div>
                ) : (
                    <ul className="mt-4 divide-y divide-white/[0.06]">
                        {members.map((row) => {
                            const st = statusLabel(row.status);
                            return (
                                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
                                    <div className="min-w-0">
                                        <div className="font-medium text-white">{row.contact_email}</div>
                                        <div className="mt-1 text-[11px] text-white/35">
                                            Rôle : {row.portal_role || 'viewer'}
                                            {row.clerk_user_id ? ' · Compte Clerk lié' : ''}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.text}</span>
                                        {row.status === 'pending' && (
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => handleActivate(row.id)}
                                                className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-50"
                                            >
                                                Activer
                                            </button>
                                        )}
                                        {(row.status === 'active' || row.status === 'pending') && (
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => handleRevoke(row.id)}
                                                className="rounded-lg border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                                            >
                                                Révoquer
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
