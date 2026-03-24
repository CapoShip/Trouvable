"use client";

import { motion } from "framer-motion";

const POINTS = [
  { label: "Google Local", x: "22%", y: "28%" },
  { label: "Recherche organique", x: "68%", y: "24%" },
  { label: "Réponses IA", x: "72%", y: "62%" },
  { label: "Cohérence NAP", x: "26%", y: "68%" },
];

export default function MandateVisualCartography() {
  return (
    <div className="relative flex items-center justify-center rounded-2xl border border-white/8 bg-[#0a0a0a] p-6 min-h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,115,255,0.04)_0%,transparent_70%)]" />

      <div className="relative h-[280px] w-[280px] sm:h-[300px] sm:w-[300px]">
        {[0.9, 0.65, 0.4].map((s, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5b73ff]/[0.08]"
            style={{ width: `${s * 100}%`, height: `${s * 100}%` }}
          />
        ))}

        <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-[#5b73ff] shadow-[0_0_14px_rgba(91,115,255,0.7)]" />

        <div
          className="absolute inset-[5%] rounded-full animate-spin"
          style={{
            animationDuration: "5s",
            background: "conic-gradient(from 0deg, transparent 320deg, rgba(91,115,255,0.12) 345deg, rgba(91,115,255,0.35) 360deg)",
          }}
        />

        {POINTS.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.2 }}
            className="absolute flex items-center gap-1.5"
            style={{ left: p.x, top: p.y }}
          >
            <div className="h-[7px] w-[7px] rounded-full bg-[#5b73ff] shadow-[0_0_8px_rgba(91,115,255,0.5)] animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
            <span className="text-[10px] font-semibold text-[#5b73ff]/70 whitespace-nowrap">{p.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[10px] text-white/25 font-mono">
        <span>SCAN · DIAGNOSTIC</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5b73ff] animate-pulse" />
          Analyse active
        </span>
      </div>
    </div>
  );
}
