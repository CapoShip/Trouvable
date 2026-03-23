import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, Layers, FileCode2, LineChart, Zap } from 'lucide-react';

export const metadata = {
    title: 'Notre Méthodologie | Trouvable',
    description: 'Découvrez comment notre équipe d\'experts structure votre visibilité IA.',
};

export default function MethodologyPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                    Comment nous travaillons
                </div>
                <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-8 max-w-3xl">
                    Une méthode rigoureuse, <br/><span className="text-[#666]">zéro boîte noire.</span>
                </h1>
                <p className="text-lg leading-relaxed text-[#a0a0a0] mb-16 max-w-2xl">
                    Notre approche est scientifique et itérative. Nous repoussons les limites du SEO local classique en y ajoutant les critères spécifiques de validation des Grands Modèles de Langage (LLM).
                </p>

                <div className="relative border-l border-white/10 ml-4 md:ml-8 pl-8 md:pl-12 space-y-16 mb-20">
                    
                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-3">1. Topographie de votre présence</h2>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Avant toute action, nous procédons à un scan complet (via notre outil interne strict) de vos mentions, de vos profils (Google Business, Bing, Apple) et de la manière dont les IA perçoivent vos concurrents. Nous établissons votre score de couverture initial.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <FileCode2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-3">2. Nettoyage et fondations sémantiques</h2>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Nos experts structurent vos informations. Nous corrigeons les incohérences de données (NAP), déployons des balises Schema.org avancées et intégrons des fichiers LLM-ready (llms.txt) pour nourrir les crawlers IA sans friction.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-3">3. Optimisation Générative (GEO)</h2>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Nous créons des hubs de questions-réponses spécifiques à votre métier pour cibler les requêtes conversationnelles. Nous nous assurons que lorsqu'un utilisateur demande "Quel est le meilleur avocat d'affaires près de chez moi pour une fusion ?", l'IA puisse sourcer votre nom immédiatement.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <LineChart className="w-4 h-4 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-3">4. Boucle de validation humaine</h2>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Chaque mois, nous vérifions physiquement et par API comment vous progressez dans les recommandations de Google et des moteurs IA (Perplexity, ChatGPT, etc). Nous ajustons nos actions en fonction des résultats constatés, pas de suppositions.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <h3 className="text-2xl font-bold mb-3">Prêt à dominer votre marché local ?</h3>
                        <p className="text-sm text-[#888] leading-relaxed">
                            Passez de l'invisible à l'incontournable. Notre méthodologie sécurise votre flux de clientèle à l'ère de la recherche par IA.
                        </p>
                    </div>
                    <ContactButton className="whitespace-nowrap rounded-lg bg-white px-6 py-3 text-[15px] font-medium text-black transition hover:bg-[#d6d6d6]">
                        Obtenir un audit gratuit
                    </ContactButton>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
