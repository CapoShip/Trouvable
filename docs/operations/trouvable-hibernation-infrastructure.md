# Trouvable — Verrous d’infrastructure après rollout

## Déploiements Git Vercel

Le site statique a été déployé en production avant l’activation de ce verrou. La configuration impose ensuite :

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

Aucun push GitHub ne doit donc créer automatiquement un nouveau Preview ou un nouveau déploiement production. Une reprise exige de retirer ce verrou dans une branche de réactivation, puis d’effectuer un déploiement manuel contrôlé.

Le script `scripts/vercel-ignore-hibernation.mjs` reste présent comme défense supplémentaire pour les déploiements qui évaluent encore l’Ignored Build Step.

## Injection Cloudflare observée

La source statique Trouvable ne contient aucun script. Lors de la validation du domaine de production, Cloudflare a néanmoins injecté à l’edge un script sous `/cdn-cgi/challenge-platform/` sur la page d’accueil.

La CSP Trouvable conserve `default-src 'none'` et ne permet aucun `script-src`; le script injecté est donc bloqué par le navigateur. Cette injection :

- ne vient pas du repo ;
- ne dépend pas de Vercel Functions ;
- ne contacte pas Supabase ;
- peut produire une violation CSP visible dans la console selon les réglages Cloudflare actifs.

Pour obtenir une réponse HTTP sans aucun octet JavaScript injecté, désactiver explicitement dans Cloudflare les fonctions JavaScript Detections/Bot concernées pour le domaine Trouvable, ou passer le record en DNS-only après validation DNS/TLS. Cette modification Cloudflare n’est pas automatisée par le repo et doit être vérifiée séparément.

## Supabase

Le projet Supabase Trouvable ne doit être pausé qu’après la validation du site statique production. La restauration du projet est la première étape obligatoire avant toute réactivation de l’ancienne application.
