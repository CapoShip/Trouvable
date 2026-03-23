import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { Lock, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Études de cas | Trouvable',
    description: 'Découvrez comment nous aidons nos clients à dominer les réponses IA.',
};

export default function CasesPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-4xl mx-auto text-center">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                    Résultats & Preuves
                </div>
                <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                    L'impact de la <br/><span className="text-[#666]">visibilité générative.</span>
                </h1>
                <p className="text-lg leading-relaxed text-[#a0a0a0] mb-20 mx-auto max-w-2xl">
                    Nous travaillons actuellement avec des entreprises de pointe pour solidifier leur place dans les moteurs de recherche IA. Par souci de confidentialité avec nos premiers partenaires, les dossiers détaillés sont présentés exclusivement lors de nos appels diagnostiques.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto text-left">
                    <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8">
                        <h3 className="text-lg font-bold mb-3 text-white">Part de recommandation IA</h3>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed">
                            Nous mesurons à quelle fréquence votre marque est citée organiquement par ChatGPT, Claude ou Gemini lorsqu'un utilisateur local cherche vos services.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8">
                        <h3 className="text-lg font-bold mb-3 text-white">Domination Google Local</h3>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed">
                            Nous suivons votre positionnement dans le "Map Pack" et la richesse de vos snippets (avis formatés, FAQ enrichies) sur Google Search traditionnelle.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#5b73ff]/20 bg-[#0d0d0d] p-8 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#5b73ff] to-transparent" />
                        <h3 className="text-lg font-bold mb-3 text-white">Conversion & Visites</h3>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed">
                            La visibilité IA n'a de sens que si elle convertit. Nous traquons le volume d'appels et d'itinéraires générés par ces nouvelles sources conversationnelles.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-12 max-w-2xl mx-auto shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    <div className="mx-auto w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6">
                        <Lock className="w-6 h-6 text-[#666]" />
                    </div>
                    <h2 className="text-xl font-bold mb-4">Études de cas en préparation</h2>
                    <p className="text-sm text-[#888] mb-8 leading-relaxed">
                        Des fiches sectorielles illustrant concrètement l'augmentation des recommandations IA (GEO) et l'assainissement Google (SEO) seront publiées ici très prochainement.
                    </p>
                    <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[14px] font-medium text-black transition hover:bg-white/80">
                        Discuter de votre secteur <ArrowRight className="h-4 w-4" />
                    </ContactButton>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
