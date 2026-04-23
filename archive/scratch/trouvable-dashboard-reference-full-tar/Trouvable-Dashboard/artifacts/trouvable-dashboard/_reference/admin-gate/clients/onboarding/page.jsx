import ClientOnboardingWizard from '../ClientOnboardingWizard';
import {
    CommandHeader,
    CommandPageShell,
} from '../../components/command';

export const metadata = {
    title: 'Onboarding client - Admin',
};

export default function ClientOnboardingPage() {
    const header = (
        <CommandHeader
            eyebrow="Portefeuille · Onboarding"
            title="Nouveau mandat"
            subtitle="Créez un dossier client, validez le profil enrichi, et lancez la stratégie GEO initiale."
        />
    );

    return (
        <CommandPageShell header={header}>
            <ClientOnboardingWizard />
        </CommandPageShell>
    );
}
