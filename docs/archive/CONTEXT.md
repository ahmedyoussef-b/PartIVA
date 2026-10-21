# CONTEXT — PartIVA

**Dernière mise à jour :** 2026-10-20
**Commit HEAD :** `cad26d4` (E16-R2) + clôture E16-R4 (présent commit)
**Phase en cours :** E16 — intégration 3D **clôturée E16-R4** — E17 à cadrer
**Tag :** `v0.1.0-e8p` (E8) · `v0.3.0-e9` (E9) · `v0.4.0-e10` (E10) · `v0.5.0-e11` (E11)

> ⚠️ 4 tags réels. Aucun tag pour E12, E13, E14, E15. Le tag `v0.5.1-e12` mentionné antérieurement n'existe pas.

## État

- Le repo est sain (HEAD = `cad26d4` + clôture E16-R4, working tree propre).
- **Baseline restaurée** (E16-R0) : ESLint 0/0 ✅, TS 0 ✅, Prettier 0 ✅ (21 fichiers reformatés, 4 erreurs règles-of-hooks corrigées).
- `next-env.d.ts` : ✅ **untracked** (R.5.32 — fichier généré, `.gitignore` ligne 81).
- `next.config.mjs` : `output: 'export'` **conditionnel** (`NEXT_EXPORT === 'true'`) — pas inconditionnel. Headers WASM `application/wasm` absents (à ajouter en E16-R1).
- `tauri.conf.json` : sidecar retiré, `frontendDist: "../../out"`, `url: "index.html"` ✅
- Sidecar supprimé (`desktop/server/`, `build-server.cjs`, `node.exe`) ✅
- `src/app/api/` déplacé en `api.disabled/` ✅
- Build export web : ✅ passe (22 pages statiques)
- Build desktop Tauri : ✅ passe (installeur NSIS ~5 MiB)
- `data-client.ts` : ✅ 74 lignes, 11 fonctions `invoke` + fallback `fetch` (vérifié E16-R0)
- 4 pages desktop : ✅ conformes (dashboard, materiaux, audit, demandes)
- 16 pages admin : ✅ fonctionnelles (`desktop-downloads` = Server Component lisant `docs/desktop-releases.json` → `[]`)
- `mapRequestToUi` : ✅ corrigé (tolérant Date/string)
- **E9-R10** : Pont Tauri ↔ Rust ↔ SQLite validé ✅
- **E11-R1** : Validation Vercel 8/8 Playwright ✅
- **E12** : Recherche avancée complète ✅
- **E13** : Hygiène clôturée (2 dettes) ✅
- **E14** : Enrichissement 3D clôturée (StlViewer, FitReport, doc 3D) ✅
- **E15-R1** : Connecteur 3DCarParts (mock) clôturé ✅
- **E16** : STEP + IGES supportés (`CadViewer` + `ModelViewer` + fixtures + E2E admin/public) — **clôturée E16-R4** ✅

## Dettes actives (2)

| ID | Priorité | Effort | Session origine |
|---|---|---|---|

| `D-E14-PRINT-ON-DEMAND` | Faible | Élevé (post-E17) | E14-R3 |
| `D-E16-IGES-ADMIN-E2E` | Faible | Faible | E16-R2 |

Détail dans `DEBT.md` (à jour).

## Décisions récentes

- `D-E9-R7-1` : Refonte vers `output: 'export'` (abandon sidecar)
- `D-E9-R7-2` : Périmètre desktop = 4 pages — **Fait**
- **E9-R10** : Validation technique complète
- **E10-R4a** : Requalification `R7-1`/`R7-1b` — 9/9 pages fonctionnelles
- **E11-R1** : Validation Vercel 8/8 — `D-E9-R5-1` clôturée
- **E12-R0** : Cadrage E12 — feature recherche avancée
- **E13-R0** : Cadrage E13 (hygiène) + E14 (enrichissement 3D)
- **E14** : CLÔTURÉE — 3 nouvelles dettes actives post-E14
- **E15-R1** : CLÔTURÉE — `D-E14-3DCARPARTS-CONNECTOR` clôturée
- **E16-R0** (2026-10-19) : Rebase `origin/master` + untrack `next-env.d.ts` (R.5.32) + baseline restaurée (Prettier 21 fichiers + ESLint règles-of-hooks)
- **E16-R0a** (2026-10-19) : Resynchronisation documentaire post-E15-R1
- **E16-R1** (2026-10-19) : `CadViewer` STEP via occt-import-js — WASM LGPL-2.1 + fixture STEP reproductible
- **E16-R3** (2026-10-19) : `ModelViewer` auto-détection branchée sur `/admin/pieces/[id]`
- **E16-R2** (2026-10-20) : IGES via `ReadFile('iges')` + `timeoutMs`/`maxSizeMb` + page publique `/test/iges-viewer` + E2E public 2/2 — fixture = copie de la référence package (LGPL-2.1, licence à côté)
- **E16-R4** (2026-10-20) : clôture E16 — `docs/3d-format-support.md` + `D-E14-STEP-VIEWER` clôturée
- **E17-R1** : `D-E16-IGES-ADMIN-E2E` documentée (mitigation publique)
- **E17-R2** : `D-E16-THREE-CLOCK` clôturée (obsolète)
- **E17-R3** : `D-E14-PRINT-ON-DEMAND` requalifiée (post-E17)
- **E17-R4** : `D-E16-DASHBOARD-FETCH` clôturée (route `/api/dashboard` + fallback)
