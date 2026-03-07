"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
                    Trouvable
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    <Link href="/#plateforme" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Plateforme</Link>
                    <Link href="/#solutions" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Solutions</Link>
                    <Link href="/#expertises" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Expertises</Link>
                    <Link href="/#faq" className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">FAQ</Link>
                </nav>

                <div className="flex-1" />
                <div className="hidden items-center gap-2 sm:flex">
                    <Link href="/admin/login" className="rounded-[7px] px-3.5 py-1.5 text-[13.5px] font-medium text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Connexion</Link>
                    <ContactButton className="rounded-[7px] bg-white px-4 py-1.5 text-[13.5px] font-medium text-black transition hover:bg-[#d6d6d6]">
                        Audit gratuit
                    </ContactButton>
                </div>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 lg:hidden">
                    {isMenuOpen ? <X className="h-5 w-5 text-white/70" /> : <Menu className="h-5 w-5 text-white/70" />}
                </button>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-[#080808]/98 backdrop-blur-xl lg:hidden">
                    <div className="flex h-[58px] items-center justify-between px-7">
                        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.025em] text-white">
                            Trouvable
                        </Link>
                        <button onClick={() => setIsMenuOpen(false)} className="p-1"><X className="h-5 w-5 text-white/60" /></button>
                    </div>
                    <nav className="flex flex-col gap-1 px-7 py-6">
                        <Link href="/#plateforme" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">Plateforme</Link>
                        <Link href="/#solutions" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">Solutions</Link>
                        <Link href="/#expertises" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">Expertises</Link>
                        <Link href="/#faq" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">FAQ</Link>
                        <hr className="my-4 border-white/8" />
                        <Link href="/admin/login" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-4 py-3 text-lg font-medium text-white/50 transition hover:bg-white/5">Connexion</Link>
                        <ContactButton className="mt-2 rounded-lg bg-white px-4 py-3 text-center text-lg font-medium text-black transition hover:bg-[#d6d6d6]">
                            Demander un audit gratuit
                        </ContactButton>
                    </nav>
                </div>
            )}

            {/* Spacer for fixed header */}
            <div className="h-[58px]" />
        </>
    );
}
