import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import LazyContactModal from '@/components/LazyContactModal'
import { SITE_URL } from '@/lib/site-config'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
    title: 'Trouvable — Firme de visibilité Google et réponses IA',
    description: 'Mandats d\'exécution : visibilité organique locale sur Google et crédibilité de votre entreprise dans les réponses des grands modèles. Vous déléguez, nous exécutons.',
    metadataBase: new URL(SITE_URL),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Trouvable — Firme de visibilité Google et réponses IA',
        description: 'Cartographie, mandat d\'implémentation et pilotage continu : une firme dédiée à votre signal public — le travail est fait pour vous.',
        url: '/',
        siteName: 'Trouvable',
        locale: 'fr_CA',
        type: 'website',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Trouvable — Firme de visibilité Google et réponses IA',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Trouvable — Firme de visibilité Google et réponses IA',
        description: 'Mandats d\'exécution pour la visibilité organique et la cohérence dans les réponses IA. Travail fait pour vous.',
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
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    )
}
