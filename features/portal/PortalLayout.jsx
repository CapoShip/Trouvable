import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { frFR } from '@clerk/localizations';

export const metadata = {
    robots: { index: false, follow: false },
};

export default function PortalLayout({ children }) {
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
            signInUrl="/portal/sign-in"
            signUpUrl="/portal/sign-in"
            afterSignInUrl="/espace/apres-connexion"
        >
            {children}
        </ClerkProvider>
    );
}
