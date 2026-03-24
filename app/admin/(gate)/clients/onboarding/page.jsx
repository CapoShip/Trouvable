import Link from 'next/link';

import ClientOnboardingWizard from '../ClientOnboardingWizard';

export const metadata = {
    title: 'Onboarding client - Admin',
};

export default function ClientOnboardingPage() {
    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-6 md:px-6">
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <Link
                    href="/admin/clients/new"
                    className="mb-4 flex items-center gap-2 text-sm font-medium text-[#a0a0a0] hover:text-white"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour au choix du type de création
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-white">Onboarding GEO complet</h1>
                <p className="mt-1 text-[#a0a0a0]">
                    Saisie minimale, enrichissement automatique, relecture opérateur puis activation avec prompts suivis. Tu peux activer
                    l&apos;accès portail pour que le client se connecte sur le site avec la même adresse courriel (vérifiée dans Clerk).
                </p>
            </div>

            <ClientOnboardingWizard />
        </div>
    );
}
