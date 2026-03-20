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
                    { question: "Combien de temps avant de voir des résultats ?", answer: "Les délais varient selon votre secteur. L'audit initial est livré rapidement et les signaux sont propagés en continu." },
                ]}
            />
            <TrouvableLandingPage />
        </>
    );
}
