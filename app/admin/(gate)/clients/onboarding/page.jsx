import ClientOnboardingWizard from '../ClientOnboardingWizard';

export const metadata = {
    title: 'Onboarding client - Admin',
};

export default function ClientOnboardingPage() {
    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-6 md:px-6">
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
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
