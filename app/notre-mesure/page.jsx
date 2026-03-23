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
                        <div className="group bg-[#0f0f0f] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 md:items-center hover:bg-[#7b8fff]/[0.02] hover:border-[#7b8fff]/30 relative hover:shadow-[0_4px_30px_rgba(123,143,255,0.05)] transition-all duration-300 cursor-default">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-1/2 bg-[#7b8fff] rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100" />
                            <div className="min-w-[140px] text-[13px] font-bold uppercase tracking-[0.08em] text-[#7b8fff]">1. Les signaux</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-all duration-300 leading-relaxed">
                                (Fondation). Ce sont les balises Schema.org, les profils créés, le code injecté. Nous mesurons si l'implémentation technique est à 100% propre pour que la donnée soit ingestible.
                            </div>
                        </div>
                        <div className="group bg-[#0f0f0f] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 md:items-center hover:bg-amber-500/[0.02] hover:border-amber-500/30 relative hover:shadow-[0_4px_30px_rgba(245,158,11,0.05)] transition-all duration-300 cursor-default">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-1/2 bg-amber-500 rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100" />
                            <div className="min-w-[140px] text-[13px] font-bold uppercase tracking-[0.08em] text-amber-500">2. La présence</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-all duration-300 leading-relaxed">
                                (Classement). C'est votre rang sur Google Maps ou la probabilité que ChatGPT vous mentionne dans sa liste de 3 réponses.
                            </div>
                        </div>
                        <div className="group bg-[#0f0f0f] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 md:items-center hover:bg-[#5b73ff]/[0.02] hover:border-[#5b73ff]/30 relative hover:shadow-[0_4px_30px_rgba(91,115,255,0.05)] transition-all duration-300 cursor-default">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-1/2 bg-[#5b73ff] rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100" />
                            <div className="min-w-[140px] text-[13px] font-bold uppercase tracking-[0.08em] text-[#5b73ff]">3. Le business</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-all duration-300 leading-relaxed">
                                (La vraie monnaie). Ce que nous visons ultimement : l'augmentation des appels entrants qualifiés et du volume de contacts provenant de recherches locales.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-24">
                    <h2 className="text-2xl font-bold mb-8 tracking-[-0.02em] text-center">Ce que nous ne confondons jamais</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="group bg-[#0f0f0f] border border-white/10 hover:border-[#7b8fff]/30 hover:bg-[#7b8fff]/[0.02] hover:shadow-[0_4px_30px_rgba(123,143,255,0.05)] p-6 rounded-xl transition-all duration-300 cursor-default relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-[#7b8fff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#7b8fff] mb-2 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/> Visibilité ≠ Conversion</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-colors leading-relaxed">Être premier ne sert à rien si aucune action (appel de prospect, demande de devis) ne suit. Nous mesurons l'acquisition réelle et ciblée.</div>
                        </div>
                        <div className="group bg-[#0f0f0f] border border-white/10 hover:border-[#7b8fff]/30 hover:bg-[#7b8fff]/[0.02] hover:shadow-[0_4px_30px_rgba(123,143,255,0.05)] p-6 rounded-xl transition-all duration-300 cursor-default relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-[#7b8fff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#7b8fff] mb-2 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/> Citation ≠ Client signé</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-colors leading-relaxed">ChatGPT ou Claude peuvent vous citer, mais la recommandation sémantique doit être assez documentée pour déclencher un contact final.</div>
                        </div>
                        <div className="group bg-[#0f0f0f] border border-white/10 hover:border-[#7b8fff]/30 hover:bg-[#7b8fff]/[0.02] hover:shadow-[0_4px_30px_rgba(123,143,255,0.05)] p-6 rounded-xl transition-all duration-300 cursor-default relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-[#7b8fff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#7b8fff] mb-2 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/> Présence ≠ Domination réelle</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-colors leading-relaxed">Être présent dans votre simple rue d'opération c'est essentiel, dominer 80% des requêtes de votre métropole entière, c'est la domination réelle.</div>
                        </div>
                        <div className="group bg-[#0f0f0f] border border-white/10 hover:border-[#7b8fff]/30 hover:bg-[#7b8fff]/[0.02] hover:shadow-[0_4px_30px_rgba(123,143,255,0.05)] p-6 rounded-xl transition-all duration-300 cursor-default relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1 bg-[#7b8fff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#7b8fff] mb-2 flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/> Signal technique ≠ Résultat immédiat</div>
                            <div className="text-[14px] text-[#a0a0a0] group-hover:text-white/90 transition-colors leading-relaxed">Un balisage de données structurées parfait (Schema.org) est une fondation invisible. Le résultat business se construit de manière incrémentale sur quelques mois.</div>
                        </div>
                    </div>
                </div>

                <div className="mb-24 rounded-2xl border border-white/7 bg-[#0a0a0a] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#5b73ff]/5 blur-[100px] rounded-full pointer-events-none" />
                    <h2 className="text-2xl font-bold mb-10 tracking-[-0.02em]">Chronologie de mesure d'un mandat</h2>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#080808] bg-[#1a1a1a] text-white/50 z-10 shrink-0 md:mx-auto md:order-1 transition-colors group-hover:bg-[#5b73ff] group-hover:text-white group-hover:shadow-[0_0_0_1px_rgba(91,115,255,0.4)]">1</div>
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-white/10 bg-white/[0.02] transition-colors group-hover:bg-white/[0.04]">
                                <div className="font-bold text-white mb-1.5 flex items-center gap-2">Mois 0 : État initial (Snapshot)</div>
                                <div className="text-[13px] text-[#a0a0a0] leading-relaxed">Diagnostic brut avant notre intervention : score et citations IA existantes, failles des signaux de confiance locaux NAP, ranking Maps sur le territoire exact.</div>
                            </div>
                        </div>
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#080808] bg-[#1a1a1a] text-white/50 z-10 shrink-0 md:mx-auto md:order-1 transition-colors group-hover:bg-[#5b73ff] group-hover:text-white group-hover:shadow-[0_0_0_1px_rgba(91,115,255,0.4)]">2</div>
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-white/10 bg-white/[0.02] transition-colors group-hover:bg-white/[0.04]">
                                <div className="font-bold text-white mb-1.5 flex items-center gap-2">Mois 1-2 : Corrections & Déploiement</div>
                                <div className="text-[13px] text-[#a0a0a0] leading-relaxed">Injections techniques sur le portail client (AEO) et nettoyage agressif des annuaires locaux incohérents, en laissant le temps aux IA / moteurs de rafraîchir la donnée.</div>
                            </div>
                        </div>
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#080808] bg-[#1a1a1a] text-white/50 z-10 shrink-0 md:mx-auto md:order-1 transition-colors group-hover:bg-[#5b73ff] group-hover:text-white group-hover:shadow-[0_0_0_1px_rgba(91,115,255,0.4)]">3</div>
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-white/10 bg-white/[0.02] transition-colors group-hover:bg-white/[0.04]">
                                <div className="font-bold text-white mb-1.5 flex items-center gap-2">Mois 3-6 : Validation des métriques</div>
                                <div className="text-[13px] text-[#a0a0a0] leading-relaxed">Suivi continu des nouvelles recommandations IA acquises et de l'évolution des appels et itinéraires générés. Validation humaine par le Lead technique.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-24 flex gap-4 md:gap-6 bg-[#0a0a0a] border border-[#5b73ff]/20 rounded-2xl p-6 md:p-8">
                    <div className="shrink-0 pt-1">
                        <ContactButton className="cursor-default pointer-events-none">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#5b73ff]/10">
                                <span className="text-[#5b73ff]">✓</span>
                            </div>
                        </ContactButton>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold mb-2">Sécurité et confidentialité d'abord.</h2>
                        <p className="text-[14px] text-[#a0a0a0] leading-relaxed">
                            Dans nos études de cas publiques ou nos échanges exploratoires, certains éléments demeurent strictement confidentiels par intégrité professionnelle : 
                            <strong className="text-white/80"> le nom précis de nos entreprises clientes et de nos partenaires actifs</strong>, 
                            <strong className="text-white/80"> le volume d'affaires monétaire exact (+$$$) généré par nos manœuvres</strong> et 
                            <strong className="text-white/80"> nos méthodes internes de prompting GEO spécifique</strong>. 
                            Nous exposons ouvertement notre architecture et l'évolution relative (+X%) des métriques, mais l'anonymat de nos mandats locaux passe avant toute notion de "marketing".
                        </p>
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
