import Link from 'next/link';

import ClientForm from '../ClientForm';

export const metadata = {
    title: 'Nouvelle fiche client - Admin',
};

export default function CreateClientPage() {
    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-6 md:px-6">
            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <Link
                    href="/admin/clients/new"
                    className="mb-4 flex items-center gap-2 text-sm font-medium text-[#a0a0a0] hover:text-white"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Autres façons de créer un client
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-white">Nouvelle fiche (rapide)</h1>
                <p className="mt-2 max-w-2xl text-sm text-[#a0a0a0]">
                    Crée uniquement le dossier dans Trouvable : nom, site, slug, SEO de base. Pas d&apos;audit ni de prompts. Tu pourras
                    compléter depuis le cockpit ou lancer un onboarding plus tard. Pour le{' '}
                    <span className="text-white/80">portail client</span>, ouvre le dossier puis la section{' '}
                    <strong className="text-white/70">Portail client</strong> dans le menu latéral pour saisir le courriel invité.
                </p>
            </div>

            <ClientForm />
        </div>
    );
}
