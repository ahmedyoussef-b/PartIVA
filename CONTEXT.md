# CONTEXT — PartIVA

**Dernière mise à jour :** 2026-10-18
**Commit HEAD :** `7560548` (clôture E9-R10)
**Phase en cours :** E9 — **TERMINÉE**
**Tag :** `v0.3.0-e9`

## État
- Le repo est sain (HEAD = `7560548`).
- `next.config.mjs` : `output: 'export'` ✅
- `tauri.conf.json` : sidecar retiré, `frontendDist: "../../out"`, `url: "index.html"` ✅
- Sidecar supprimé (`desktop/server/`, `build-server.cjs`, `node.exe`) ✅
- `src/app/api/` déplacé en `api.disabled/` ✅
- Build export web : ✅ **passe** (22 pages statiques)
- Build desktop Tauri : ✅ **passe** (installeur NSIS 4.99 MiB)
- `data-client.ts` : ✅ existe, 11 fonctions `invoke` + fallback `fetch`
- 4 pages desktop : ✅ **toutes conformes** (dashboard, materiaux, audit, demandes)
- `mapRequestToUi` : ✅ corrigé (tolérant Date/string)
- **E9-R10 : Pont Tauri ↔ Rust ↔ SQLite validé** — `invoke` retournent `[]` (base vide), pas d'erreur CSP, dashboard affiché ✅

## Dettes actives
- `D-E9-R3a-1` (flash navigation) — Faible
- `D-E9-R3a-2` (ESLint non exécuté) — Très faible
- `D-E9-R3a-3` (bridge SQLite mocké) — Faible
- `D-E9-R3b-3` (non-migration pages) — Faible
- `D-E9-R3b-bis-1` (validation GUI reportée) — Faible
- `D-E9-R4b1-1` (client non miroité) — **Requalifiée** (non bloquante)
- `D-E9-R4b1-2` (photos TEXT JSON) — **Requalifiée** (non bloquante)
- `D-E9-R5-1` (validation fonctionnelle reportée) — **Reportée** (dépend Vercel + token)
- `D-E9-R7-1` (11 pages web-only existantes) — **Requalifiée** : 2 fonctionnelles (desktop-downloads, parametres) + 9 stubs (<1000 o)
- `D-E9-R7-1b` (9 pages web-only stubs) — **Moyenne** : machines, reverse-engineering, sync, usinage, demandes/[id], pieces, reverse-engineering/[id], demandes/[id]/recherche, recherche — 251–973 o, à implémenter fonctionnellement

**Dettes clôturées :** voir `DEBT.md` section « Clôturées » (`D-E9-R6-2`, `D-E9-R7-2`).

## Décisions récentes
- `D-E9-R7-1` : Refonte vers `output: 'export'` (abandon sidecar)
- `D-E9-R7-2` : Périmètre desktop = 4 pages (dashboard, demandes, matériaux, audit) — **Fait**
- **E9-R10** : Validation technique complète — desktop Tauri opérationnel sans sidecar, auth, 4 pages, `invoke` fonctionnel