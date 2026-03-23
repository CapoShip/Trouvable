import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata = {
    title: 'À propos | Trouvable',
    description: 'Nous sommes une firme spécialisée dans la visibilité locale sur Google et l\'Intelligence Artificielle.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                    Notre firme
                </div>
                <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-8">
                    L'équipe d'experts derrière <br/><span className="text-[#666]">votre visibilité IA.</span>
                </h1>
                <p className="text-lg leading-relaxed text-[#a0a0a0] mb-12 max-w-3xl">
                    Trouvable n'est pas une &quot;agence SEO&quot; classique ni un logiciel vide. Nous sommes une firme d'exécution spécialisée en visibilité locale et intelligence générative. 
                    <br/><br/>
                    Notre mission est claire : garantir que votre entreprise soit trouvée, comprise et recommandée en priorité par les nouveaux moteurs de recherche (Google, ChatGPT, Gemini, Claude).
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8">
                        <h2 className="text-xl font-semibold mb-6 text-white tracking-[-0.02em]">Pourquoi nous choisir ?</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>Une véritable expertise technique approfondie, loin du blabla marketing habituel.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>Un service d'exécution clé en main : vous déléguez l'exécution technique, nous livrons les résultats.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>Une technologie propriétaire rigoureuse utilisée par notre équipe pour assurer la qualité.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8">
                        <h2 className="text-xl font-semibold mb-4 text-white tracking-[-0.02em]">Notre philosophie</h2>
                        <p className="text-[15px] leading-relaxed text-[#a0a0a0]">
                            La technologie doit servir le commerce local, et non le complexifier. Vous n'avez pas le temps d'étudier l'algorithme de ChatGPT, ni de gérer un nouvel outil logiciel tous les mois. 
                            <br/><br/>
                            C'est notre travail. Nous traduisons l'excellence de votre métier en signaux techniques irréprochables pour que les IA vous reconnaissent comme le leader local.
                        </p>
                        <ContactButton className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-white/70 transition">
                            Discuter avec l'équipe <ArrowRight className="w-4 h-4" />
                        </ContactButton>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
