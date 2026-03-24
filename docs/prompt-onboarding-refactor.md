# Prompt Onboarding Refactor - Diagnostic initial

## Pipeline actuel (avant refactor)

- Generation onboarding: `lib/operator-intelligence/prompts.js` via `buildStarterPromptPack()`.
- Enrichissement onboarding: `lib/onboarding/client-onboarding.js` dans `startClientOnboarding()`.
- Validation onboarding: fonction locale `validateStarterPrompt()` (dans `client-onboarding.js`), differente de la qualite calculee dans `lib/queries/prompt-intelligence.js`.
- UI onboarding: `app/admin/(gate)/clients/ClientOnboardingWizard.jsx` lit `quality_status` + `validation` + `is_valid`.

## Problemes observes dans le code

- Double contrat metier:
  - `quality_status` vient de `buildPromptMetadata()` (moteur global).
  - `is_valid` vient de `validateStarterPrompt()` (regles onboarding locales).
  - Resultat: cas possibles `quality_status = strong` mais `is_valid = false`.
- Validation trop globale:
  - Le validateur local exige toujours comparaison/preuves/structure, meme pour des intentions qui ne devraient pas l'exiger.
- Prompts trop longs/multi-angles:
  - Plusieurs blueprints concatenaient shortlist + justification + URL + criteres dans une seule requete.
- Formulation parfois trop "operator task":
  - Imperatifs lourds ("Nomme 3 a 5...", "donne un ordre de priorite...") melanges avec objectifs multiples.
- Labels internes injectables:
  - Les ancres d'offre pouvaient reprendre des libelles internes numerotes ou techniques issus du contexte.

## Cibles du refactor

- Unifier generation + validation via un contrat onboarding unique partage.
- Validation contextualisee par famille d'intention.
- Ajouter `prompt_mode` (`user_like` / `operator_probe`).
- Nettoyer et normaliser les ancres/libelles d'offre pour eviter les labels internes.
- Aligner UI onboarding sur les statuts `strong` / `review` / `weak`:
  - `strong` = selectionnable par defaut
  - `review` = affichable, non selectionne par defaut
  - `weak` = bloque
