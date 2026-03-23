import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VILLES, EXPERTISES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import ContactButton from '../../../components/ContactButton';
import GeoSeoInjector from '../../../components/GeoSeoInjector';
import { SITE_URL } from '@/lib/site-config';
import { ArrowRight, MapPin, AlertTriangle, Wrench, BarChart3, HelpCircle } from 'lucide-react';

export function generateStaticParams() {
    return VILLES.map((ville) => ({ ville_slug: ville.slug }));
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const ville = VILLES.find((v) => v.slug === resolvedParams.ville_slug);
    if (!ville) return { title: 'Non trouvé' };

    return {
        title: 'Visibilité IA & Référencement ChatGPT à ' + ville.name + ' | Trouvable',
        description: ville.description,
        metadataBase: new URL(SITE_URL),
        alternates: { canonical: '/villes/' + ville.slug },
        openGraph: {
            title: 'Visibilité IA à ' + ville.name + ' - Trouvable',
            description: ville.description,
            url: '/villes/' + ville.slug,
            siteName: 'Trouvable',
            locale: 'fr_CA',
            type: 'website',
        }
    };
}

export default async function VillePage({ params }) {
    const resolvedParams = await params;
    const ville = VILLES.find((v) => v.slug === resolvedParams.ville_slug);
    if (!ville) { notFound(); }

    const linkedExpertises = ville.linkedExpertises
        .map(slug => EXPERTISES.find(e => e.slug === slug))
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-[#080808] font-sans text-[#f0f0f0]">
            <Navbar />

            <GeoSeoInjector
                faqs={ville.faqs}
                breadcrumbs={[
                    { name: 'Accueil', url: '/' },
                    { name: 'Villes', url: null },
                    { name: ville.name, url: '/villes/' + ville.slug }
                ]}
                baseUrl={SITE_URL}
            />

            <main>
                <article className="max-w-4xl mx-auto px-4 pt-28 pb-20">
                    {/* HEADER */}
                    <header className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5b73ff]/10 text-[#7b8fff] font-medium text-sm border border-[#5b73ff]/20 mb-6">
                            <MapPin size={16} />
                            Expertise Locale : {ville.name}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                            Soyez le premier commerce recommandé par l'IA à <span className="bg-gradient-to-r from-[#5b73ff] to-[#9333ea] bg-clip-text text-transparent">{ville.name}</span>
                        </h1>
                        <p className="text-xl text-[#a0a0a0] max-w-2xl mx-auto font-medium">
                            {ville.description}
                        </p>
                    </header>

                    {/* SECTION 1 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="problems-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-400/10 rounded-xl"><AlertTriangle size={22} className="text-red-400" /></div>
                            <h2 id="problems-heading" className="text-2xl font-bold text-white">
                                Pourquoi les commerces de {ville.name} sont invisibles pour l'IA
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {ville.problems.map((problem, i) => (
                                <li key={i} className="flex items-start gap-3 text-[#a0a0a0]">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                    {problem}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 2 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="methodology-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#5b73ff]/10 rounded-xl"><Wrench size={22} className="text-[#7b8fff]" /></div>
                            <h2 id="methodology-heading" className="text-2xl font-bold text-white">
                                Ce que nous mettons en place à {ville.name}
                            </h2>
                        </div>
                        <ol className="space-y-4">
                            {ville.methodology.map((step, i) => (
                                <li key={i} className="flex items-start gap-4 text-[#a0a0a0]">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-[#5b73ff]/10 text-[#7b8fff] font-bold text-sm flex items-center justify-center border border-[#5b73ff]/20">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* SECTION 3 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="signals-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-400/10 rounded-xl"><BarChart3 size={22} className="text-emerald-400" /></div>
                            <h2 id="signals-heading" className="text-2xl font-bold text-white">
                                Les signaux GEO que nous déployons
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {ville.signals.map((signal, i) => (
                                <li key={i} className="flex items-start gap-3 text-[#a0a0a0]">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                    {signal}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 4 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="faq-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-400/10 rounded-xl"><HelpCircle size={22} className="text-amber-400" /></div>
                            <h2 id="faq-heading" className="text-2xl font-bold text-white">
                                Questions fréquentes — Visibilité IA à {ville.name}
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {ville.faqs.map((faq, i) => (
                                <div key={i} className="border-b border-white/[0.07] pb-5 last:border-0 last:pb-0">
                                    <h3 className="font-bold text-white mb-2">{faq.question}</h3>
                                    <p className="text-[#a0a0a0]">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* INTERNAL LINKING */}
                    {linkedExpertises.length > 0 && (
                        <section className="bg-white/[0.02] rounded-2xl p-8 md:p-10 border border-white/[0.07] mb-8" aria-labelledby="expertises-heading">
                            <h2 id="expertises-heading" className="text-xl font-bold text-white mb-6">
                                Nos expertises à {ville.name}
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {linkedExpertises.map(exp => (
                                    <Link key={exp.slug} href={'/expertises/' + exp.slug}
                                        className="bg-[#0f0f0f] rounded-xl p-5 border border-white/10 hover:border-[#5b73ff]/40 hover:bg-[#5b73ff]/5 transition-all group">
                                        <h3 className="font-bold text-white mb-2 group-hover:text-[#7b8fff] transition-colors">{exp.name}</h3>
                                        <p className="text-sm text-white/30 line-clamp-2">{exp.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-12 text-center mt-12 border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5b73ff]/5 to-[#9333ea]/5 pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-4">Prêt à dominer le marché de {ville.name} ?</h2>
                            <p className="text-[#a0a0a0] mb-8 max-w-xl mx-auto">
                                Ne laissez pas vos concurrents prendre l'avantage sur la nouvelle génération de recherche IA.
                            </p>
                            <ContactButton className="bg-white hover:bg-[#d6d6d6] text-black px-8 py-4 rounded-full font-bold transition-all inline-flex items-center justify-center gap-2 text-lg">
                                Demander un audit gratuit à {ville.name} <ArrowRight size={20} />
                            </ContactButton>
                        </div>
                    </section>
                </article>
            </main>

            <footer className="bg-[#0a0a0a] border-t border-white/[0.05] text-white/30 py-12 text-center">
                <p className="text-sm">© 2026 <Link href="/" className="hover:text-[#7b8fff] transition-colors">Trouvable</Link> — Visibilité IA à {ville.name}.</p>
            </footer>
        </div>
    );
}
