'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ChevronUp } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const TOPICS = [
    { value: 'Comprendre les indicateurs de mon espace', label: 'Comprendre les indicateurs de mon espace' },
    { value: 'Question sur une métrique ou une section', label: 'Question sur une métrique ou une section' },
    { value: 'Accès, connexion ou courriel', label: 'Accès, connexion ou courriel' },
    { value: 'Autre demande', label: 'Autre demande' },
];

const inputClasses =
    'w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-[14px] text-white outline-none transition-all duration-200 placeholder:text-white/18 hover:border-white/[0.12] focus:border-[#5b73ff]/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#5b73ff]/15';

export default function PortalSupportForm({ defaultEmail = '', clientLabel = '' }) {
    const [formData, setFormData] = useState({
        name: '',
        email: defaultEmail,
        phone: '',
        portalTopic: TOPICS[0].value,
        message: '',
        honeypot: '',
    });
    const [formStatus, setFormStatus] = useState('idle');
    const [turnstileToken, setTurnstileToken] = useState(null);
    const [turnstileError, setTurnstileError] = useState('');
    const [turnstileRenderKey, setTurnstileRenderKey] = useState(0);
    const [formExpanded, setFormExpanded] = useState(false);
    const sectionRef = useRef(null);
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const isTurnstileConfigured = Boolean(turnstileSiteKey);

    useEffect(() => {
        const syncHash = () => {
            if (typeof window === 'undefined') return;
            if (window.location.hash === '#aide-espace-client') {
                setFormExpanded(true);
                requestAnimationFrame(() => {
                    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        };
        syncHash();
        window.addEventListener('hashchange', syncHash);
        return () => window.removeEventListener('hashchange', syncHash);
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const resetTurnstileWidget = () => {
        setTurnstileToken(null);
        setTurnstileError('');
        setTurnstileRenderKey((v) => v + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.honeypot) {
            setFormStatus('success');
            return;
        }
        if (!isTurnstileConfigured) {
            setTurnstileError('Vérification anti-robot indisponible pour le moment. Merci de réessayer dans quelques instants.');
            return;
        }
        if (!turnstileToken) {
            alert('Veuillez valider la vérification anti-robot.');
            return;
        }

        setFormStatus('loading');
        setTurnstileError('');
        try {
            const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
            const response = await fetch('/api/submit-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || '',
                    businessType: '',
                    message: formData.message,
                    honeypot: formData.honeypot,
                    turnstileToken,
                    page_path: typeof window !== 'undefined' ? window.location.pathname : '/portal',
                    utm_source: searchParams.get('utm_source') || '',
                    utm_medium: searchParams.get('utm_medium') || '',
                    utm_campaign: searchParams.get('utm_campaign') || '',
                    form_type: 'portal_support',
                    portal_topic: formData.portalTopic,
                    client_context: clientLabel || null,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur lors de l'envoi");
            }
            setFormStatus('success');
            setFormData({
                name: '',
                email: defaultEmail,
                phone: '',
                portalTopic: TOPICS[0].value,
                message: '',
                honeypot: '',
            });
            setTurnstileToken(null);
            setTurnstileError('');
        } catch (err) {
            console.error('Portal support form:', err);
            setTurnstileToken(null);
            if (String(err?.message || '').toLowerCase().includes('anti-robot')) {
                setTurnstileError('La vérification Cloudflare a expiré ou a échoué. Merci de valider à nouveau.');
            }
            setFormStatus('error');
        }
    };

    if (formStatus === 'success') {
        return (
            <div ref={sectionRef} id="aide-espace-client">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[28px] border border-white/[0.05] bg-[#0a0a0d] p-12 text-center shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
                >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-400/[0.02] to-transparent" />
                    <div className="relative">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06]">
                            <CheckCircle2 size={26} className="text-emerald-400" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-white">Message envoyé</h3>
                        <p className="mx-auto max-w-md text-[14px] leading-relaxed text-white/35">
                            Nous avons bien reçu votre demande. L&apos;équipe vous répondra dans les meilleurs délais ouvrables.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            ref={sectionRef}
            id="aide-espace-client"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="relative"
        >
            <AnimatePresence mode="wait">
                {!formExpanded ? (
                    <motion.section
                        key="teaser"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="relative overflow-hidden rounded-[28px] border border-white/[0.05] bg-[#0a0a0d] shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
                    >
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -bottom-20 -right-20 h-[220px] w-[220px] rounded-full bg-[#5b73ff]/[0.025] blur-[100px]" />
                        </div>
                        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#5b73ff]/12 to-transparent" />

                        <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between md:gap-10 md:p-10">
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]/40">
                                    Accompagnement
                                </div>
                                <h2 className="mb-2 text-[18px] font-bold tracking-[-0.02em] text-white md:text-[19px]">
                                    Votre dossier est suivi en continu
                                </h2>
                                <p className="max-w-xl text-[13px] leading-relaxed text-white/32 md:text-[14px]">
                                    L&apos;équipe reste disponible pour vos questions, vos résultats et la suite de votre accompagnement.
                                </p>
                            </div>
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setFormExpanded(true)}
                                    className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[13px] font-bold text-black transition-all hover:-translate-y-px hover:shadow-[0_14px_44px_rgba(255,255,255,0.05)]"
                                >
                                    Aide sur l&apos;espace client
                                    <ArrowRight size={15} className="opacity-60 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        </div>
                    </motion.section>
                ) : (
                    <motion.section
                        key="form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative overflow-hidden rounded-[28px] border border-white/[0.05] bg-[#0a0a0d] shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
                    >
                        <div className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#5b73ff]/12 to-transparent" />

                        <div className="flex flex-col gap-3 border-b border-white/[0.04] px-8 pb-6 pt-7 md:flex-row md:items-start md:justify-between md:px-10 md:pt-9">
                            <div>
                                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]/45">
                                    Aide
                                </div>
                                <h2 className="text-[clamp(20px,2.5vw,24px)] font-bold tracking-[-0.03em] text-white">
                                    Une question sur votre{' '}
                                    <span className="bg-gradient-to-r from-[#5b73ff] to-[#a78bfa] bg-clip-text text-transparent">
                                        espace client
                                    </span>
                                    &nbsp;?
                                </h2>
                                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/30">
                                    Décrivez votre besoin. Réponse sous les meilleurs délais ouvrables.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormExpanded(false)}
                                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 text-[12px] font-medium text-white/35 transition hover:border-white/[0.1] hover:text-white/60"
                            >
                                <ChevronUp size={14} />
                                Masquer
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-8 md:px-10 md:pb-10">
                            {formStatus === 'error' && (
                                <div className="rounded-xl border border-red-500/12 bg-red-500/[0.04] px-4 py-3 text-[13px] font-medium leading-relaxed text-red-300/80">
                                    Une erreur s&apos;est produite. Vous pouvez réessayer ou nous écrire directement depuis la page contact du site.
                                </div>
                            )}
                            {turnstileError && (
                                <div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-4 py-3 text-[13px] font-medium text-amber-200/80">
                                    {turnstileError}
                                </div>
                            )}

                            <div className="hidden" aria-hidden="true">
                                <label htmlFor="portal-support-honeypot">Ne pas remplir</label>
                                <input
                                    id="portal-support-honeypot"
                                    type="text"
                                    name="honeypot"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={formData.honeypot}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/35"
                                        htmlFor="portal-support-name"
                                    >
                                        Nom complet <span className="text-[#5b73ff]/60">*</span>
                                    </label>
                                    <input
                                        id="portal-support-name"
                                        type="text"
                                        name="name"
                                        required
                                        maxLength={80}
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Votre nom"
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/35"
                                        htmlFor="portal-support-phone"
                                    >
                                        Téléphone
                                    </label>
                                    <input
                                        id="portal-support-phone"
                                        type="tel"
                                        name="phone"
                                        maxLength={30}
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Optionnel"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/35"
                                    htmlFor="portal-support-email"
                                >
                                    Courriel <span className="text-[#5b73ff]/60">*</span>
                                </label>
                                <input
                                    id="portal-support-email"
                                    type="email"
                                    name="email"
                                    required
                                    maxLength={254}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="votre@courriel.ca"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label
                                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/35"
                                    htmlFor="portal-support-topic"
                                >
                                    Sujet <span className="text-[#5b73ff]/60">*</span>
                                </label>
                                <select
                                    id="portal-support-topic"
                                    name="portalTopic"
                                    value={formData.portalTopic}
                                    onChange={handleInputChange}
                                    className={`${inputClasses} cursor-pointer appearance-none [&>option]:bg-[#121212] [&>option]:text-white`}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23ffffff40' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 14px center',
                                    }}
                                >
                                    {TOPICS.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-white/35"
                                    htmlFor="portal-support-message"
                                >
                                    Message <span className="text-[#5b73ff]/60">*</span>
                                </label>
                                <textarea
                                    id="portal-support-message"
                                    name="message"
                                    required
                                    maxLength={2000}
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Expliquez votre question ou ce que vous souhaitez clarifier…"
                                    className={`${inputClasses} resize-none`}
                                />
                                <div className="mt-1 flex justify-end">
                                    <span
                                        className={`text-[10px] tabular-nums ${
                                            formData.message.length >= 1800
                                                ? 'text-amber-400/50'
                                                : formData.message.length >= 2000
                                                  ? 'font-bold text-red-400'
                                                  : 'text-white/12'
                                        }`}
                                    >
                                        {formData.message.length}/2000
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-center py-1">
                                {isTurnstileConfigured ? (
                                    <Turnstile
                                        key={turnstileRenderKey}
                                        siteKey={turnstileSiteKey}
                                        options={{
                                            retry: 'auto',
                                            retryInterval: 1200,
                                            refreshExpired: 'auto',
                                            refreshTimeout: 'auto',
                                        }}
                                        onSuccess={(token) => {
                                            setTurnstileToken(token);
                                            setTurnstileError('');
                                        }}
                                        onError={() => {
                                            setTurnstileToken(null);
                                            setTurnstileError(
                                                "La vérification Cloudflare n'a pas pu être chargée. Vérifiez votre connexion et réessayez."
                                            );
                                        }}
                                        onExpire={() => {
                                            setTurnstileToken(null);
                                            setTurnstileError('La vérification anti-robot a expiré. Merci de valider à nouveau.');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-4 py-3 text-center text-[12px] text-amber-200/70">
                                        Vérification Cloudflare momentanément indisponible.
                                    </div>
                                )}
                            </div>
                            {turnstileError && isTurnstileConfigured && (
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={resetTurnstileWidget}
                                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] text-white/50 transition hover:bg-white/[0.04] hover:text-white/70"
                                    >
                                        Recharger la vérification
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={formStatus === 'loading' || !turnstileToken || !isTurnstileConfigured}
                                className="group relative w-full overflow-hidden rounded-xl py-3.5 text-[14px] font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-25"
                                style={{
                                    background:
                                        formStatus === 'loading' || !turnstileToken || !isTurnstileConfigured
                                            ? 'rgba(255,255,255,0.03)'
                                            : 'linear-gradient(135deg, #5b73ff, #7c3aed)',
                                    color:
                                        formStatus === 'loading' || !turnstileToken || !isTurnstileConfigured
                                            ? 'rgba(255,255,255,0.25)'
                                            : '#fff',
                                    boxShadow:
                                        formStatus === 'loading' || !turnstileToken || !isTurnstileConfigured
                                            ? 'none'
                                            : '0 4px 20px rgba(91,115,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                                }}
                            >
                                {formStatus === 'loading' ? (
                                    <span className="flex items-center justify-center gap-2.5">
                                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Envoi en cours…
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Envoyer à l&apos;équipe
                                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                )}
                            </button>

                            <p className="text-center text-[11px] leading-relaxed text-white/12">
                                Vos informations sont traitées de façon confidentielle, dans le cadre de votre accompagnement.
                            </p>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
