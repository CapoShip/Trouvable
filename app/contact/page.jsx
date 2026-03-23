import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
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
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 md:gap-24">
                    
                    {/* Left side: Information */}
                    <div>
                        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                            Discutons
                        </div>
                        <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                            Faites analyser votre <br/><span className="text-[#666]">présence IA.</span>
                        </h1>
                        <p className="text-[15px] leading-relaxed text-[#a0a0a0] mb-12">
                            Que vous souhaitiez comprendre pourquoi vos concurrents trustent les réponses de ChatGPT, ou que vous cherchiez à dominer fermement votre marché local sur Google, notre équipe est prête à évaluer votre profil.
                        </p>

                        <div className="space-y-6 mb-16">
                            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                                    <Mail className="w-5 h-5 text-[#a0a0a0] group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#666] uppercase tracking-[0.05em] mb-1">Notre courriel</p>
                                    <p className="text-[15px] font-medium text-white">{SITE_CONTACT_EMAIL}</p>
                                </div>
                            </a>

                            <a href={`tel:${SITE_PHONE_TEL}`} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                                    <Phone className="w-5 h-5 text-[#a0a0a0] group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#666] uppercase tracking-[0.05em] mb-1">Téléphone</p>
                                    <p className="text-[15px] font-medium text-white">{SITE_PHONE_DISPLAY}</p>
                                </div>
                            </a>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-[#a0a0a0]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#666] uppercase tracking-[0.05em] mb-1">Zone d'intervention privilégiée</p>
                                    <p className="text-[15px] font-medium text-white">Grand Montréal & Québec</p>
                                </div>
                            </div>
                        </div>

                        {/* Process Block */}
                        <div className="rounded-xl border border-white/7 bg-[#0d0d0d] p-6 md:p-8">
                            <h3 className="text-lg font-bold mb-6 tracking-[-0.02em]">Ce qui se passe après votre demande :</h3>
                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <Search className="w-5 h-5 text-[#5b73ff] mt-0.5" />
                                    <div>
                                        <div className="text-sm font-semibold text-white/90">Analyse de repérage</div>
                                        <div className="text-xs text-[#888] leading-relaxed mt-1">Nous scannons rapidement vos signaux avant de vous contacter.</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Phone className="w-5 h-5 text-emerald-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-semibold text-white/90">L'appel de découverte (30 min)</div>
                                        <div className="text-xs text-[#888] leading-relaxed mt-1">Un échange qualifié. Nous pourrons vous ouvrir un véritable dossier-type pour vous montrer l'intérieur de notre ingénierie. Pas de pression commerciale.</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-semibold text-white/90">Le plan d'action</div>
                                        <div className="text-xs text-[#888] leading-relaxed mt-1">Si nous pouvons être rentables pour vous, nous vous soumettons un mandat sur-mesure.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Direct Trigger */}
                    <div className="relative">
                        <div className="sticky top-32 rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-8 md:p-12">
                            <h2 className="text-[clamp(20px,2.5vw,26px)] font-bold mb-5 tracking-[-0.02em] leading-snug">Remplissez une demande expresse.</h2>
                            <p className="text-[15px] text-[#a0a0a0] leading-relaxed mb-8">
                                Confiez-nous quelques informations de base pour que notre équipe effectue un premier repérage de votre couverture locale.
                            </p>
                            
                            <div className="bg-[#121212] border border-white/5 rounded-xl p-8 text-center transition-all hover:border-white/10 hover:bg-[#141414]">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center mx-auto mb-5">
                                    <ShieldCheck className="w-5 h-5 text-white/40" />
                                </div>
                                <p className="text-sm font-medium text-white mb-6">Ouvrez le formulaire sécurisé</p>
                                
                                <ContactButton
                                    className="w-full flex justify-center items-center gap-2 py-4 rounded-lg bg-white text-black font-[600] text-[15px] hover:bg-neutral-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                                >
                                    Faire ma demande <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </ContactButton>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
