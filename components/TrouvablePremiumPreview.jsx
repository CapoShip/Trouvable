"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
import { VILLES, EXPERTISES } from "@/lib/data/geo-architecture";

/* ---------- DATA ---------- */

const heroWords = [
  "Google Search",
  "ChatGPT",
  "Perplexity AI",
  "Google Gemini",
  "Claude AI",
  "Grok",
  "Microsoft Copilot",
  "Google AI Overviews",
];

const bottomWords = [
  "Perplexity AI",
  "ChatGPT",
  "Claude AI",
  "Google Gemini",
  "Grok",
  "Microsoft Copilot",
  "Google AI Overviews",
];

const pipelineSteps = [
  { id: 0, icon: Globe, name: "Scraping du site web", output: "Contenu HTML extrait", done: "Contenu extrait" },
  { id: 1, icon: Search, name: "Extraction des signaux SEO", output: "Signaux détectés · Score calculé", done: "Signaux SEO OK" },
  { id: 2, icon: Wand2, name: "Analyse GEO — compréhension IA", output: "Score GEO calculé · Lacunes identifiées", done: "Analyse GEO OK" },
  { id: 3, icon: GitMerge, name: "Safe Merge → Cockpit client", output: "Données fusionnées intelligemment", done: "Merge appliqué" },
];

const mergeRows = [
  { label: "Description", type: "auto" },
  { label: "Adresse", type: "auto" },
  { label: "Activité", type: "auto" },
  { label: "Horaires", type: "suggest" },
  { label: "Services", type: "suggest" },
  { label: "Téléphone", type: "covered" },
  { label: "FAQ métier", type: "review" },
];

/** Libellés génériques — illustration d’interface uniquement (aucune donnée client réelle). */
const sideSlots = [
  { name: "Espace 1 (illustration)", tone: "good", active: true },
  { name: "Espace 2 (illustration)", tone: "warn" },
  { name: "Espace 3 (illustration)", tone: "bad" },
  { name: "Espace 4 (illustration)", tone: "good" },
  { name: "Espace 5 (illustration)", tone: "violet" },
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

const scaleNav = [
  {
    id: "audit",
    title: "Audit automatique",
    desc: "Scannez le site de n’importe quel client en un clic. Détection intelligente des signaux SEO et GEO, scoring instantané, pipeline traçable.",
  },
  {
    id: "geo",
    title: "Score GEO",
    desc: "Indicateur agrégé à partir de votre site et des audits : compréhension des signaux utiles aux réponses IA (pas un classement officiel d’un modèle).",
  },
  {
    id: "cockpit",
    title: "Cockpit client",
    desc: "Centralisez toutes les données d’un client dans un cockpit unifié. Complétude, prévisualisation, publication — tout en un endroit.",
  },
  {
    id: "merge",
    title: "Safe Merge",
    desc: "Les données détectées sont fusionnées intelligemment — jamais d’écrasement, traçabilité complète. Auto-appliqué, Suggéré, Déjà couvert, À réviser.",
  },
];

const channelTabs = [
  {
    id: "seo",
    label: "SEO Local",
    eyebrow: "SEO Local",
    title: "Dominez Google dans votre zone géographique.",
    body: "Metadata, schema.org LocalBusiness, signaux locaux, indexabilité, vitesse — tout ce dont Google a besoin pour classer vos clients en tête des résultats locaux.",
  },
  {
    id: "geo",
    label: "GEO & Moteurs IA",
    eyebrow: "GEO — Moteurs génératifs",
    title: "Renforcez les signaux que les modèles peuvent exploiter.",
    body: "Le Score GEO est un indicateur interne (audit + structure), pas une « position officielle » dans un moteur. Il aide à prioriser FAQ, services, crédibilité et cohérence locale.",
  },
  {
    id: "agency",
    label: "Agences & Consultants",
    eyebrow: "Agences & Consultants",
    title: "Gérez des dizaines de clients depuis un seul tableau de bord.",
    body: "Vue multi-clients, audit en masse, cockpit par client, Safe Merge automatique. Passez de la saisie manuelle à la supervision intelligente.",
  },
];

const auditSignals = [
  ["Balises title et meta description", "ok"],
  ["Schema.org LocalBusiness (JSON-LD)", "ok"],
  ["Sitemap XML", "ok"],
  ["Description d’activité claire et complète", "ok"],
  ["Vitesse de chargement", "warn"],
  ["FAQ métier", "bad"],
  ["Données structurées d’avis absentes", "bad"],
];

const geoSignals = [
  ["Activité et localisation comprises par les IA", "good"],
  ["Coordonnées cohérentes", "good"],
  ["Détail des services", "warn"],
  ["FAQ structurée", "bad"],
  ["Signaux de crédibilité (avis, certifications)", "bad"],
];

const faqsData = [
  {
    q: "C’est quoi exactement la visibilité IA (GEO) ?",
    a: "Quand vos clients posent une question à ChatGPT, Gemini ou Perplexity (ex : « Quel est le meilleur restaurant italien près de chez moi ? »), nous nous assurons que c’est votre entreprise qui apparaît dans la réponse. C’est comme être en tête de Google, mais pour l’intelligence artificielle.",
  },
  {
    q: "Quelle est la différence entre SEO et GEO ?",
    a: "Le SEO vous positionne sur la page de résultats de Google. Le GEO (Generative Engine Optimization) vous positionne dans les réponses conversationnelles de ChatGPT, Claude, Gemini et Perplexity — là où de plus en plus de consommateurs cherchent des recommandations.",
  },
  {
    q: "Est-ce que ça marche pour mon type de commerce ?",
    a: "Oui. Notre plateforme est conçue pour tout commerce local : restaurants, cliniques, salons de coiffure, cabinets juridiques, services résidentiels (plombiers, électriciens), courtiers immobiliers, et bien d’autres.",
  },
  {
    q: "Combien de temps avant de voir des résultats ?",
    a: "Les délais varient selon votre secteur et la concurrence locale. L'audit initial est livré rapidement. Les signaux structurés sont ensuite propagés aux moteurs IA en continu.",
  },
  {
    q: "Est-ce que je dois avoir un site internet ?",
    a: "Ce n’est pas strictement obligatoire — Trouvable génère un profil public optimisé pour chaque client. Mais un site web permet de maximiser les signaux et le score GEO.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Contactez-nous pour connaître nos offres. Nos forfaits d'optimisation varient selon votre secteur et la concurrence locale.",
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
        Illustration d’interface — animation générique, sans données réelles ni scores clients.
      </p>
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.02] px-5 py-3">
        <div className="h-3 w-3 rounded-full bg-[#ff5f57] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#febc2e] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#28c840] opacity-80" />
        <div className="flex-1 text-center text-xs text-white/30">Trouvable &mdash; Audit automatique</div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{doneCount >= 4 ? "Terminé ✓" : "En cours..."}</span>
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-[200px_1fr_190px] lg:grid-cols-[200px_1fr_190px] max-lg:grid-cols-1">
        {/* Left sidebar */}
        <div className="border-r border-white/8 px-0 py-4 max-lg:hidden">
          <div className="mb-4 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Clients</div>
          {sideSlots.map((client) => (
            <div key={client.name} className={`flex items-center gap-2 px-4 py-2 text-xs transition ${client.active ? "border-l-2 border-blue-400 bg-blue-500/8 pl-3 text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white/80"}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${client.tone === "good" ? "bg-emerald-400" : client.tone === "warn" ? "bg-amber-400" : client.tone === "bad" ? "bg-red-400" : "bg-violet-400"}`} />
              <span className="flex-1 truncate">{client.name}</span>
              <span className={`h-1.5 w-6 rounded-full inline-block ${client.tone === "good" ? "bg-emerald-400/40" : client.tone === "warn" ? "bg-amber-400/40" : client.tone === "bad" ? "bg-red-400/40" : "bg-violet-400/40"}`} />
            </div>
          ))}
          <div className="mb-4 mt-6 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Navigation</div>
          {["Cockpit", "Audit", "Profil public"].map((item) => (
            <div key={item} className="px-4 py-2 text-xs text-white/55 hover:bg-white/[0.03] hover:text-white/80">{item}</div>
          ))}
        </div>

        {/* Center pipeline */}
        <div className="px-5 py-5 md:px-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/30">Pipeline d&apos;audit</div>
            <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold text-blue-300">
              {doneCount >= 4 ? "✓ Terminé" : "⚡ En cours"}
            </div>
            <button className="inline-flex items-center gap-2 rounded-md bg-[#5b73ff] px-3 py-1.5 text-xs font-medium text-white transition hover:-translate-y-px hover:opacity-90">
              <Play className="h-3.5 w-3.5" /> Relancer
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
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/35">Output</span>
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

          <div className="mt-5 grid grid-cols-2 gap-3">
            <motion.div animate={{ opacity: phase >= 8 ? 1 : 0, y: phase >= 8 ? 0 : 8 }} className="rounded-lg border border-white/8 bg-[#161616] p-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">{"🔎"} Score SEO</div>
              <div className="text-[34px] font-bold tracking-[-0.04em] text-blue-300">{seoProgress ? "✓" : "—"}</div>
              <div className="mt-3 h-[3px] overflow-hidden rounded bg-white/[0.05]">
                <motion.div animate={{ width: `${seoProgress}%` }} className="h-full rounded bg-gradient-to-r from-[#5b73ff] to-[#93c5fd]" />
              </div>
            </motion.div>
            <motion.div animate={{ opacity: phase >= 9 ? 1 : 0, y: phase >= 9 ? 0 : 8 }} className="rounded-lg border border-white/8 bg-[#161616] p-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">{"✨"} Score GEO</div>
              <div className="text-[34px] font-bold tracking-[-0.04em] text-violet-300">{geoProgress ? "✓" : "—"}</div>
              <div className="mt-3 h-[3px] overflow-hidden rounded bg-white/[0.05]">
                <motion.div animate={{ width: `${geoProgress}%` }} className="h-full rounded bg-gradient-to-r from-violet-600 to-violet-300" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right sidebar merge */}
        <div className="border-l border-white/8 px-0 py-4 max-lg:hidden">
          <div className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white/25">{"🔀"} Safe Merge</div>
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

/* ---------- SCALE PANELS ---------- */

function ScalePanels({ active }) {
  return (
    <div className="relative min-h-[420px]">
      <AnimatePresence mode="wait">
        {active === "audit" && (
          <motion.div key="audit" initial={{ opacity: 0, y: 14, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
            </div>
            <div className="p-6">
              <p className="mb-4 text-[11px] text-white/35">Maquette — les coches ci-dessous sont un exemple générique, pas un résultat Trouvable.</p>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold tracking-[-0.02em]">Exemple de fiche</div>
                  <div className="text-xs text-white/30">domaine-exemple.ca &middot; Audit</div>
                </div>
                <button type="button" className="h-8 rounded-md bg-[#5b73ff] px-4 text-xs font-medium text-white/80 cursor-default">{"▶"} Relancer</button>
              </div>
              <div className="space-y-2">
                {auditSignals.map(([label, tone]) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[12.5px] text-white/65 hover:border-white/15">
                    <span>{tone === "ok" ? "✅" : tone === "warn" ? "⚠️" : "❌"}</span>
                    <span className="flex-1">{label}</span>
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em] ${tone === "ok" ? "bg-emerald-400/10 text-emerald-300" : tone === "warn" ? "bg-amber-400/10 text-amber-300" : "bg-red-400/10 text-red-300"}`}>
                      {tone === "ok" ? "OK" : tone === "warn" ? "Améliorer" : "Manquant"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {active === "geo" && (
          <motion.div key="geo" initial={{ opacity: 0, y: 14, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
            </div>
            <div className="p-6">
              <p className="mb-4 text-[11px] text-white/35">Maquette — scores affichés « — » ; les barres ne représentent pas une mesure réelle.</p>
              <div className="mb-4">
                <div className="text-sm font-semibold tracking-[-0.02em]">Indicateurs GEO (exemple)</div>
                <div className="text-xs text-white/30">Lecture indicative après audit réel dans Trouvable</div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Score SEO</div>
                  <div className="mb-2 text-3xl font-bold tracking-[-0.04em] text-blue-300">—</div>
                  <div className="h-[3px] overflow-hidden rounded bg-white/[0.05]"><div className="h-full w-0 rounded bg-gradient-to-r from-[#5b73ff] to-[#93c5fd]" /></div>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Score GEO</div>
                  <div className="mb-2 text-3xl font-bold tracking-[-0.04em] text-violet-300">—</div>
                  <div className="h-[3px] overflow-hidden rounded bg-white/[0.05]"><div className="h-full w-0 rounded bg-gradient-to-r from-violet-700 to-violet-300" /></div>
                </div>
              </div>
              <div className="space-y-2">
                {geoSignals.map(([label, tone]) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 text-xs text-white/65">
                    <span>{tone === "good" ? "✅" : tone === "warn" ? "⚠️" : "❌"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {active === "cockpit" && (
          <motion.div key="cockpit" initial={{ opacity: 0, y: 14, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
            </div>
            <div className="p-6">
              <p className="mb-4 text-[11px] text-white/35">Maquette — état de publication fictif.</p>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="text-sm font-semibold tracking-[-0.02em]">Cockpit (exemple)</div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                  Statut (illustration)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                {[
                  ["Nom", "Votre client"],
                  ["Type d’activité", "Restaurant gastronomique"],
                  ["Ville", "Montréal"],
                  ["Téléphone", CONTACT_PHONE_DISPLAY],
                  ["Description", "Restaurant gastronomique au cœur du Plateau-Mont-Royal, reconnu pour sa cuisine française revisitée avec des produits du terroir québécois."],
                  ["Horaires", "Mar–Dim · 17h–23h"],
                  ["FAQ", "3 questions publiées"],
                ].map(([label, value], idx) => (
                  <div key={label} className={`rounded-lg border border-white/8 bg-white/[0.025] p-3 ${idx === 4 ? "col-span-2 max-md:col-span-1" : ""}`}>
                    <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.07em] text-white/25">{label}</div>
                    <div className="text-sm text-white/85">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {active === "merge" && (
          <motion.div key="merge" initial={{ opacity: 0, y: 14, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
            </div>
            <div className="p-6">
              <div className="mb-4 text-sm font-semibold text-white/75">{"🔀"} Safe Merge &middot; Résultats de l&apos;audit</div>
              <div className="space-y-2">
                {[
                  ["Description d’entreprise", "Auto-appliqué", "a"],
                  ["Adresse et ville", "Auto-appliqué", "a"],
                  ["Type d’activité", "Auto-appliqué", "a"],
                  ["Horaires d’ouverture", "Suggéré", "s"],
                  ["Liste des services principaux", "Suggéré", "s"],
                  ["Numéro de téléphone", "Déjà renseigné", "c"],
                  ["FAQ métier — confiance faible", "À réviser", "r"],
                ].map(([field, badge, kind]) => (
                  <div key={field} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${kind === "a" ? "border-emerald-400/15 bg-emerald-400/5" : kind === "s" ? "border-blue-400/15 bg-blue-400/5" : kind === "r" ? "border-amber-400/15 bg-amber-400/5" : "border-white/8 bg-white/[0.012]"}`}>
                    <span>{kind === "a" ? "✅" : kind === "s" ? "💡" : kind === "r" ? "⚠️" : "🛡️"}</span>
                    <span className="flex-1 text-white/65">{field}</span>
                    <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-[0.05em] ${kind === "a" ? "bg-emerald-400/10 text-emerald-300" : kind === "s" ? "bg-blue-400/10 text-blue-300" : kind === "r" ? "bg-amber-400/10 text-amber-300" : "bg-white/[0.05] text-white/35"}`}>{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- CHANNEL VISUALS ---------- */

function ChannelVisual({ active }) {
  if (active === "seo") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
        </div>
        <div className="space-y-2 p-5">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.09em] text-white/25">Signaux SEO détectés</div>
          {[
            ["Schema LocalBusiness", 80, "green"],
            ["Balises title / meta", 80, "green"],
            ["Sitemap XML", 80, "green"],
            ["Vitesse de page", 50, "amber"],
            ["Avis structurés", 20, "red"],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2.5 text-xs text-white/65">
              <span>{color === "green" ? "🟢" : color === "amber" ? "🟡" : "🔴"}</span>
              <span className="flex-1">{label}</span>
              <div className="h-1 w-24 overflow-hidden rounded bg-white/[0.06]">
                <div className={`h-full rounded ${color === "green" ? "bg-emerald-400" : color === "amber" ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${value}%` }} />
              </div>
              <span className={`text-[11px] font-semibold ${color === "green" ? "text-emerald-300" : color === "amber" ? "text-amber-300" : "text-red-300"}`}>{value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "geo") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
        </div>
        <div className="space-y-3 p-5">
          <div className="max-w-[85%] rounded-[12px_12px_12px_3px] border border-white/8 bg-white/[0.04] px-4 py-3 text-[12.5px] leading-6 text-white/65">
            Quel est le meilleur commerce local dans ma ville ?
          </div>
          <div className="ml-auto max-w-[92%] rounded-[12px_12px_3px_12px] border border-blue-400/18 bg-blue-400/7 px-4 py-3 text-[12.5px] leading-6 text-white/90">
            <span className="font-semibold text-blue-300">Votre entreprise</span> est recommandée grâce à des données structurées complètes, des FAQ pertinentes et un profil local optimisé.
            <div className="mt-2 flex items-center gap-2 text-[10.5px] text-white/30">
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] text-blue-300">Source</span>
              votre-site.ca
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.015] px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] opacity-70" /><div className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-70" />
      </div>
      <div className="space-y-2 p-5">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.09em] text-white/25">Vue multi-clients</div>
        {[
          ["Client A", "SEO", "GEO", "good"],
          ["Client B", "SEO", "GEO", "warn"],
          ["Client C", "SEO", "GEO", "bad"],
          ["Client D", "SEO", "GEO", "good"],
          ["Client E", "SEO", "GEO", "warn"],
        ].map(([name, s1, s2, tone]) => (
          <div key={name} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2.5 text-xs text-white/65">
            <span>{tone === "good" ? "🏪" : tone === "bad" ? "💇" : "🔧"}</span>
            <span className="flex-1">{name}</span>
            <div className="flex gap-2">
              <span className={`h-1.5 w-8 rounded-full inline-block ${tone === "good" ? "bg-emerald-400/30" : tone === "warn" ? "bg-amber-400/30" : "bg-red-400/30"}`} />
              <span className={`h-1.5 w-8 rounded-full inline-block ${tone === "good" ? "bg-violet-400/30" : "bg-red-400/30"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- FAQ SECTION ---------- */

function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2">
      {faqsData.map((faq, idx) => (
        <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] transition hover:border-white/15">
          <button onClick={() => setOpen(open === idx ? null : idx)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90">
            <span>{faq.q}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open === idx ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {open === idx && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="px-5 pb-5 text-[14px] leading-[1.7] text-[#a0a0a0]">{faq.a}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ---------- MOBILE NAV ---------- */

function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#080808]/98 backdrop-blur-xl lg:hidden">
      <div className="flex h-[58px] items-center justify-between px-7">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.025em]">
          Trouvable
        </Link>
        <button onClick={onClose} className="p-1"><X className="h-5 w-5 text-white/60" /></button>
      </div>
      <nav className="flex flex-col gap-1 px-7 py-6">
        {[
          { label: "Marché", href: "#marche" },
          { label: "Plateforme", href: "#plateforme" },
          { label: "Solutions", href: "#solutions" },
          { label: "Expertises", href: "#expertises" },
          { label: "FAQ", href: "#faq" },
        ].map((item) => (
          <a key={item.label} href={item.href} onClick={onClose} className="rounded-lg px-4 py-3 text-lg font-medium text-white/80 transition hover:bg-white/5">{item.label}</a>
        ))}
        <hr className="my-4 border-white/8" />
        <Link href="/admin/sign-in" onClick={onClose} className="rounded-lg px-4 py-3 text-lg font-medium text-white/50 transition hover:bg-white/5">Connexion</Link>
        <ContactButton className="mt-2 rounded-lg bg-white px-4 py-3 text-center text-lg font-medium text-black transition hover:bg-[#d6d6d6]">
          Réserver une démo
        </ContactButton>
      </nav>
    </motion.div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function TrouvableLandingPage() {
  const [activeScale, setActiveScale] = useState("audit");
  const [activeChannel, setActiveChannel] = useState("seo");
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-scréén overflow-x-hidden bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

      {/* HEADER */}
      <header className={`fixed left-0 right-0 top-0 z-50 flex h-[58px] items-center gap-8 border-b px-7 backdrop-blur-2xl transition ${navScrolled ? "border-white/12 bg-[#080808]/95" : "border-white/7 bg-[#080808]/82"}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-[-0.025em]">
          Trouvable
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            { label: "Marché", href: "#marche" },
            { label: "Plateforme", href: "#plateforme" },
            { label: "Solutions", href: "#solutions" },
            { label: "Expertises", href: "#expertises" },
            { label: "FAQ", href: "#faq" },
          ].map((item) => (
            <a key={item.label} href={item.href} className="rounded-[7px] px-3 py-1.5 text-[13.5px] font-[450] text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex-1" />
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/admin/sign-in" className="rounded-[7px] px-3.5 py-1.5 text-[13.5px] font-medium text-[#a0a0a0] transition hover:bg-white/5 hover:text-white">Connexion</Link>
          <ContactButton className="rounded-[7px] bg-white px-4 py-1.5 text-[13.5px] font-medium text-black transition hover:bg-[#d6d6d6]">
            Audit stratégique
          </ContactButton>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1 lg:hidden"><Menu className="h-5 w-5 text-white/70" /></button>
      </header>

      <AnimatePresence>
        <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </AnimatePresence>

      {/* HERO */}
      <section className="relative mt-[58px] overflow-hidden px-6 pb-0 pt-[72px] text-center">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_90%_55%_at_50%_0%,black_30%,transparent_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.10)_0%,transparent_62%)]" />

        <div className="relative z-[1] mx-auto flex w-full max-w-[860px] flex-col items-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="text-[clamp(40px,6.5vw,84px)] font-bold leading-[1.04] tracking-[-0.045em]">
            <span className="block">Rendez vos clients visibles dans</span>
            <span className="flex h-[1.08em] items-center justify-center overflow-hidden">
              <CyclingWord words={heroWords} className="w-full text-[clamp(40px,6.5vw,84px)] font-bold tracking-[-0.045em]" />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mx-auto mb-9 mt-7 max-w-[520px] text-[17px] leading-[1.65] text-[#a0a0a0]">
            Trouvable optimise automatiquement la visibilité locale de vos clients &mdash; sur Google <strong className="text-white/80">et</strong> dans les moteurs IA génératifs. Audit, Score GEO, Cockpit, Safe Merge.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap justify-center gap-3">
            <ContactButton className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:-translate-y-px hover:bg-[#ccc]">
              Demander un audit stratégique
            </ContactButton>
            <a href="#plateforme" className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-[#a0a0a0] transition hover:-translate-y-px hover:border-white/25 hover:text-white">Découvrir la plateforme &rarr;</a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-white/40">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Audit de visibilité complet</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sans engagement</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Support dédié</span>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <PipelinePreview />
        </motion.div>
      </section>

      {/* DONNÉES DE MARCHÉ EXTERNES (non-Trouvable) */}
      <section id="marche" className="scroll-mt-20 border-y border-white/7 bg-[#0a0a0a] px-6 py-20 sm:px-10">
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
            Données de marché externes — Sources : Bain &amp; Company, Adobe Digital Insights. Ces chiffres décrivent des tendances du secteur, pas des résultats Trouvable.
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
          <p className="mt-10 text-center text-[11px] text-white/30">
            Données de marché externes — Sources : Bain &amp; Company, Adobe Digital Insights
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-y border-white/7 bg-[#0f0f0f] px-10 py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/25">Plateforme de visibilité locale</div>
          <div className="mb-2 text-[clamp(20px,2.5vw,28px)] font-semibold tracking-[-0.03em]">Chaque jour, des moteurs IA recommandent des entreprises.<br className="max-sm:hidden" />Celles qui ne sont pas optimisées sont oubliées.</div>
          <div className="mx-auto mb-10 max-w-[560px] text-[15px] leading-[1.6] text-[#a0a0a0]">Trouvable vous aide à y remédier.</div>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 sm:gap-12">
            <div>
              <div className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Audit</div>
              <div className="mt-1 text-xs text-white/30 sm:text-sm">Complet et automatique</div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-[-0.04em] text-emerald-300 sm:text-4xl">GEO</div>
              <div className="mt-1 text-xs text-white/30 sm:text-sm">Score de visibilité IA</div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Merge</div>
              <div className="mt-1 text-xs text-white/30 sm:text-sm">Fusion intelligente des données</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PLATFORM SECTION */}
      <section id="plateforme" className="scroll-mt-20 border-t border-white/7 py-24">
        <div className="mx-auto max-w-[1120px] px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">Plateforme complète</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-[72px] max-w-[680px] text-[clamp(32px,4vw,52px)] font-bold leading-[1.08] tracking-[-0.04em]">Maîtrisez votre présence,<br /><span className="text-[#666]">pas votre charge de travail.</span></motion.h2>

          <div className="grid items-start gap-[72px] lg:grid-cols-[320px_1fr]">
            <div className="top-[88px] lg:sticky">
              {scaleNav.map((item) => (
                <button key={item.id} onClick={() => setActiveScale(item.id)} className={`relative mb-1 w-full overflow-hidden rounded-[10px] border px-5 py-4 text-left transition ${activeScale === item.id ? "border-white/13 bg-white/[0.04]" : "border-transparent"}`}>
                  <div className={`absolute left-0 top-2 bottom-2 w-0.5 origin-center rounded-r-sm bg-white transition ${activeScale === item.id ? "scale-y-100" : "scale-y-0"}`} />
                  <div className={`text-[14.5px] font-semibold tracking-[-0.015em] ${activeScale === item.id ? "text-white" : "text-[#a0a0a0]"}`}>{item.title}</div>
                  <div className={`overflow-hidden text-[13px] leading-[1.55] text-[#666] transition-all ${activeScale === item.id ? "mt-2 max-h-28" : "max-h-0"}`}>{item.desc}</div>
                  {activeScale === item.id && <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#7b8fff]">En savoir plus <ArrowRight className="h-3.5 w-3.5" /></span>}
                </button>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.12 }}>
              <ScalePanels active={activeScale} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative overflow-hidden border-t border-white/7 bg-[#0f0f0f] px-6 py-24 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_50%_50%,rgba(91,115,255,0.05),transparent)]" />
        <div className="relative mx-auto max-w-[900px]">
          <motion.blockquote initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-9 text-[clamp(22px,3vw,36px)] font-semibold leading-[1.25] tracking-[-0.035em]">
            &ldquo;Comprenez enfin comment les moteurs IA <span className="text-[#666]">voient votre entreprise.</span> Passez de l&apos;invisible au recommandé.&rdquo;
          </motion.blockquote>
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.16 }} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#5b73ff] to-[#9333ea] text-sm font-bold">✨</div>
            <div>
              <div className="text-sm font-semibold tracking-[-0.01em]">La vision de Trouvable</div>
              <div className="mt-0.5 text-xs text-[#666]">Visibilité locale automatisée, Québec</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOLUTIONS / CHANNEL TABS */}
      <section id="solutions" className="scroll-mt-20 border-t border-white/7 py-24">
        <div className="mx-auto max-w-[1120px] px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">Solutions adaptées</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-10 text-[clamp(30px,3.5vw,48px)] font-bold leading-[1.08] tracking-[-0.04em]">Optimisation pour <span className="text-[#666]">chaque dimension</span><br />de votre visibilité</motion.h2>

          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.12 }} className="mb-0 flex gap-1 overflow-x-auto border-b border-white/7">
            {channelTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveChannel(tab.id)} className={`relative shrink-0 px-[18px] pb-3.5 pt-2.5 text-sm font-medium transition ${activeChannel === tab.id ? "text-white" : "text-[#666] hover:text-[#a0a0a0]"}`}>
                {tab.label}
                <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-sm bg-white transition ${activeChannel === tab.id ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {channelTabs.filter((tab) => tab.id === activeChannel).map((tab) => (
              <motion.div key={tab.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="grid items-center gap-16 pt-14 lg:grid-cols-[1fr_480px]">
                <div>
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">{tab.eyebrow}</div>
                  <h3 className="mb-4 text-[clamp(26px,3vw,38px)] font-bold leading-[1.1] tracking-[-0.035em]">{tab.title}</h3>
                  <p className="mb-6 max-w-[440px] text-[15px] leading-[1.65] text-[#a0a0a0]">{tab.body}</p>
                  <ContactButton className="inline-flex items-center gap-1 border-b border-white/13 pb-0.5 text-sm font-medium text-white transition hover:gap-2 hover:border-white/35">
                    {tab.id === "seo" ? "Demander un audit SEO" : tab.id === "geo" ? "Analyser mon Score GEO" : "Découvrir la plateforme"} <ArrowRight className="h-3.5 w-3.5" />
                  </ContactButton>
                </div>
                <ChannelVisual active={activeChannel} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA CARDS */}
      <section className="border-t border-white/7 px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 transition hover:-translate-y-[3px] hover:border-white/13 sm:p-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Audit initial</div>
            <div className="mb-2 text-[22px] font-bold leading-[1.2] tracking-[-0.03em]">Obtenez votre rapport<br />de visibilité IA</div>
            <div className="mb-6 text-sm leading-[1.6] text-[#a0a0a0]">Analyse approfondie de votre présence sur Google et dans les moteurs génératifs. Score SEO + Score GEO + recommandations actionnables.</div>
            <ContactButton className="inline-flex items-center gap-2 rounded-lg border border-white/13 px-4 py-2 text-[13.5px] font-medium text-white transition hover:bg-white/5 hover:gap-3">
              Analyser mon site <ArrowRight className="h-3.5 w-3.5" />
            </ContactButton>
            <div className="mt-8 rounded-[10px] border border-white/7 bg-[#161616] p-4">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-blue-300/12 bg-blue-300/5 p-3 text-center">
                  <div className="text-[26px] font-bold tracking-[-0.04em] text-blue-300">—</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-white/30">Score SEO</div>
                </div>
                <div className="flex-1 rounded-lg border border-violet-300/12 bg-violet-300/5 p-3 text-center">
                  <div className="text-[26px] font-bold tracking-[-0.04em] text-violet-300">—</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-white/30">Score GEO</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 transition hover:-translate-y-[3px] hover:border-white/13 sm:p-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Plateforme</div>
            <div className="mb-2 text-[22px] font-bold leading-[1.2] tracking-[-0.03em]">Découvrez le cockpit<br />Trouvable</div>
            <div className="mb-6 text-sm leading-[1.6] text-[#a0a0a0]">Accédez à notre outil d&apos;optimisation complet. Audit + Score GEO + Cockpit client + Safe Merge pour tous vos clients locaux.</div>
            <ContactButton className="inline-flex items-center gap-2 rounded-lg border border-white/13 px-4 py-2 text-[13.5px] font-medium text-white transition hover:bg-white/5 hover:gap-3">
              Réserver une démo <ArrowRight className="h-3.5 w-3.5" />
            </ContactButton>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Audit SEO", "Score GEO", "Cockpit client", "Safe Merge", "Profils publics"].map((pill) => (
                <span key={pill} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#a0a0a0]">{pill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERTISES & VILLES */}
      <section id="expertises" className="scroll-mt-20 border-t border-white/7 bg-[#0f0f0f] px-6 py-24 sm:px-10">
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
      <section id="faq" className="scroll-mt-20 border-t border-white/7 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-[720px]">
          <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">Questions fréquentes</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-10 text-center text-[clamp(30px,3.5vw,44px)] font-bold leading-[1.1] tracking-[-0.04em]">Tout ce que vous devez savoir</motion.h2>
          <FaqSection />
          <div className="mt-10 text-center">
            <p className="mb-3 text-sm text-[#666]">Vous avez d&apos;autres questions ?</p>
            <ContactButton className="inline-flex items-center gap-2 text-sm font-medium text-[#7b8fff] transition hover:text-white">
              Contactez notre équipe <ArrowRight className="h-3.5 w-3.5" />
            </ContactButton>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-white/7 px-6 py-24 text-center sm:px-10">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.07),transparent_65%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[600px] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#5b73ff]/60 to-transparent" />
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="relative z-[1] mb-7 text-xs font-semibold uppercase tracking-[0.06em] text-[#666]">Votre marque citée par</motion.div>
        <motion.h2 initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.08 }} className="relative z-[1] mx-auto mb-4 max-w-[780px] text-[clamp(36px,5vw,68px)] font-bold leading-[1.05] tracking-[-0.045em]">
          <span className="block">Faites recommander</span>
          <span className="block">vos clients dans</span>
          <span className="flex h-[1.07em] items-center justify-center overflow-hidden">
            <CyclingWord words={bottomWords} className="w-full text-[clamp(36px,5vw,68px)] font-bold tracking-[-0.045em]" />
          </span>
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.16 }} className="relative z-[1] mx-auto mb-10 max-w-[460px] text-[17px] leading-[1.65] text-[#a0a0a0]">Rejoignez les agences et consultants qui automatisent la visibilité locale de leurs clients au Québec.</motion.p>
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.24 }} className="relative z-[1] flex flex-wrap justify-center gap-3">
          <ContactButton className="rounded-lg bg-white px-7 py-3.5 text-[15px] font-medium text-black transition hover:bg-[#ccc]">
            Demander un audit stratégique
          </ContactButton>
          <Link href="/admin/sign-in" className="rounded-lg border border-white/15 px-7 py-3.5 text-[15px] font-medium text-[#a0a0a0] transition hover:border-white/25 hover:text-white">Accéder à la plateforme</Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/7 bg-[#080808] px-6 pb-9 pt-16 sm:px-10">
        <div className="mx-auto mb-12 grid max-w-[1120px] gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
              Trouvable
            </Link>
            <p className="max-w-[230px] text-[13px] leading-[1.65] text-[#666]">Plateforme québécoise de visibilité IA &mdash; optimisez votre présence sur Google et dans les moteurs génératifs.</p>
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
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">Plateforme</div>
            <ul className="space-y-2.5">
              {["Audit SEO/GEO", "Score GEO", "Cockpit client", "Safe Merge", "Profils publics"].map((link) => (
                <li key={link}><a href="#plateforme" className="text-sm text-[#666] transition hover:text-white">{link}</a></li>
              ))}
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
              <li><Link href="/admin/sign-in" className="text-sm text-[#666] transition hover:text-white">Connexion</Link></li>
              <li><a href="#faq" className="text-sm text-[#666] transition hover:text-white">FAQ</a></li>
              <li><a href="#" className="text-sm text-[#666] transition hover:text-white">Mentions légales</a></li>
              <li><a href="#" className="text-sm text-[#666] transition hover:text-white">Confidentialité</a></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1120px] flex-col gap-5 border-t border-white/7 pt-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <span className="order-1 text-[13px] text-[#666] lg:order-none">&copy; 2026 Trouvable. Tous droits réservés.</span>
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
            Tous les systèmes opérationnels
          </div>
        </div>
      </footer>
    </div>
  );
}
