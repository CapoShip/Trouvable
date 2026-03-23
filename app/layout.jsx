import './globals.css'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { frFR } from '@clerk/localizations'
import ContactModal from '@/components/ContactModal'
import { SITE_URL } from '@/lib/site-config'

export const metadata = {
    title: 'Trouvable — Visibilité IA pour Commerces Locaux',
    description: 'L\'agence spécialiste en visibilité IA pour les PME et commerces locaux. Nous plaçons votre entreprise en tête des recommandations de l\'intelligence artificielle (ChatGPT, Gemini, Claude).',
    metadataBase: new URL(SITE_URL),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Trouvable — Visibilité IA pour Commerces Locaux',
        description: 'Nous plaçons votre commerce en tête des recommandations ChatGPT, Gemini et Claude.',
        url: '/',
        siteName: 'Trouvable',
        locale: 'fr_CA',
        type: 'website',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Trouvable — Visibilité IA',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Trouvable — Visibilité IA pour Commerces Locaux',
        description: 'Nous plaçons votre commerce en tête des recommandations ChatGPT, Gemini et Claude.',
        images: ['/twitter-image.png'],
    },
    icons: {
        icon: '/icon.png',
        apple: '/apple-icon.png',
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#080808',
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body>
                <Script 
                    id="trustpilot-script"
                    src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" 
                    strategy="lazyOnload" 
                />
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
                    afterSignInUrl="/admin/dashboard"
                >
                    {children}
                    <ContactModal />
                </ClerkProvider>
            </body>
        </html>
    )
}
