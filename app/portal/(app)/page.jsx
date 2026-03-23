import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

import { resolvePortalMembership } from '@/lib/portal-access';
import { SITE_CONTACT_EMAIL } from '@/lib/site-contact';
export const dynamic = 'force-dynamic';

export default async function PortalIndexPage() {
    const membershipState = await resolvePortalMembership();
    const memberships = membershipState.memberships || [];

    if (memberships.length === 1) {
        redirect(`/portal/${memberships[0].client_slug}`);
    }

    if (memberships.length === 0) {
        return (
            <section className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-[#0e0e10] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.48)]">
                <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                    Acces en attente
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-white">
                    Aucun dossier client n est encore lie a ce compte
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                    Le portail se debloque uniquement lorsqu un acces actif existe pour votre compte via votre identifiant Clerk
                    ou une adresse Clerk verifiee. Si vous venez d etre invite, demandez a notre equipe de confirmer
                    l adresse suivante:
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-white/75">
                    {membershipState.primaryVerifiedEmail || 'Aucune adresse verifiee disponible dans ce compte'}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                    <a
                        href={`mailto:${SITE_CONTACT_EMAIL}`}
                        className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#d6d6d6]"
                    >
                        Contacter Trouvable
                    </a>
                    <SignOutButton redirectUrl="/portal/sign-in">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                        >
                            Changer de compte
                        </button>
                    </SignOutButton>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,115,255,0.16),transparent_34%),linear-gradient(180deg,#121316_0%,#0a0a0b_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Selection du dossier
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-white">
                    Choisissez le dossier client a consulter
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                    Chaque vue reste en lecture seule et se limite au dossier auquel votre compte est autorise.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {memberships.map((membership) => (
                    <Link
                        key={membership.id}
                        href={`/portal/${membership.client_slug}`}
                        className="group rounded-[24px] border border-white/10 bg-[#0e0f11] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.38)] transition hover:border-white/20 hover:bg-white/[0.04]"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xl font-bold tracking-[-0.03em] text-white">{membership.client_name}</div>
                                <div className="mt-2 text-sm text-white/45">{membership.business_type || 'Entreprise locale'}</div>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                                {membership.portal_role}
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between text-sm">
                            <span className="text-white/45">{membership.website_url || membership.client_slug}</span>
                            <span className="text-[#a9b6ff] transition group-hover:text-white">Ouvrir</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
