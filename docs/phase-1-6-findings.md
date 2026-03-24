# Phase 1.6 — Audit express (causes réelles)

## Problèmes observés

| Symptôme | Cause probable dans le code |
|----------|----------------------------|
| Citations souvent à 0 | Les citations sont des **mentions `entity_type: source`**, créées uniquement à partir **d’URLs extraites du texte brut** (`extractUrlsFromText`). Si le modèle répond sans URL, **aucune source** n’est persistée. |
| Concurrents souvent à 0 | Seules les lignes `entity_type: competitor` comptent (cf. `competitors.js`). La classification exige **liste de concurrents connue / alias**, **signal de reco forte**, ou mots-clés type « vs / alternative ». Le reste part en **`generic_mention`** → 0 concurrent confirmé. |
| Runs « terminés mais vides » | Un run peut être `completed` avec `parse_status: parsed_partial` et peu de mentions. Le pipeline **n’impose pas** de liens ni de liste de marques dans la réponse. |
| Warning « aucune source/citation… » peu actionnable | `computeGuardrails` (`kpi-core.js`) déclenchait `NO_SOURCES` sur volume agrégé, **sans** expliquer *pourquoi* (souvent: pas d’URL dans la réponse). |
| UI diagnostics illisibles | `translateDiagnostic` dans `GeoRunsView.jsx` utilisait des **clés typo** (`no_source_détectéd` au lieu de `no_source_detected`) → retombée sur le code brut. |
| Incohérence métriques modèles | `models.js` utilisait `total_mentioned` comme « citations » alors que c’est le **nombre total de mentions** (toutes entités). |
| Schema.org trop dominant | `resolveBusinessType` pilotait fortement le pack SaaS (ex. `LocalBusiness` + mots-clés → `saas`). Bug: `.replace(/\\s+/g,'_')` ne normalisait **pas** les espaces (regex littérale `\s` attendue). |
| Social listening « fantôme » | API slice `social` + `GeoSocialView` existent, **aucune route** `/clients/[id]/social` ni entrée nav → module invisible. |

## Corrections retenues (phase 1.6)

1. **Moteur / extraction** : enrichir `diagnostics` (codes `run_signal_tier`, `operator_reason_codes`, affinage `zero_*_reason`), forcer des **prompts query + analyse** qui demandent URLs et entités nommées.
2. **Guardrails** : message `NO_SOURCES` explicite + agrégation des raisons sur les **100 derniers runs** ; utiliser **sources externes** pour le seuil citation.
3. **UI** : cartographie diagnostic complète, badge **signal utile / faible / vide** sur les runs, empty states citations/concurrents plus honnêtes, liens prompts ↔ runs.
4. **Business type** : résolution **défensive** (audit `site_classification` > type brut), champs enrichis (`primary_use_case`, `market_positioning`, `differentiation_angle`, etc.), correction regex espaces.
5. **Prompts starter** : ancres JTBD / objections / résultats concrets à partir des services + résolution, moins de « meilleur X » seul.
6. **Social** : **Option A** — route + entrée nav « Veille » avec états explicites (connecteur off / erreur / données).
7. **models.js** : citations = `source_mentions` (ou équivalent dans `normalized_response`).

## Limites restantes (hors scope 1.6)

- Pas de **grounding** garanti si le provider ne renvoie pas de `sources` structurées exploitables (seule la présence d’URL dans le texte alimente les citations).
- La confirmation concurrent reste **conservatrice** par design (réduction du bruit) ; il faut des **concurrents déclarés** ou des prompts « vs / alternatives » pour monter en couverture.
- Données historiques : les nouveaux champs diagnostics sont surtout visibles sur les **runs post-déploiement** (anciens runs sans `run_signal_tier` restent dérivables via parse + mentions).
