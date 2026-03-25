# Diagnostic de la dette technique (Task 8)

## 1. lib/db.js
**Taille et responsabilités :**
- C'est un “God object” ou "God module" qui centralise la majorité des interactions avec Supabase.
- Gère des domaines très variés : clients, audits, intelligence opérationnelle, jobs asynchrones, profiles, relations legacy.
- La complexité augmente drastiquement les risques de conflits lors des merges et rend la traçabilité des mutations difficile.

**Sous-domaines naturels de découpage :**
1. `lib/data/clients.js` : Opérations CRUD sur les entités clientes, geo-profils, et onboarding.
2. `lib/data/audits.js` : Lecture/écriture des requêtes de type crawls, analyses et scores d'audits.
3. `lib/data/jobs.js` : Gestion de la file d'attente (recurring_jobs, job_runs, locks).
4. `lib/data/intelligence.js` : Ce qui concerne les requêtes traquées, les opportunités et benchmarks IA.

**Plan de refactorisation (futur, sans risque actuel) :**
- *Phase 1* : Créer les fichiers de sous-domaines, exporter les fonctions depuis ces fichiers, et les ré-exporter depuis `lib/db.js` pour maintenir la compatibilité ascendante exacte.
- *Phase 2* : Migrer de la ré-exportation vers des imports directs dans l'application, domaine par domaine.

## 2. lib/audit/score.js
**Taille et responsabilités :**
- Contient des logiques lourdes de calcul algorithmique déterministe.
- Difficile à tester isolément sur des cas edge sans moquer de larges structures de données.

**Sous-domaines naturels de découpage :**
1. `lib/audit/scoring/seo-deterministic.js` : Isoler la logique de scan des balises internes.
2. `lib/audit/scoring/geo-deterministic.js` : Isoler la pondération locale.
3. `lib/audit/scoring/heuristics.js` : Déplacer les constantes de configuration et le système de pénalités/bonus.

**Plan de refactorisation :**
- Découpler les fonctions d'évaluation unitaires (ex: `evaluateTitleTag`) en fonctions pures dans un dossier spécifique.
- Garder `score.js` comme un assembleur/pipeline qui orchestre l'évaluation et calcule le score hybride, allégeant sa complexité cognitive.
