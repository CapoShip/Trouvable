import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Sparkles, Phone } from 'lucide-react';
import ContactButton from './ContactButton';
import { EXPERTISES, VILLES } from '../lib/data/geo-architecture';
import { SITE_CONTACT_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from '@/lib/site-contact';

export default function SiteFooter({ title, description, showCta = true }) {
    return (
        <footer id="contact" className="border-t border-white/10 bg-[#050816]">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {showCta && (
                    <div className="surface-panel mb-12 overflow-hidden p-8 sm:p-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_36%)]" />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <span className="section-label mb-4 inline-flex">Audit GEO / AEO gratuit</span>
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    {title || 'Donnez à votre entreprise locale une présence crédible dans les réponses IA.'}
                                </h2>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                    {description || 'Trouvable transforme vos signaux locaux, vos contenus et vos données structurées en avantage visible sur ChatGPT, Gemini et les moteurs de réponse.'}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <ContactButton className="btn-primary">
                                    Demander un audit
                                    <ArrowUpRight size={18} />
                                </ContactButton>
                                <Link href="/#plateforme" className="btn-secondary">
                                    Voir la plateforme
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
                    <div>
                        <Link href="/" className="flex items-center gap-3 text-white">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                                <img src="/logos/trouvable_logo_blanc.png" alt="Trouvable" className="h-7 w-7 object-contain" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold tracking-tight">Trouvable</div>
                                <div className="text-xs uppercase tracking-[0.32em] text-slate-500">Plateforme de visibilité IA</div>
                            </div>
                        </Link>
                        <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                            Plateforme québécoise de visibilité IA pour commerces, cabinets et PME. Nous structurons votre présence pour les moteurs de réponse et les parcours conversationnels.
                        </p>
                        <div className="mt-6 space-y-3 text-sm text-slate-300">
                            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="flex items-center gap-3 transition-colors hover:text-white">
                                <Mail size={16} className="text-cyan-300" />
                                <span>{SITE_CONTACT_EMAIL}</span>
                            </a>
                            <a href={`tel:${SITE_PHONE_TEL}`} className="flex items-center gap-3 transition-colors hover:text-white">
                                <Phone size={16} className="text-cyan-300" />
                                <span>{SITE_PHONE_DISPLAY}</span>
                            </a>
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className="text-cyan-300" />
                                <span>Montréal · Laval · Québec</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Sparkles size={16} className="text-cyan-300" />
                                <span>Audit sous 48 h · approche GEO / AEO</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Navigation</h3>
                        <ul className="mt-5 space-y-3 text-sm text-slate-300">
                            <li><Link href="/#plateforme" className="transition-colors hover:text-white">Plateforme</Link></li>
                            <li><Link href="/#methodologie" className="transition-colors hover:text-white">Méthodologie</Link></li>
                            <li><Link href="/#cas-usages" className="transition-colors hover:text-white">Cas d'usage</Link></li>
                            <li><Link href="/#faq" className="transition-colors hover:text-white">FAQ</Link></li>
                            <li><Link href="/admin/sign-in" className="transition-colors hover:text-white">Accès admin</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Expertises</h3>
                        <ul className="mt-5 space-y-3 text-sm text-slate-300">
                            {EXPERTISES.slice(0, 6).map((expertise) => (
                                <li key={expertise.slug}>
                                    <Link href={`/expertises/${expertise.slug}`} className="transition-colors hover:text-white">
                                        {expertise.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Marchés locaux</h3>
                        <ul className="mt-5 space-y-3 text-sm text-slate-300">
                            {VILLES.slice(0, 6).map((ville) => (
                                <li key={ville.slug}>
                                    <Link href={`/villes/${ville.slug}`} className="transition-colors hover:text-white">
                                        {ville.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2025 Trouvable. Plateforme de visibilité IA locale.</p>
                    <div className="flex flex-wrap gap-4">
                        <span>Système de design premium</span>
                        <span>Compatible SEO local</span>
                        <span>Next.js · Supabase</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
