"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ContactButton from "@/components/ContactButton";
import Link from "next/link";
import { ArrowRight, BookOpen, Lock, ShieldCheck, BarChart3, Bot, Search } from "lucide-react";

const METRICS = [
  { icon: Bot, accent: "#a78bfa", title: "Part de recommandation IA", desc: "Fréquence à laquelle votre marque est citée par ChatGPT, Claude ou Gemini sur les requêtes de votre marché local." },
  { icon: Search, accent: "#5b73ff", title: "Domination Google Local", desc: "Positionnement sur le Map Pack et déclenchement des requêtes itinéraire, appel et clic vers votre site." },
  { icon: BarChart3, accent: "#34d399", title: "Taux de conversion", desc: "Impact concret sur vos prises de contact et vos appels de découverte — la seule métrique qui compte." },
];

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#080808)]" />

      <main>
        <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
          <div className="pointer-events-none absolute left-1/2 top-[-100px] z-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(167,139,250,0.06)_0%,rgba(91,115,255,0.04)_40%,transparent_65%)]" />
          <div className="relative z-[1] mx-auto max-w-[860px] text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#a78bfa]">
              Résultats &amp; Métriques
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }} className="text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
              Comment nous documentons<br /><span className="bg-gradient-to-r from-[#a78bfa]/70 to-[#5b73ff]/70 bg-clip-text text-transparent">vos acquis.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="mx-auto max-w-[580px] text-[17px] leading-[1.65] text-[#a0a0a0]">
              Par exigence de confidentialité, nous n&apos;exposons ni les noms ni les chiffres de nos partenaires en public. Toutefois, notre mesure des résultats est implacable.
            </motion.p>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
          <div className="mx-auto max-w-[1100px]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a78bfa]">Ce que nous suivons</div>
              <h2 className="text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.04em]">Trois dimensions de mesure</h2>
            </motion.div>
            <div className="space-y-5">
              {METRICS.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.div key={m.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="group relative grid items-center gap-6 rounded-2xl border border-white/7 bg-[#0a0a0a] p-6 transition-all hover:border-white/15 md:grid-cols-[60px_1fr] md:p-8 cursor-default">
                    <div className="hidden md:grid h-14 w-14 place-items-center rounded-xl border bg-white/[0.02]" style={{ borderColor: `${m.accent}20` }}>
                      <Icon className="h-6 w-6" style={{ color: m.accent }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="md:hidden grid h-9 w-9 place-items-center rounded-lg border bg-white/[0.02]" style={{ borderColor: `${m.accent}20` }}>
                          <Icon className="h-4 w-4" style={{ color: m.accent }} />
                        </div>
                        <h3 className="text-[16px] font-semibold text-white">{m.title}</h3>
                      </div>
                      <p className="text-[14px] leading-[1.65] text-[#888] group-hover:text-white/70 transition-colors">{m.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.05] bg-[#060606] px-6 py-28 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto max-w-[800px]">
            <div className="relative overflow-hidden rounded-2xl border border-[#a78bfa]/15 bg-[#0a0a0a] p-10 md:p-14 text-center shadow-[0_20px_60px_rgba(167,139,250,0.04)]">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#a78bfa]/30 to-transparent" />
              <BookOpen className="mx-auto mb-5 h-8 w-8 text-[#a78bfa]" />
              <h2 className="mb-4 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Ce que contient un mandat Trouvable.</h2>
              <p className="mx-auto mb-8 max-w-lg text-[15px] leading-[1.65] text-[#888]">
                L&apos;exécution produit des résultats d&apos;ingénierie que nous documentons intégralement. Consultez la vue d&apos;un <strong className="text-white/80">Dossier Type</strong>.
              </p>
              <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                Consulter un dossier-type <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.04)_0%,transparent_60%)]" />
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative z-10 mx-auto max-w-[620px]">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                <ShieldCheck className="h-40 w-40 text-white" />
              </div>
              <div className="relative z-10">
                <div className="mb-6 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
                  <Lock className="h-5 w-5 text-[#888]" />
                </div>
                <h2 className="mb-5 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Accès direct à nos données stratégiques</h2>
                <p className="mb-8 text-[15px] leading-[1.65] text-[#888]">
                  Lors de notre premier entretien, un expert de la firme vous détaillera notre méthodologie en situation réelle. Nous vous montrerons de vrais déploiements techniques et comparerons anonymement la puissance de notre infrastructure.
                </p>
                <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                  Planifier un entretien diagnostic <ArrowRight className="h-4 w-4" />
                </ContactButton>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
