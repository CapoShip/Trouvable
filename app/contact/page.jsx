import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { Mail, Phone, MapPin } from 'lucide-react';
import { SITE_CONTACT_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from '@/lib/site-contact';

export const metadata = {
    title: 'Contactez-nous | Trouvable',
    description: 'Commencez par un diagnostic gratuit de votre visibilité Google et IA.',
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
                        <p className="text-lg leading-relaxed text-[#a0a0a0] mb-12">
                            Que vous souhaitiez comprendre pourquoi vos concurrents apparaissent sur ChatGPT à votre place, ou que vous cherchiez à dominer fermement votre marché local sur Google, notre équipe est prête à évaluer votre profil.
                        </p>

                        <div className="space-y-6">
                            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                                    <Mail className="w-5 h-5 text-[#a0a0a0] group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-[#666] mb-1">Notre courriel</p>
                                    <p className="text-sm font-medium text-white">{SITE_CONTACT_EMAIL}</p>
                                </div>
                            </a>

                            <a href={`tel:${SITE_PHONE_TEL}`} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.08] transition">
                                    <Phone className="w-5 h-5 text-[#a0a0a0] group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-[#666] mb-1">Téléphone</p>
                                    <p className="text-sm font-medium text-white">{SITE_PHONE_DISPLAY}</p>
                                </div>
                            </a>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-[#a0a0a0]" />
                                </div>
                                <div>
                                    <p className="text-sm text-[#666] mb-1">Service local</p>
                                    <p className="text-sm font-medium text-white">Montréal, Laval, Québec</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Instructions or Direct Trigger */}
                    <div className="relative">
                        <div className="sticky top-32 rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-8 md:p-10">
                            <h2 className="text-2xl font-bold mb-4 tracking-[-0.02em]">Prêt à déléguer ?</h2>
                            <p className="text-sm text-[#a0a0a0] leading-relaxed mb-8">
                                Remplissez une demande expresse et notre équipe effectuera un premier repérage de votre couverture locale avant notre appel.
                            </p>
                            
                            {/* We just trigger the ContactModal here natively instead of building a separate form.
                                To do this nicely on page, since ContactModal is global, we can use the same 
                                standard button, but it's a dedicated page. The user can just click. */}
                            <div className="bg-[#121212] border border-white/5 rounded-xl p-6 text-center">
                                <p className="text-sm font-medium text-white mb-4">Ouvrez le formulaire sécurisé</p>
                                {/* To avoid breaking global ContactModal patterns, we rely on the standard trigger mechanism. */}
                                <ContactButton
                                    className="w-full flex justify-center items-center py-4 rounded-lg bg-white text-black font-[600] text-sm hover:bg-white/90 transition shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                >
                                    Demander un diagnostic rapide
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
