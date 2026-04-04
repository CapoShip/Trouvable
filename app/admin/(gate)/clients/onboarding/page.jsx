import ClientOnboardingWizard from '../ClientOnboardingWizard';

export const metadata = {
    title: 'Onboarding client - Admin',
};

export default function ClientOnboardingPage() {
    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-6 md:px-6">
            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <h1 className="text-3xl font-bold tracking-tight text-white">Nouveau mandat</h1>
                <p className="mt-1 text-[#a0a0a0]">
                    Créez un dossier client, validez le profil enrichi, et lancez la stratégie GEO initiale.
                </p>
            </div>

            <ClientOnboardingWizard />
        </div>
    );
}
