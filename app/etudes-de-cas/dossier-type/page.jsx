"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Lock,
  ShieldCheck,
  Target,
  CheckCircle2,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ContactButton from "@/components/ContactButton";

const MANDATE_FLOW = [
  {
    id: "cartographie",
    label: "Cartographie strategique",
    description:
      "Lecture croisee des signaux publics, inventaire des ecarts entre discours commercial et traces visibles, priorisation des causes qui freinent la visibilite.",
  },
  {
    id: "implementation",
    label: "Mandat d implementation",
    description:
      "Execution des correctifs et enrichissements sur perimetre valide, avec tracabilite de chaque action appliquee et controle des points sensibles.",
  },
  {
    id: "pilotage",
    label: "Pilotage continu",
    description:
      "Suivi periodique, arbitrages de priorites, iteration sur les signaux Google et IA, puis compte rendu consolide pour la direction.",
  },
];

const DELIVERABLE_EXAMPLES = [
  {
    title: "Synthese direction",
    details:
      "Document court de decision: situation de depart, risques principaux, priorites retenues, limites connues et ordre d execution recommande.",
  },
  {
    title: "Plan d action mandate",
    details:
      "Feuille de route operationnelle avec sections par lot, dependances, statut par action et criteres de validation avant cloture.",
  },
  {
    title: "Compte rendu de periode",
    details:
      "Recapitulatif factuel des actions executees, points stables, points en progression, risques ouverts et prochaines actions proposees.",
  },
];

const METRIC_EXAMPLES = [
  "Evolution du score GEO et du score SEO sur periode comparable",
  "Couverture des requetes suivies (presence, mention, position relative)",
  "Cohesion des informations publiques (coordonnees, services, zones, preuves)",
  "Etat du backlog d actions (livrees, en cours, a arbitrer)",
];

const DOSSIER_READING_GUIDE = [
  {
    title: "Lecture direction",
    text: "Vue synthetique pour arbitrer: ce qui a bouge, ce qui reste stable, et les decisions de perimetre a valider.",
  },
  {
    title: "Lecture operationnelle",
    text: "Plan d action detaille pour suivre l execution: priorites, dependances, et ordre de deploiement.",
  },
  {
    title: "Lecture de compte rendu",
    text: "Narratif de periode relie aux signaux mesures: progression, stabilite, risques, et prochaines actions engagees.",
  },
];

const HERO_OVERVIEW_TEXT =
  "Ce dossier-type illustre la forme reelle d un compte rendu Trouvable: sections de contexte, sequence de mandats, extraits de livrables et lecture direction. Les contenus sensibles sont anonymises ou remplaces par des placeholders.";

export default function DossierTypePage() {
  const [heroOverview, setHeroOverview] = useState("");

  useEffect(() => {
    setHeroOverview(HERO_OVERVIEW_TEXT);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#050505)]" />

      <main>
        <section className="relative mt-[58px] overflow-hidden px-6 pb-14 pt-[84px] sm:px-10 sm:pt-[104px]">
          <div className="pointer-events-none absolute left-1/2 top-[-110px] z-0 h-[540px] w-[860px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.07)_0%,transparent_62%)]" />
          <div className="relative z-[1] mx-auto max-w-[1000px]">
            <motion.nav
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-7 flex items-center gap-2 text-[12px] font-medium text-white/40"
            >
              <Link href="/etudes-de-cas" className="transition-colors hover:text-white">
                Etudes de cas
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/65">Dossier-type</span>
            </motion.nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.04 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-white/45"
            >
              <Lock className="h-3.5 w-3.5" />
              Exemple structure de dossier
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 text-[clamp(32px,5vw,62px)] font-bold leading-[1.06] tracking-[-0.045em]"
            >
              Dossier-type de mandat<br />
              <span className="bg-gradient-to-b from-white/55 to-white/20 bg-clip-text text-transparent">version concrete, sans donnees reelles publiees</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              translate="no"
              className="mt-5 max-w-3xl text-[16px] leading-[1.7] text-[#a0a0a0] notranslate"
            >
              <span>{heroOverview}</span>
            </motion.p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-amber-200">
                Confidentialite: anonymisation active
              </div>
              <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-white/45">
                Placeholder: extraits reels a ajouter par le fondateur
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-6 py-20 sm:px-10">
          <div className="mx-auto grid max-w-[1000px] gap-6 lg:grid-cols-[1.1fr_1fr]">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-7"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-white/55">
                <Target className="h-3.5 w-3.5" />
                Contexte initial
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">Secteur, territoire, problematique</h2>
              <p className="mt-4 text-[14px] leading-[1.7] text-white/70">
                Exemple structure: cabinet de services local, territoire prioritaire a definir, et ecart entre perception interne et signal public observe sur Google et dans les reponses IA.
              </p>
              <p className="mt-3 text-[14px] leading-[1.7] text-white/60">
                Placeholder a completer avec un cas reel: secteur precis, zone couverte, contexte concurrentiel, contraintes metier.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-7"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-white/55">
                <ShieldCheck className="h-3.5 w-3.5" />
                Cadre de lecture
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">Ce dossier est un exemple structure</h2>
              <p className="mt-4 text-[14px] leading-[1.7] text-white/70">
                Les informations reelles sont anonymisees ou remplacees par des placeholders. Aucun nom de client, aucun chiffre public sensible, aucun extrait identifiant n est publie sur cette page.
              </p>
            </motion.article>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-[#060606] px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[1000px]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b8fff]">Sequence de mandat</div>
              <h2 className="text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.03em] text-white">Ce que Trouvable a fait</h2>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-3">
              {MANDATE_FLOW.map((step, idx) => (
                <motion.article
                  key={step.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">Etape {String(idx + 1).padStart(2, "0")}</div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-white">{step.label}</h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-white/65">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-[1000px]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b8fff]">Extraits attendus</div>
              <h2 className="text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.03em] text-white">Exemples de livrables</h2>
            </motion.div>

            <div className="space-y-3">
              {DELIVERABLE_EXAMPLES.map((item, idx) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-[#0b0b0b] p-5"
                >
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-white/50" />
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-white">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.7] text-white/65">{item.details}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-[#060606] px-6 py-20 sm:px-10">
          <div className="mx-auto grid max-w-[1000px] gap-8 lg:grid-cols-2">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Exemples de metriques suivies</h2>
              <ul className="mt-5 space-y-3 text-[14px] text-white/65">
                {METRIC_EXAMPLES.map((metric) => (
                  <li key={metric} className="flex items-start gap-2.5 leading-[1.7]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs uppercase tracking-[0.08em] text-white/35">
                Aucun chiffre reel n est publie ici. Types de metriques uniquement.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Comment le client lit ce dossier</h2>
              <div className="mt-5 space-y-4">
                {DOSSIER_READING_GUIDE.map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45">{item.title}</div>
                    <p className="mt-2 text-[14px] leading-[1.7] text-white/65">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.article>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-24 sm:px-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[680px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.05)_0%,transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-[700px] text-center">
            <motion.h3
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.03em] text-white"
            >
              Ouvrir un mandat avec un dossier pilote
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.7] text-white/65"
            >
              Nous cadrons le perimetre, executons les actions et livrons un compte rendu exploitable pour votre direction.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mt-8"
            >
              <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                Demander un cadrage initial <ArrowRight className="h-4 w-4" />
              </ContactButton>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
