import Link from 'next/link';

export const metadata = {
    title: 'Nouveau client - Admin',
};

export default function NewClientHubPage() {
    return (
        <div className="mx-auto w-full max-w-[900px] space-y-8 px-4 pb-10 pt-2 md:px-6">
            <div>
                <Link
                    href="/admin/clients"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#a0a0a0] hover:text-white"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour aux clients
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-white">Nouveau client</h1>
                <p className="mt-2 text-sm text-[#a0a0a0]">
                    Choisis le parcours qui correspond à ton besoin. Les deux mènent au même type de dossier ; seul le niveau de travail au
                    départ change.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    href="/admin/clients/create"
                    className="group flex flex-col rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-[#5b73ff]/40 hover:bg-white/[0.03]"
                >
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5b73ff]">Recommandé si tu veux aller vite</span>
                    <h2 className="mt-3 text-xl font-bold text-white">Fiche rapide</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a0a0a0]">
                        Nom, site web, slug et champs utiles. Aucun audit automatique ni pack de prompts. Idéal pour entrer un client et
                        travailler le détail dans le cockpit.
                    </p>
                    <span className="mt-5 text-sm font-semibold text-[#7b8fff] group-hover:text-white">Créer la fiche →</span>
                </Link>

                <Link
                    href="/admin/clients/onboarding"
                    className="group flex flex-col rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-emerald-400/30 hover:bg-white/[0.03]"
                >
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400/90">Audit + prompts dès le départ</span>
                    <h2 className="mt-3 text-xl font-bold text-white">Onboarding guidé</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a0a0a0]">
                        Premier audit, suggestions de profil, choix des prompts suivis. Tu peux en même temps autoriser l&apos;accès au
                        portail client avec l&apos;email de contact.
                    </p>
                    <span className="mt-5 text-sm font-semibold text-emerald-300 group-hover:text-white">Lancer l&apos;onboarding →</span>
                </Link>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-5 py-4 text-sm text-white/45">
                <strong className="text-white/70">Portail client :</strong> l&apos;URL de connexion est{' '}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-white/80">/portal/sign-in</code>
                . Le client doit utiliser une adresse courriel <strong className="text-white/65">vérifiée</strong> et figurant dans
                l&apos;accès portail du dossier.
            </div>
        </div>
    );
}
