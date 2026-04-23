'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import { dark } from '@clerk/themes';

export default function AdminClerkProvider({ children }) {
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
            afterSignInUrl="/espace/apres-connexion"
        >
            {children}
        </ClerkProvider>
    );
}
