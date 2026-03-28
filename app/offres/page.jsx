import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import OffersHero from "@/components/offers/OffersHero";
import OffersStickyNav from "@/components/offers/OffersStickyNav";
import OffersTimeline from "@/components/offers/OffersTimeline";
import MandateSection from "@/components/offers/MandateSection";
import MandateVisualCartography from "@/components/offers/MandateVisualCartography";
import MandateVisualImplementation from "@/components/offers/MandateVisualImplementation";
import MandateVisualContinuous from "@/components/offers/MandateVisualContinuous";
import OffersDecisionBlock from "@/components/offers/OffersDecisionBlock";
import OffersFinalCta from "@/components/offers/OffersFinalCta";

export const metadata = {
  title: "Mandats de visibilité | Trouvable",
  description:
    "Trois mandats : cartographie stratégique, implémentation encadrée, pilotage continu. Visibilité Google et réponses IA, exécutée par notre équipe.",
};

const MANDATES = {
  cartographie: {
    id: "cartographie-strategique",
    number: "01",
    title: "Cartographie stratégique",
    accent: "#5b73ff",
    reversed: false,
    subtitle:
      "Un constat net sur votre visibilité Google et votre crédibilité dans les réponses IA — avant tout investissement d\u2019exécution.",
    hook: "Lecture croisée de vos signaux publics, scénarios de recherche sur votre marché, hiérarchisation des causes (Google local, recherche organique, cohérence face aux systèmes conversationnels). Vous recevez une synthèse direction, un plan d\u2019action priorisé, les risques et critères de succès alignés sur notre cadre de mesure.",
    forWho:
      "Dirigeants de firmes de services professionnels — cabinets juridiques, financiers, de santé, d'ingénierie — qui veulent trancher sur des faits, pas sur des impressions.",
    when: "Reprise en main, refonte, baisse d\u2019appels entrants, arbitrage budgétaire ou cadrage avant mandat.",
    outcome:
      "Décision claire : quoi corriger en premier, pourquoi, et dans quel ordre — base pour chiffrer la phase d\u2019exécution.",
    bullets: [
      "Écart entre votre discours commercial et ce que les systèmes retiennent",
      "Priorités : cohérence des données publiques, fondations, preuves locales",
      "Feuille de route exploitable, sans engagement de suite",
      "Points de contrôle pour mesurer l\u2019impact ensuite",
    ],
    cta: "Demander une cartographie",
    secondaryLink: { href: "/notre-mesure", label: "Voir notre cadre de mesure" },
  },
  implementation: {
    id: "mandat-implementation",
    number: "02",
    title: "Mandat d\u2019implémentation",
    accent: "#34d399",
    reversed: true,
    subtitle:
      "Nous exécutons les corrections et enrichissements sur un périmètre défini : vous validez les points sensibles convenus, nous déployons.",
    hook: "Mise aux normes des informations publiques, contenus et structuration attendus par les moteurs, intégrations sans fragiliser l'existant, contrôle qualité et preuve de ce qui a été appliqué. Vous recevez des livrables documentés, un compte rendu d'exécution et la liste des changements réels.",
    forWho:
      "Firmes de services professionnels locales qui ont identifié leurs priorités et veulent passer à l'exécution sans mobiliser de ressource interne.",
    when: "Après cartographie Trouvable ou lorsque le diagnostic existe déjà et doit être mis en \u0153uvre proprement.",
    outcome:
      "Signal public plus lisible et cohérent ; base solide pour que Google et les réponses IA s\u2019appuient sur des informations vérifiables.",
    bullets: [
      "Périmètre contractualisé — pas de prestation floue",
      "Correctifs prioritaires et enrichissements métier",
      "Traçabilité des changements appliqués",
      "Garde-fous : pas de promesse de résultat instantané",
      "Passage de relais clair vers le pilotage si vous poursuivez avec nous",
    ],
    cta: "Lancer le mandat d\u2019implémentation",
    secondaryLink: { href: "/etudes-de-cas/dossier-type", label: "Aperçu d\u2019un dossier-type" },
  },
  pilotage: {
    id: "pilotage-continu",
    number: "03",
    title: "Pilotage continu",
    accent: "#a78bfa",
    reversed: false,
    subtitle:
      "Un rôle dédié : veille, mesure, arbitrage et itérations sur votre visibilité Google et votre crédibilité dans les réponses IA.",
    hook: "Suivi selon notre cadre de mesure, revue des scénarios de recherche, ajustements contenus et signaux, compte rendu périodique et exécution dans le périmètre convenu. Vous recevez un compte rendu régulier, un backlog priorisé, les actions réalisées pendant la période et un accès direct au responsable de dossier.",
    forWho:
      "Marchés serrés, multi-établissements, saisonnalité forte, ou besoin d\u2019un interlocuteur unique sur le sujet.",
    when: "Après implémentation, ou lorsque l\u2019enjeu est récurrent (concurrence, mises à jour des moteurs, extension géographique).",
    outcome:
      "Stabilité et progression mesurée de la présence pertinente et de la qualité de la recommandation ; moins de dérive entre canaux.",
    bullets: [
      "Rythme et périmètre fixés dans le mandat",
      "Signaux, présence et indicateurs business distingués",
      "Itérations fondées sur des constats",
      "Relation directe, pas de file anonyme",
    ],
    cta: "Discuter d\u2019un mandat récurrent",
    secondaryLink: null,
  },
};

export default function OffersPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
      <Navbar />
      <OffersStickyNav />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

      <main>
        <OffersHero />

        <OffersTimeline />

        <MandateSection {...MANDATES.cartographie}>
          <MandateVisualCartography />
        </MandateSection>

        <MandateSection {...MANDATES.implementation}>
          <MandateVisualImplementation />
        </MandateSection>

        <MandateSection {...MANDATES.pilotage}>
          <MandateVisualContinuous />
        </MandateSection>

        <OffersDecisionBlock />

        <OffersFinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}
