import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import WebMcpProvider from '@/components/agent/WebMcpProvider'
import DeferredVercelTelemetry from '@/components/analytics/DeferredVercelTelemetry'
import LazyContactModal from '@/features/public/shared/LazyContactModal'
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
    title: 'Trouvable | Firme de visibilité Google et réponses IA',
    description: 'Mandats d\'exécution : visibilité organique locale sur Google et crédibilité de votre entreprise dans les réponses des grands modèles. Vous déléguez, nous exécutons.',
    metadataBase: new URL(SITE_URL),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Trouvable | Firme de visibilité Google et réponses IA',
        description: 'Cartographie, mandat d\'implémentation et pilotage continu : une firme dédiée à votre signal public. Le travail est fait pour vous.',
        url: '/',
        siteName: 'Trouvable',
        locale: 'fr_CA',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Trouvable | Firme de visibilité Google et réponses IA',
        description: 'Mandats d\'exécution pour la visibilité organique et la cohérence dans les réponses IA. Travail fait pour vous.',
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
            <head>
                {/* DNS prefetch for external origins used at runtime */}
                <link rel="dns-prefetch" href="https://clerk-telemetry.com" />
                <link rel="alternate" type="text/markdown" href="/markdown?path=/" />
                <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="Trouvable - Etudes de cas" />
                <link rel="alternate" type="text/plain" href="/.well-known/ai.txt" />
            </head>
            <body className="font-sans">
                <WebMcpProvider />
                {children}
                <LazyContactModal />
                <DeferredVercelTelemetry />
            </body>
        </html>
    )
}
