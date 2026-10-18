# CONTEXT — PartIVA

**Dernière mise à jour :** 2026-10-18
**Commit HEAD :** `c8e40da` (E11-R1)
**Phase en cours :** E11 — **TERMINÉE**
**Tag :** `v0.3.0-e9` (E9) · `v0.4.0-e10` (E10) · `v0.5.0-e11` (à créer)

## État
- Le repo est sain (HEAD = `c8e40da`).
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

## Dettes actives
- `D-E10-R2b-1` (search-bar : perte d'état au rechargement) — Faible — **post-E11**


**Dettes clôturées :** voir `DEBT.md` section « Clôturées » (9 E10 + 2 E9 + 1 E11).

## Décisions récentes
- `D-E9-R7-1` : Refonte vers `output: 'export'` (abandon sidecar)
- `D-E9-R7-2` : Périmètre desktop = 4 pages — **Fait**
- **E9-R10** : Validation technique complète
- **E10-R4a** : Requalification `R7-1`/`R7-1b` — 9/9 pages fonctionnelles (leçon : « petit fichier » ≠ « stub »)
- **E11-R1** : Validation fonctionnelle Vercel 8/8 — `D-E9-R5-1` clôturée
- **E12-R0** : Cadrage E12 — feature recherche avancée + `ROADMAP.md` E10/E11 à jour