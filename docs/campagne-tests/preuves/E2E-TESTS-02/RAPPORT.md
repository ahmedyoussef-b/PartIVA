# Rapport d'exécution — E2E-TESTS-02

**Date** : 2026-11-02T15:28:00Z
**SHA** : 4abd4db
**Exécuteur** : Coordinateur humain

## Cause racine
Build obsolète / serveur réutilisé : `.next` antérieur à la correction `AssistantZone.tsx` (rendu des `warnings` bruts). Le test ciblé passait sur un cache obsolète, masquant la régression dans la suite complète. Le code de `AssistantZone.tsx` et la spec `workspace.spec.ts` étaient corrects.

## Correction appliquée
- `src/components/workspace/AssistantZone.tsx` : ajout du rendu de `result.ingest.warnings` (chaînes brutes) en plus des `structuredWarnings`.
- Rebuild obligatoire (`npm run build`) + serveur propre avant exécution Playwright.

## Sortie brute Playwright (suite complète)
```
npx playwright test e2e/workspace/workspace.spec.ts --project=workspace --reporter=list
...
  2 skipped
  15 passed (1.3m)
```
Ligne finale : `15 passed, 2 skipped, 0 failed`.
Exit code : 0

## Tests skippés (tracés)
- `deep mode sends mode deep` (dette D-E57-DEEP-MODE-PLAYWRIGHT)
- `deep mode triggers engine with deep` (dette D-E57-DEEP-MODE-PLAYWRIGHT)

## Leçon
Un test ciblé vert ne prouve pas la suite ; seul le run complet sur un build frais fait foi. Règle E2E-PROOF à graver.

## Artefacts
- db-snapshot.json : docs/campagne-tests/preuves/E2E-TESTS-02/db-snapshot.json
- db-snapshot-retest.json : docs/campagne-tests/preuves/E2E-TESTS-02/db-snapshot-retest.json
- capture.png : N/A (optionnel)

## Verdict coordinateur
SUCCESS — suite complète 15/2/0 sur build frais.
