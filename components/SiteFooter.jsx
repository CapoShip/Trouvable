import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { EXPERTISES, VILLES } from "@/lib/data/geo-architecture";
import { SITE_CONTACT_EMAIL as CONTACT_EMAIL, SITE_PHONE_DISPLAY as CONTACT_PHONE_DISPLAY, SITE_PHONE_TEL as CONTACT_PHONE_TEL } from '@/lib/site-contact';

export default function SiteFooter() {
    return (
      <footer className="border-t border-white/7 bg-[#080808] px-6 pb-9 pt-16 sm:px-10">
        <div className="mx-auto mb-12 grid max-w-[1120px] gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
              Trouvable
            </Link>
            <p className="max-w-[230px] text-[13px] leading-[1.65] text-[#666]">Service québécois de visibilité SEO + GEO &mdash; optimisez votre présence sur Google et dans les moteurs de recherche IA.</p>
            <div className="mt-5 space-y-2.5 text-[13px] text-[#666]">
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#5b73ff]" /> Montréal &middot; Laval &middot; Québec</div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 transition-colors hover:text-white">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#5b73ff]" />
                {CONTACT_EMAIL}
              </a>
              <a href={`tel:${CONTACT_PHONE_TEL}`} className="flex items-center gap-2 transition-colors hover:text-white">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#5b73ff]" />
                {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Nos Services</div>
            <ul className="space-y-2.5">
              <li><Link href="/offres" className="text-sm text-[#666] transition hover:text-white">Diagnostic visibilité IA</Link></li>
              <li><Link href="/offres" className="text-sm text-[#666] transition hover:text-white">Optimisation Google Local</Link></li>
              <li><Link href="/methodologie" className="text-sm text-[#666] transition hover:text-white">Ingénierie de prompt (GEO)</Link></li>
              <li><Link href="/offres" className="text-sm text-[#666] transition hover:text-white">Déploiement Schema.org</Link></li>
              <li><Link href="/offres" className="text-sm text-[#666] transition hover:text-white">Suivi et Accompagnement</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Expertises</div>
            <ul className="space-y-2.5">
              {EXPERTISES.slice(0, 5).map((exp) => (
                <li key={exp.slug}><Link href={`/expertises/${exp.slug}`} className="text-sm text-[#666] transition hover:text-white">{exp.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Marchés locaux</div>
            <ul className="space-y-2.5">
              {VILLES.slice(0, 5).map((ville) => (
                <li key={ville.slug}><Link href={`/villes/${ville.slug}`} className="text-sm text-[#666] transition hover:text-white">{ville.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Entreprise</div>
            <ul className="space-y-2.5">
              <li><Link href="/a-propos" className="text-sm text-[#666] transition hover:text-white">La Firme</Link></li>
              <li><Link href="/methodologie" className="text-sm text-[#666] transition hover:text-white">Méthodologie</Link></li>
              <li><Link href="/offres" className="text-sm text-[#666] transition hover:text-white">Nos Offres</Link></li>
              <li><Link href="/etudes-de-cas" className="text-sm text-[#666] transition hover:text-white">Cas Clients</Link></li>
              <li><Link href="/contact" className="text-sm text-[#666] transition hover:text-white">Contact</Link></li>
              <li><Link href="/admin/sign-in" className="text-[13px] text-[#5b73ff] transition hover:text-white mt-1 inline-block">Espace client</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1120px] flex-col gap-5 border-t border-white/7 pt-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <span className="order-1 text-[13px] text-[#666] lg:order-none">&copy; 2026 Trouvable. Visibilité Générative.</span>
          <div className="order-3 flex flex-col gap-2.5 text-[13px] sm:flex-row sm:items-center sm:gap-6 lg:order-none">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-[#a0a0a0] underline decoration-white/10 underline-offset-4 transition-colors hover:text-white hover:decoration-white/30"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-[#5b73ff]" />
              {CONTACT_EMAIL}
            </a>
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center gap-2 text-[#a0a0a0] underline decoration-white/10 underline-offset-4 transition-colors hover:text-white hover:decoration-white/30"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#5b73ff]" />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>
          <div className="order-2 flex items-center gap-2 text-[13px] text-[#666] lg:order-none">
            <div className="h-[7px] w-[7px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(34,197,94)] animate-pulse" />
            Accompagnement en cours
          </div>
        </div>
      </footer>
    );
}
