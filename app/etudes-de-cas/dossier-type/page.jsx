"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ContactButton from "@/components/ContactButton";
import Link from "next/link";
import { ArrowRight, Lock, CheckCircle2, ChevronRight, FileSearch, ShieldCheck, AlertTriangle, Wrench, BarChart3, ChevronDown, Eye } from "lucide-react";

const PHASES = [
  {
    id: "diagnostic",
    num: "01",
    label: "Diagnostic",
    icon: FileSearch,
    status: { text: "Risque Critique", color: "#ef4444" },
    accent: "#ef4444",
    intro: "Cabinet juridique montréalais générant du bouche-à-oreille, mais invisible sur les nouveaux algorithmes locaux.",
    findings: [
      { type: "SEO", severity: "Critique", items: ["Fiche d'établissement non catégorisée correctement", "Aucune donnée Schema.org pour confirmer l'adresse à Google", "NAP incohérent sur 6 annuaires majeurs"] },
      { type: "IA", severity: "Critique", items: ["Sur 10 questions à ChatGPT, le cabinet n'est jamais cité", "Claude cite un concurrent mieux structuré", "Aucun fichier llms.txt disponible"] },
    ],
  },
  {
    id: "deploiement",
    num: "02",
    label: "Déploiement",
    icon: Wrench,
    status: { text: "Ingénierie", color: "#5b73ff" },
    accent: "#5b73ff",
    intro: "Intervention technique complète sur tous les signaux : balisage structuré, couche IA, nettoyage d'autorité.",
    actions: [
      { title: 'Injection Schema.org "Attorney" Local', desc: "Codage en JSON-LD de tous les champs essentiels pour aligner fiche Maps et entité web à 100\u00A0%.", done: true },
      { title: 'Création de la surcouche "llms.txt"', desc: "Fichier brut optimisé pour les IA, décrivant l'expertise du cabinet en format Markdown RAG.", done: true },
      { title: "Alignement des Signaux de Confiance", desc: "Nettoyage des annuaires juridiques incohérents brouillant l'autorité locale.", done: true },
      { title: "Enrichissement sémantique FAQ métier", desc: "Contenus structurés répondant aux requêtes conversationnelles de l'écosystème juridique.", done: true },
    ],
  },
  {
    id: "suivi",
    num: "03",
    label: "Suivi (Mois 3-6)",
    icon: BarChart3,
    status: { text: "Actif", color: "#34d399" },
    accent: "#34d399",
    intro: "Le suivi porte sur les dimensions qui créent de l'impact financier pur.",
    metrics: [
      { label: "Appels entrants (Maps)", value: "Augmentation des clics vers le standard", trend: "up" },
      { label: "Couverture IA", value: "Mentions par ChatGPT sur requêtes locales", trend: "up" },
      { label: "Position Map Pack", value: "Suivi hebdomadaire par code postal", trend: "stable" },
      { label: "Cohérence NAP", value: "Alignement 100\u00A0% maintenu", trend: "up" },
    ],
  },
];

function PhaseNav({ active, onSelect }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-3">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        return (
          <button key={p.id} onClick={() => onSelect(i)} className={`group relative flex items-center gap-2.5 rounded-xl px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-all ${i === active ? "text-white" : "text-white/30 hover:text-white/60"}`}>
            {i === active && <motion.div layoutId="phaseTab" className="absolute inset-0 rounded-xl border bg-white/[0.05]" style={{ borderColor: `${p.accent}30` }} transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
            <Icon className="relative z-10 h-4 w-4" style={{ color: i === active ? p.accent : undefined }} />
            <span className="relative z-10">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DossierTypePage() {
  const [activePhase, setActivePhase] = useState(0);
  const phase = PHASES[activePhase];
  const Icon = phase.icon;

  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#050505)]" />

      <main>
        <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-6 sm:pt-[100px]">
          <div className="pointer-events-none absolute left-1/2 top-[-100px] z-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
          <div className="relative z-[1] mx-auto max-w-[900px]">
            <motion.nav initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex items-center gap-2 text-[12px] font-medium text-white/40">
              <Link href="/etudes-de-cas" className="transition-colors hover:text-white">Résultats</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#a0a0a0]">Dossier Type</span>
            </motion.nav>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.04 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium text-white/60">
              <Lock className="h-3.5 w-3.5" /> Données anonymisées
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="text-[clamp(32px,5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
              Anatomie d&apos;un<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">Mandat d&apos;Exécution.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="max-w-[560px] text-[17px] leading-[1.65] text-[#a0a0a0]">
              Diagnostic, déploiement, suivi : naviguez dans les trois phases d&apos;un vrai dossier. Chaque livrable est documenté.
            </motion.p>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[960px]">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <PhaseNav active={activePhase} onSelect={setActivePhase} />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={activePhase} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="mt-8">
                <div className="overflow-hidden rounded-2xl border border-white/7 bg-[#0a0a0a]">
                  <div className="flex items-center justify-between border-b border-white/5 bg-[#0d0d0d] px-6 py-4 sm:px-8 sm:py-5">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" style={{ color: phase.accent }} />
                      <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-white/50">Phase {phase.num} — {phase.label}</h2>
                    </div>
                    <span className="rounded px-2.5 py-1 text-[10px] font-bold uppercase" style={{ backgroundColor: `${phase.accent}15`, color: phase.accent }}>{phase.status.text}</span>
                  </div>

                  <div className="p-6 sm:p-8">
                    <p className="mb-8 text-[14px] leading-[1.65] text-[#a0a0a0]">{phase.intro}</p>

                    {phase.findings && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {phase.findings.map((f) => (
                          <div key={f.type} className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:border-red-500/20 cursor-default">
                            <div className="absolute left-0 top-0 h-full w-1 bg-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <span className="text-[11px] font-bold uppercase tracking-wide text-red-400">Faille {f.type}</span>
                              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400">{f.severity}</span>
                            </div>
                            <ul className="space-y-2 text-[13px] text-[#888] group-hover:text-white/70 transition-colors">
                              {f.items.map((item) => <li key={item} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-400" />{item}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {phase.actions && (
                      <div className="space-y-3">
                        {phase.actions.map((a, i) => (
                          <motion.div key={a.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.3 }} className="group flex gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] cursor-default">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            <div className="flex-1">
                              <div className="mb-1 text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">{a.title}</div>
                              <div className="text-[13px] leading-[1.65] text-[#888] group-hover:text-white/70 transition-colors">{a.desc}</div>
                            </div>
                            <span className="self-start rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">LIVRÉ</span>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {phase.metrics && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {phase.metrics.map((m, i) => (
                          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.3 }} className="group relative overflow-hidden rounded-xl border border-white/6 bg-white/[0.02] p-5 transition-all hover:border-emerald-500/20 cursor-default">
                            <div className="absolute right-3 top-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                            </div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-400/60">{m.label}</div>
                            <div className="text-[14px] font-semibold text-white/90">{m.value}</div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {activePhase === 2 && (
                  <div className="mt-6 border-t border-white/5 pt-6">
                    <Link href="/notre-mesure" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#7b8fff] transition-colors hover:text-white">
                      Voir notre cadre de mesure complet <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.04)_0%,transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-[620px] text-center">
            <motion.h3 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-4 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Ouvrez un dossier avec nous.</motion.h3>
            <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }} className="mx-auto mb-8 max-w-md text-[15px] leading-[1.65] text-[#a0a0a0]">
              Le processus est invisible pour vos concurrents, et totalement pris en charge pour vous.
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
