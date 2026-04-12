"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Search,
  Wand2,
  GitMerge,
  Globe,
  MapPin,
  Target,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import ContactButton from "@/components/ContactButton";
import SiteFooter from "@/components/SiteFooter";
import Navbar from "@/components/Navbar";
import { VILLES, EXPERTISES } from "@/lib/data/geo-architecture";
import { TESTIMONIALS } from "@/lib/data/testimonials";

const SeoAnimationPanel = dynamic(() => import("@/components/SeoAnimationPanel"), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse rounded-xl bg-white/5" />,
});
const GeoAnimationPanel = dynamic(() => import("@/components/GeoAnimationPanel"), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse rounded-xl bg-white/5" />,
});

/* ---------- DATA ---------- */

const pipelineSteps = [
  { id: 0, icon: Globe, name: "Analyse de votre écosystème", output: "Contenus et traces extraits", done: "Écosystème mappé" },
  { id: 1, icon: Search, name: "Diagnostic des fondations SEO", output: "Lacunes techniques repérées", done: "Diagnostic SEO terminé" },
  { id: 2, icon: Wand2, name: "Évaluation de l'empreinte IA", output: "Points de blocage identifiés", done: "Évaluation GEO terminée" },
  { id: 3, icon: GitMerge, name: "Application sécurisée", output: "Correctifs déployés proprement", done: "Mise à jour effectuée" },
];

const mergeRows = [
  { label: "Description", type: "auto" },
  { label: "Adresse", type: "auto" },
  { label: "Activité", type: "auto" },
  { label: "Horaires", type: "suggest" },
  { label: "Services", type: "suggest" },
  { label: "Téléphone", type: "covered" },
  { label: "Création de FAQ", type: "review" },
];

/** Schéma pédagogique — lecture d’un mandat-type, sans livrable écran. */
const sideSlots = [
  { name: "Étape 1 : Cartographie", tone: "good", active: true },
  { name: "Étape 2 : Priorités Google", tone: "warn" },
  { name: "Étape 3 : Cohérence réponses IA", tone: "bad" },
  { name: "Étape 4 : Validation", tone: "good" },
  { name: "Étape 5 : Pilotage", tone: "violet" },
];

const MARKET_STATS = [
  {
    eyebrow: "Rupture",
    value: "−61 %",
    accent: "text-red-400",
    accentLine: "bg-red-400/80",
    title: "Le clic classique ne tient plus.",
    text: "AI Overviews absorbent la première page. Votre canal d\u2019acquisition principal se tarit.",
    source: "Seer Interactive",
    year: 2025,
    sourceUrl: "https://www.seerinteractive.com/news/seer-interactive-research-featured-in-inc.-analysis-of-ctr-and-ai-overviews",
  },
  {
    eyebrow: "Levier",
    splitStats: [
      { value: "+35 %", label: "clics organiques", accent: "text-emerald-400" },
      { value: "+91 %", label: "clics payants", accent: "text-emerald-300" },
    ],
    accentLine: "bg-emerald-400/80",
    title: "La citation IA multiplie les clics.",
    text: "Organique et payant : les marques citées captent un surplus mesurable sur les deux canaux.",
    source: "Seer Interactive",
    year: 2025,
    sourceUrl: "https://www.seerinteractive.com/news/seer-interactive-research-featured-in-inc.-analysis-of-ctr-and-ai-overviews",
  },
  {
    eyebrow: "Contrôle",
    value: "86 %",
    accent: "text-[#7b8fff]",
    accentLine: "bg-[#7b8fff]/80",
    title: "La source, c\u2019est vous.",
    text: "La majorité des citations IA viennent d\u2019actifs que vous contrôlez déjà. Ce n\u2019est pas aléatoire — c\u2019est actionnable.",
    source: "Yext Research",
    year: 2025,
    sourceUrl: "https://www.businesswire.com/news/home/20251009106549/en/Yext-Research-86-of-AI-Citations-Come-from-Brand-Managed-Sources-Clarifying-How-Marketers-Can-Compete-in-the-AI-Search-Era",
  },
];


const faqsData = [
  {
    q: "Dois-je gérer la technique et l'implémentation moi-même ?",
    a: "Absolument pas. Trouvable est un service 100\u00A0% fait pour vous. Notre équipe prend en charge le diagnostic, la création des contenus métier et leur mise en forme technique pour les moteurs — sans action de votre part.",
  },
  {
    q: "Quelle est la différence entre une agence SEO classique et vous ?",
    a: "Nous sommes une firme d'exécution sur mandat : Google local et recherche organique d'un côté, crédibilité et cohérence dans les réponses des grands modèles de l'autre. Nos contrôles internes accélèrent notre travail ; ce que vous achetez, ce sont des experts qui livrent des résultats concrets.",
  },
  {
    q: "Qu'est-ce que l'optimisation GEO apporte concrètement ?",
    a: "En SEO local, l'enjeu est d'apparaître sur Google. En GEO, le but est que les IA (ChatGPT, Claude) comprennent si bien votre entreprise qu'elles puissent plus facilement la comprendre et la citer en réponse aux internautes.",
  },
  {
    q: "Allez-vous modifier le code de mon site web existant ?",
    a: "Nous utilisons un processus strict pour ne jamais casser l'existant. Les intégrations techniques sont ajoutées proprement sans perturber votre infrastructure existante ni ralentir votre site.",
  },
  {
    q: "Je n'ai pas de site web, pouvez-vous quand même m'aider ?",
    a: "Oui. Nous pouvons bâtir une présence en ligne solide, lisible et autonome pour que les moteurs et IA saisissent parfaitement votre offre.",
  },
  {
    q: "Comment fonctionne la tarification de cet accompagnement ?",
    a: "Nous fonctionnons sur mesure selon l'envergure de votre marché et vos besoins réels. Vous payez pour une prestation effectuée par des humains experts. Contactez-nous pour échanger sur vos objectifs.",
  },
];

/* ---------- HELPERS ---------- */

function mergeTone(type) {
  if (type === "auto") return "text-emerald-300 border-emerald-400/15 bg-emerald-400/5";
  if (type === "suggest") return "text-blue-300 border-blue-400/15 bg-blue-400/5";
  if (type === "review") return "text-amber-300 border-amber-400/15 bg-amber-400/5";
  return "text-white/40 border-white/10 bg-white/[0.02]";
}

/* ---------- PIPELINE PREVIEW ---------- */

function PipelinePreview() {
  const [phase, setPhase] = useState(0);
  const totalPhases = 12;
  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => (p + 1) % totalPhases), 700);
    return () => window.clearInterval(id);
  }, []);

  const currentStep = Math.min(Math.floor(phase / 3), pipelineSteps.length - 1);
  const doneCount = Math.floor((phase + 1) / 3);

  return (
    <div className="relative mx-auto mt-14 w-full max-w-[1140px] rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_40px_100px_rgba(0,0,0,0.7)]">
      <p className="px-5 pt-4 text-center text-[11px] text-white/35">
        Schéma interne d&apos;illustration — lecture d&apos;un mandat-type (ce que nous faisons, pas un livrable écran).
      </p>
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.02] px-5 py-3">
        <div className="h-3 w-3 rounded-full bg-[#ff5f57] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#febc2e] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#28c840] opacity-80" />
        <div className="flex-1 text-center text-xs text-white/30">Feuille de route mandat &mdash; vue synthétique</div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{doneCount >= 4 ? "Phase bouclée ✓" : "Mandat actif"}</span>
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-[200px_1fr_190px] lg:grid-cols-[200px_1fr_190px] max-lg:grid-cols-1">
        {/* Left sidebar */}
        <div className="border-r border-white/8 px-0 py-4 max-lg:hidden">
          <div className="mb-4 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Étapes du mandat</div>
          {sideSlots.map((client) => (
            <div key={client.name} className={`flex items-center gap-2 px-4 py-2 text-xs transition ${client.active ? "border-l-2 border-blue-400 bg-blue-500/8 pl-3 text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white/80"}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${client.tone === "good" ? "bg-emerald-400" : client.tone === "warn" ? "bg-amber-400" : client.tone === "bad" ? "bg-red-400" : "bg-violet-400"}`} />
              <span className="flex-1 truncate">{client.name}</span>
              <span className={`h-1.5 w-6 rounded-full inline-block ${client.tone === "good" ? "bg-emerald-400/40" : client.tone === "warn" ? "bg-amber-400/40" : client.tone === "bad" ? "bg-red-400/40" : "bg-violet-400/40"}`} />
            </div>
          ))}
          <div className="mb-4 mt-6 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Livrables types</div>
          {["Synthèse direction", "Plan d'action", "Compte rendu périodique"].map((item) => (
            <div key={item} className="px-4 py-2 text-xs text-white/55 hover:bg-white/[0.03] hover:text-white/80">{item}</div>
          ))}
        </div>

        {/* Center pipeline */}
        <div className="px-5 py-5 md:px-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/30">Contrôle qualité mandat</div>
            <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold text-blue-300">
              {doneCount >= 4 ? "✓ Jalons validés" : "Exécution"}
            </div>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-white/40" aria-hidden>
              Illustration
            </span>
          </div>

          <div className="space-y-0">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const status = idx < currentStep ? "done" : idx === currentStep && doneCount < 4 ? "running" : idx < doneCount ? "done" : "idle";
              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    animate={{
                      opacity: status === "idle" ? 0.4 : 1,
                      borderColor: status === "running" ? "rgba(91,115,255,0.40)" : status === "done" ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.07)",
                      backgroundColor: status === "running" ? "rgba(91,115,255,0.05)" : status === "done" ? "rgba(34,197,94,0.02)" : "rgba(22,22,22,1)",
                    }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-[10px] border px-4 py-3"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 shrink-0 text-white/70" />
                      <span className={`flex-1 ${status === "idle" ? "text-white/45" : "text-white/90"}`}>{step.name}</span>
                      <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${status === "running" ? "bg-blue-400/15 text-blue-300" : status === "done" ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[0.04] text-white/30"}`}>
                        {status === "running" ? "Actif" : status === "done" ? step.done : "À venir"}
                      </span>
                    </div>
                    <motion.div animate={{ opacity: status === "done" ? 1 : 0, y: status === "done" ? 0 : 4 }} transition={{ duration: 0.3, delay: 0.08 }} className="mt-2 flex items-center gap-2 text-[11px] text-white/35">
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/35">Résultat</span>
                      {step.output}
                    </motion.div>
                  </motion.div>
                  {idx < pipelineSteps.length - 1 && (
                    <div className="flex h-6 items-center justify-center">
                      <motion.div animate={{ backgroundColor: idx < currentStep ? "rgba(34,197,94,0.35)" : idx === currentStep ? "rgba(91,115,255,0.5)" : "rgba(255,255,255,0.07)" }} className="relative h-full w-px">
                        <motion.div animate={{ backgroundColor: idx < currentStep ? "rgb(34 197 94)" : idx === currentStep ? "rgb(91 115 255)" : "#080808", borderColor: idx < currentStep ? "rgb(34 197 94)" : idx === currentStep ? "rgb(91 115 255)" : "rgba(255,255,255,0.13)" }} className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border" />
                      </motion.div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>


        </div>

        {/* Right sidebar merge */}
        <div className="border-l border-white/8 px-0 py-4 max-lg:hidden">
          <div className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white/25">{"🛡️"} Déploiement propre</div>
          <div className="space-y-0">
            {mergeRows.map((row, idx) => (
              <motion.div key={row.label} animate={{ opacity: phase >= idx + 7 ? 1 : 0, x: phase >= idx + 7 ? 0 : 8 }} className={`mx-0 flex items-center gap-2 border-b border-white/8 px-4 py-2 text-[11.5px] ${row.type === "auto" ? "text-emerald-300" : row.type === "suggest" ? "text-blue-300" : row.type === "review" ? "text-amber-300" : "text-white/45"}`}>
                <span>{row.type === "auto" ? "✅" : row.type === "suggest" ? "💡" : row.type === "review" ? "⚠️" : "🛡️"}</span>
                <span className="flex-1">{row.label}</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] ${mergeTone(row.type)}`}>
                  {row.type === "auto" ? "Conforme" : row.type === "suggest" ? "Proposé" : row.type === "review" ? "À valider" : "Couvert"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />
    </div>
  );
}

/* ---------- FAQ SECTION ---------- */

function FaqSection() {
  return (
    <div className="space-y-2">
      {faqsData.map((faq, idx) => (
        <details key={idx} className="group rounded-xl border border-white/8 bg-white/[0.02] transition hover:border-white/15 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90 outline-none">
            <span>{faq.q}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 text-[14px] leading-[1.7] text-[#a0a0a0]">
            <span>{faq.a}</span>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ---------- ANIMATIONS PÉDAGOGIQUES ---------- */

/* ---------- CYCLING HERO WORDS ---------- */

const HERO_PLATFORMS = [
  "Google Search",
  "Google AI Overviews",
  "ChatGPT",
  "Gemini",
  "Claude",
  "Perplexity",
  "Copilot",
  "Grok",
];

function CyclingWord() {
  const [index, setIndex] = useState(0);
  const longestLabel = HERO_PLATFORMS.reduce((a, b) => (a.length >= b.length ? a : b));

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % HERO_PLATFORMS.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block max-w-full align-baseline pb-[0.28em]" aria-live="polite" aria-atomic="true">
      {/* Réserve la largeur du libellé le plus long + interligne confortable pour descendantes (g, p, y…) */}
      <span className="invisible block whitespace-nowrap select-none leading-[1.28]" aria-hidden="true">
        {longestLabel}
      </span>
      <span className="absolute inset-0 overflow-hidden">
        {HERO_PLATFORMS.map((word, i) => (
          <motion.span
            key={word}
            className="absolute inset-x-0 top-0 flex h-full items-center justify-center bg-gradient-to-r from-[#5b73ff] to-[#a78bfa] bg-clip-text text-transparent will-change-transform whitespace-nowrap px-1 py-[0.06em] sm:px-0"
            initial={false}
            animate={{
              y: i === index ? 0 : i === (index - 1 + HERO_PLATFORMS.length) % HERO_PLATFORMS.length ? "-108%" : "108%",
              opacity: i === index ? 1 : 0,
              filter: i === index ? "blur(0px)" : "blur(5px)",
            }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function TrouvableLandingPage() {

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

      <Navbar />

      {/* HERO */}
      <section className="relative mt-[58px] overflow-hidden px-6 pb-0 pt-[72px] text-center">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_90%_55%_at_50%_0%,black_30%,transparent_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.10)_0%,transparent_62%)]" />

        <div className="relative z-[1] mx-auto flex w-full max-w-[860px] flex-col items-center">
          <h1 className="text-[clamp(36px,6vw,76px)] font-bold leading-[1.08] tracking-[-0.045em]">
            <span className="block text-white">Nous opérons votre visibilité sur</span>
            <span className="mt-2 block leading-[1.28] sm:mt-2.5">
              <CyclingWord />
            </span>
          </h1>

          <p className="mx-auto mb-9 mt-7 max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
            Votre visibilité organique locale, la cohérence de votre signal face aux moteurs de recherche et aux systèmes conversationnels, des livrables vérifiables. Vous déléguez, nous exécutons.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <ContactButton className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:-translate-y-px hover:bg-[#ccc]">
              Demander une cartographie
            </ContactButton>
            <Link href="/offres" className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-[#a0a0a0] transition hover:-translate-y-px hover:border-white/25 hover:text-white">Voir les mandats &rarr;</Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-white/40">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Exécution faite pour vous</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Interlocuteur unique</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Livrables vérifiables</span>
          </motion.div>
        </div>

        <div>
          <PipelinePreview />
        </div>
      </section>

      {/* PREUVE STRATÉGIQUE — SIGNAL MARCHÉ */}
      <section id="marche" className="scroll-mt-20 border-y border-white/[0.06] bg-[#09090b] px-6 py-24 sm:px-10 sm:py-32" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1000px' }}>
        <div className="mx-auto max-w-[1120px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-4 text-center text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#7b8fff]/70"
          >
            Signal marché
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mb-5 text-center text-[clamp(28px,3.6vw,44px)] font-bold tracking-[-0.04em]"
          >
            L&apos;IA redistribue vos clics.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mx-auto mb-16 max-w-xl text-center text-[15px] leading-[1.7] text-white/40"
          >
            Pas une prédiction. Trois données mesurées.
          </motion.p>
          <div className="grid gap-5 md:grid-cols-3">
            {MARKET_STATS.map((row, idx) => (
              <motion.div
                key={row.source + (row.value || row.eyebrow)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] p-8 sm:p-10"
              >
                {/* Accent top line */}
                <div className={`absolute inset-x-0 top-0 h-[2px] ${row.accentLine}`} />

                {/* Eyebrow */}
                <div className="mb-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                  {row.eyebrow}
                </div>

                {/* Dominant stat — split layout for dual metrics */}
                {row.splitStats ? (
                  <div className="mb-4 flex gap-8">
                    {row.splitStats.map((s) => (
                      <div key={s.label}>
                        <div className={`whitespace-nowrap text-[clamp(36px,4.5vw,48px)] font-extrabold leading-[0.95] tracking-[-0.04em] ${s.accent}`}>
                          {s.value}
                        </div>
                        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`mb-4 text-[clamp(44px,5.5vw,60px)] font-extrabold leading-[0.95] tracking-[-0.04em] ${row.accent}`}>
                    {row.value}
                  </div>
                )}

                {/* Hard-hitting headline */}
                <h3 className="mb-3 text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-white">
                  {row.title}
                </h3>

                {/* Short consequence line */}
                <p className="mb-8 text-[13.5px] leading-[1.6] text-white/45">
                  {row.text}
                </p>

                {/* Premium source — no default link styling */}
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/20 no-underline transition-colors duration-200 hover:text-white/40"
                >
                  <span>{row.source}, {row.year}</span>
                  <svg className="h-2.5 w-2.5 opacity-60" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5"><path d="M3 7l4-4M3 3h4v4" /></svg>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TROIS MANDATS — IMMERSIVE */}
      <section className="relative border-t border-b border-white/[0.08] px-6 py-28 sm:px-10 sm:py-36 overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}>
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_left,rgba(91,115,255,0.04),transparent_70%)]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_right,rgba(167,139,250,0.04),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
            Mandats d&apos;exécution
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-5 text-[clamp(28px,4vw,48px)] font-bold leading-[1.06] tracking-[-0.04em]">
            Trois niveaux d&apos;engagement.<br /><span className="bg-gradient-to-r from-white/50 to-white/20 bg-clip-text text-transparent">Choisissez votre entrée.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.14 }} className="mb-16 max-w-xl text-[15px] leading-relaxed text-[#888]">
            Cartographie pour décider. Implémentation pour livrer. Pilotage pour tenir la cadence.
          </motion.p>

          <div className="space-y-0">
            {[
              { num: "01", icon: Search, accent: "#5b73ff", title: "Cartographie stratégique", tagline: "Comprendre avant d'agir", hook: "Lecture croisée de vos signaux publics, scénarios de recherche, hiérarchisation des causes. Vous recevez une synthèse direction et un plan d'action priorisé.", bullets: ["Constat direction et priorités", "Plan d'action ordonné", "Critères de preuve clairs"], href: "/offres#cartographie-strategique", cta: "Demander une cartographie" },
              { num: "02", icon: ShieldCheck, accent: "#34d399", title: "Mandat d'implémentation", tagline: "Exécuter sans compromis", hook: "Nous déployons les corrections et enrichissements sur un périmètre défini. Vous validez les points sensibles, nous livrons des changements documentés.", bullets: ["Exécution clé en main", "Livrables tangibles et traçables", "Respect de l'existant"], href: "/offres#mandat-implementation", cta: "Lancer un mandat" },
              { num: "03", icon: TrendingUp, accent: "#a78bfa", title: "Pilotage continu", tagline: "Tenir la cadence", hook: "Un interlocuteur dédié : mesure selon notre cadre, ajustements contenu et signaux, compte rendu périodique et exécution dans le périmètre convenu.", bullets: ["Compte rendu et arbitrages", "Suivi Google et réponses IA", "Itérations fondées sur les faits"], href: "/offres#pilotage-continu", cta: "Parler d'un accompagnement" },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="group relative"
                >
                  {i > 0 && <div className="mx-auto h-px max-w-[90%] bg-gradient-to-r from-transparent via-white/8 to-transparent" />}
                  <div className="grid items-center gap-6 py-10 sm:py-14 lg:grid-cols-[80px_1fr_1fr] lg:gap-12">
                    <div className="hidden lg:block">
                      <span className="font-mono text-[clamp(48px,5vw,72px)] font-bold leading-none tracking-[-0.06em]" style={{ color: `${m.accent}20` }}>{m.num}</span>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <span className="font-mono text-[28px] font-bold leading-none tracking-[-0.04em] lg:hidden" style={{ color: `${m.accent}30` }}>{m.num}</span>
                        <div className="grid h-10 w-10 place-items-center rounded-xl border bg-white/[0.03] transition-colors group-hover:bg-white/[0.06]" style={{ borderColor: `${m.accent}25` }}>
                          <Icon className="h-4 w-4" style={{ color: m.accent }} />
                        </div>
                        <div>
                          <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-white">{m.title}</h3>
                          <span className="text-[12px] font-medium" style={{ color: `${m.accent}90` }}>{m.tagline}</span>
                        </div>
                      </div>
                      <p className="mt-4 text-[14px] leading-[1.65] text-[#a0a0a0] max-w-md">{m.hook}</p>
                    </div>
                    <div className="flex flex-col gap-4">
                      <ul className="space-y-2.5">
                        {m.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2.5 text-[13px] text-[#999]">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: `${m.accent}70` }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <ContactButton className="rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                          {m.cta}
                        </ContactButton>
                        <Link href={m.href} className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-white" style={{ color: `${m.accent}bb` }}>
                          Détails du mandat <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/offres" className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/12 px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-px hover:bg-white/10">
              Voir tous les mandats <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/methodologie" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-[#a0a0a0] transition hover:-translate-y-px hover:border-white/25 hover:text-white">
              Notre méthode d&apos;exécution
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CADRE DE MESURE & PREUVE */}
      <section className="border-b border-white/[0.08] px-6 py-24 sm:px-10 bg-[#0a0a0a]" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1000px' }}>
        <div className="mx-auto max-w-[1120px]">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff] flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Cadre de mesure
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.1 }} className="mb-6 text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">
                Nous rendons compte <br /><span className="text-[#666]">avec des repères vérifiables.</span>
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.2 }} className="text-[#a0a0a0] text-[15px] leading-relaxed mb-8 max-w-lg">
                Signaux publics, présence sur votre marché, indicateurs business : nous les dissocions pour éviter les confusions et les métriques de façade.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.3 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/notre-mesure" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5b73ff] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-blue-500 hover:shadow-[0_10px_30px_rgba(91,115,255,0.3)]">
                  Comment nous mesurons <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-white/[0.08]">
                  Vue d'un dossier-type
                </Link>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="relative rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#5b73ff]/40 to-transparent" />
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase text-white/40 tracking-wider mb-1">Lecture croisée</div>
                  <div className="text-xl font-bold text-white">Recommandation et cohérence</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#7b8fff]">
                  Suivi de mandat
                </div>
              </div>
              <div className="space-y-3 mt-6 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#888]">Scénarios grand public (ex. OpenAI)</span>
                  <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wider bg-blue-400/10 px-2 py-1 rounded">Contrôlé</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#888]">Autres modèles conversationnels</span>
                  <span className="text-orange-400 text-[10px] font-semibold uppercase tracking-wider bg-orange-400/10 px-2 py-1 rounded">Contrôlé</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#888]">Google (recherche &amp; aperçus)</span>
                  <span className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider bg-emerald-400/10 px-2 py-1 rounded">Contrôlé</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-t border-b border-white/[0.08] bg-[#0f0f0f] px-6 py-14 text-center sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/25">Rigueur de cabinet</div>
          <div className="mb-2 text-[clamp(20px,2.5vw,28px)] font-semibold tracking-[-0.03em]">Un responsable de dossier.<br className="max-sm:hidden" />Des contrôles internes exigeants derrière chaque livrable.</div>
          <div className="mx-auto mb-10 max-w-[560px] text-[15px] leading-[1.6] text-[#a0a0a0]">Vous traitez avec un interlocuteur unique. L&apos;exécution repose sur un protocole documenté, un cadre de mesure transparent et des livrables vérifiables — le travail est fait pour vous, sans charge opérationnelle de votre côté.</div>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 sm:gap-12">
            <div>
              <div className="text-[clamp(18px,5vw,36px)] font-bold tracking-[-0.04em] text-white">Cartographie</div>
              <div className="mt-1 text-[11px] text-white/30 sm:text-sm">Constat et priorités</div>
            </div>
            <div>
              <div className="text-[clamp(18px,5vw,36px)] font-bold tracking-[-0.04em] text-emerald-300">Exécution</div>
              <div className="mt-1 text-[11px] text-white/30 sm:text-sm">Périmètre cadré, livrables documentés</div>
            </div>
            <div>
              <div className="text-[clamp(18px,5vw,36px)] font-bold tracking-[-0.04em] text-white">Compte rendu</div>
              <div className="mt-1 text-[11px] text-white/30 sm:text-sm">Preuve, arbitrage, suites</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* TEMOIGNAGES — affiché uniquement quand des témoignages vérifiés sont disponibles */}
      {TESTIMONIALS.length > 0 && (
      <section className="border-b border-white/[0.08] bg-[#0b0b0b] px-6 py-16 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
        <div className="mx-auto max-w-[1120px]">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="mb-10 text-center">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30">Retours de mandats</div>
            <h2 className="text-[clamp(24px,3vw,34px)] font-semibold tracking-[-0.03em] text-white">Ce que nos clients en disent</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-[1.7] text-white/50">
              Témoignages anonymisés — les noms et chiffres restent confidentiels par engagement contractuel.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <p className="text-[15px] leading-[1.7] text-white/80">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-5 border-t border-white/8 pt-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/35">{item.sector}</div>
                  <div className="mt-1 text-sm text-white/65">{item.role}</div>
                  <div className="mt-2 inline-flex rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    {item.anonymizationLevel}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* PÉDAGOGIE : SEO CLASSIQUE VS VISIBILITÉ IA */}
      <section className="relative border-t border-white/7 bg-[#050505] px-6 py-32 sm:px-10 overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}>
        {/* Abstract background glows */}
        <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-[100px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#5b73ff]/[0.04] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-[1120px]">
          <div className="mb-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">
              Double contrainte
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mx-auto mb-6 max-w-3xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.05] tracking-[-0.04em]">
              Pourquoi être le premier sur Google <br className="max-sm:hidden" />
              <span className="text-[#666]">ne suffit plus aujourd&apos;hui.</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.16 }} className="mx-auto max-w-2xl text-[16px] leading-[1.65] text-[#a0a0a0]">
              Une entreprise peut avoir un excellent positionnement organique &ldquo;classique&rdquo;, mais être ignorée par les moteurs d&apos;intelligence artificielle car elle manque de clarté sémantique.
            </motion.p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Colonne 1 : SEO Classique (Bento 5 cols) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f0f0f] p-8 lg:col-span-5 hover:border-white/20 transition-colors shadow-none">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                <Search className="h-32 w-32 text-white" />
              </div>
              
              <div className="relative z-10 w-full mb-8">
                <SeoAnimationPanel />
              </div>

              <div className="relative z-10 mt-auto">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#a0a0a0]">
                  <Search className="h-3.5 w-3.5" /> La base technique
                </div>
                <h3 className="mb-2 text-2xl font-bold tracking-[-0.03em] text-white">SEO Classique</h3>
                <p className="mb-6 text-[15px] leading-[1.6] text-[#666]">L&apos;optimisation historique pour le moteur de recherche traditionnel.</p>
                
                <ul className="space-y-4 text-[14px] text-[#a0a0a0]">
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                    <span className="leading-[1.6]">Se concentre sur le <strong>positionnement Google</strong> classique.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                    <span className="leading-[1.6]">S&apos;appuie sur les mots-clés et les signaux bruts.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Colonne 2 : Visibilité IA (Bento 7 cols) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-[#5b73ff]/30 bg-gradient-to-br from-[#5b73ff]/[0.08] to-[#0f0f0f] p-8 lg:col-span-7 shadow-[0_0_80px_rgba(91,115,255,0.06)_inset]">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#5b73ff]/60 to-transparent opacity-50" />
              <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#5b73ff]/10 blur-[80px]" />
              
              <div className="relative z-10 w-full mb-8">
                <GeoAnimationPanel />
              </div>

              <div className="relative z-10 mt-auto">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#7b8fff]">
                  <Wand2 className="h-3.5 w-3.5" /> La nouvelle norme (GEO)
                </div>
                <h3 className="mb-2 text-2xl font-bold tracking-[-0.03em] text-white">Visibilité IA</h3>
                <p className="mb-6 text-[15px] leading-[1.6] text-[#a0a0a0]">La clarté attendue par les systèmes conversationnels — au-delà du seul classement Google.</p>
                
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <ul className="space-y-4 text-[14px] text-white/80">
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">Vise à être <strong>cité et recommandé</strong> comme une entité fiable.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">Objectif : être cité lorsque la question est précise et locale.</span>
                    </li>
                  </ul>
                  <ul className="space-y-4 text-[14px] text-white/80">
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">Exige une <strong>cohérence sémantique absolue</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">S&apos;appuie sur des formats techniques conformes aux attentes des moteurs.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mini exemple anonymisé (Bento Full Width) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 lg:p-12 relative shadow-none">
             <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(34,197,94,0.05),transparent)] pointer-events-none" />
             
             <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between mb-10">
               <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                    Mise en situation
                  </div>
                  <h3 className="text-[22px] font-bold text-white tracking-[-0.03em]">Exemple : Cabinet de Services </h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-[#666] max-w-lg">
                    Découvrez concrètement l&apos;impact d&apos;une restructuration sémantique de vos données sur les réponses des moteurs IA.
                  </p>
               </div>
               <Link href="/etudes-de-cas/dossier-type" className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 py-3.5 text-[14px] font-semibold text-black transition hover:bg-[#e0e0e0] shrink-0">
                 Voir le dossier de référence <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
               </Link>
             </div>

             <div className="relative z-10 grid gap-4 lg:grid-cols-2">
               {/* Avant */}
              <div className="group rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6 transition-all duration-300 hover:border-red-500/35 hover:bg-red-500/[0.06] lg:p-8">
                 <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/12 transition-colors duration-300 group-hover:bg-red-500/20">
                    <div className="h-2 w-2 rounded-full bg-red-400/80 transition-colors duration-300 group-hover:bg-red-500" />
                   </div>
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-red-300 transition-colors duration-300 group-hover:text-red-200">Avant intégration</div>
                 </div>
                <ul className="space-y-4 text-[14px] text-[#b8b8b8] transition-colors duration-300 group-hover:text-[#e1e1e1]">
                  <li className="flex items-start gap-3"><span className="mt-0.5 text-red-400/70 transition-colors duration-300 group-hover:text-red-300">✕</span> <span className="leading-[1.6]">L&apos;entreprise est mal identifiée par ChatGPT et Gemini.</span></li>
                  <li className="flex items-start gap-3"><span className="mt-0.5 text-red-400/70 transition-colors duration-300 group-hover:text-red-300">✕</span> <span className="leading-[1.6]">Les spécialités et zones d&apos;intervention sont floues.</span></li>
                  <li className="flex items-start gap-3"><span className="mt-0.5 text-red-400/70 transition-colors duration-300 group-hover:text-red-300">✕</span> <span className="leading-[1.6]">L&apos;IA recommande plutôt les annuaires ou vos concurrents.</span></li>
                 </ul>
               </div>

               {/* Après */}
              <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 transition-all duration-300 hover:border-emerald-500/35 hover:bg-emerald-500/[0.06] hover:shadow-[0_0_30px_rgba(34,197,94,0.06)_inset] lg:p-8">
                 <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 transition-all duration-300 group-hover:bg-emerald-500/22 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 transition-colors duration-300 group-hover:text-emerald-200" />
                   </div>
                  <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-emerald-300 transition-colors duration-300 group-hover:text-emerald-200">Après l&apos;intervention Trouvable</div>
                 </div>
                <ul className="space-y-4 text-[14px] text-[#b8b8b8] transition-colors duration-300 group-hover:text-[#e1e1e1]">
                  <li className="flex items-start gap-3"><span className="mt-0.5 text-emerald-400/75 transition-colors duration-300 group-hover:text-emerald-300">✓</span> <span className="leading-[1.6]">L&apos;activité est lue clairement grâce à l&apos;injection de données sémantiques.</span></li>
                  <li className="flex items-start gap-3"><span className="mt-0.5 text-emerald-400/75 transition-colors duration-300 group-hover:text-emerald-300">✓</span> <span className="leading-[1.6]">FAQ métier et attributs locaux alignés sur les formats attendus par les moteurs.</span></li>
                  <li className="flex items-start gap-3 transition-colors duration-300 group-hover:text-white"><span className="mt-0.5 text-emerald-400/75 transition-colors duration-300 group-hover:text-emerald-200">✓</span> <span className="leading-[1.6]">L&apos;entreprise gagne en <strong>crédibilité</strong> lorsque les réponses résument le marché.</span></li>
                 </ul>
               </div>
             </div>
          </motion.div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-t border-white/7 px-6 py-28 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 500px' }}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-[700px] text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]">Prochaine étape</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.06 }} className="mb-5 text-[clamp(26px,4vw,44px)] font-bold leading-[1.06] tracking-[-0.04em]">
            Un appel de cadrage.<br /><span className="bg-gradient-to-r from-white/50 to-white/25 bg-clip-text text-transparent">Zéro engagement.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.14 }} className="mx-auto mb-10 max-w-lg text-[16px] leading-[1.65] text-[#a0a0a0]">
            Nous identifions le mandat adapté, le périmètre et le rythme — avant tout engagement. Chaque mandat est unique, nous cadrons le vôtre.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8] hover:shadow-[0_20px_60px_rgba(255,255,255,0.06)]">
              Planifier un appel de cadrage <ArrowRight className="h-4 w-4" />
            </ContactButton>
            <Link href="/offres" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-8 py-4 text-[15px] font-medium text-[#a0a0a0] transition hover:border-white/25 hover:text-white">
              Voir les mandats
            </Link>
          </motion.div>
        </div>
      </section>

      {/* EXPERTISES & VILLES */}
      <section id="expertises" className="scroll-mt-20 border-t border-white/7 bg-[#0a0a0a] px-6 py-28 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}>
        <div className="mx-auto max-w-[1120px]">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">Couverture complète</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-5 text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">Nos expertises et <span className="text-[#666]">marchés locaux</span></motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.12 }} className="mb-14 max-w-2xl text-[15px] leading-relaxed text-[#888]">
            Des mandats adaptés à chaque secteur et chaque territoire. Nous opérons pour des firmes de services professionnels dont la confiance et la réputation locale sont déterminantes.
          </motion.p>

          <div className="grid gap-8 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-[#5b73ff]/30 to-transparent" />
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10 text-[#7b8fff]"><Target className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">Nos expertises</h3>
              </div>
              <ul className="space-y-1">
                {EXPERTISES.map((exp) => (
                  <li key={exp.slug}>
                    <Link href={`/expertises/${exp.slug}`} className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] text-white/55 transition-all hover:text-white hover:bg-white/[0.03]">
                      <span>{exp.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white/15 transition-all group-hover:translate-x-1 group-hover:text-[#7b8fff]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div id="marches-locaux" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-emerald-400/30 to-transparent" />
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400"><MapPin className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">Marchés locaux &mdash; Québec</h3>
              </div>
              <ul className="space-y-1">
                {VILLES.map((ville) => (
                  <li key={ville.slug}>
                    <Link href={`/villes/${ville.slug}`} className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] text-white/55 transition-all hover:text-white hover:bg-white/[0.03]">
                      <span>Visibilité Google et IA — {ville.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white/15 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-white/7 px-6 py-24 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
        <div className="mx-auto max-w-[720px]">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">Questions fréquentes</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-10 text-center text-[clamp(30px,3.5vw,44px)] font-bold leading-[1.1] tracking-[-0.04em]">Tout ce que vous devez savoir</motion.h2>
          <FaqSection />
          <div className="mt-10 text-center">
            <p className="mb-3 text-sm text-[#9a9a9a]">Vous avez d&apos;autres questions ?</p>
            <ContactButton className="inline-flex items-center gap-2 rounded-lg border border-[#7b8fff]/40 bg-[#7b8fff]/10 px-3 py-1.5 text-sm font-medium text-[#b8c5ff] transition hover:border-[#9fb0ff] hover:bg-[#7b8fff]/16 hover:text-white">
              Contactez notre équipe <ArrowRight className="h-3.5 w-3.5" />
            </ContactButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter showCta={false} />
    </main>
  );
}