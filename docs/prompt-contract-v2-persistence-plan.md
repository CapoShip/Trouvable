# Prompt Contract v2 - Persistence Plan

## Etat actuel (avant durcissement v2)

- Colonnes deja first-class dans `tracked_queries`:
  - `prompt_origin`, `intent_family`, `query_type_v2`, `funnel_stage`,
  - `geo_scope`, `brand_scope`, `comparison_scope`,
  - `quality_status`, `quality_score`, `quality_reasons`,
  - `prompt_metadata` (jsonb).
- Champs critiques encore hybrides/metadata-driven:
  - `prompt_mode`
  - `validation_status`
  - `validation_reasons`
  - `offer_anchor`
  - `user_visible_offering`
  - `target_audience`
  - `primary_use_case`
  - `differentiation_angle`

## Dette constatee

- Les endpoints create/update/onboarding serialisaient localement le contrat.
- Les lectures operateur faisaient des fallback heterogenes entre colonnes et metadata.
- `prompt_metadata` servait encore de fourre-tout pour des champs structurants.

## Decision par champ

### Passe en first-class (colonnes)
- `prompt_mode`: structurant (UX + pipeline + qualification).
- `validation_status`: structurant (coherence activation/lecture).
- `validation_reasons`: structurant (explicabilite operateur).
- `offer_anchor`: structurant (ancrage intention produit/service).
- `user_visible_offering`: structurant (lisibilite user-facing).
- `target_audience`: structurant (qualification requete).
- `primary_use_case`: structurant (projection metier).
- `differentiation_angle`: structurant (intent concurrentiel/diff).

### Reste en `prompt_metadata` (volontairement)
- Metadonnees non canoniques et evolutives:
  - horodatages techniques (`generated_at`)
  - traces de compatibilite legacy
  - attributs experimentaux non stabilises

## Strategie de migration

1. Ajouter colonnes v2 avec defaults/guardrails.
2. Backfill defensif depuis `prompt_metadata` + fallback sur colonnes deja presentes.
3. Ajouter contraintes de domaine:
   - `prompt_mode in ('user_like', 'operator_probe')`
   - `validation_status in ('strong','review','weak')`
4. Ajouter indexes operationnels (`prompt_mode`, `validation_status`).
5. Conserver `prompt_metadata` pour compatibilite et enrichissements non critiques.

## Strategie applicative

- Introduire une couche unique de persistence:
  - `lib/queries/prompt-contract-persistence.js`
  - serialisation: contrat canonique -> colonnes + metadata
  - deserialisation: row DB -> projection canonique
- Brancher cette couche dans:
  - onboarding activation
  - create/update prompt
  - lecture operateur (`getPromptSlice`)

## Resultat vise

- Contrat canonique explicite et stable en base.
- Moins de couplage a `prompt_metadata`.
- Cohesion end-to-end create/update/onboarding/lecture.
