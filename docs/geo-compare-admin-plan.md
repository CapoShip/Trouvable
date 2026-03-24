# GEO Compare Admin Plan

## Emplacement retenu

- Route admin dédiée: `/admin/geo-compare`
- Intégration dans le shell admin existant via `AdminSidebar` (section `Outils GEO`).
- Séparation explicite du workspace client (`/admin/clients/[id]/*`) pour éviter de polluer les runs GEO standards.

## Logique d usage

1. L opérateur saisit un prompt GEO et une source (URL ou texte).
2. Optionnel: sélection d un client pour préremplir le contexte cible (marque, domaine, concurrents).
3. Lancement de la comparaison via `/api/admin/llm-compare`.
4. Lecture provider par provider:
   - statut, latence, usage, contenu brut
   - citations/URLs, concurrents, mention de marque, score signal
5. Lecture comparative:
   - meilleur provider global
   - plus de citations / concurrents
   - providers qui mentionnent la marque
   - hints de calibration prompt

## Decisions UI/UX

- UI dense et premium réutilisant les primitives `GeoPremium`:
  - `GeoSectionTitle`, `GeoKpiCard`, `GeoPremiumCard`, `GeoEmptyPanel`
- États explicites:
  - chargement, erreur globale
  - succès partiel (providers en erreur)
  - absence de signal GEO exploitable
- La vue est opérateur-first: la priorité est la décision, pas l esthétique démonstrative.

## Dépendances réutilisées

- Backend compare existant: `/api/admin/llm-compare`
- Utilitaires GEO existants:
  - `lib/geo-query-utils.js` (URLs, hostnames, type source, confiance)
- Shell admin:
  - `app/admin/(gate)/layout.jsx`
  - `app/admin/(gate)/components/AdminSidebar.jsx`
- API admin clients:
  - `/api/admin/geo/clients`
  - `/api/admin/geo/client/[id]`
