# Trouvable — Procédure d’hibernation réversible

## Objectif

Trouvable est conservé comme actif dormant. Le code, l’historique Git et les données restent disponibles, mais le déploiement public ne doit plus exécuter Next.js, Clerk, Supabase, Chromium, les fournisseurs IA, les synchronisations Google ou les tâches planifiées.

La référence applicative active avant hibernation est le commit :

```text
eea4736186c0e86324b3b61fdfc45abe9e2e77e5
```

Aucune donnée n’est supprimée par le chantier d’hibernation.

## Architecture cible

```text
trouvable.app
  -> Vercel CDN
     -> parking/index.html
     -> parking/404.html
     -> parking/robots.txt

GitHub
  -> Hibernation Gate léger
  -> External Cron manuel seulement avec confirmation RUN_ONCE
  -> CodeQL manuel
  -> Dependency Review manuel
  -> mises à jour Dependabot de version désactivées

Supabase
  -> données conservées
  -> projet à pauser uniquement après validation de la production statique
```

## Contrat du déploiement statique

Le déploiement doit respecter toutes les contraintes suivantes :

- preset Vercel `Other` via `framework: null` ;
- aucune installation de dépendances ;
- aucune fonction serverless ;
- aucun Cron Vercel ;
- aucun script client ;
- aucune ressource externe ;
- aucun formulaire ;
- aucun appel Clerk, Supabase, Clarity ou Vercel Analytics ;
- `noindex`, `nofollow` et `noarchive` ;
- CSP restrictive ;
- fichiers déployés limités à `index.html`, `404.html` et `robots.txt`.

Le script suivant valide ce contrat :

```bash
node scripts/validate-hibernation.mjs
```

## Séquence de mise en production

Respecter strictement cet ordre :

1. Faire passer le Hibernation Gate sur la pull request.
2. Vérifier le Preview Vercel : HTTP 200, HTML statique, aucune fonction, aucune requête externe.
3. Faire relire la pull request et corriger les problèmes P0/P1.
4. Fusionner explicitement la pull request dans `main`.
5. Vérifier le domaine de production `trouvable.app` sur mobile et desktop.
6. Vérifier les logs Vercel et confirmer l’absence d’invocation applicative.
7. Vérifier qu’aucun nouveau run automatique `External Cron` ne démarre.
8. Sauvegarder les secrets requis pour une reprise dans un coffre chiffré, jamais dans Git.
9. Pauser le projet Supabase Trouvable seulement après les vérifications précédentes.
10. Retirer ou révoquer les intégrations runtime inutilisées après confirmation de la pause.

## Interdictions de sécurité

Ne pas :

- pauser Supabase avant le déploiement statique production ;
- supprimer le projet Supabase ;
- supprimer les tables ;
- supprimer les variables ou secrets sans sauvegarde chiffrée ;
- désactiver les domaines de production ;
- merger automatiquement ;
- travailler directement sur `main` ;
- réactiver le Cron sans une validation explicite.

## Exécution manuelle exceptionnelle d’un Cron

Le workflow `External Cron (Hibernated)` ne possède aucun schedule. Une exécution exceptionnelle exige :

1. ouvrir le workflow manuellement ;
2. sélectionner la cible ;
3. sélectionner exactement `RUN_ONCE` ;
4. vérifier les logs et les effets produits.

Le choix par défaut `CANCEL` ne lance aucun job.

## Reprise de Trouvable

Pour réactiver l’application :

1. Restaurer le projet Supabase et attendre l’état `ACTIVE_HEALTHY`.
2. Créer une branche propre depuis le dernier `origin/main`, par exemple `revive/trouvable`.
3. Restaurer l’application depuis Git en annulant le commit d’hibernation ou en reprenant les fichiers applicatifs du commit `eea4736186c0e86324b3b61fdfc45abe9e2e77e5`.
4. Restaurer la configuration Vercel Next.js et les variables d’environnement depuis le coffre chiffré.
5. Restaurer les workflows CI, CodeQL, Dependency Review, External Cron et Dependabot seulement selon les besoins réels.
6. Exécuter :

```bash
npm ci
npm run lint
npm test
npm run build
```

7. Lancer le serveur local et vérifier les routes publiques, l’auth, le portail, l’admin et les APIs.
8. Vérifier console, Network, erreurs d’hydratation, mobile et desktop avec Playwright/Chrome DevTools.
9. Déployer un Preview et inspecter les logs Vercel avant toute promotion production.
10. Réactiver les tâches planifiées une par une, avec observation entre chaque étape.

## Rollback de l’hibernation

Le rollback applicatif consiste à annuler la pull request d’hibernation dans une nouvelle branche et à redéployer le Preview. Les données n’ayant pas été supprimées, aucune restauration destructive de base n’est requise.

Si Supabase a déjà été pausé, le restaurer avant de promouvoir l’application dynamique.

## Vérifications post-hibernation

- page d’accueil : HTTP 200 ;
- route inconnue : page 404 statique ;
- `robots.txt` : `Disallow: /` ;
- aucune balise `<script>` ;
- aucun formulaire ;
- aucune requête réseau externe ;
- aucune Vercel Function dans le déploiement ;
- aucun Cron automatique ;
- aucune nouvelle visite `TrouvableAuditBot` dans les logs Storage de Vistaire ;
- Supabase pausé uniquement après validation de la production statique.
