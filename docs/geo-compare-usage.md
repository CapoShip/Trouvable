# GEO Compare (outil interne)

## Où se trouve le module

- Admin: `/admin/geo-compare`
- Navigation: section `Outils GEO` dans la sidebar admin.

## À quoi sert le module

- Comparer Gemini, Groq et Mistral sur une même requête GEO.
- Diagnostiquer la qualité des réponses pour calibration prompts:
  - citations / URLs
  - concurrents
  - mention marque cible
  - exploitabilité du signal

## Différence avec le moteur GEO standard

- `GEO Compare` = outil de calibration interne ponctuelle.
- Moteur GEO standard = runs persistés et pipeline opérateur client.
- Le module n altère pas `run-tracked-queries` ni les runs standards.

## Workflow conseillé équipe

1. Tester un prompt candidate avec source texte/URL.
2. Vérifier signal par provider (citations, concurrents, marque).
3. Lire la synthèse comparative et les hints calibration.
4. Décider:
   - garder le prompt
   - le réécrire
   - le classer benchmark-only
   - le rejeter

## Bonnes pratiques opérateur

- Ajouter un contexte client quand pertinent (préremplissage).
- Éviter les prompts trop vagues (faible signal multi-provider).
- Surveiller les succès partiels et ne pas surinterpréter un provider en erreur.
