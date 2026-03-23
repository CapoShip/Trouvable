import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, Lock, CheckCircle2, ChevronRight, FileSearch, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Structure d\'un Dossier Type | Trouvable',
    description: 'Découvrez la structure et le niveau de détail d\'un mandat d\'exécution chez Trouvable, avec des exemples concrets anonymisés.',
};

export default function DossierTypePage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-4xl mx-auto">
                <nav className="mb-8 flex items-center gap-2 text-[12px] font-medium text-white/40">
                    <Link href="/etudes-de-cas" className="hover:text-white transition-colors">Résultats</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#a0a0a0]">Dossier Type</span>
                </nav>

                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-6 text-xs text-white/60">
                        <Lock className="w-3.5 h-3.5" /> Données anonymisées pour confidentialité
                    </div>
                    <h1 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                        Anatomie d'un <br/><span className="text-[#666]">Mandat d'Exécution.</span>
                    </h1>
                    <p className="text-lg leading-relaxed text-[#a0a0a0] max-w-2xl">
                        Nos clients n'achètent pas une promesse, ils acquièrent une ingénierie stricte. Voici exactement à quoi ressemble un dossier de déploiement avant, pendant, et après notre intervention (Format Cabinet d'Avocats).
                    </p>
                </div>

                <div className="space-y-12">
                    {/* SECTION 1: LE CONSTAT initial */}
                    <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] overflow-hidden">
                        <div className="bg-[#121212] px-8 py-5 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white/50 flex items-center gap-2">
                                <FileSearch className="w-4 h-4" /> 1. Le Diagnostic Avant Intervention
                            </h2>
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">Risque Critique</span>
                        </div>
                        <div className="p-8">
                            <p className="text-[14px] text-[#a0a0a0] mb-6">
                                Exemple concret d'un cabinet juridique montréalais générant déjà du bouche-à-oreille, mais invisible sur les nouveaux algorithmes locaux.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-red-500/10 bg-red-500/[0.02] p-5 rounded-xl">
                                    <div className="text-red-400 font-bold mb-2 text-sm">Faille SEO (Google Maps)</div>
                                    <ul className="text-[13px] text-[#888] space-y-2">
                                        <li>• Fiche d'établissement revendiquée mais non catégorisée (inscrit comme "Bureau" au lieu de "Avocat d'affaires").</li>
                                        <li>• Aucune donnée Schema.org sur le site pour confirmer la propriété et l'adresse à Google.</li>
                                    </ul>
                                </div>
                                <div className="border border-amber-500/10 bg-amber-500/[0.02] p-5 rounded-xl">
                                    <div className="text-amber-500 font-bold mb-2 text-sm">Faille GEO (Intelligence Artificielle)</div>
                                    <ul className="text-[13px] text-[#888] space-y-2">
                                        <li>• Sur 10 questions posées à ChatGPT concernant un avocat en litige d'affaires local, le cabinet n'est jamais cité initialement.</li>
                                        <li>• Claude IA cite systématiquement un concurrent car sa base de services est mieux structurée.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: L'EXECUTION */}
                    <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] overflow-hidden">
                        <div className="bg-[#121212] px-8 py-5 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-white/50 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> 2. Le Déploiement Trouvable
                            </h2>
                            <span className="px-2 py-1 rounded bg-[#5b73ff]/10 text-[#5b73ff] text-[10px] font-bold uppercase">Ingénierie Structurée</span>
                        </div>
                        <div className="p-8">
                            <p className="text-[14px] text-[#a0a0a0] mb-6">
                                Sans que le client n'ait à coder quoi que ce soit, notre équipe produit et intègre l'ensemble de l'architecture visible.
                            </p>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-[14px] text-white/90 mb-1">Injection Schema.org "Attorney" Local</div>
                                        <div className="text-[13px] text-[#888]">Codage en JSON-LD de tous les champs essentiels, injectés dans le site du client pour aligner sa fiche Maps et son entité web à 100%.</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-[14px] text-white/90 mb-1">Création de la surcouche "llms.txt"</div>
                                        <div className="text-[13px] text-[#888]">Un fichier brut, illisible pour les humains mais adoré par les IA, décrivant l'expertise pointue du cabinet en format Markdown optimisé pour RAG.</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-[14px] text-white/90 mb-1">Alignement des Signaux de Confiance (Trust Signals)</div>
                                        <div className="text-[13px] text-[#888]">Nettoyage des annuaires juridiques incohérents qui brouillaient l'autorité du cabinet au niveau local.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: RESULTATS ATTENDUS */}
                    <div className="rounded-2xl border border-[#5b73ff]/20 bg-[#0d0d0d] overflow-hidden relative shadow-[0_10px_40px_rgba(91,115,255,0.05)]">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-[#5b73ff] to-transparent" />
                        <div className="p-8">
                            <h2 className="text-xl font-bold tracking-[-0.02em] mb-4">Ce que nous suivons mois par mois (Mois 3-6)</h2>
                            <p className="text-[14px] text-[#a0a0a0] mb-8">
                                Le suivi de notre firme porte sur les dimensions qui créent de l'impact financier pur (les chiffres varient, la structure de rapport est la même).
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-5 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold uppercase text-white/40 tracking-wider mb-1">Appels entrants (Maps)</div>
                                        <div className="text-sm font-semibold text-white">Augmentation des clics vers le standard téléphonique.</div>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold uppercase text-white/40 tracking-wider mb-1">Cov. IA</div>
                                        <div className="text-sm font-semibold text-white">Évolution des mentions par ChatGPT sur un échantillon de requêtes locales ciblées.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-12 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-bold mb-4 tracking-[-0.02em]">Ouvrez un dossier avec nous.</h3>
                    <p className="text-[15px] text-[#a0a0a0] mb-8 max-w-xl mx-auto">
                        Le processus est invisible de l'extérieur pour vos concurrents, et totalement pris en charge pour vous de l'intérieur.
                    </p>
                    <ContactButton className="inline-flex items-center gap-2 rounded-xl bg-[#5b73ff] px-8 py-4 text-[15px] font-[600] text-white transition hover:bg-blue-500 hover:shadow-[0_10px_30px_rgba(91,115,255,0.3)]">
                        Demander un diagnostic initial
                    </ContactButton>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
