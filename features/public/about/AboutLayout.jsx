import GeoSeoInjector from '@/features/public/shared/GeoSeoInjector';
import { SITE_URL } from '@/lib/site-config';

export const metadata = {
    title: 'À propos de Trouvable | Firme d\'exécution en visibilité organique',
    description:
        'Trouvable est une firme d\'exécution québécoise spécialisée en visibilité organique sur Google et en cohérence de la présence des entreprises dans les réponses des grands modèles conversationnels.',
    alternates: {
        canonical: '/a-propos',
    },
    openGraph: {
        title: 'À propos de Trouvable | Firme d\'exécution en visibilité organique',
        description:
            'Firme d\'exécution basée au Québec : visibilité Google, cohérence dans les réponses IA, mandats de cartographie, d\'implémentation et de pilotage continu.',
        url: '/a-propos',
    },
};

export default function AboutLayout({ children }) {
    return (
        <>
            <GeoSeoInjector
                organization={true}
                baseUrl={SITE_URL}
                breadcrumbs={[
                    { name: 'Accueil', url: '/' },
                    { name: 'À propos', url: '/a-propos' },
                ]}
            />
            {children}
        </>
    );
}
