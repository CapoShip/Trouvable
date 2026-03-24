"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EXPERTISES, VILLES } from "../../../lib/data/geo-architecture";
import Navbar from "../../../components/Navbar";
import SiteFooter from "../../../components/SiteFooter";
import ContactButton from "../../../components/ContactButton";
import GeoSeoInjector from "../../../components/GeoSeoInjector";
import { SITE_URL } from "@/lib/site-config";
import { ArrowRight, Briefcase, Search, Layers, BookOpen, HelpCircle, ChevronDown } from "lucide-react";

export default function ExpertisePage() {
  const params = useParams();
  const expertise = EXPERTISES.find((e) => e.slug === params.expertise_slug);
  if (!expertise) notFound();

  const linkedVilles = expertise.linkedVilles.map((s) => VILLES.find((v) => v.slug === s)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <GeoSeoInjector service={expertise} faqs={expertise.faqs} breadcrumbs={[{ name: "Accueil", url: "/" }, { name: "Expertises", url: null }, { name: expertise.name, url: "/expertises/" + expertise.slug }]} baseUrl={SITE_URL} />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#080808)]" />

      <main>
        <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
          <div className="pointer-events-none absolute left-[-200px] top-[60px] h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(147,51,234,0.06),transparent_70%)]" />
          <div className="pointer-events-none absolute right-[-100px] top-[-50px] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(91,115,255,0.04),transparent_70%)]" />
          <div className="relative z-[1] mx-auto max-w-[860px]">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-300">
              <Briefcase className="h-3.5 w-3.5" /> Expertise Sectorielle
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }} className="text-[clamp(32px,5.5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
              La référence en visibilité pour<br /><span className="bg-gradient-to-r from-[#5b73ff] to-[#a78bfa] bg-clip-text text-transparent">{expertise.name}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="max-w-[580px] text-[17px] leading-[1.65] text-[#a0a0a0]">
              {expertise.description}
            </motion.p>
          </div>
        </section>

        <article className="mx-auto max-w-[900px] px-6 pb-20">
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="intents-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-500/20 bg-violet-500/10"><Search className="h-5 w-5 text-violet-400" /></div>
              <h2 id="intents-h" className="text-xl font-bold tracking-[-0.02em]">L&apos;intention de recherche : {expertise.name}</h2>
            </div>
            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">Voici les types de requêtes formulées quotidiennement à ChatGPT, Gemini et Perplexity pour votre secteur :</p>
            <div className="space-y-2.5">
              {expertise.searchIntents.map((intent, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-colors hover:border-violet-500/15 hover:bg-violet-500/[0.02]">
                  <span className="mt-0.5 font-mono text-sm text-violet-400 shrink-0">→</span>
                  <span className="text-[14px] leading-[1.6] text-[#a0a0a0] italic">{intent}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="content-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10"><Layers className="h-5 w-5 text-[#7b8fff]" /></div>
              <h2 id="content-h" className="text-xl font-bold tracking-[-0.02em]">L&apos;architecture sémantique de votre offre</h2>
            </div>
            <ul className="space-y-3">
              {expertise.contentAngles.map((angle, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.65] text-[#a0a0a0]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />{angle}
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="usecases-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10"><BookOpen className="h-5 w-5 text-emerald-400" /></div>
              <h2 id="usecases-h" className="text-xl font-bold tracking-[-0.02em]">Le niveau de précision documentaire exigé</h2>
            </div>
            <ol className="space-y-3">
              {expertise.useCases.map((uc, i) => (
                <li key={i} className="flex items-start gap-4 text-[14px] leading-[1.65] text-[#a0a0a0]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-[12px] font-bold text-emerald-400">{i + 1}</span>{uc}
                </li>
              ))}
            </ol>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border-t border-white/[0.05] py-16" aria-labelledby="faq-h">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10"><HelpCircle className="h-5 w-5 text-amber-400" /></div>
              <h2 id="faq-h" className="text-xl font-bold tracking-[-0.02em]">Questions fréquentes — GEO en {expertise.name}</h2>
            </div>
            <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
              {expertise.faqs.map((faq, i) => (
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
            <h2 className="mb-4 text-xl font-bold tracking-[-0.02em]">Une exécution sur-mesure pour {expertise.name}</h2>
            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">Les standards de référencement pour ce secteur exigent une précision technique absolue. Notre firme déploie et maintient cette infrastructure pour vous.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/offres" className="inline-flex items-center gap-2 text-[14px] font-medium text-[#7b8fff] transition-colors hover:text-white">Découvrir nos mandats <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/notre-mesure" className="inline-flex items-center gap-2 text-[14px] font-medium text-emerald-400 transition-colors hover:text-white">Notre cadre de mesure <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </motion.section>

          {linkedVilles.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/6 bg-white/[0.02] p-8 md:p-10 mb-10">
              <h2 className="mb-6 text-xl font-bold tracking-[-0.02em]">{expertise.name} : nos marchés locaux</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {linkedVilles.map((v) => (
                  <Link key={v.slug} href={"/villes/" + v.slug} className="group rounded-xl border border-white/7 bg-[#0a0a0a] p-5 transition-all hover:-translate-y-0.5 hover:border-[#5b73ff]/30">
                    <h3 className="mb-2 text-sm font-bold text-white group-hover:text-[#7b8fff] transition-colors">Visibilité IA à {v.name}</h3>
                    <p className="text-[12px] leading-[1.6] text-white/30 line-clamp-2">{v.description}</p>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 md:p-12 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#5b73ff]/[0.03] to-[#9333ea]/[0.03]" />
            <div className="relative z-10">
              <h2 className="mb-4 text-[clamp(20px,3vw,26px)] font-bold tracking-[-0.02em]">Passez devant vos concurrents en {expertise.name}</h2>
              <p className="mx-auto mb-8 max-w-md text-[14px] leading-[1.65] text-[#a0a0a0]">Découvrons ensemble comment positionner votre activité sur Google et les réponses IA.</p>
              <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                Obtenir mon plan d&apos;action <ArrowRight className="h-4 w-4" />
              </ContactButton>
            </div>
          </motion.section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
