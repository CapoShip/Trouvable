import './globals.css'

export const metadata = {
    title: 'Trouvable — Visibilité IA pour Commerces Locaux',
    description: 'Trouvable - L\'agence spécialiste en visibilité IA pour les PME et commerces locaux. Nous plaçons votre entreprise en tête des recommandations de l\'intelligence artificielle.',
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                {/* <link rel="icon" type="image/svg+xml" href="/vite.svg" /> Removed missing asset */}
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}
