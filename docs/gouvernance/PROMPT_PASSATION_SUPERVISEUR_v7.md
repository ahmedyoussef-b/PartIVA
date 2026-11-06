# PROMPT PASSATION SUPERVISEUR — v7

**Date :** 2026-11-05
**Commit HEAD :** 1b96531
**Statut V2 :** Close et prouvée

## Résumé V2 (nouvelles fonctionnalités)

- **V2-A** (mocks) : close — 6 tests passed + logs serveur.
- **V2-B** (FAPI backend) : close — 20 résultats curl + 2/2 tests unitaires.
- **V2-V2** (UI FAPI) : close — 6/6 E2E passed.
- **V2-C** (cache web) : close — MISS 35.34s → HIT 12.76s, 18 candidats, `_cache: miss/hit`, FAPI dans `sourcesQueried`.

## Zones stables V2

- `src/lib/cache/search-cache.ts`
- `prisma/schema.prisma` (modèle `WebSearchCache`)
- `src/lib/connectors/aggregator.ts` (partie cache)
- `src/lib/connectors/fapi.ts`
- `src/components/search-bar.tsx`
- `src/app/api/search/route.ts` (lignes 35-42, `ALL_CONNECTORS`)

## Dettes actives (consolidé)

### V2 restantes
- `D-V2-CACHE-HIT-LATENCY-12S` (Basse) — HIT 12.76s au lieu de < 0.2s.
- `D-V2-CACHE-ENABLED-OPTION` (Basse) — documenter `skipCache`.
- `D-V2-FAPI-PAGINATION-NATIVE` (Basse) — pagination native FAPI.
- `D-V2-FAPI-HTTP-ERROR-TEST` (Basse) — tests 429/500.

### V1 pré-existantes
- `D-CAMPAIGN-CHECK-AUTH-VALIDITY` (Haute)
- `D-E57-DEEP-MODE-PLAYWRIGHT` (Haute, 2 tests fixme)
- `D-ADMIN-TEST-COVERAGE` (Moyenne)
- `D-WS-REFACTOR` (Moyenne)
- `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` (Haute)
- `D-V14-BLOB-NOT-CONFIGURED` (Moyenne)
- `D-V13A-NAVIGATION-NOT-CLICKABLE` (Moyenne)
- `D-V13A-A4-NO-STABLE-SELECTOR` (Moyenne)
- `D-E24-E2E-TIMEOUT-SOURCES` (Active, CI)
- `D-CI-BYPASS-ADMIN-PUSH` (Basse)

## Leçons V2

- **Leçon 19** : un correctif annoncé sans `Get-Content` n'est pas un correctif. Cline a menti 2× sur l'ajout de `fapiConnector` dans `ALL_CONNECTORS`. Toujours vérifier par lecture directe du fichier.
- **Leçon 20** : le cache doit être prouvé par les métriques `_cache: miss/hit` et `candidates.length` identiques sur les deux appels, pas seulement par le code.

## Prochaines phases recommandées

1. **Option C** (consolidation dettes Haute) — effort faible.
2. **Option A** (optimisation cache V2-D) — effort moyen.
3. **Option B** (nouvelles fonctionnalités V3) — effort élevé.
