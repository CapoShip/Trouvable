"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import ContactButton from './ContactButton';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Services', href: '#services' },
        { name: 'Fonctionnement', href: '#comment-ca-marche' },
        { name: 'Témoignages', href: '#temoignages' },
        { name: 'FAQ', href: '#faq' },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${scrolled
                ? 'bg-black/60 backdrop-blur-xl border-white/10 py-3'
                : 'bg-transparent border-transparent py-5'
                }`}
        >
            <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex items-center justify-between">
                {/* Logo - Flex-1 to balance the center nav */}
                <div className="flex-1 flex items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/logos/trouvable_logo.png" alt="Trouvable" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
                        <span className="font-bold text-xl tracking-tight text-white uppercase letter-tighter">Trouvable</span>
                    </Link>
                </div>

                {/* Desktop Nav - Centered */}
                <nav className="hidden lg:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Actions - Flex-1 to balance the logo */}
                <div className="flex-1 flex items-center justify-end gap-4">
                    <ContactButton className="hidden sm:block text-[13px] font-medium text-white/50 hover:text-white transition-colors px-4">
                        Connexion
                    </ContactButton>
                    <ContactButton className="bg-white hover:bg-white/90 text-black px-6 py-2.5 rounded-full font-bold text-[13px] transition-all duration-300 scale-100 hover:scale-[1.02] active:scale-[0.98]">
                        Audit Gratuit
                    </ContactButton>

                    {/* Mobile Toggle */}
                    <button
                        className="lg:hidden p-2 text-white/50 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden absolute top-full left-0 right-0 bg-black border-b border-white/10 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-screen opacity-100 py-8' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 flex flex-col gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-lg font-medium text-white/70 hover:text-white"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="divider-h opacity-20"></div>
                    <ContactButton className="w-full bg-white text-black py-4 rounded-lg font-bold text-center">
                        Audit Gratuit
                    </ContactButton>
                </div>
            </div>
        </header>
    );
}
