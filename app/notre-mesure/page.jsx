import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, BarChart3, Target, Bot, Search } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Notre cadre de mesure | Trouvable',
    description: 'Découvrez comment Trouvable mesure techniquement l\'impact de votre visibilité sur Google Maps, Search et les Moteurs d\'IA (ChatGPT, Claude).',
};

export default function NotreMesurePage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-4xl mx-auto">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff] flex justify-center items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Cadre de mesure
                    </div>
                    <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                        Ce que nous mesurons, <br/><span className="text-[#666]">et ce que nous excluons.</span>
                    </h1>
                    <p className="text-lg leading-relaxed text-[#a0a0a0]">
                        La visibilité moderne est mesurable. Notre métrique principale n'est pas le "trafic brut", mais bien la probabilité que votre entreprise soit recommandée en priorité, tant par Google que par les Intelligences Artificielles, menant à une conversion locale.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-24">
                    <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent" />
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Search className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-[-0.02em]">L'axe Google (SEO Local)</h2>
                        </div>
                        <p className="text-[14px] text-[#a0a0a0] leading-relaxed mb-6">
                            Sur l'écosystème classique de recherche, nous suivons la capacité de votre profil d'entreprise à s'imposer sur le Pack Local (les 3 résultats Google Maps).
                        </p>
                        <h3 className="text-sm font-semibold text-white/90 mb-3 border-b border-white/10 pb-2">Indicateurs suivis :</h3>
                        <ul className="space-y-3 mb-0">
                            <li className="flex gap-3 text-[13px] text-[#888] leading-relaxed items-start">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span><strong>Positionnement Map Pack :</strong> Votre classement par code postal sur vos mots-clés de service (ex: "Avocat droit affaires H2X").</span>
                            </li>
                            <li className="flex gap-3 text-[13px] text-[#888] leading-relaxed items-start">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span><strong>Actions de conversion Google :</strong> Demandes d'itinéraire, appels téléphoniques déclenchés et clics depuis la fiche.</span>
                            </li>
                            <li className="flex gap-3 text-[13px] text-[#888] leading-relaxed items-start">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span><strong>Alignement d'autorité NAP :</strong> La cohérence exacte de votre Raison sociale, Adresse et Téléphone sur les annuaires locaux.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500/40 to-transparent" />
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-[-0.02em]">L'axe IA (GEO)</h2>
                        </div>
                        <p className="text-[14px] text-[#a0a0a0] leading-relaxed mb-6">
                            L'IA générative (ChatGPT, Claude, Perplexity) ne classe plus des liens : elle donne *une seule* réponse. Nous mesurons la part de recommandation de votre marque.
                        </p>
                        <h3 className="text-sm font-semibold text-white/90 mb-3 border-b border-white/10 pb-2">Indicateurs suivis :</h3>
                        <ul className="space-y-3 mb-0">
                            <li className="flex gap-3 text-[13px] text-[#888] leading-relaxed items-start">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span><strong>Part de voix (Share of Model) :</strong> Fréquence à laquelle les IA vous citent en réponse à "Qui est le meilleur [service] à [ville] ?".</span>
                            </li>
                            <li className="flex gap-3 text-[13px] text-[#888] leading-relaxed items-start">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span><strong>Exactitude des réponses :</strong> L'IA restitue-t-elle correctement vos tarifs, votre expertise et votre zone de couverture ?</span>
                            </li>
                            <li className="flex gap-3 text-[13px] text-[#888] leading-relaxed items-start">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span><strong>Disponibilité sémantique (llms.txt) :</strong> Le temps mis par l'IA pour extraire avec confiance vos spécialisations.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mb-24">
                    <h2 className="text-2xl font-bold mb-8 tracking-[-0.02em] text-center">La nuance entre Signal, Présence et Résultat</h2>
                    <div className="space-y-4">
                        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 md:items-center">
                            <div className="min-w-[140px] text-[13px] font-bold uppercase tracking-[0.08em] text-[#7b8fff]">1. Les signaux</div>
                            <div className="text-[14px] text-[#a0a0a0] leading-relaxed">
                                (Fondation). Ce sont les balises Schema.org, les profils créés, le code injecté. Nous mesurons si l'implémentation technique est à 100% propre pour que la donnée soit ingestible.
                            </div>
                        </div>
                        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 md:items-center">
                            <div className="min-w-[140px] text-[13px] font-bold uppercase tracking-[0.08em] text-amber-500">2. La présence</div>
                            <div className="text-[14px] text-[#a0a0a0] leading-relaxed">
                                (Classement). C'est votre rang sur Google Maps ou la probabilité que ChatGPT vous mentionne dans sa liste de 3 réponses.
                            </div>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#5b73ff]/20 bg-[#5b73ff]/[0.02] p-6 rounded-xl flex flex-col md:flex-row gap-6 md:items-center relative shadow-[0_4px_30px_rgba(91,115,255,0.05)]">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[#5b73ff] rounded-r-full" />
                            <div className="min-w-[140px] text-[13px] font-bold uppercase tracking-[0.08em] text-white">3. Le business</div>
                            <div className="text-[14px] text-white/90 font-medium leading-relaxed">
                                (La vraie monnaie). Ce que nous visons ultimement : l'augmentation des appels entrants qualifiés et du volume de contacts provenant de recherches locales.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-10 md:p-14 text-center">
                    <div className="flex justify-center mb-6">
                        <Target className="w-10 h-10 text-[#5b73ff]" />
                    </div>
                    <h3 className="text-[clamp(20px,2.5vw,26px)] font-bold mb-4 tracking-[-0.03em] leading-snug">
                        Voyez un audit en conditions réelles.
                    </h3>
                    <p className="text-[#a0a0a0] mb-8 text-[15px] leading-relaxed max-w-xl mx-auto">
                        Pour comprendre très concrètement le niveau de granularité avec lequel nous mesurons une entreprise, visualisez à quoi ressemble le dossier d'exécution complet d'un prospect sous mandat.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[14px] font-[600] text-black transition hover:bg-neutral-200">
                            Voir le dossier-type <ArrowRight className="h-4 w-4" />
                        </Link>
                        <ContactButton className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-[14px] font-[600] text-white transition hover:bg-white/[0.08]">
                            Demander l'analyse de mon entreprise
                        </ContactButton>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
