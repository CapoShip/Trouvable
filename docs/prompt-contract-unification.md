# Prompt Contract Unification

## Audit des sources actuelles

### Generation de prompts
- `lib/operator-intelligence/prompts.js`
  - `buildPromptBlueprints()`
  - `buildStarterPromptPack()`
- `lib/onboarding/client-onboarding.js`
  - `startClientOnboarding()` (pack onboarding)
  - `activateClientOnboarding()` (normalisation avant persistence)

### Evaluation / scoring / validation
- Base canonique (nouvelle): `lib/queries/onboarding-prompt-contract.js`
  - `buildCanonicalPromptContract()`
  - `evaluateOnboardingPromptContract()`
- Couche compat / usage transverse: `lib/queries/prompt-intelligence.js`
  - `buildPromptMetadata()` -> delegue au contrat canonique
  - `evaluatePromptQuality()` -> delegue au contrat canonique

### Persistence / lecture
- Create / update prompt: `app/api/admin/queries/create/route.js`, `app/api/admin/queries/update/route.js`
- DB access: `lib/db.js`
- Projection operateur: `lib/operator-intelligence/prompts.js` (`getPromptSlice()`)

## Divergences detectees avant convergence

- Deux systemes de verite:
  - Qualite globale (`evaluatePromptQuality`)
  - Contrat onboarding (`evaluateOnboardingPromptContract`)
- Champs contractuels partiellement persistes:
  - `prompt_mode`, `validation_status`, `validation_reasons` surtout dans des objets heterogenes
- UI non uniforme:
  - onboarding lisait le nouveau contrat
  - vue prompts suivis restait orientee legacy

## Strategie de convergence appliquee

1. Definir un builder canonique unique:
   - `buildCanonicalPromptContract()` dans `onboarding-prompt-contract.js`
2. Faire converger les wrappers historiques:
   - `buildPromptMetadata()` et `evaluatePromptQuality()` deleguent tous deux au builder canonique
3. Unifier la projection operateur:
   - `getPromptSlice()` reconstruit/fallback tous les champs via le contrat canonique
4. Unifier create/update prompts:
   - metadata canoniques calculees partout
   - champs structurants persistes explicitement dans `prompt_metadata` (quand colonnes dediees non garanties)
5. Aligner UI prompts suivis:
   - affichage `prompt_mode`, raisons de validation, statuts uniformes

## Contrat canonique cible

Champs principaux:
- `query_text` (obligatoire)
- `intent_family` (derive)
- `prompt_mode` (derive ou fourni)
- `quality_status` (derive)
- `quality_score` (derive)
- `quality_reasons` (derive)
- `validation_status` (derive, aligne sur quality_status)
- `validation_reasons` (derive)
- `prompt_origin` (fourni)
- `query_type_v2`, `funnel_stage`, `geo_scope`, `brand_scope`, `comparison_scope` (derives)
- `locale` (obligatoire avec fallback)
- `offer_anchor`, `user_visible_offering`, `target_audience`, `primary_use_case`, `differentiation_angle` (derive/fourni selon contexte)
- `is_valid`, `is_selected_default`, `activation_blocked` (derive)

## Persistence recommandee

- Colonnes deja stables:
  - `quality_status`, `quality_score`, `quality_reasons`, `intent_family`, `prompt_origin`, `query_type_v2`, `funnel_stage`, `geo_scope`, `brand_scope`, `comparison_scope`, `locale`
- Champs structurants additionnels:
  - persistes de facon explicite dans `prompt_metadata`:
    - `prompt_mode`
    - `validation_status`
    - `validation_reasons`
    - `offer_anchor`
    - `user_visible_offering`
    - `target_audience`
    - `primary_use_case`
    - `differentiation_angle`

## Resultat attendu

- Une seule logique de qualification/scoring.
- Meme semantique onboarding + prompts suivis + starter pack + UI operateur.
- Fin des contradictions `strong` vs `refused`.
