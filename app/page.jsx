import TrouvableLandingPage from '../components/TrouvablePremiumPreview';
import GeoSeoInjector from '../components/GeoSeoInjector';

export default function Page() {
    return (
        <>
            <GeoSeoInjector
                organization={true}
                baseUrl={process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca'}
                faqs={[
                    { question: "C'est quoi la visibilité IA (GEO) ?", answer: "Le GEO (Generative Engine Optimization) vous positionne dans les réponses de ChatGPT, Claude, Gemini et Perplexity." },
                    { question: "Quelle est la différence entre SEO et GEO ?", answer: "Le SEO vous positionne sur Google. Le GEO vous positionne dans les réponses conversationnelles des moteurs IA génératifs." },
                    { question: "Combien de temps avant de voir des résultats ?", answer: "Les premiers résultats sont visibles sous 30 à 45 jours. L'audit initial est livré en 48h." },
                ]}
            />
            <TrouvableLandingPage />
        </>
    );
}
