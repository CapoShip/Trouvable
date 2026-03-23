"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Search,
  Wand2,
  GitMerge,
  Globe,
  Play,
  MapPin,
  Mail,
  Phone,
  Target,
  Menu,
  X,
} from "lucide-react";

import { SITE_CONTACT_EMAIL as CONTACT_EMAIL, SITE_PHONE_DISPLAY as CONTACT_PHONE_DISPLAY, SITE_PHONE_TEL as CONTACT_PHONE_TEL } from '@/lib/site-contact';
import ContactButton from "@/components/ContactButton";
import SiteFooter from "@/components/SiteFooter";
import Navbar from "@/components/Navbar";
import { VILLES, EXPERTISES } from "@/lib/data/geo-architecture";

/* ---------- DATA ---------- */

const heroWords = [
  "Google Search",
  "ChatGPT",
  "Perplexity AI",
  "Gemini",
  "Claude AI",
  "Grok",
  "Microsoft Copilot",
  "Google AI Overviews",
];



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

/** Libellés génériques — illustration d’interface uniquement. */
const sideSlots = [
  { name: "Phase 1 : Analyse initiale", tone: "good", active: true },
  { name: "Phase 2 : Priorités SEO", tone: "warn" },
  { name: "Phase 3 : Enrichissement GEO", tone: "bad" },
  { name: "Phase 4 : Validation stricte", tone: "good" },
  { name: "Phase 5 : Suivi continu", tone: "violet" },
];

const MARKET_STATS = [
  {
    value: "80%",
    text: "80% des utilisateurs de recherche s’appuient déjà sur des résumés IA.",
    source: "Bain & Company",
  },
  {
    value: "60%",
    text: "60% des recherches se terminent sans clic vers un site.",
    source: "Bain & Company",
  },
  {
    value: "+1 300%",
    text: "+1 300% de croissance du trafic issu de l’IA générative vers les sites retail.",
    source: "Adobe Digital Insights",
  },
];


const faqsData = [
  {
    q: "Dois-je gérer la technique et l'implémentation moi-même ?",
    a: "Absolument pas. Trouvable est un service 100% fait pour vous. Notre équipe prend en charge la détection des vulnérabilités SEO/GEO, la création des contenus (FAQ, données structurées) et leur intégration sans action de votre part.",
  },
  {
    q: "Quelle est la différence entre une agence SEO classique et vous ?",
    a: "Notre méthodologie est soutenue par notre propre technologie interne. Cela nous permet d'auditer et d'optimiser non seulement pour Google (SEO standard), mais aussi pour les exigences de l'IA (GEO), avec une méthode plus rigoureuse et spécialisée.",
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

function CyclingWord({ words, className = "" }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((v) => (v + 1) % words.length), 2100);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <div className={`relative h-[1.08em] overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 42, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -42, opacity: 0 }}
          transition={{ duration: 0.48, ease: [0.77, 0, 0.18, 1] }}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap bg-gradient-to-b from-white to-white/45 bg-clip-text text-transparent"
        >
          {words[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function tonePill(tone) {
  if (tone === "good") return "bg-emerald-400/10 text-emerald-300 border-emerald-400/15";
  if (tone === "warn") return "bg-amber-400/10 text-amber-300 border-amber-400/15";
  if (tone === "bad") return "bg-red-400/10 text-red-300 border-red-400/15";
  return "bg-violet-400/10 text-violet-300 border-violet-400/15";
}

function mergeTone(type) {
  if (type === "auto") return "text-emerald-300 border-emerald-400/15 bg-emerald-400/5";
  if (type === "suggest") return "text-blue-300 border-blue-400/15 bg-blue-400/5";
  if (type === "review") return "text-amber-300 border-amber-400/15 bg-amber-400/5";
  return "text-white/40 border-white/10 bg-white/[0.02]";
}

function useCycleClock(cycleMs, tickMs = 40) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const dt = (Date.now() - startedAt) % cycleMs;
      setElapsed(dt);
    }, tickMs);
    return () => window.clearInterval(id);
  }, [cycleMs, tickMs]);

  return elapsed;
}

function getTypedSlice(text, elapsed, startMs, typeDurationMs) {
  if (elapsed < startMs) return "";
  if (elapsed >= startMs + typeDurationMs) return text;
  const progress = (elapsed - startMs) / typeDurationMs;
  const chars = Math.max(0, Math.floor(progress * text.length));
  return text.slice(0, chars);
}

function inWindow(elapsed, startMs, endMs) {
  return elapsed >= startMs && elapsed < endMs;
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
  const seoProgress = phase >= 8 ? 100 : 0;
  const geoProgress = phase >= 9 ? 100 : 0;

  return (
    <div className="relative mx-auto mt-14 w-full max-w-[1140px] rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_40px_100px_rgba(0,0,0,0.7)]">
      <p className="px-5 pt-4 text-center text-[11px] text-white/35">
        La méthode de travail de notre équipe dédiée — notre processus interne pour garantir votre visibilité.
      </p>
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.02] px-5 py-3">
        <div className="h-3 w-3 rounded-full bg-[#ff5f57] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#febc2e] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#28c840] opacity-80" />
        <div className="flex-1 text-center text-xs text-white/30">Méthode Trouvable &mdash; Analyse</div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{doneCount >= 4 ? "Terminé ✓" : "En cours..."}</span>
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-[200px_1fr_190px] lg:grid-cols-[200px_1fr_190px] max-lg:grid-cols-1">
        {/* Left sidebar */}
        <div className="border-r border-white/8 px-0 py-4 max-lg:hidden">
          <div className="mb-4 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Phases du projet</div>
          {sideSlots.map((client) => (
            <div key={client.name} className={`flex items-center gap-2 px-4 py-2 text-xs transition ${client.active ? "border-l-2 border-blue-400 bg-blue-500/8 pl-3 text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white/80"}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${client.tone === "good" ? "bg-emerald-400" : client.tone === "warn" ? "bg-amber-400" : client.tone === "bad" ? "bg-red-400" : "bg-violet-400"}`} />
              <span className="flex-1 truncate">{client.name}</span>
              <span className={`h-1.5 w-6 rounded-full inline-block ${client.tone === "good" ? "bg-emerald-400/40" : client.tone === "warn" ? "bg-amber-400/40" : client.tone === "bad" ? "bg-red-400/40" : "bg-violet-400/40"}`} />
            </div>
          ))}
          <div className="mb-4 mt-6 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Livrables</div>
          {["Rapport d'audit", "Plan d'action", "Suivi mensuel"].map((item) => (
            <div key={item} className="px-4 py-2 text-xs text-white/55 hover:bg-white/[0.03] hover:text-white/80">{item}</div>
          ))}
        </div>

        {/* Center pipeline */}
        <div className="px-5 py-5 md:px-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/30">Exécution du diagnostic</div>
            <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold text-blue-300">
              {doneCount >= 4 ? "✓ Terminé" : "⚡ En cours"}
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-[#5b73ff] px-3 py-1.5 text-xs font-medium text-white transition hover:-translate-y-px hover:opacity-90">
              <Play className="h-3.5 w-3.5" /> Actualiser
            </button>
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
                        {status === "running" ? "En cours" : status === "done" ? step.done : "En attente"}
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
                  {row.type === "auto" ? "Auto" : row.type === "suggest" ? "Suggéré" : row.type === "review" ? "Réviser" : "Couvert"}
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
    <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
      {faqsData.map((faq, idx) => (
        <details key={idx} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="group rounded-xl border border-white/8 bg-white/[0.02] transition hover:border-white/15 [&_summary::-webkit-details-marker]:hidden">
          <summary itemProp="name" className="flex cursor-pointer w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90 outline-none">
            <span>{faq.q}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180" />
          </summary>
          <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="px-5 pb-5 text-[14px] leading-[1.7] text-[#a0a0a0]">
            <span itemProp="text">{faq.a}</span>
          </div>
        </details>
      ))}
    </div>
  );
}

/* ---------- ANIMATIONS PÉDAGOGIQUES ---------- */

function SeoAnimation() {
  const cycleMs = 8400;
  const elapsed = useCycleClock(cycleMs);
  const typedSeoQuery = getTypedSlice(
    "Meilleur expert SEO Quebec",
    elapsed,
    250,
    1850
  );
  const showCaret = inWindow(elapsed, 250, 2400);
  const showMainResult = inWindow(elapsed, 1850, 7000);
  const showSkeletonResult = inWindow(elapsed, 2650, 7600);

  return (
    <div className="relative mb-8 flex h-[320px] w-full flex-col overflow-hidden border border-white/[0.04] bg-[#202124] p-5 shadow-inner" style={{ borderRadius: '1.5rem', fontFamily: "Arial, sans-serif" }}>
       
       <div className="flex w-full items-center gap-3 mb-6 mt-1 px-1">
         <div className="text-[22px] font-bold tracking-tighter flex items-center">
           <span className="text-[#4285F4]">G</span>
           <span className="text-[#EA4335]">o</span>
           <span className="text-[#FBBC05]">o</span>
           <span className="text-[#4285F4]">g</span>
           <span className="text-[#34A853]">l</span>
           <span className="text-[#EA4335]">e</span>
         </div>
         <div className="flex h-10 w-full flex-1 items-center rounded-full border border-[#5f6368] bg-[#202124] px-4 shadow-[0_1px_6px_rgba(32,33,36,0.28)]">
            <div className="overflow-hidden whitespace-nowrap text-[13px] text-[#e8eaed] font-normal">
              {typedSeoQuery}
              {showCaret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
            </div>
            <div className="ml-auto pl-2 flex items-center text-[#8ab4f8]">
              <Search className="h-4 w-4" />
            </div>
         </div>
       </div>

       <div className="px-2 flex flex-col gap-6">
         {/* Resultat 1 - Trouvable */}
         <motion.div
           initial={false}
           animate={{ opacity: showMainResult ? 1 : 0, y: showMainResult ? 0 : 8 }}
           transition={{ duration: 0.35, ease: "easeOut" }}
         >
           <Link 
             href="https://trouvable.app" 
             target="_blank" 
             className="relative z-50 group pointer-events-auto"
           >
             <div className="flex items-center gap-3 text-[12px] text-[#bdc1c6] mb-1.5">
               <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#303134] overflow-hidden">
                 <Image
                   src="/logos/trouvable_logo_blanc1.png"
                   alt="Trouvable"
                   width={14}
                   height={14}
                   sizes="14px"
                   className="h-[14px] w-[14px] object-contain opacity-90"
                 />
               </div>
               <div className="flex flex-col leading-[1.2]">
                 <span className="font-normal text-[#dadce0]">Trouvable</span>
                 <span className="text-[#bdc1c6]">https://trouvable.app</span>
               </div>
             </div>
             <div className="text-[17.5px] font-normal text-[#8ab4f8] group-hover:underline cursor-pointer leading-[1.25] mb-1.5">
               Trouvable : L&apos;expert de votre visibilité SEO & IA
             </div>
             <div className="text-[13px] text-[#bdc1c6] leading-[1.58] line-clamp-2">
               Nous structurons vos données sémantiques pour vous rendre incontournable auprès des moteurs classiques et génératifs.
             </div>
           </Link>
         </motion.div>

         {/* Resultat 2 */}
         <motion.div
           initial={false}
           animate={{ opacity: showSkeletonResult ? 1 : 0, y: showSkeletonResult ? 0 : 10 }}
           transition={{ duration: 0.35, ease: "easeOut" }}
         >
           <div className="flex items-center gap-3 mb-2">
             <div className="h-7 w-7 rounded-full bg-[#303134]" />
             <div className="flex flex-col gap-1.5 w-32">
               <div className="h-1.5 w-16 bg-[#303134] rounded-sm" />
               <div className="h-1.5 w-24 bg-[#303134] rounded-sm" />
             </div>
           </div>
           <div className="h-3 w-64 bg-[#3c4043] rounded-sm mb-2" />
           <div className="h-2 w-full bg-[#303134] rounded-sm mb-1.5" />
           <div className="h-2 w-4/5 bg-[#303134] rounded-sm" />
         </motion.div>
       </div>
    </div>
  );
}

function GeoAnimation() {
  const cycleMs = 12000;
  const elapsed = useCycleClock(cycleMs);

  const typedUserQuestion = getTypedSlice(
    "Meilleur expert en visibilite IA ?",
    elapsed,
    250,
    1900
  );
  const typedResponseLine1 = getTypedSlice(
    "Pour une visibilite maximale sur les IA, Trouvable est la reference.",
    elapsed,
    4300,
    2600
  );
  const typedResponseLine2 = getTypedSlice(
    "Expert en optimisation GEO et structures de donnees semantiques.",
    elapsed,
    7100,
    2300
  );

  const showUserBubble = inWindow(elapsed, 150, 10500);
  const showUserCaret = inWindow(elapsed, 250, 2150);
  const showResponse = inWindow(elapsed, 2500, 11400);
  const showThinking = inWindow(elapsed, 2500, 3850);
  const showLine1Caret = inWindow(elapsed, 4300, 6900);
  const showLine2Caret = inWindow(elapsed, 7100, 9400);
  const showSource = inWindow(elapsed, 9700, 11200);

  return (
    <div className="relative mb-8 flex h-[320px] w-full flex-col overflow-hidden border border-white/[0.04] bg-[#212121] p-5 shadow-inner" style={{ borderRadius: '1.5rem', fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}>
       {/* Top Bar ChatGPT */}
       <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
         <div className="text-[14px] font-medium text-[#ececec] pl-1">ChatGPT</div>
       </div>

       <div className="flex flex-col gap-6 w-full flex-1">
        
         {/* User Bubble with Typing Effect */}
         <motion.div
           initial={false}
           animate={{
             opacity: showUserBubble ? 1 : 0,
             y: showUserBubble ? 0 : 6,
           }}
           transition={{ duration: 0.35, ease: "easeOut" }}
           className="self-end max-w-[90%] rounded-[20px] bg-[#2f2f2f] px-4 py-3 text-[14px] leading-[1.5] text-[#ececec] flex items-center shadow-sm"
         >
          <div className="overflow-hidden whitespace-nowrap">
            {typedUserQuestion}
            {showUserCaret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
          </div>
         </motion.div>
        
         {/* ChatGPT Response Container */}
         <motion.div
           initial={false}
           animate={{ opacity: showResponse ? 1 : 0, y: showResponse ? 0 : 6 }}
           transition={{ duration: 0.35, ease: "easeOut" }}
           className="flex flex-col w-full px-1"
         >
           <div className="flex flex-col w-full pt-1 relative min-h-[140px]">
            
             {/* AI Thinking Dot */}
             {showThinking && (
               <motion.div
                 initial={{ opacity: 0.15, scale: 0.9 }}
                 animate={{ opacity: [0.15, 1, 0.2, 1, 0.15], scale: [0.9, 1.08, 0.92, 1.06, 0.9] }}
                 transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute top-1 left-0 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.95)]"
               />
             )}

             {/* Response Content (Typing effect) */}
             <div className="flex flex-col overflow-hidden">
               {/* Line 1 */}
              <div className="text-[15px] leading-[1.6] text-[#ececec] overflow-hidden whitespace-nowrap">
                {typedResponseLine1}
                {showLine1Caret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
              </div>
              
               {/* Line 2 */}
              <div className="text-[15px] leading-[1.6] text-[#ececec] mt-3 overflow-hidden whitespace-nowrap">
                {typedResponseLine2}
                {showLine2Caret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
              </div>
             </div>
            
             {/* Source Chip (Appears only AFTER Line 2 is visible) */}
             <motion.a
               href="https://trouvable.app" target="_blank" rel="noopener noreferrer"
               initial={false}
               animate={{
                 opacity: showSource ? 1 : 0,
                 scale: showSource ? 1 : 0.92,
                 y: showSource ? 0 : 4,
               }}
               transition={{ duration: 0.25, ease: "easeOut" }}
               className="mt-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#2f2f2f] px-3 py-2 hover:bg-[#3a3a3a] transition-colors cursor-pointer shadow-sm relative z-50 pointer-events-auto"
             >
               <Image
                 src="/logos/trouvable_logo_blanc1.png"
                 alt="Trouvable"
                 width={14}
                 height={14}
                 sizes="14px"
                 className="h-[14px] w-[14px] object-contain opacity-90"
               />
               <span className="text-[12px] font-medium text-[#ececec]">trouvable.app</span>
             </motion.a>
           </div>
         </motion.div>
       </div>
    </div>
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
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="text-[clamp(40px,6.5vw,84px)] font-bold leading-[1.04] tracking-[-0.045em]">
            <span className="block">L'équipe experte pour dominer</span>
            <span className="flex h-[1.08em] items-center justify-center overflow-hidden">
              <CyclingWord words={heroWords} className="w-full text-[clamp(40px,6.5vw,84px)] font-bold tracking-[-0.045em]" />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mx-auto mb-9 mt-7 max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
            Ne laissez pas l'IA recommander vos concurrents. Notre firme spécialisée prend en charge 100% de votre optimisation technique et sémantique pour vous rendre incontournable. Vous déléguez, nous exécutons.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap justify-center gap-3">
            <ContactButton className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:-translate-y-px hover:bg-[#ccc]">
              Demander un diagnostic
            </ContactButton>
            <Link href="/methodologie" className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-[#a0a0a0] transition hover:-translate-y-px hover:border-white/25 hover:text-white">Découvrir la méthode &rarr;</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-white/40">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Prise en charge complète</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Expertise humaine</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Méthodologie éprouvée</span>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <PipelinePreview />
        </motion.div>
      </section>

      {/* DONNÉES DE MARCHÉ EXTERNES */}
      <section id="marche" className="scroll-mt-20 border-y border-white/7 bg-[#0a0a0a] px-6 py-20 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1000px' }}>
        <div className="mx-auto max-w-[1120px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]"
          >
            Pourquoi maintenant
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mb-4 text-center text-[clamp(26px,3.2vw,40px)] font-bold tracking-[-0.035em]"
          >
            Le basculement de la recherche
          </motion.h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-sm text-[#888]">
            Données de marché externes — Sources : Bain &amp; Company, Adobe Digital Insights. Ces chiffres décrivent des tendances du secteur.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {MARKET_STATS.map((row) => (
              <motion.div
                key={row.source + row.value}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8"
              >
                <div className="mb-4 text-[clamp(40px,5vw,56px)] font-bold tracking-[-0.05em] text-white">{row.value}</div>
                <p className="mb-6 text-[15px] leading-relaxed text-[#c4c4c4]">{row.text}</p>
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-white/35">Source : {row.source}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CE QUE NOUS FAISONS POUR VOUS */}
      <section className="border-t border-b border-white/[0.08] px-6 py-24 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1000px' }}>
        <div className="mx-auto max-w-[1120px]">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
            Ce que nous faisons pour vous
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-14 text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">
            Votre présence en ligne,<br /><span className="text-[#666]">pilotée de A à Z par un expert dédié.</span>
          </motion.h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: "Diagnostic visibilité", desc: "Diagnostic initial de votre visibilité SEO et GEO actuelle.", link: "/notre-mesure", linkText: "Notre méthode" },
              { icon: Target, title: "Priorisation", desc: "Un plan d'action pour corriger les faiblesses.", link: "/etudes-de-cas/dossier-type", linkText: "Exemple de mandat" },
              { icon: GitMerge, title: "Structuration", desc: "Corrections et enrichissement des contenus sans toucher au code." },
              { icon: Globe, title: "Suivi continu", desc: "Ajustements réguliers face aux mises à jour IA." },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 * i }} className="group rounded-2xl border border-white/7 bg-[#0f0f0f] p-6 hover:bg-[#5b73ff]/[0.02] hover:border-[#5b73ff]/30 hover:shadow-[0_4px_30px_rgba(91,115,255,0.05)] transition-all overflow-hidden flex flex-col relative cursor-default">
                  <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.03] group-hover:border-[#5b73ff]/20 group-hover:bg-[#5b73ff]/10 transition-colors">
                    <Icon className="h-5 w-5 text-[#a0a0a0] group-hover:text-[#5b73ff] transition-colors" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold group-hover:text-white transition-colors">{step.title}</h3>
                  <p className="text-sm leading-[1.6] text-[#666] group-hover:text-white/80 transition-colors flex-1">{step.desc}</p>
                  {step.link && (
                    <Link href={step.link} className="mt-4 text-[13px] font-medium text-[#7b8fff] hover:text-white transition-colors flex items-center gap-1">
                      {step.linkText} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
          <div className="mt-14 flex justify-center">
            <Link href="/offres" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.03]">
              Découvrir le détail de nos offres <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CADRE DE MESURE & PREUVE */}
      <section className="border-b border-white/[0.08] px-6 py-24 sm:px-10 bg-[#0a0a0a]" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1000px' }}>
        <div className="mx-auto max-w-[1120px]">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff] flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Preuve & Mesure
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.1 }} className="mb-6 text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">
                Nous documentons <br /><span className="text-[#666]">chaque gain de visibilité.</span>
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.2 }} className="text-[#a0a0a0] text-[15px] leading-relaxed mb-8 max-w-lg">
                La croissance n'est pas une opinion, c'est une donnée technique. Nous distinguons rigoureusement vos signaux locaux, votre présence brute et le volume d'appels entrants générés.
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
                  <div className="text-[11px] font-bold uppercase text-white/40 tracking-wider mb-1">Indexation IA</div>
                  <div className="text-xl font-bold text-white">Part de recommandation</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#7b8fff]">
                  Mesure Continue
                </div>
              </div>
              <div className="space-y-3 mt-6 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#888]">ChatGPT-4o (OpenAI)</span>
                  <span className="text-blue-400 font-mono text-[10px] uppercase tracking-wider bg-blue-400/10 px-2 py-1 rounded">Suivi Actif</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#888]">Claude 3.5 Sonnet (Anthropic)</span>
                  <span className="text-orange-400 font-mono text-[10px] uppercase tracking-wider bg-orange-400/10 px-2 py-1 rounded">Suivi Actif</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#888]">Google AI Overviews</span>
                  <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-wider bg-emerald-400/10 px-2 py-1 rounded">Suivi Actif</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-t border-b border-white/[0.08] bg-[#0f0f0f] px-6 py-14 text-center sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/25">Une rigueur de travail sans compromis</div>
          <div className="mb-2 text-[clamp(20px,2.5vw,28px)] font-semibold tracking-[-0.03em]">L'humain au cœur de l'expertise.<br className="max-sm:hidden" />Une méthode technologique pour appuyer l'humain.</div>
          <div className="mx-auto mb-10 max-w-[560px] text-[15px] leading-[1.6] text-[#a0a0a0]">Un expert dédié orchestre votre stratégie et garantit un suivi personnel de qualité sur chaque dossier.</div>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 sm:gap-12">
            <div>
              <div className="text-[clamp(18px,5vw,36px)] font-bold tracking-[-0.04em] text-white">Diagnostic</div>
              <div className="mt-1 text-[11px] text-white/30 sm:text-sm">Précis et exhaustif</div>
            </div>
            <div>
              <div className="text-[clamp(18px,5vw,36px)] font-bold tracking-[-0.04em] text-emerald-300">Notre Équipe</div>
              <div className="mt-1 text-[11px] text-white/30 sm:text-sm">Exécution sur-mesure</div>
            </div>
            <div>
              <div className="text-[clamp(18px,5vw,36px)] font-bold tracking-[-0.04em] text-white">Déploiement</div>
              <div className="mt-1 text-[11px] text-white/30 sm:text-sm">Propre et sécurisé</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PÉDAGOGIE : SEO CLASSIQUE VS VISIBILITÉ IA */}
      <section className="relative border-t border-white/7 bg-[#050505] px-6 py-32 sm:px-10 overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}>
        {/* Abstract background glows */}
        <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-[100px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#5b73ff]/[0.04] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-[1120px]">
          <div className="mb-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">
              Le Changement de Paradigme
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
                <SeoAnimation />
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
                <GeoAnimation />
              </div>

              <div className="relative z-10 mt-auto">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#7b8fff]">
                  <Wand2 className="h-3.5 w-3.5" /> La nouvelle norme (GEO)
                </div>
                <h3 className="mb-2 text-2xl font-bold tracking-[-0.03em] text-white">Visibilité IA</h3>
                <p className="mb-6 text-[15px] leading-[1.6] text-[#a0a0a0]">L&apos;optimisation stricte pour les Modèles de Langage (LLM).</p>
                
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <ul className="space-y-4 text-[14px] text-white/80">
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">Vise à être <strong>cité et recommandé</strong> comme une entité fiable.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">Objectif : être la réponse finale générative.</span>
                    </li>
                  </ul>
                  <ul className="space-y-4 text-[14px] text-white/80">
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">Exige une <strong>cohérence sémantique absolue</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                      <span className="leading-[1.6]">S&apos;appuie sur des données structurées impeccables.</span>
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
                  <li className="flex items-start gap-3"><span className="mt-0.5 text-emerald-400/75 transition-colors duration-300 group-hover:text-emerald-300">✓</span> <span className="leading-[1.6]">FAQ métier et attributs locaux unifiés au format schema.org strict.</span></li>
                  <li className="flex items-start gap-3 transition-colors duration-300 group-hover:text-white"><span className="mt-0.5 text-emerald-400/75 transition-colors duration-300 group-hover:text-emerald-200">✓</span> <span className="leading-[1.6]">L&apos;entreprise devient la <strong>recommandation prioritaire</strong> dans les résumés.</span></li>
                 </ul>
               </div>
             </div>
          </motion.div>

        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative overflow-hidden border-b border-t border-white/[0.08] bg-[#0f0f0f] px-6 py-24 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 600px' }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_50%_50%,rgba(91,115,255,0.05),transparent)]" />
        <div className="relative mx-auto max-w-[900px]">
          <motion.blockquote initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-9 text-[clamp(22px,3vw,36px)] font-semibold leading-[1.25] tracking-[-0.035em]">
            &ldquo;Comprenez enfin comment les moteurs IA <span className="text-[#666]">voient votre entreprise.</span> Renforcez votre présence jusqu&apos;à devenir plus visible et plus crédible.&rdquo;
          </motion.blockquote>
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.16 }} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#5b73ff] to-[#9333ea] text-sm font-bold">✨</div>
            <div>
              <div className="text-sm font-semibold tracking-[-0.01em]">La promesse de Trouvable</div>
              <div className="mt-0.5 text-xs text-[#666]">Une expertise humaine, soutenue par une méthode rigoureuse.</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA CARDS */}
      <section className="border-t border-white/7 px-6 py-20 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
        <div className="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 transition hover:-translate-y-[3px] hover:border-white/13 sm:p-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#9a9a9a]">Diagnostic approfondi</div>
            <div className="mb-2 text-[22px] font-bold leading-[1.2] tracking-[-0.03em]">Bilan de vos fondations<br />SEO &amp; GEO</div>
            <div className="mb-6 text-sm leading-[1.6] text-[#a0a0a0]">Nos experts examinent vos signaux techniques pour identifier la raison exacte qui vous freine sur les recherches locales et au sein des IA génératives.</div>
            <ContactButton className="inline-flex items-center gap-2 rounded-lg border border-white/13 px-4 py-2 text-[13.5px] font-medium text-white transition hover:bg-white/5 hover:gap-3">
              Demander un diagnostic <ArrowRight className="h-3.5 w-3.5" />
            </ContactButton>

          </div>

          <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 transition hover:-translate-y-[3px] hover:border-white/13 sm:p-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#9a9a9a]">Prise en charge complète</div>
            <div className="mb-2 text-[22px] font-bold leading-[1.2] tracking-[-0.03em]">Déléguez l&apos;optimisation<br />de votre présence en ligne</div>
            <div className="mb-6 text-sm leading-[1.6] text-[#a0a0a0]">Nous prenons la main sur votre dossier : création de contenus, structuration sémantique stricte et déploiement soigné effectué par nos experts.</div>
            <ContactButton className="inline-flex items-center gap-2 rounded-lg border border-white/13 px-4 py-2 text-[13.5px] font-medium text-white transition hover:bg-white/5 hover:gap-3">
              Nous parler de votre projet <ArrowRight className="h-3.5 w-3.5" />
            </ContactButton>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Diagnostic complet", "Stratégie dédiée", "Rédaction & Intégration", "Suivi mensuel"].map((pill) => (
                <span key={pill} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#a0a0a0]">{pill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERTISES & VILLES */}
      <section id="expertises" className="scroll-mt-20 border-t border-white/7 bg-[#0f0f0f] px-6 py-24 sm:px-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}>
        <div className="mx-auto max-w-[1120px]">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">Couverture complète</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-14 text-[clamp(30px,3.5vw,48px)] font-bold leading-[1.08] tracking-[-0.04em]">Nos expertises et <span className="text-[#666]">marchés locaux</span></motion.h2>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-white/7 bg-[#161616] p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10 text-[#7b8fff]"><Target className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">Nos expertises</h3>
              </div>
              <ul className="space-y-3">
                {EXPERTISES.map((exp) => (
                  <li key={exp.slug}>
                    <Link href={`/expertises/${exp.slug}`} className="group flex items-center justify-between rounded-lg px-1 py-1 text-[15px] text-white/60 transition hover:text-white">
                      <span>{exp.name}</span>
                      <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-1 group-hover:text-[#7b8fff]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/7 bg-[#161616] p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10 text-[#7b8fff]"><MapPin className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">Marchés locaux &mdash; Québec</h3>
              </div>
              <ul className="space-y-3">
                {VILLES.map((ville) => (
                  <li key={ville.slug}>
                    <Link href={`/villes/${ville.slug}`} className="group flex items-center justify-between rounded-lg px-1 py-1 text-[15px] text-white/60 transition hover:text-white">
                      <span>Visibilité IA à {ville.name}</span>
                      <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-1 group-hover:text-[#7b8fff]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
            <ContactButton className="inline-flex items-center gap-2 text-sm font-medium text-[#7b8fff] transition hover:text-white">
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