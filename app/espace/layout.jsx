import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import { dark } from '@clerk/themes';

export const metadata = {
    title: 'Espace client — Trouvable',
    robots: { index: false, follow: false },
};

export default function EspaceLayout({ children }) {
    return (
        <ClerkProvider
            localization={frFR}
            appearance={{
                baseTheme: dark,
                variables: {
                    colorPrimary: '#5b73ff',
                    colorBackground: '#0f0f0f',
                    colorInputBackground: '#161616',
                    colorInputText: '#ffffff',
                    borderRadius: '0.75rem',
                },
                layout: {
                    logoImageUrl: '/logos/trouvable_logo_blanc1.png',
                    socialButtonsVariant: 'iconButton',
                },
            }}
            signInUrl="/espace"
            signUpUrl="/espace"
            afterSignInUrl="/espace/apres-connexion"
        >
            {children}
        </ClerkProvider>
    );
}
