"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Structuration des données", status: "done" },
  { label: "Enrichissement contenu", status: "done" },
  { label: "Validation qualité", status: "active" },
  { label: "Déploiement sécurisé", status: "pending" },
  { label: "Contrôle d\u2019intégrité", status: "pending" },
];

export default function MandateVisualImplementation() {
  return (
    <div className="relative rounded-2xl border border-white/8 bg-[#0a0a0a] p-6 sm:p-8 min-h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(52,211,153,0.04)_0%,transparent_60%)]" />

      <div className="relative flex flex-col gap-0">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/25">Pipeline d&apos;exécution</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            3/5 validés
          </span>
        </div>

        {STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                {step.status === "done" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {step.status === "active" && <Loader2 className="h-5 w-5 text-[#5b73ff] animate-spin" style={{ animationDuration: "2s" }} />}
                {step.status === "pending" && <Circle className="h-5 w-5 text-white/15" />}
              </div>
              <div className="flex flex-1 items-center justify-between py-3">
                <span className={`text-[13px] font-medium ${step.status === "done" ? "text-white/80" : step.status === "active" ? "text-white" : "text-white/30"}`}>
                  {step.label}
                </span>
                <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${
                  step.status === "done" ? "bg-emerald-400/10 text-emerald-300" :
                  step.status === "active" ? "bg-[#5b73ff]/15 text-[#7b8fff]" :
                  "bg-white/[0.03] text-white/20"
                }`}>
                  {step.status === "done" ? "Validé" : step.status === "active" ? "Actif" : "À venir"}
                </span>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="ml-[9px] h-3 w-px" style={{ backgroundColor: step.status === "done" ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)" }} />
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="mt-5 pt-4 border-t border-white/6"
        >
          <div className="flex items-center justify-between text-[11px] text-white/30 mb-2">
            <span>Progression</span>
            <span className="font-mono">60%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "60%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 1.1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[10px] text-white/25 font-mono">
        <span>DEPLOY · MERGE</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Exécution
        </span>
      </div>
    </div>
  );
}
