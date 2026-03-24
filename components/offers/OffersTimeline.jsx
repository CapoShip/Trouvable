"use client";

import { motion } from "framer-motion";
import { Crosshair, BarChart3, Hammer, FileText, RotateCcw } from "lucide-react";

const STEPS = [
  { icon: Crosshair, title: "Cadrage", desc: "Objectifs, territoire, contraintes, interlocuteur unique." },
  { icon: BarChart3, title: "Preuve", desc: "État initial documenté, repères mesurables." },
  { icon: Hammer, title: "Exécution", desc: "Nous appliquons ; vous validez ce qui est convenu." },
  { icon: FileText, title: "Compte rendu", desc: "Ce qui est fait, ce qui reste, ce que nous observons." },
  { icon: RotateCcw, title: "Poursuite", desc: "Clôture du mandat ou passage au pilotage récurrent." },
];

export default function OffersTimeline() {
  return (
    <section className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]"
        >
          Notre cadre de travail
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="mb-6 text-center text-[clamp(26px,3.5vw,42px)] font-bold tracking-[-0.04em]"
        >
          Comment nous travaillons ensemble
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mb-16 max-w-xl text-center text-[15px] leading-relaxed text-[#888]"
        >
          Pas de promesse de « première place » : une exécution disciplinée, des livrables vérifiables et une lecture honnête des résultats.
        </motion.p>

        <div className="relative">
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/8 to-transparent md:left-1/2 md:block" />

          <div className="space-y-10 md:space-y-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20, x: isLeft ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative flex items-start gap-6 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} md:items-center md:py-8`}
                >
                  <div className={`hidden md:flex md:w-1/2 ${isLeft ? "md:justify-end md:pr-12" : "md:justify-start md:pl-12"}`}>
                    <div className="max-w-[320px] rounded-xl border border-white/6 bg-white/[0.02] p-5 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
                      <div className="mb-1.5 text-[14px] font-semibold text-white">{step.title}</div>
                      <p className="text-[13px] leading-[1.55] text-[#999]">{step.desc}</p>
                    </div>
                  </div>

                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0d0d0d] md:absolute md:left-1/2 md:-translate-x-1/2">
                    <span className="text-[11px] font-mono font-bold text-[#7b8fff]">{String(i + 1).padStart(2, "0")}</span>
                  </div>

                  <div className="flex-1 md:hidden">
                    <div className="text-[14px] font-semibold text-white mb-1">{step.title}</div>
                    <p className="text-[13px] leading-[1.55] text-[#999]">{step.desc}</p>
                  </div>

                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
