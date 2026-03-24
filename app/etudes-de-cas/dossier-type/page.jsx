"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ContactButton from "@/components/ContactButton";
import Link from "next/link";
import { ArrowRight, Lock, CheckCircle2, ChevronRight, FileSearch, ShieldCheck, AlertTriangle, Wrench } from "lucide-react";

const DEPLOYMENT_ITEMS = [
  { title: 'Injection Schema.org "Attorney" Local', desc: "Codage en JSON-LD de tous les champs essentiels pour aligner fiche Maps et entité web à 100\u00A0%." },
  { title: 'Création de la surcouche "llms.txt"', desc: "Un fichier brut optimisé pour les IA, décrivant l'expertise du cabinet en format Markdown RAG." },
  { title: "Alignement des Signaux de Confiance", desc: "Nettoyage des annuaires juridiques incohérents brouillant l'autorité du cabinet au niveau local." },
];

export default function DossierTypePage() {
  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#060606)]" />

      <main>
        <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[100px]">
          <div className="pointer-events-none absolute left-1/2 top-[-100px] z-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
          <div className="relative z-[1] mx-auto max-w-[860px]">
            <motion.nav initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex items-center gap-2 text-[12px] font-medium text-white/40">
              <Link href="/etudes-de-cas" className="transition-colors hover:text-white">Résultats</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#a0a0a0]">Dossier Type</span>
            </motion.nav>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.04 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium text-white/60">
              <Lock className="h-3.5 w-3.5" /> Données anonymisées pour confidentialité
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="text-[clamp(32px,5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
              Anatomie d&apos;un<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">Mandat d&apos;Exécution.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="max-w-[580px] text-[17px] leading-[1.65] text-[#a0a0a0]">
              Nos clients n&apos;achètent pas une promesse, ils acquièrent une ingénierie stricte. Voici exactement à quoi ressemble un dossier de déploiement avant, pendant et après notre intervention.
            </motion.p>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[900px] space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="overflow-hidden rounded-2xl border border-white/7 bg-[#0a0a0a]">
              <div className="flex items-center justify-between border-b border-white/5 bg-[#0d0d0d] px-8 py-5">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-white/50">
                  <FileSearch className="h-4 w-4" /> 1. Le Diagnostic
                </h2>
                <span className="rounded bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-red-400">Risque Critique</span>
              </div>
              <div className="p-8">
                <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                  Cabinet juridique montréalais générant du bouche-à-oreille, mais invisible sur les nouveaux algorithmes locaux.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="group relative overflow-hidden rounded-xl border border-red-500/10 bg-red-500/[0.02] p-5 transition-all hover:border-red-500/25 cursor-default">
                    <div className="absolute left-0 top-0 h-full w-1 bg-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-[12px] font-bold uppercase tracking-wide text-red-400">Faille SEO</span>
                    </div>
                    <ul className="space-y-2 text-[13px] text-[#888] group-hover:text-white/70 transition-colors">
                      <li>• Fiche d&apos;établissement non catégorisée correctement.</li>
                      <li>• Aucune donnée Schema.org pour confirmer l&apos;adresse à Google.</li>
                    </ul>
                  </div>
                  <div className="group relative overflow-hidden rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-5 transition-all hover:border-amber-500/25 cursor-default">
                    <div className="absolute left-0 top-0 h-full w-1 bg-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-[12px] font-bold uppercase tracking-wide text-amber-500">Faille IA</span>
                    </div>
                    <ul className="space-y-2 text-[13px] text-[#888] group-hover:text-white/70 transition-colors">
                      <li>• Sur 10 questions à ChatGPT, le cabinet n&apos;est jamais cité.</li>
                      <li>• Claude cite un concurrent mieux structuré.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="overflow-hidden rounded-2xl border border-white/7 bg-[#0a0a0a]">
              <div className="flex items-center justify-between border-b border-white/5 bg-[#0d0d0d] px-8 py-5">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-white/50">
                  <Wrench className="h-4 w-4" /> 2. Le Déploiement
                </h2>
                <span className="rounded bg-[#5b73ff]/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#5b73ff]">Ingénierie</span>
              </div>
              <div className="p-8 space-y-3">
                {DEPLOYMENT_ITEMS.map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }} className="group relative flex gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] cursor-default">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 rounded-r-full bg-emerald-500 opacity-0 transition-all group-hover:h-3/4 group-hover:opacity-100" />
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <div>
                      <div className="mb-1 text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">{item.title}</div>
                      <div className="text-[13px] leading-[1.65] text-[#888] group-hover:text-white/70 transition-colors">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-[#0a0a0a] shadow-[0_10px_40px_rgba(52,211,153,0.04)]">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-[#5b73ff] to-transparent" />
              <div className="p-8">
                <h2 className="mb-4 text-xl font-bold tracking-[-0.02em]">Ce que nous suivons mois par mois (Mois 3-6)</h2>
                <p className="mb-8 text-[14px] leading-[1.65] text-[#a0a0a0]">
                  Le suivi porte sur les dimensions qui créent de l&apos;impact financier pur.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Appels entrants (Maps)", desc: "Augmentation des clics vers le standard téléphonique.", accent: "#34d399" },
                    { label: "Cov. IA", desc: "Évolution des mentions par ChatGPT sur requêtes locales.", accent: "#a78bfa" },
                  ].map((item) => (
                    <div key={item.label} className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-white/15 cursor-default">
                      <div className="absolute left-0 top-0 h-full w-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: item.accent }} />
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors">{item.label}</div>
                      <div className="text-sm font-semibold text-white">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-white/5 pt-6">
                  <Link href="/notre-mesure" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#7b8fff] transition-colors hover:text-white">
                    Voir notre cadre de mesure <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.04)_0%,transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-[620px] text-center">
            <motion.h3 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-4 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Ouvrez un dossier avec nous.</motion.h3>
            <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }} className="mx-auto mb-8 max-w-md text-[15px] leading-[1.65] text-[#a0a0a0]">
              Le processus est invisible de l&apos;extérieur pour vos concurrents, et totalement pris en charge pour vous.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.14 }}>
              <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8] hover:shadow-[0_20px_60px_rgba(255,255,255,0.06)]">
                Demander un diagnostic initial <ArrowRight className="h-4 w-4" />
              </ContactButton>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
