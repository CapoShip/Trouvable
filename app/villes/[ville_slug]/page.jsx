"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLES, EXPERTISES } from "../../../lib/data/geo-architecture";
import Navbar from "../../../components/Navbar";
import SiteFooter from "../../../components/SiteFooter";
import ContactButton from "../../../components/ContactButton";
import GeoSeoInjector from "../../../components/GeoSeoInjector";
import { SITE_URL } from "@/lib/site-config";
import { ArrowRight, MapPin, AlertTriangle, Wrench, BarChart3, HelpCircle, ChevronDown } from "lucide-react";

export default function VillePage() {
  const params = useParams();
  const ville = VILLES.find((v) => v.slug === params.ville_slug);
  if (!ville) notFound();

  const linkedExpertises = ville.linkedExpertises.map((s) => EXPERTISES.find((e) => e.slug === s)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <GeoSeoInjector faqs={ville.faqs} breadcrumbs={[{ name: "Accueil", url: "/" }, { name: "Villes", url: null }, { name: ville.name, url: "/villes/" + ville.slug }]} baseUrl={SITE_URL} />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#080808)]" />

      <main>
        <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
          <div className="pointer-events-none absolute right-[-150px] top-[40px] h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(52,211,153,0.05),transparent_70%)]" />
          <div className="pointer-events-none absolute left-[-100px] top-[-60px] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(91,115,255,0.04),transparent_70%)]" />
          <div className="relative z-[1] mx-auto max-w-[860px]">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300">
              <MapPin className="h-3.5 w-3.5" /> Marché Local : {ville.name}
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }} className="text-[clamp(32px,5.5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
              Première recommandation à<br /><span className="bg-gradient-to-r from-emerald-400 to-[#5b73ff] bg-clip-text text-transparent">{ville.name}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="max-w-[580px] text-[17px] leading-[1.65] text-[#a0a0a0]">
              {ville.description}
            </motion.p>
          </div>
        </section>

        <article className="mx-auto max-w-[900px] px-6 pb-20">
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="problems-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/20 bg-red-400/10"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
              <h2 id="problems-h" className="text-xl font-bold tracking-[-0.02em]">L&apos;angle mort de la visibilité à {ville.name}</h2>
            </div>
            <div className="space-y-2.5">
              {ville.problems.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-colors hover:border-red-400/15 hover:bg-red-400/[0.02]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span className="text-[14px] leading-[1.65] text-[#a0a0a0]">{p}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="methodology-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10"><Wrench className="h-5 w-5 text-[#7b8fff]" /></div>
              <h2 id="methodology-h" className="text-xl font-bold tracking-[-0.02em]">L&apos;infrastructure que nous déployons</h2>
            </div>
            <ol className="space-y-3">
              {ville.methodology.map((step, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="flex items-start gap-4 text-[14px] leading-[1.65] text-[#a0a0a0]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/10 text-[12px] font-bold text-[#7b8fff]">{i + 1}</span>{step}
                </motion.li>
              ))}
            </ol>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="signals-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10"><BarChart3 className="h-5 w-5 text-emerald-400" /></div>
              <h2 id="signals-h" className="text-xl font-bold tracking-[-0.02em]">Les signaux techniques maîtrisés</h2>
            </div>
            <ul className="space-y-3">
              {ville.signals.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.65] text-[#a0a0a0]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{s}
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="faq-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10"><HelpCircle className="h-5 w-5 text-amber-400" /></div>
              <h2 id="faq-h" className="text-xl font-bold tracking-[-0.02em]">Questions fréquentes — Visibilité IA à {ville.name}</h2>
            </div>
            <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
              {ville.faqs.map((faq, i) => (
                <details key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="group rounded-xl border border-white/7 bg-white/[0.02] transition hover:border-white/15 [&_summary::-webkit-details-marker]:hidden">
                  <summary itemProp="name" className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90 outline-none">
                    <span>{faq.question}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
                  </summary>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="px-5 pb-5 text-[14px] leading-[1.65] text-[#a0a0a0]">
                    <span itemProp="text">{faq.answer}</span>
                  </div>
                </details>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/7 bg-[#0a0a0a] p-8 md:p-10 mb-10">
            <h2 className="mb-4 text-xl font-bold tracking-[-0.02em]">Une exigence d&apos;exécution pour {ville.name}</h2>
            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">L&apos;écosystème local évolue vite. Notre firme prend en charge l&apos;intégralité du déploiement technique et sémantique requis.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/methodologie" className="inline-flex items-center gap-2 text-[14px] font-medium text-[#7b8fff] transition-colors hover:text-white">Voir notre méthodologie <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 text-[14px] font-medium text-emerald-400 transition-colors hover:text-white">Consulter la preuve <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </motion.section>

          {linkedExpertises.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/6 bg-white/[0.02] p-8 md:p-10 mb-10">
              <h2 className="mb-6 text-xl font-bold tracking-[-0.02em]">Nos expertises à {ville.name}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {linkedExpertises.map((exp) => (
                  <Link key={exp.slug} href={"/expertises/" + exp.slug} className="group rounded-xl border border-white/7 bg-[#0a0a0a] p-5 transition-all hover:-translate-y-0.5 hover:border-[#5b73ff]/30">
                    <h3 className="mb-2 text-sm font-bold text-white group-hover:text-[#7b8fff] transition-colors">{exp.name}</h3>
                    <p className="text-[12px] leading-[1.6] text-white/30 line-clamp-2">{exp.description}</p>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 md:p-12 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-[#5b73ff]/[0.03]" />
            <div className="relative z-10">
              <h2 className="mb-4 text-[clamp(20px,3vw,26px)] font-bold tracking-[-0.02em]">Prêt à dominer le marché de {ville.name} ?</h2>
              <p className="mx-auto mb-8 max-w-md text-[14px] leading-[1.65] text-[#a0a0a0]">Ne laissez pas vos concurrents prendre l&apos;avantage sur la nouvelle génération de recherche IA.</p>
              <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                Diagnostic personnalisé à {ville.name} <ArrowRight className="h-4 w-4" />
              </ContactButton>
            </div>
          </motion.section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
