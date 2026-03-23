import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import LazyContactModal from '@/components/LazyContactModal'
import { SITE_URL } from '@/lib/site-config'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
})

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-plus-jakarta-sans',
})

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
        <html lang="fr" className={`${inter.variable} ${plusJakartaSans.variable} scroll-smooth`} suppressHydrationWarning>
            <body className="font-sans">
                {children}
                <LazyContactModal />
            </body>
        </html>
    )
}
