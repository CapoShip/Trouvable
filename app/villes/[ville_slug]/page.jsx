"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { VILLES, EXPERTISES } from "../../../lib/data/geo-architecture";
import Navbar from "../../../components/Navbar";
import SiteFooter from "../../../components/SiteFooter";
import ContactButton from "../../../components/ContactButton";
import GeoSeoInjector from "../../../components/GeoSeoInjector";
import { SITE_URL } from "@/lib/site-config";
import { ArrowRight, MapPin, AlertTriangle, Wrench, BarChart3, HelpCircle, ChevronDown, Compass, Radio } from "lucide-react";

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
        {/* HERO — full-width territorial, city-dominant */}
        <section className="relative mt-[58px] overflow-hidden px-6 pt-[90px] pb-0 sm:pt-[120px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(52,211,153,0.06),transparent_55%)]" />
          <div className="pointer-events-none absolute left-[-100px] top-[-60px] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(91,115,255,0.04),transparent_70%)]" />
          <div className="relative z-[1] mx-auto max-w-[1100px] text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300">
              <MapPin className="h-3.5 w-3.5" /> Marché Local
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }} className="text-[clamp(44px,8vw,96px)] font-bold leading-[0.98] tracking-[-0.05em] mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-[#5b73ff] bg-clip-text text-transparent">{ville.name}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="mx-auto max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
              {ville.description}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }} className="mt-8 flex flex-wrap justify-center gap-3">
              <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                Diagnostic à {ville.name} <ArrowRight className="h-4 w-4" />
              </ContactButton>
            </motion.div>
          </div>
        </section>

        {/* SIGNAL BAR — horizontal stats, unique to ville pages */}
        <section className="border-t border-white/[0.05] mt-16 px-6 py-5 sm:px-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto max-w-[1100px] flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-center">
            {[
              { label: "Signaux trackés", value: String(ville.signals.length), icon: Radio },
              { label: "Failles identifiées", value: String(ville.problems.length), icon: AlertTriangle },
              { label: "Étapes de déploiement", value: String(ville.methodology.length), icon: Wrench },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-emerald-400/50" />
                  <div>
                    <span className="text-[20px] font-bold text-white">{stat.value}</span>
                    <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-white/30">{stat.label}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* CONTENT — alternating 2-col layout, NOT linear article */}
        <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[1100px] space-y-0">
            {/* Problems */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }} className="grid gap-8 py-16 lg:grid-cols-[380px_1fr] lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/20 bg-red-400/10"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
                  <h2 className="text-xl font-bold tracking-[-0.02em]">L&apos;angle mort</h2>
                </div>
                <p className="text-[14px] leading-[1.65] text-[#888]">Les failles de visibilité que nous identifions systématiquement sur le marché de {ville.name}.</p>
              </div>
              <div className="space-y-2.5">
                {ville.problems.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:border-red-400/15 hover:bg-red-400/[0.02] cursor-default">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <span className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/70 transition-colors">{p}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="mx-auto h-px max-w-[80%] bg-gradient-to-r from-transparent via-white/6 to-transparent" />

            {/* Methodology */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }} className="grid gap-8 py-16 lg:grid-cols-[1fr_380px] lg:gap-16 items-start">
              <div className="order-2 lg:order-1 space-y-3">
                {ville.methodology.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:border-[#5b73ff]/15 cursor-default">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/8 text-[11px] font-bold text-[#7b8fff]">{i + 1}</span>
                    <span className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/70 transition-colors pt-1">{step}</span>
                  </motion.div>
                ))}
              </div>
              <div className="order-1 lg:order-2 lg:sticky lg:top-28">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10"><Wrench className="h-5 w-5 text-[#7b8fff]" /></div>
                  <h2 className="text-xl font-bold tracking-[-0.02em]">Le déploiement</h2>
                </div>
                <p className="text-[14px] leading-[1.65] text-[#888]">L&apos;infrastructure technique et sémantique que nous mettons en place sur le territoire de {ville.name}.</p>
              </div>
            </motion.div>

            <div className="mx-auto h-px max-w-[80%] bg-gradient-to-r from-transparent via-white/6 to-transparent" />

            {/* Signals */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }} className="grid gap-8 py-16 lg:grid-cols-[380px_1fr] lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10"><BarChart3 className="h-5 w-5 text-emerald-400" /></div>
                  <h2 className="text-xl font-bold tracking-[-0.02em]">Les signaux</h2>
                </div>
                <p className="text-[14px] leading-[1.65] text-[#888]">Ce que nous mesurons et contrôlons pour garantir votre domination locale à {ville.name}.</p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {ville.signals.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.04 }} className="group relative overflow-hidden rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all hover:border-emerald-400/15 cursor-default">
                    <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-emerald-400/40" />
                    <span className="text-[13px] leading-[1.6] text-[#a0a0a0] group-hover:text-white/70 transition-colors">{s}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/[0.05] bg-[#060606] px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[800px]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10">
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl font-bold tracking-[-0.02em]">Questions fréquentes — {ville.name}</h2>
              </div>
            </motion.div>
            <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
              {ville.faqs.map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                  <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="group rounded-xl border border-white/7 bg-white/[0.02] transition hover:border-amber-400/15 [&_summary::-webkit-details-marker]:hidden">
                    <summary itemProp="name" className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90 outline-none">
                      <span>{faq.question}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
                    </summary>
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="px-5 pb-5 text-[14px] leading-[1.65] text-[#a0a0a0]">
                      <span itemProp="text">{faq.answer}</span>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERNAL LINKING — expertises */}
        {linkedExpertises.length > 0 && (
          <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
            <div className="mx-auto max-w-[960px]">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
                <h2 className="text-xl font-bold tracking-[-0.02em]">Nos expertises à {ville.name}</h2>
              </motion.div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {linkedExpertises.map((exp, i) => (
                  <motion.div key={exp.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                    <Link href={"/expertises/" + exp.slug} className="group flex items-center justify-between rounded-xl border border-white/7 bg-[#0a0a0a] p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-emerald-400/[0.02]">
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{exp.name}</h3>
                        <p className="mt-1 text-[11px] text-white/25">Expertise sectorielle</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/15 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA — territorial, different from expertise */}
        <section className="relative overflow-hidden border-t border-white/[0.05] bg-[#060606] px-6 py-28 sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.04),transparent_55%)]" />
          <div className="relative z-10 mx-auto max-w-[700px] text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <Compass className="mx-auto mb-6 h-10 w-10 text-emerald-400/70" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.06 }} className="mb-5 text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.03em]">
              Dominez le marché de {ville.name}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.12 }} className="mx-auto mb-10 max-w-lg text-[15px] leading-[1.65] text-[#a0a0a0]">
              Ne laissez pas vos concurrents capter les recommandations IA locales. Notre firme déploie l&apos;infrastructure nécessaire.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.18 }} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8] hover:shadow-[0_20px_60px_rgba(255,255,255,0.06)]">
                Diagnostic personnalisé à {ville.name} <ArrowRight className="h-4 w-4" />
              </ContactButton>
              <Link href="/methodologie" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-7 py-3.5 text-sm font-medium text-[#a0a0a0] transition hover:border-white/30 hover:text-white">
                Notre méthodologie
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
