# GEO Compare Admin Plan

## Emplacement retenu

- Mode global: `/admin/geo-compare`
- Mode client-linked: `/admin/clients/[id]/geo-compare`
- Intégration sidebar:
  - globale via `Outils GEO`
  - client via `Pilotage client > GEO Compare`
- Séparation explicite du moteur standard (`runs/prompts`) pour éviter toute pollution pipeline.

## Logique d usage

1. L opérateur ouvre GEO Compare en mode global ou client.
2. En mode client, les prompts suivis actifs sont chargés automatiquement.
3. L opérateur choisit:
   - prompt suivi du client
   - ou prompt libre
4. Source principale: URL (site client ou page ciblée).
5. Texte brut disponible en mode expert (repliable).
6. Lancement de la comparaison via `/api/admin/llm-compare`.
7. Lecture provider par provider:
   - statut, latence, usage, contenu brut
   - citations/URLs, concurrents, mention de marque, score signal
8. Lecture comparative:
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
- Le mode client conserve le contexte de sidebar/workspace et évite les ruptures navigation.

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
- `/api/admin/geo/client/[id]/prompts`
