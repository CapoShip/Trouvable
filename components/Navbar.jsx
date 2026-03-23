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
            <header className={`fixed left-0 right-0 top-0 z-50 flex h-[58px] items-center gap-8 border-b px-7 backdrop-blur-2xl transition ${scrolled ? 'bg-[#080808]/90 border-white/7' : 'bg-transparent border-transparent'}`}>
                <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-[-0.025em] text-white">
                    <Image
                        src="/logos/trouvable_logo_blanc1.png"
                        alt=""
                        width={22}
                        height={22}
                        sizes="22px"
                        priority
                        className="w-[22px] h-[22px] object-contain"
                    />
                    Trouvable
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    <Link href="/offres" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Offres</Link>
                    <Link href="/methodologie" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Méthodologie</Link>
                    <Link href="/etudes-de-cas" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Cas clients</Link>
                    <Link href="/a-propos" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">La Firme</Link>
                </nav>

                <div className="flex-1" />
                <div className="hidden items-center gap-2 sm:flex">
                    <Link href="/admin/sign-in" className="rounded-[7px] px-3.5 py-1.5 text-[13.5px] font-medium text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Espace client</Link>
                    <ContactButton className="rounded-[7px] bg-white px-4 py-1.5 text-[13.5px] font-medium text-black transition hover:bg-[#d6d6d6]">
                        Demander un diagnostic
                    </ContactButton>
                </div>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 lg:hidden"
                    aria-label={isMenuOpen ? 'Fermer le menu principal' : 'Ouvrir le menu principal'}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-site-menu"
                    type="button"
                >
                    {isMenuOpen ? <X className="h-5 w-5 text-white/70" /> : <Menu className="h-5 w-5 text-white/70" />}
                </button>
            </header>

            {isMenuOpen && (
                <div id="mobile-site-menu" className="fixed inset-0 z-[60] bg-[#080808]/98 backdrop-blur-xl lg:hidden">
                    <div className="flex h-[58px] items-center justify-between px-7">
                        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.025em] text-white">
                            <Image
                                src="/logos/trouvable_logo_blanc1.png"
                                alt=""
                                width={22}
                                height={22}
                                sizes="22px"
                                className="w-[22px] h-[22px] object-contain"
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
                    <nav className="flex flex-col gap-1 px-7 py-6">
                        <Link href="/offres" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">Offres</Link>
                        <Link href="/methodologie" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">Méthodologie</Link>
                        <Link href="/etudes-de-cas" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">Cas clients</Link>
                        <Link href="/a-propos" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">La Firme</Link>
                        <hr className="my-4 border-white/8" />
                        <Link href="/admin/sign-in" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/50 transition hover:bg-white/5">Espace client</Link>
                        <ContactButton className="mt-2 rounded-lg bg-white px-4 py-3 text-center text-lg font-medium text-black transition hover:bg-[#d6d6d6]">
                            Demander un diagnostic
                        </ContactButton>
                    </nav>
                </div>
            )}

            {/* Spacer for fixed header */}
            <div className="h-[58px]" />
        </>
    );
}
