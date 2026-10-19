# JOURNAL — PartIVA

| Date | Session | Objet | Commit | Statut |
|---|---|---|---|---|
| 2026-10-17 | E9-R4a | Pilote `material` | `0cf727e` | ✅ |
| 2026-10-17 | E9-R4b-1 | Pilote `request` | `941ca95` | ✅ |
| 2026-10-17 | E9-R5 | ACL Tauri v2 + validation technique | `[hash]` | ✅ |
| 2026-10-17 | E9-R6 | Échec sidecar (dette D-E9-R6-2) | `[hash]` | ❌ |
| 2026-10-18 | E9-R7 | Refonte `export` + build desktop | `0544287` | ✅ |
| 2026-10-18 | E9-R8 | Auth desktop + AuthGuard + layout Tauri | `9561738` | ✅ |
| 2026-10-18 | E9-R9 | Build system + CSP fix | `6f29825` | ✅ |
| 2026-10-18 | E9-R10 | Validation technique finale | `7560548` | ✅ |
| 2026-10-18 | E9-R10b | Chore : ignorer artefacts build desktop | `b28e288` | ✅ |
| 2026-10-18 | E9-R11 | Clôture E9 (README + DEBT) | `9fa2f08` | ✅ |
| 2026-10-18 | E9-R11-ter | Correction CONTEXT.md (11 invoke, D-E9-R7-1b) | `080ecbf` | ✅ |
| 2026-10-18 | E10-R0 | Cadrage E10 + restructurer DEBT.md | `23f9ffb` | ✅ |
| 2026-10-18 | E10-R1 | Purge D-E9-R3a-2 (ESLint) + D-E9-R3a-3 (bridge mocké) | `3f17d98` | ✅ |
| 2026-10-18 | E10-R2a | Refactorisation DEBT.md v2 (structure formelle + régularisation R3a-1/R3b-3/R3b-bis-1) | 841ada0 | ✅ |
| 2026-10-18 | E10-R2b | Purge D-E9-R3a-1 — remplacer router.push par window.location.href (5 transitions flash navigation) | f69d84d | ✅ |
| 2026-10-18 | E10-R3 | Clôturer D-E9-R4b1-1 (obsolète) + D-E9-R4b1-2 (requalifiée choix conception) | `9a9a43c` | ✅ |
| 2026-10-18 | E10-R4a | Clôturer R7-1/R7-1b (obsolètes) + aligner CONTEXT.md | `c7e4fac` | ✅ |
| 2026-10-18 | E10-R5 | Clôture E10 — CONTEXT.md réécrit + JOURNAL.md complété + tag `v0.4.0-e10` | `[à venir]` | ✅ |
| 2026-10-18 | E11-R1 | Validation fonctionnelle Vercel — 8/8 tests Playwright passés | `c8e40da` | ✅ |
| 2026-10-18 | E12-R1a | Spécification recherche avancée (filtres, tri, facettes, pagination) | `1f0c930` | ✅ |
| 2026-10-18 | E12-R1b | Filtres (material, status, dates, minScore) + tri (relevance/date/nom/status) + pagination API | `ad6e526` | ✅ |
| 2026-10-18 | E12-R1b fix | Tests non-vacuites, skip photo, 5 dettes DEBT.md | `2a42c4e` | ✅ |
| 2026-10-18 | E12-R1c | Facettes API `/api/search/facets` (material, status, cache 30s) | `c39c0d5` | ✅ |
| 2026-10-18 | E12-R1d | UI filtres + tri + facettes + pagination | `788ca26` | ✅ |
| 2026-10-19 | E12-R1e | Validation finale — .env, next-env.d.ts, clôture D-E12-SEED-E2E | `99a3ddc` | ✅ |
| 2026-10-19 | E12-R2 | Clôture E12-R2 — purge 4 dettes P0+P1 + docs DEBT/CONTEXT/JOURNAL/ROADMAP | `463f471` | ✅ |
| 2026-10-19 | E13-R0 | Cadrage E13 (hygiène) + E14 (enrichissement 3D) + dette D-E13-3D-FEATURES | `d3f59fc` | ✅ |
| 2026-10-19 | E13-R1 | Hygiène — newline finale `CONTEXT.md` + `sessionStorage` search-bar (D-E12-NEWLINE + D-E10-R2b-1) | `e2a1b7f` | ✅ |
| 2026-10-19 | E14-R4 | StlViewer (Three.js) — visualisation STL/GLTF + tests E2E | `4e65caf` | ✅ |
| 2026-10-19 | E14-R5 | Intégration `/admin/pieces/[id]` — StlViewer conditionné par `printableModelUrl` | `4e65caf` | ✅ |
| 2026-10-19 | E14-R3 | Doc `3d-printing-resources.md` + 3 dettes + clôture `D-E13-3D-FEATURES` | `1947724` | ✅ |
| 2026-10-19 | E15-R1 | Connecteur 3DCarParts (mock) + fixtures + tests E2E | `bc1aea6` | ✅ |
| 2026-10-19 | E15-R1 | Clôture `D-E14-3DCARPARTS-CONNECTOR` | `15cfbb0` | ✅ |
| 2026-10-19 | E16-R0 | Rebase `origin/master` + untrack `next-env.d.ts` (R.5.32) | `4a7bf44` | ✅ |
| 2026-10-19 | E16-R3 | Intégration ModelViewer dans `/admin/pieces/[id]` — `.step`/`.iges` → `CadViewer`, `.stl`/`.gltf` → `StlViewer` + 2 tests E2E | `[à venir]` | 🕒 |
| 2026-10-19 | E16-R0 | Baseline : prettier --write sur 21 fichiers (dette E12→E15) | `879060c` | ✅ |
| 2026-10-19 | E16-R0 | Fix(3d) : règles-of-hooks `stl-viewer.tsx` | `8884eee` | ✅ |
| 2026-10-19 | E16-R0a | Resynchronisation documentaire post-E15-R1 | `[à venir]` | ✅ |
