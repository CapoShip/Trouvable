import TrouvableLandingPage from '../components/TrouvablePremiumPreview';
import GeoSeoInjector from '../components/GeoSeoInjector';
import { SITE_URL } from '@/lib/site-config';

export default function Page() {
    return (
        <>
            <GeoSeoInjector
                organization={true}
                baseUrl={SITE_URL}
                faqs={[
                    { question: "C'est quoi la visibilité IA (GEO) ?", answer: "Le GEO (Generative Engine Optimization) vous positionne dans les réponses de ChatGPT, Claude, Gemini et Perplexity." },
                    { question: "Quelle est la différence entre SEO et GEO ?", answer: "Le SEO vous positionne sur Google. Le GEO vous positionne dans les réponses conversationnelles des moteurs IA génératifs." },
                    { question: "Combien de temps avant de voir des résultats ?", answer: "Les délais varient selon votre secteur. L'audit initial est livré rapidement et les signaux sont propagés en continu." },
                ]}
            />
            <TrouvableLandingPage />
        </>
    );
}
