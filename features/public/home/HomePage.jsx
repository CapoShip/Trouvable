import GeoSeoInjector from '@/features/public/shared/GeoSeoInjector';
import TrouvableLandingPage from '@/features/public/home/TrouvablePremiumPreview';
import { SITE_URL } from '@/lib/site-config';

export default function HomePage() {
    return (
        <>
            <GeoSeoInjector
                organization={true}
                baseUrl={SITE_URL}
                faqs={[
                    { question: "C'est quoi la visibilité dans les réponses IA (GEO) ?", answer: "C'est la qualité et la cohérence de ce que les grands modèles conversationnels retiennent sur votre entreprise quand un internaute pose une question précise sur votre marché." },
                    { question: "Quelle est la différence entre SEO et GEO ?", answer: "Le SEO couvre votre visibilité organique sur Google (local et recherche). Le GEO couvre la crédibilité de votre signal dans les réponses générées par les systèmes conversationnels." },
                    { question: "Combien de temps avant de voir des résultats ?", answer: "Les délais varient selon votre secteur. La cartographie est livrée sur un rythme de mandat convenu ; les effets se construisent ensuite de manière incrémentale, avec compte rendu." },
                ]}
            />
            <TrouvableLandingPage />
        </>
    );
}

