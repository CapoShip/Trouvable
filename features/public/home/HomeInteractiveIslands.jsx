"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  GitMerge,
  Globe,
  Search,
  ShieldCheck,
  TriangleAlert,
  Wand2,
} from "lucide-react";

const SeoAnimationPanel = dynamic(() => import("@/features/public/home/SeoAnimationPanel"), {
  ssr: false,
  loading: () => <PanelFallback />,
});

const GeoAnimationPanel = dynamic(() => import("@/features/public/home/GeoAnimationPanel"), {
  ssr: false,
  loading: () => <PanelFallback />,
});

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

const sideSlots = [
  { name: "Étape 1 : Cartographie", tone: "good", active: true },
  { name: "Étape 2 : Priorités Google", tone: "warn" },
  { name: "Étape 3 : Cohérence réponses IA", tone: "bad" },
  { name: "Étape 4 : Validation", tone: "good" },
  { name: "Étape 5 : Pilotage", tone: "violet" },
];

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

function PanelFallback() {
  return <div className="mb-8 h-[320px] rounded-[1.5rem] border border-white/[0.04] bg-white/[0.03]" />;
}

function useDeferredMount(rootMargin = "360px") {
  const ref = useRef(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount) return undefined;

    const node = ref.current;
    if (!node || typeof window === "undefined") return undefined;

    if (!("IntersectionObserver" in window)) {
      const id = window.setTimeout(() => setShouldMount(true), 1200);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldMount]);

  return { ref, shouldMount };
}

function DeferredPanel({ children }) {
  const { ref, shouldMount } = useDeferredMount();
  return <div ref={ref}>{shouldMount ? children : <PanelFallback />}</div>;
}

export function DeferredSeoAnimationPanel() {
  return (
    <DeferredPanel>
      <SeoAnimationPanel />
    </DeferredPanel>
  );
}

export function DeferredGeoAnimationPanel() {
  return (
    <DeferredPanel>
      <GeoAnimationPanel />
    </DeferredPanel>
  );
}

function mergeTone(type) {
  if (type === "auto") return "text-emerald-300 border-emerald-400/15 bg-emerald-400/5";
  if (type === "suggest") return "text-blue-300 border-blue-400/15 bg-blue-400/5";
  if (type === "review") return "text-amber-300 border-amber-400/15 bg-amber-400/5";
  return "text-white/40 border-white/10 bg-white/[0.02]";
}

function MergeRowIcon({ type }) {
  if (type === "auto") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />;
  }

  if (type === "suggest") {
    return <Wand2 className="h-3.5 w-3.5 shrink-0 text-blue-300" />;
  }

  if (type === "review") {
    return <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />;
  }

  return <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white/45" />;
}

export function PipelinePreview() {
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
        Schéma interne d&apos;illustration, lecture d&apos;un mandat-type (ce que nous faisons, pas un livrable écran).
      </p>
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.02] px-5 py-3">
        <div className="h-3 w-3 rounded-full bg-[#ff5f57] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#febc2e] opacity-80" />
        <div className="h-3 w-3 rounded-full bg-[#28c840] opacity-80" />
        <div className="flex-1 text-center text-xs text-white/30">Feuille de route mandat &mdash; vue synthétique</div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-300">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{doneCount >= 4 ? "Phase bouclée" : "Mandat actif"}</span>
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-[200px_1fr_190px] lg:grid-cols-[200px_1fr_190px] max-lg:grid-cols-1">
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

        <div className="px-5 py-5 md:px-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/30">Contrôle qualité mandat</div>
            <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold text-blue-300">
              {doneCount >= 4 ? "Jalons validés" : "Exécution"}
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
                <div key={step.id}>
                  <div
                    className="relative overflow-hidden rounded-[10px] border px-4 py-3 transition-[opacity,border-color,background-color] duration-300"
                    style={{
                      opacity: status === "idle" ? 0.4 : 1,
                      borderColor: status === "running" ? "rgba(91,115,255,0.40)" : status === "done" ? "rgba(34,197,94,0.20)" : "rgba(255,255,255,0.07)",
                      backgroundColor: status === "running" ? "rgba(91,115,255,0.05)" : status === "done" ? "rgba(34,197,94,0.02)" : "rgba(22,22,22,1)",
                    }}
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 shrink-0 text-white/70" />
                      <span className={`flex-1 ${status === "idle" ? "text-white/45" : "text-white/90"}`}>{step.name}</span>
                      <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${status === "running" ? "bg-blue-400/15 text-blue-300" : status === "done" ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[0.04] text-white/30"}`}>
                        {status === "running" ? "Actif" : status === "done" ? step.done : "À venir"}
                      </span>
                    </div>
                    <div
                      className="mt-2 flex items-center gap-2 text-[11px] text-white/35 transition-[opacity,transform] duration-300"
                      style={{ opacity: status === "done" ? 1 : 0, transform: status === "done" ? "translateY(0)" : "translateY(4px)" }}
                    >
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white/35">Résultat</span>
                      {step.output}
                    </div>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <div className="flex h-6 items-center justify-center">
                      <div
                        className="relative h-full w-px transition-colors duration-300"
                        style={{ backgroundColor: idx < currentStep ? "rgba(34,197,94,0.35)" : idx === currentStep ? "rgba(91,115,255,0.5)" : "rgba(255,255,255,0.07)" }}
                      >
                        <div
                          className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border transition-colors duration-300"
                          style={{
                            backgroundColor: idx < currentStep ? "rgb(34 197 94)" : idx === currentStep ? "rgb(91 115 255)" : "#080808",
                            borderColor: idx < currentStep ? "rgb(34 197 94)" : idx === currentStep ? "rgb(91 115 255)" : "rgba(255,255,255,0.13)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-l border-white/8 px-0 py-4 max-lg:hidden">
          <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white/25">
            <ShieldCheck className="h-3.5 w-3.5 text-white/35" />
            <span>Déploiement propre</span>
          </div>
          <div className="space-y-0">
            {mergeRows.map((row, idx) => (
              <div
                key={row.label}
                className={`mx-0 flex items-center gap-2 border-b border-white/8 px-4 py-2 text-[11.5px] transition-[opacity,transform] duration-300 ${row.type === "auto" ? "text-emerald-300" : row.type === "suggest" ? "text-blue-300" : row.type === "review" ? "text-amber-300" : "text-white/45"}`}
                style={{ opacity: phase >= idx + 7 ? 1 : 0, transform: phase >= idx + 7 ? "translateX(0)" : "translateX(8px)" }}
              >
                <MergeRowIcon type={row.type} />
                <span className="flex-1">{row.label}</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] ${mergeTone(row.type)}`}>
                  {row.type === "auto" ? "Conforme" : row.type === "suggest" ? "Proposé" : row.type === "review" ? "À valider" : "Couvert"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />
    </div>
  );
}

export function CyclingWord() {
  const [index, setIndex] = useState(0);
  const longestLabel = HERO_PLATFORMS.reduce((a, b) => (a.length >= b.length ? a : b));
  const minWidthCh = Math.max(longestLabel.length + 1, 12);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % HERO_PLATFORMS.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      className="relative inline-flex min-h-[1.24em] align-baseline"
      aria-live="polite"
      aria-atomic="true"
      style={{ minWidth: `${minWidthCh}ch` }}
    >
      <span aria-hidden="true" className="invisible inline-block whitespace-nowrap px-1 py-1">
        {longestLabel}
      </span>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
        <span className="inline-block whitespace-nowrap bg-gradient-to-r from-[#5b73ff] via-[#7b8fff] to-[#b79cff] bg-clip-text px-1 py-1 text-transparent transition-opacity duration-300">
          {HERO_PLATFORMS[index]}
        </span>
      </span>
    </span>
  );
}
