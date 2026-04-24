"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import ContactButton from './ContactButton';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed left-0 right-0 top-0 z-50 flex h-[58px] items-center gap-8 border-b px-7 backdrop-blur-2xl transition ${scrolled ? 'bg-[#080808]/90 border-white/7' : 'bg-transparent border-transparent'}`}
                data-agent-surface="primary-nav"
            >
                <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-[-0.025em] text-white" data-agent-action="nav-home">
                    <Image
                        src="/logos/trouvable_logo_blanc1.png"
                        alt="Logo Trouvable"
                        width={22}
                        height={22}
                        sizes="22px"
                        priority
                        className="h-[22px] w-[22px] object-contain"
                    />
                    Trouvable
                </Link>

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
                    <Link href="/offres" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-offres">Mandats</Link>
                    <Link href="/services/audit-visibilite-ia" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-audit-ia">Audit IA</Link>
                    <Link href="/methodologie" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-methodologie">Méthodologie</Link>
                    <Link href="/etudes-de-cas" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-case-studies">Cas clients</Link>
                    <Link href="/a-propos" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-about">La Firme</Link>
                    <Link href="/recherche" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-search">Recherche</Link>
                </nav>

                <div className="flex-1" />
                <div className="hidden items-center gap-2 sm:flex">
                    <Link href="/espace" className="rounded-[7px] px-3.5 py-1.5 text-[13.5px] font-medium text-[#a0a0a0] transition hover:bg-white/5 hover:text-white" data-agent-action="nav-client-space">Espace client</Link>
                    <ContactButton className="rounded-[7px] bg-white px-4 py-1.5 text-[13.5px] font-medium text-black transition hover:bg-[#d6d6d6]" data-agent-action="open-contact-modal-nav">
                        Planifier un appel
                    </ContactButton>
                </div>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 lg:hidden"
                    aria-label={isMenuOpen ? 'Fermer le menu principal' : 'Ouvrir le menu principal'}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-site-menu"
                    type="button"
                    data-agent-action="toggle-mobile-menu"
                >
                    {isMenuOpen ? <X className="h-5 w-5 text-white/70" /> : <Menu className="h-5 w-5 text-white/70" />}
                </button>
            </header>

            {isMenuOpen && (
                <div id="mobile-site-menu" className="fixed inset-0 z-[60] bg-[#080808]/98 backdrop-blur-xl lg:hidden">
                    <div className="flex h-[58px] items-center justify-between px-7">
                        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.025em] text-white" data-agent-action="nav-home-mobile">
                            <Image
                                src="/logos/trouvable_logo_blanc1.png"
                                alt="Logo Trouvable"
                                width={22}
                                height={22}
                                sizes="22px"
                                className="h-[22px] w-[22px] object-contain"
                            />
                            Trouvable
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-1"
                            aria-label="Fermer le menu principal"
                            type="button"
                        >
                            <X className="h-5 w-5 text-white/60" />
                        </button>
                    </div>
                    <nav className="flex flex-col gap-1 px-7 py-6" aria-label="Navigation mobile">
                        <Link href="/offres" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5" data-agent-action="nav-offres-mobile">Mandats</Link>
                        <Link href="/services/audit-visibilite-ia" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5" data-agent-action="nav-audit-ia-mobile">Audit IA</Link>
                        <Link href="/methodologie" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5" data-agent-action="nav-methodologie-mobile">Méthodologie</Link>
                        <Link href="/etudes-de-cas" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5" data-agent-action="nav-case-studies-mobile">Cas clients</Link>
                        <Link href="/a-propos" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5" data-agent-action="nav-about-mobile">La Firme</Link>
                        <Link href="/recherche" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5" data-agent-action="nav-search-mobile">Recherche</Link>
                        <hr className="my-4 border-white/8" />
                        <Link href="/espace" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/50 transition hover:bg-white/5" data-agent-action="nav-client-space-mobile">Espace client</Link>
                        <ContactButton className="mt-2 rounded-lg bg-white px-4 py-3 text-center text-lg font-medium text-black transition hover:bg-[#d6d6d6]" data-agent-action="open-contact-modal-mobile-nav">
                            Planifier un appel
                        </ContactButton>
                    </nav>
                </div>
            )}

            <div className="h-[58px]" />
        </>
    );
}
