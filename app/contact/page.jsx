import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import FadeIn from '@/components/premium/FadeIn';
import { Mail, Phone, MapPin, Search, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { SITE_CONTACT_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from '@/lib/site-contact';

export const metadata = {
    title: 'Diagnostic visibilité & Contact | Trouvable',
    description: 'Demandez un audit de visibilité Google et IA sans engagement avec nos experts locaux.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.12)_0%,transparent_58%)]" />
                </section>

                <section className="px-6 pb-28 sm:px-10">
                    <div className="mx-auto max-w-[1100px] grid gap-16 md:grid-cols-2 md:gap-20">
                        <div className="relative z-[1]">
                            <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">Discutons</div>
                            <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                                Faites analyser votre<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">présence IA.</span>
                            </h1>
                            <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] max-w-[480px] text-[15px] leading-[1.65] text-[#a0a0a0] mb-12">
                                Que vous souhaitiez comprendre pourquoi vos concurrents trustent les réponses de ChatGPT, ou que vous cherchiez à dominer votre marché local sur Google, notre équipe est prête à évaluer votre profil.
                            </p>

                            <FadeIn delay={0.2} className="space-y-5 mb-14">
                                <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="group flex items-center gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] transition group-hover:bg-white/[0.08]">
                                        <Mail className="h-5 w-5 text-[#a0a0a0] group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.06em] text-[#666] mb-0.5">Notre courriel</p>
                                        <p className="text-[15px] font-medium text-white">{SITE_CONTACT_EMAIL}</p>
                                    </div>
                                </a>
                                <a href={`tel:${SITE_PHONE_TEL}`} className="group flex items-center gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] transition group-hover:bg-white/[0.08]">
                                        <Phone className="h-5 w-5 text-[#a0a0a0] group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.06em] text-[#666] mb-0.5">Téléphone</p>
                                        <p className="text-[15px] font-medium text-white">{SITE_PHONE_DISPLAY}</p>
                                    </div>
                                </a>
                                <div className="flex items-center gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                                        <MapPin className="h-5 w-5 text-[#a0a0a0]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.06em] text-[#666] mb-0.5">Zone d&apos;intervention</p>
                                        <p className="text-[15px] font-medium text-white">Grand Montréal &amp; Québec</p>
                                    </div>
                                </div>
                            </FadeIn>

                            <FadeIn delay={0.3}>
                                <div className="rounded-xl border border-white/7 bg-[#0d0d0d] p-7">
                                    <h3 className="mb-6 text-lg font-bold tracking-[-0.02em]">Ce qui se passe après votre demande :</h3>
                                    <div className="space-y-5">
                                        {[
                                            { Icon: Search, color: 'text-[#5b73ff]', title: 'Analyse de repérage', desc: 'Nous scannons rapidement vos signaux avant de vous contacter.' },
                                            { Icon: Phone, color: 'text-emerald-400', title: "L'appel de découverte (30 min)", desc: "Un échange qualifié. Nous pourrons vous ouvrir un véritable dossier-type. Pas de pression commerciale." },
                                            { Icon: CheckCircle2, color: 'text-amber-500', title: "Le plan d'action", desc: 'Si nous pouvons être rentables pour vous, nous vous soumettons un mandat sur-mesure.' },
                                        ].map(({ Icon, color, title, desc }) => (
                                            <div key={title} className="flex items-start gap-4">
                                                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                                                <div>
                                                    <div className="text-sm font-semibold text-white/90">{title}</div>
                                                    <div className="mt-1 text-[12px] leading-[1.6] text-[#888]">{desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>
                        </div>

                        <div className="relative">
                            <FadeIn delay={0.15} className="sticky top-32">
                                <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] md:p-12">
                                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#5b73ff]/30 to-transparent" />
                                    <h2 className="mb-4 text-[clamp(20px,2.5vw,26px)] font-bold tracking-[-0.02em] leading-snug">Remplissez une demande expresse.</h2>
                                    <p className="mb-8 text-[15px] leading-[1.65] text-[#a0a0a0]">
                                        Confiez-nous quelques informations de base pour que notre équipe effectue un premier repérage de votre couverture locale.
                                    </p>
                                    <div className="rounded-xl border border-white/5 bg-[#121212] p-8 text-center transition-all hover:border-white/10 hover:bg-[#141414]">
                                        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
                                            <ShieldCheck className="h-5 w-5 text-white/40" />
                                        </div>
                                        <p className="mb-6 text-sm font-medium text-white">Ouvrez le formulaire sécurisé</p>
                                        <ContactButton className="group flex w-full items-center justify-center gap-2 rounded-lg bg-white py-4 text-[15px] font-semibold text-black transition hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.08)]">
                                            Faire ma demande <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </ContactButton>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
