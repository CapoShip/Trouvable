"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ContactModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', businessType: '', message: '', honeypot: '' });
    const [formStatus, setFormStatus] = useState('idle');
    const [turnstileToken, setTurnstileToken] = useState(null);
    const formRef = useRef();

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openContactModal', handleOpen);
        return () => window.removeEventListener('openContactModal', handleOpen);
    }, []);

    if (!isOpen) return null;

    const handleClose = () => {
        setFormStatus('idle');
        setTurnstileToken(null);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.honeypot) { setFormStatus('success'); return; }
        if (!turnstileToken) { alert("Veuillez valider la vérification anti-robot."); return; }

        setFormStatus('loading');
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const response = await fetch('/api/submit-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name, email: formData.email, phone: formData.phone || '',
                    businessType: formData.businessType || '', message: formData.message,
                    honeypot: formData.honeypot, turnstileToken,
                    page_path: window.location.pathname,
                    utm_source: searchParams.get('utm_source') || '',
                    utm_medium: searchParams.get('utm_medium') || '',
                    utm_campaign: searchParams.get('utm_campaign') || ''
                }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erreur serveur'); }
            setFormStatus('success');
            setFormData({ name: '', email: '', phone: '', businessType: '', message: '', honeypot: '' });
            setTurnstileToken(null);
        } catch (err) {
            console.error('API error:', err);
            setFormStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease' }} aria-label="Contact Modal" role="dialog">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') handleClose(); }} aria-label="Fermer la modale" role="button" tabIndex={0} />

            <div className="relative rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0f0f0f]" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
                <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

                {/* Header */}
                <div className="bg-gradient-to-r from-[#5b73ff] to-[#9333ea] rounded-t-2xl p-8 text-white relative">
                    <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors" aria-label="Fermer">
                        <X size={18} />
                    </button>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                        <Send size={24} />
                    </div>
                    <h2 className="text-2xl font-extrabold mb-1">Contactez-nous</h2>
                    <p className="text-white/70 text-sm">Réponse garantie sous 24h ouvrables</p>
                </div>

                {/* Success State */}
                {formStatus === 'success' ? (
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-400/20">
                            <CheckCircle2 size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3" aria-live="polite">Message envoyé !</h3>
                        <p className="text-[#a0a0a0] mb-8">Nous avons bien reçu votre message et vous répondrons dans les 24h.</p>
                        <button onClick={handleClose} className="bg-white hover:bg-[#d6d6d6] text-black px-8 py-3 rounded-xl font-bold transition-colors">Fermer</button>
                    </div>
                ) : (
                    <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-5">
                        {formStatus === 'error' && (
                            <div className="bg-red-400/10 border border-red-400/20 text-red-300 rounded-xl px-4 py-3 text-sm font-medium">
                                Une erreur s&apos;est produite. Veuillez réessayer ou nous écrire à <span className="font-bold">contact.marchadidi@gmail.com</span>
                            </div>
                        )}

                        <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                            <label htmlFor="honeypot">Ne remplissez pas ce champ si vous êtes humain</label>
                            <input id="honeypot" type="text" name="honeypot" tabIndex="-1" autoComplete="off" value={formData.honeypot} onChange={handleInputChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-semibold text-[#a0a0a0] mb-2" htmlFor="name">Nom complet *</label>
                                <input id="name" type="text" name="name" required autoFocus maxLength={100} value={formData.name} onChange={handleInputChange} placeholder="Jean Tremblay" className="w-full border border-white/10 bg-[#161616] rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#5b73ff] focus:border-transparent transition-all placeholder-white/25" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-semibold text-[#a0a0a0] mb-2" htmlFor="phone">Téléphone</label>
                                <input id="phone" type="tel" name="phone" maxLength={20} value={formData.phone} onChange={handleInputChange} placeholder="514 555-0123" className="w-full border border-white/10 bg-[#161616] rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#5b73ff] focus:border-transparent transition-all placeholder-white/25" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#a0a0a0] mb-2" htmlFor="email">Courriel *</label>
                            <input id="email" type="email" name="email" required maxLength={100} value={formData.email} onChange={handleInputChange} placeholder="jean@monentreprise.ca" className="w-full border border-white/10 bg-[#161616] rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#5b73ff] focus:border-transparent transition-all placeholder-white/25" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#a0a0a0] mb-2" htmlFor="businessType">Type de commerce</label>
                            <select id="businessType" name="businessType" value={formData.businessType} onChange={handleInputChange} className="w-full border border-white/10 bg-[#161616] rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#5b73ff] focus:border-transparent transition-all">
                                <option value="">Sélectionner...</option>
                                <option>Restaurant / Café</option>
                                <option>Salon de coiffure / Esthétique</option>
                                <option>Clinique / Santé</option>
                                <option>Boutique / Commerce de détail</option>
                                <option>Garage / Automobile</option>
                                <option>Pharmacie</option>
                                <option>Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#a0a0a0] mb-2" htmlFor="message">Message *</label>
                            <textarea id="message" name="message" required maxLength={1000} rows={4} value={formData.message} onChange={handleInputChange} placeholder="Parlez-nous de votre commerce et de vos objectifs..." className="w-full border border-white/10 bg-[#161616] rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#5b73ff] focus:border-transparent transition-all resize-none placeholder-white/25" />
                            <div className="text-right mt-1">
                                <span className={`text-xs ${formData.message.length >= 1000 ? 'text-red-400 font-bold' : 'text-white/25'}`}>{formData.message.length}/1000</span>
                            </div>
                        </div>

                        <div className="flex justify-center my-4">
                            <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={(token) => setTurnstileToken(token)} onError={() => setTurnstileToken(null)} onExpire={() => setTurnstileToken(null)} />
                        </div>

                        <button type="submit" disabled={formStatus === 'loading' || !turnstileToken} className="w-full bg-white hover:bg-[#d6d6d6] disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed text-black py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg">
                            {formStatus === 'loading' ? (
                                <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Envoi en cours...</>
                            ) : (
                                <><Send size={18} />Envoyer le message</>
                            )}
                        </button>

                        <p className="text-center text-xs text-white/25">Vos informations sont confidentielles et ne seront jamais partagées.</p>
                    </form>
                )}
            </div>
        </div>
    );
}
