# CONTEXT — PartIVA

**Dernière mise à jour :** 2026-10-19
**Commit HEAD :** `649c2b6` (E12-R2)
**Phase en cours :** E12 — **TERMINÉE** — E12-R1 + E12-R2 clôturées, ouverture E13 à venir
**Tag :** `v0.3.0-e9` (E9) · `v0.4.0-e10` (E10) · `v0.5.0-e11` (E11) · `v0.5.1-e12` (E12)

## État
- Le repo est sain (HEAD = `649c2b6`).
- `next.config.mjs` : `output: 'export'` ✅
- `tauri.conf.json` : sidecar retiré, `frontendDist: "../../out"`, `url: "index.html"` ✅
- Sidecar supprimé (`desktop/server/`, `build-server.cjs`, `node.exe`) ✅
- `src/app/api/` déplacé en `api.disabled/` ✅
- Build export web : ✅ **passe** (22 pages statiques)
- Build desktop Tauri : ✅ **passe** (installeur NSIS 4.99 MiB)
- `data-client.ts` : ✅ existe, 11 fonctions `invoke` + fallback `fetch`
- 4 pages desktop : ✅ **toutes conformes** (dashboard, materiaux, audit, demandes)
- 15 pages admin : ✅ **toutes fonctionnelles** (6 Server Components courts + 9 Server Components + Client Components)
- `mapRequestToUi` : ✅ corrigé (tolérant Date/string)
- **E9-R10 : Pont Tauri ↔ Rust ↔ SQLite validé** — `invoke` retournent `[]` (base vide), pas d'erreur CSP, dashboard affiché ✅
- **E11-R1** : Validation fonctionnelle Vercel — 8/8 tests Playwright passés (6 pages + login + healthcheck) ✅

## E12 — Recherche avancée (COMPLÈTE)

- **E12-R1d** : UI recherche — `search-bar.tsx` (6 modes, onglets, debounce 300ms), panneau filtres, sélecteur tri (pertinence/date/nom/statut), facettes cliquables, pagination, badge filtres actifs ✅
- **E12-R1c** : Facettes API `/api/search/facets` (material, status, cache 30s) ✅
- **E12-R1b** : Filtres (material, status, createdAfter, createdBefore, minScore) + tri (relevance/date/nom/status) + pagination ✅
- **E12-R1a** : Spécification recherche avancée (filtres, tri, facettes, pagination) ✅
- **E12-R2** : Purge P0+P1 — `D-E12-MACHINE-FILTER` (retirée : pas de FK `Part`→`Machine`), `D-E12-LIMIT-100` (`max(50)`→`max(100)`), `D-E12-MINSCORE-MONO` (ignoré en mono-mode), `D-E12-FILTERS-MONO` (Stratégie B documentée) ✅ (commit `649c2b6`)
- `lib/search-constants.ts` : `PART_STATUS_VALUES` aligné PartStatus (11 valeurs) — dette D-E12-STATUS-ENUM clôturée E12-R1d ✅
- `schemas/search.ts` : `z.enum(PART_STATUS_VALUES)` aligné PartStatus ✅
- `api/search/route.ts` : `statusOrder` tri aligné PART_STATUS_VALUES (détection ordre statut) ✅
- E2E : 48/50 passés (2 skips photo), typecheck 0, lint 0 ✅
- Closed : `docs(DEBT): D-E12-SEED-E2E` (commit `99a3ddc`) ✅

## Dettes actives
- `D-E10-R2b-1` (search-bar : perte d'état au rechargement) — Faible — **post-E12**
- `D-E13-3D-FEATURES` (fonctionnalités 3D manquantes, 3DCarParts) — Multi-niveaux (H/M/F) — **E14**


**Dettes clôturées :** voir `DEBT.md` section « Clôturées » (9 E10 + 2 E9 + 1 E11 + 6 E12).

## Décisions récentes
- `D-E9-R7-1` : Refonte vers `output: 'export'` (abandon sidecar)
- `D-E9-R7-2` : Périmètre desktop = 4 pages — **Fait**
- **E9-R10** : Validation technique complète
- **E10-R4a** : Requalification `R7-1`/`R7-1b` — 9/9 pages fonctionnelles (leçon : « petit fichier » ≠ « stub »)
- **E11-R1** : Validation fonctionnelle Vercel 8/8 — `D-E9-R5-1` clôturée
- **E12-R0** : Cadrage E12 — feature recherche avancée + `ROADMAP.md` E10/E11 à jour
- **E13-R0** : Cadrage E13 (hygiène) + E14 (enrichissement 3D) — 6 fonctionnalités manquantes identifiées (analyse 3DCarParts)
- **Décisions E14** : D1 (Oui), D2 (Oui), D3 (Non — dette), D4 (Oui), D5 (Oui), D6 (Oui — dette)