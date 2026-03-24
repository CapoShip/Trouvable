import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import FadeIn from '@/components/premium/FadeIn';
import { ArrowRight, BarChart3, Target, Bot, Search } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Notre cadre de mesure | Trouvable',
    description: "Découvrez comment Trouvable mesure techniquement l'impact de votre visibilité sur Google Maps, Search et les Moteurs d'IA (ChatGPT, Claude).",
};

export default function NotreMesurePage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(52,211,153,0.08)_0%,rgba(91,115,255,0.08)_50%,transparent_70%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px] text-center">
                        <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">
                            <BarChart3 className="h-3.5 w-3.5" /> Cadre de mesure
                        </div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            Ce que nous mesurons,<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">et ce que nous excluons.</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] mx-auto max-w-[620px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                            La visibilité moderne est mesurable. Notre métrique principale n&apos;est pas le &ldquo;trafic brut&rdquo;, mais la probabilité que votre entreprise soit recommandée en priorité, tant par Google que par les Intelligences Artificielles.
                        </p>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[1100px] grid gap-8 md:grid-cols-2">
                        <FadeIn>
                            <div className="relative h-full overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                                <div className="flex items-center gap-4 mb-7">
                                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                                        <Search className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-[-0.02em]">L&apos;axe Google (SEO Local)</h2>
                                </div>
                                <p className="mb-7 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                    Sur l&apos;écosystème classique de recherche, nous suivons la capacité de votre profil d&apos;entreprise à s&apos;imposer sur le Pack Local (les 3 résultats Google Maps).
                                </p>
                                <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400/70">Indicateurs suivis</div>
                                <ul className="space-y-4">
                                    {[
                                        ['Positionnement Map Pack', 'Votre classement par code postal sur vos mots-clés de service.'],
                                        ['Actions de conversion Google', 'Demandes d\u2019itinéraire, appels téléphoniques déclenchés et clics depuis la fiche.'],
                                        ['Alignement d\u2019autorité NAP', 'La cohérence exacte de votre Raison sociale, Adresse et Téléphone sur les annuaires locaux.'],
                                    ].map(([title, desc]) => (
                                        <li key={title} className="flex gap-3 text-[13px] text-[#999] leading-[1.6]">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                            <span><strong className="text-white/80">{title} :</strong> {desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <div className="relative h-full overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
                                <div className="flex items-center gap-4 mb-7">
                                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                                        <Bot className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-[-0.02em]">L&apos;axe IA (GEO)</h2>
                                </div>
                                <p className="mb-7 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                    L&apos;IA générative (ChatGPT, Claude, Perplexity) ne classe plus des liens : elle donne <em>une seule</em> réponse. Nous mesurons la part de recommandation de votre marque.
                                </p>
                                <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400/70">Indicateurs suivis</div>
                                <ul className="space-y-4">
                                    {[
                                        ['Part de voix (Share of Model)', 'Fréquence à laquelle les IA vous citent en réponse à \u00AB Qui est le meilleur [service] à [ville] ? \u00BB.'],
                                        ['Exactitude des réponses', 'L\u2019IA restitue-t-elle correctement vos tarifs, votre expertise et votre zone de couverture ?'],
                                        ['Disponibilité sémantique (llms.txt)', 'Le temps mis par l\u2019IA pour extraire avec confiance vos spécialisations.'],
                                    ].map(([title, desc]) => (
                                        <li key={title} className="flex gap-3 text-[13px] text-[#999] leading-[1.6]">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                            <span><strong className="text-white/80">{title} :</strong> {desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[900px]">
                        <FadeIn className="mb-14 text-center">
                            <h2 className="text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.04em]">La nuance entre Signal, Présence et Résultat</h2>
                        </FadeIn>
                        <div className="space-y-4">
                            {[
                                { num: '1', label: 'Les signaux', accent: '#7b8fff', desc: '(Fondation). Ce sont les balises Schema.org, les profils créés, le code injecté. Nous mesurons si l\u2019implémentation technique est à 100% propre pour que la donnée soit ingestible.' },
                                { num: '2', label: 'La présence', accent: '#f59e0b', desc: '(Classement). C\u2019est votre rang sur Google Maps ou la probabilité que ChatGPT vous mentionne dans sa liste de 3 réponses.' },
                                { num: '3', label: 'Le business', accent: '#5b73ff', desc: '(La vraie monnaie). Ce que nous visons ultimement : l\u2019augmentation des appels entrants qualifiés et du volume de contacts provenant de recherches locales.' },
                            ].map((row, i) => (
                                <FadeIn key={row.label} delay={i * 0.08}>
                                    <div className="group flex flex-col gap-4 rounded-xl border border-white/7 bg-[#0f0f0f] p-6 transition-all hover:border-white/15 hover:bg-white/[0.03] md:flex-row md:items-center cursor-default">
                                        <div className="flex items-center gap-3 min-w-[160px]">
                                            <span className="font-mono text-[32px] font-bold leading-none" style={{ color: `${row.accent}40` }}>{row.num}</span>
                                            <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: row.accent }}>{row.label}</span>
                                        </div>
                                        <div className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/80 transition-colors">{row.desc}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[1000px]">
                        <FadeIn className="mb-14 text-center">
                            <h2 className="text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.04em]">Ce que nous ne confondons jamais</h2>
                        </FadeIn>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { title: 'Visibilité \u2260 Conversion', desc: 'Être premier ne sert à rien si aucune action (appel, demande de devis) ne suit. Nous mesurons l\u2019acquisition réelle et ciblée.' },
                                { title: 'Citation \u2260 Client signé', desc: 'ChatGPT ou Claude peuvent vous citer, mais la recommandation sémantique doit être assez documentée pour déclencher un contact final.' },
                                { title: 'Présence \u2260 Domination réelle', desc: 'Être présent dans votre simple rue d\u2019opération c\u2019est essentiel, dominer 80% des requêtes de votre métropole, c\u2019est la domination réelle.' },
                                { title: 'Signal technique \u2260 Résultat immédiat', desc: 'Un balisage de données structurées parfait est une fondation invisible. Le résultat business se construit de manière incrémentale.' },
                            ].map((card, i) => (
                                <FadeIn key={card.title} delay={i * 0.06}>
                                    <div className="group relative overflow-hidden rounded-xl border border-white/7 bg-[#0f0f0f] p-6 transition-all hover:border-[#5b73ff]/25 hover:bg-[#5b73ff]/[0.02] cursor-default">
                                        <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 transition-opacity group-hover:opacity-100" />
                                        <div className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.06em] text-[#7b8fff]">
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> {card.title}
                                        </div>
                                        <div className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/80 transition-colors">{card.desc}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[900px]">
                        <FadeIn className="mb-14">
                            <h2 className="text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.04em] text-center">Chronologie de mesure d&apos;un mandat</h2>
                        </FadeIn>
                        <div className="relative space-y-6">
                            <div className="absolute left-5 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/8 to-transparent md:left-1/2 md:block" />
                            {[
                                { step: '1', title: 'Mois 0 : État initial (Snapshot)', desc: 'Diagnostic brut avant notre intervention : score et citations IA existantes, failles des signaux de confiance locaux NAP, ranking Maps sur le territoire exact.' },
                                { step: '2', title: 'Mois 1-2 : Corrections & Déploiement', desc: 'Mise en \u0153uvre technique encadrée sur votre périmètre et nettoyage des annuaires locaux incohérents, en laissant le temps aux moteurs et modèles de rafraîchir la donnée.' },
                                { step: '3', title: 'Mois 3-6 : Validation des métriques', desc: 'Suivi continu des nouvelles recommandations IA acquises et de l\u2019évolution des appels et itinéraires générés. Validation humaine par le Lead technique.' },
                            ].map((item, i) => (
                                <FadeIn key={item.step} delay={i * 0.1} className={`relative flex items-center justify-between gap-6 md:justify-normal ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                    <div className={`hidden md:flex md:w-1/2 ${i % 2 === 0 ? 'md:justify-end md:pr-12' : 'md:justify-start md:pl-12'}`}>
                                        <div className="max-w-[340px] rounded-xl border border-white/7 bg-white/[0.02] p-5 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
                                            <div className="mb-1.5 text-[14px] font-semibold text-white">{item.title}</div>
                                            <p className="text-[13px] leading-[1.6] text-[#999]">{item.desc}</p>
                                        </div>
                                    </div>
                                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0d0d0d] font-mono text-sm font-bold text-[#7b8fff] md:absolute md:left-1/2 md:-translate-x-1/2">
                                        {item.step}
                                    </div>
                                    <div className="flex-1 md:hidden">
                                        <div className="mb-1 text-[14px] font-semibold text-white">{item.title}</div>
                                        <p className="text-[13px] leading-[1.6] text-[#999]">{item.desc}</p>
                                    </div>
                                    <div className="hidden md:block md:w-1/2" />
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
                    <FadeIn className="relative z-10 mx-auto max-w-[700px] text-center">
                        <Target className="mx-auto mb-6 h-10 w-10 text-[#5b73ff]" />
                        <h3 className="mb-5 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.03em]">Voyez un audit en conditions réelles.</h3>
                        <p className="mx-auto mb-8 max-w-xl text-[15px] leading-[1.65] text-[#a0a0a0]">
                            Pour comprendre le niveau de granularité avec lequel nous mesurons une entreprise, visualisez le dossier d&apos;exécution complet d&apos;un prospect sous mandat.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                            <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                Voir le dossier-type <ArrowRight className="h-4 w-4" />
                            </Link>
                            <ContactButton className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]">
                                Demander l&apos;analyse de mon entreprise
                            </ContactButton>
                        </div>
                    </FadeIn>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
