import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { frFR } from '@clerk/localizations';

export const metadata = {
    robots: { index: false, follow: false },
};

/** Enveloppe légère : la vérif admin est dans (gate)/layout.jsx uniquement (pas sur /admin/sign-in). */
export default function AdminShellLayout({ children }) {
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
            signInUrl="/admin/sign-in"
            signUpUrl="/admin/sign-in"
            afterSignInUrl="/admin/clients"
        >
            {children}
        </ClerkProvider>
    );
}
