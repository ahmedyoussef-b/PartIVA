# CONTEXT — PartIVA

**Dernière mise à jour :** 2026-10-18
**Commit HEAD :** `3f17d98` (E10-R1)
**Phase en cours :** E10 — **En cours**
**Tag :** `v0.3.0-e9`

## État
- Le repo est sain (HEAD = `3f17d98`).
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

## Dettes actives
- `D-E9-R3a-1` (flash navigation) — Faible
- `D-E9-R3b-3` (non-migration pages) — Faible
- `D-E9-R3b-bis-1` (validation GUI reportée) — Faible
- `D-E9-R4b1-1` (client non miroité) — **Requalifiée** (non bloquante)
- `D-E9-R4b1-2` (photos TEXT JSON) — **Requalifiée** (non bloquante)
- `D-E9-R5-1` (validation fonctionnelle reportée) — **Reportée** (dépend Vercel + token)


**Dettes clôturées :** voir `DEBT.md` section « Clôturées » (`D-E9-R3a-2`, `D-E9-R3a-3`, `D-E9-R6-2`, `D-E9-R7-2`).

## Décisions récentes
- `D-E9-R7-1` : Refonte vers `output: 'export'` (abandon sidecar)
- `D-E9-R7-2` : Périmètre desktop = 4 pages (dashboard, demandes, matériaux, audit) — **Fait**
- **E9-R10** : Validation technique complète — desktop Tauri opérationnel sans sidecar, auth, 4 pages, `invoke` fonctionnel