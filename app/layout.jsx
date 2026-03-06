import './globals.css'

export const metadata = {
    title: 'Trouvable — Visibilité IA pour Commerces Locaux',
    description: 'L\'agence spécialiste en visibilité IA pour les PME et commerces locaux. Nous plaçons votre entreprise en tête des recommandations de l\'intelligence artificielle (ChatGPT, Gemini, Claude).',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca'),
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
    themeColor: '#000000',
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-black text-white">
                {children}
            </body>
        </html>
    )
}
