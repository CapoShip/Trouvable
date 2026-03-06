# Trouvable — App Router V1

Ce projet est la plateforme SaaS "Trouvable.ca", dédiée à l'optimisation de la visibilité Intelligence Artificielle (GEO/AEO) pour les PME et commerces locaux.

## Architecture Actuelle (Mars 2026)

L'architecture vient d'être stabilisée sous **Next.js 16.1.x (App Router exclusif)**. Toute référence à un ancien environnement Vite, Pages Router, ou Create React App a été purgée de la base de code pour garantir la maintenabilité.

### Commandes Principales
- `npm run dev` : Lancer l'environnement de développement local.
- `npm run build` : Compiler le projet pour la production (Turbopack, vérification TS/ESLint & pages SEO statiques).
- `npm run lint` : Contrôler scrupuleusement le code.

### Règles d'or de Maintenabilité

1. **Routing** : Tout passe par `app/`. Aucun fichier de vue public ne doit être placé dans `pages/` pour éviter les conflits d'hydration et de compilation.
2. **Layout & Metadata** : Les metadata SEO dynamiques (Title, Canonical, OpenGraph) sont injectées automatiquement par les fonctions natives requises par Next (`export function generateMetadata`).
3. **Admin & Protection** : Tout le dossier `app/admin` est protégé par un système de vérification JWT géré dans le middleware natif (renommé `proxy.js` selon les nouvelles specs 16+ pour éviter les conflits). Ne pas modifier les stratégies Edge sans auditer ce fichier.
4. **Base de Données / Supabase** : 
   - Toute requête "admin" avec droit d'écriture doit utiliser le `service_role_key` via le helper serveur pour bypasser RLS de façon stricte (uniquement via Server Actions).
   - Les affichages publics (pages clients) exploitent la clé anonyme classique sans surcharger les droits.
5. **Composants d'UI** : Les blocs de rendu se trouvent dans `/components`, et l'injection Schema.org critique pour le modèle d'affaire réside au sein de `GeoSeoInjector.jsx` (Dictionnaire strict `VALID_BUSINESS_TYPES`).
6. **Contraintes BDD** : Ne modifiez pas en local les schémas Zod sans avoir vérifié au préalable les contraintes DB réelles (ex: `website_url` en `NOT NULL`).

## Déploiement

Le site est optimisé pour être déployé sur des environnements standard Node.js ou Edge (Vercel, Cloudflare Pages, VPS classique). Assurez-vous simplement que le `.env` de production respecte strictement la structure décrite dans `.env.example`.
