"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, ShieldCheck, TrendingUp } from "lucide-react";

const PHASES = [
  {
    num: "01",
    icon: Search,
    title: "Cartographie",
    desc: "Lecture croisée de vos signaux publics, diagnostic des fondations SEO et de l\u2019empreinte IA.",
    accent: "#5b73ff",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Implémentation",
    desc: "Corrections structurelles, enrichissements sémantiques, déploiement propre sans casser l\u2019existant.",
    accent: "#34d399",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Pilotage",
    desc: "Suivi périodique, ajustements contenu et signaux, compte rendu factuel.",
    accent: "#a78bfa",
  },
];

export default function MandateReveal() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const [revealedCount, setRevealedCount] = useState(0);
  const [noMotion, setNoMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      setNoMotion(true);
      setRevealedCount(PHASES.length);
    }
  }, []);

  useEffect(() => {
    if (!isInView || noMotion) return;
    const timers = [];
    for (let i = 1; i <= PHASES.length; i++) {
      timers.push(setTimeout(() => setRevealedCount(i), 450 + (i - 1) * 580));
    }
    return () => timers.forEach(clearTimeout);
  }, [isInView, noMotion]);

  return (
    <div
      ref={ref}
      className="relative mx-auto mt-14 w-full max-w-[960px]"
      aria-label="Phases du mandat Trouvable"
    >
      {/* Ambient glow tracking the active phase */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-3xl transition-all duration-[1200ms]"
        style={{
          opacity: revealedCount > 0 ? 0.7 : 0,
          background:
            revealedCount > 0
              ? `radial-gradient(ellipse at ${revealedCount === 1 ? "17%" : revealedCount === 2 ? "50%" : "83%"} 50%, ${PHASES[Math.min(revealedCount - 1, 2)].accent}0a, transparent 70%)`
              : "none",
        }}
      />

      {/* Card surface */}
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.01]"
        initial={noMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top accent gradient line — draws across the card */}
        <motion.div
          className="h-px w-full origin-left"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, #5b73ff40, #34d39940, #a78bfa40, transparent 95%)",
          }}
          initial={noMotion ? false : { scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : undefined}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />

        <div className="grid gap-0 md:grid-cols-3">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            const isRevealed = idx < revealedCount;

            return (
              <motion.div
                key={phase.num}
                className="relative flex flex-col items-center px-8 py-10 text-center"
                initial={noMotion ? false : { opacity: 0, y: 14, filter: "blur(8px)" }}
                animate={
                  isRevealed ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined
                }
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Vertical separator between phases */}
                {idx > 0 && (
                  <motion.div
                    className="absolute left-0 top-[15%] hidden h-[70%] w-px origin-top md:block"
                    style={{ backgroundColor: `${phase.accent}18` }}
                    initial={noMotion ? false : { scaleY: 0 }}
                    animate={isRevealed ? { scaleY: 1 } : undefined}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                  />
                )}

                {/* Phase number with accent glow */}
                <span
                  className="mb-3 block font-mono text-[28px] font-bold tracking-[-0.03em] transition-all duration-700"
                  style={{
                    color: isRevealed ? phase.accent : "#222",
                    textShadow: isRevealed
                      ? `0 0 28px ${phase.accent}35, 0 0 56px ${phase.accent}12`
                      : "none",
                  }}
                >
                  {phase.num}
                </span>

                {/* Icon container */}
                <motion.div
                  className="mb-4 grid h-12 w-12 place-items-center rounded-xl border transition-colors duration-500"
                  style={{
                    borderColor: isRevealed
                      ? `${phase.accent}25`
                      : "rgba(255,255,255,0.04)",
                    backgroundColor: isRevealed
                      ? `${phase.accent}06`
                      : "rgba(255,255,255,0.01)",
                  }}
                  animate={
                    isRevealed && !noMotion
                      ? { scale: [0.85, 1.06, 1] }
                      : { scale: noMotion ? 1 : 0.85 }
                  }
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Icon
                    className="h-5 w-5 transition-colors duration-500"
                    style={{ color: isRevealed ? phase.accent : "#333" }}
                  />
                </motion.div>

                {/* Title */}
                <h3
                  className="mb-2 text-[17px] font-semibold tracking-[-0.02em] transition-colors duration-500"
                  style={{ color: isRevealed ? "#fff" : "#444" }}
                >
                  {phase.title}
                </h3>

                {/* Description */}
                <p
                  className="text-[13px] leading-[1.65] transition-all duration-500"
                  style={{
                    color: isRevealed ? "#888" : "#2a2a2a",
                    opacity: isRevealed ? 1 : 0.2,
                  }}
                >
                  {phase.desc}
                </p>

                {/* Accent dot */}
                <motion.div
                  className="mt-5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: phase.accent }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    isRevealed
                      ? { scale: [0, 1.3, 1], opacity: [0, 0.8, 0.5] }
                      : {}
                  }
                  transition={{ duration: 0.4, delay: 0.25 }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </motion.div>
    </div>
  );
}
