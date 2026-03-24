"use client";

import { motion } from "framer-motion";

const CHANNELS = [
  { name: "Google Local", status: "stable", delta: "+4%", color: "#34d399" },
  { name: "Réponses IA", status: "+12%", delta: "↑", color: "#a78bfa" },
  { name: "Signal NAP", status: "conforme", delta: "→", color: "#5b73ff" },
];

const TREND_PATH = "M 0 50 Q 15 42, 30 44 T 60 38 T 90 35 T 120 30 T 150 28 T 180 22 T 210 20 T 240 18";

export default function MandateVisualContinuous() {
  return (
    <div className="relative rounded-2xl border border-white/8 bg-[#0a0a0a] p-6 sm:p-8 min-h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.04)_0%,transparent_60%)]" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/25">Pilotage mensuel</span>
          <span className="rounded-full border border-[#a78bfa]/20 bg-[#a78bfa]/8 px-2.5 py-1 text-[10px] font-semibold text-[#a78bfa]">
            Mandat actif
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white/20">
            Tendance recommandation · 6 mois
          </div>
          <svg viewBox="0 0 240 60" className="w-full h-[60px]" preserveAspectRatio="none">
            <motion.path
              d={TREND_PATH}
              fill="none"
              stroke="url(#trendGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5b73ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <div className="space-y-2.5">
          {CHANNELS.map((ch, i) => (
            <motion.div
              key={ch.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.15 }}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: ch.color, animationDelay: `${i * 0.3}s` }} />
                <span className="text-[12px] font-medium text-white/70">{ch.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold" style={{ color: ch.color }}>{ch.status}</span>
                <span className="text-[10px] text-white/30">{ch.delta}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.4 }}
          className="mt-5 flex items-center justify-between rounded-lg border border-[#a78bfa]/15 bg-[#a78bfa]/[0.04] px-4 py-2.5"
        >
          <span className="text-[11px] text-white/50">Prochain compte rendu</span>
          <span className="text-[11px] font-semibold text-[#a78bfa]">15 jours</span>
        </motion.div>
      </div>

      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[10px] text-white/25 font-mono">
        <span>MONITOR · ITERATE</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
          Suivi continu
        </span>
      </div>
    </div>
  );
}
