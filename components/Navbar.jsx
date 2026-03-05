"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ContactButton from './ContactButton';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/logos/trouvable_logo.png" alt="Trouvable Logo" className="w-10 h-10 object-contain" />
                            <span className="font-bold text-2xl tracking-tight">Trouvable</span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
                            <Link href="/#services" className="hover:text-orange-600 transition-colors">Nos Services</Link>
                            <Link href="/#comment-ca-marche" className="hover:text-orange-600 transition-colors">Comment ça marche</Link>
                            <Link href="/#temoignages" className="hover:text-orange-600 transition-colors">Témoignages</Link>
                            <Link href="/#contact" className="hover:text-orange-600 transition-colors">Contact</Link>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <ContactButton className="text-slate-600 hover:text-slate-900 font-medium text-sm">Audit Gratuit</ContactButton>
                            <ContactButton className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-orange-600/20">
                                Nous Contacter
                            </ContactButton>
                        </div>
                        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
                {
                    isMenuOpen && (
                        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-4">
                            <Link href="/#services" className="block font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Nos Services</Link>
                            <Link href="/#comment-ca-marche" className="block font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Comment ça marche</Link>
                            <Link href="/#temoignages" className="block font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Témoignages</Link>
                            <hr />
                            <ContactButton className="w-full text-center bg-orange-600 text-white px-5 py-3 rounded-full font-medium">
                                Demander mon audit gratuit
                            </ContactButton>
                        </div>
                    )
                }
            </nav >
        </>
    );
}
