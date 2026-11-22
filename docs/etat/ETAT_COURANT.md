# État courant du projet

**Date de mise à jour :** 2026-11-22
**Dernière sous-étape :** Itérations C1+C2 — nettoyage données PCB + garde-fou `%TEMP%` + faux positif GND — `master` = `d50f4c0`
**Branche courante :** `fast-track/p7-dashboard-pcb` (**à jour avec `origin`**, C1+C2 = `398930c` poussé ; `master` = `origin/master` = `d50f4c0`)
**Tests :** 341 (40 fichiers) · `prettier --check .` ✅ · `npm run typecheck` ✅
**Statut :** V7 close (V7-A → V7-H validées). V8 close (V8-B-6 intégralement clôturée). V8-C-2a close. V8-D-4 close — correctif `621e1a4` (PR #128) : dette `D-V8-D-4-COMPARE-VISUAL-VALIDATION` **partiellement résolue**. V8-D-5 / TÂCHE 1/2/3 closes. V8-D-7 close (PRs #103 → #109). V8-D-8 → V8-D-13-b **livrés techniquement** (PRs #112 → #127) mais **non tracés** dans ce registre (cf. §« Écarts détectés »). **V8-D-14 close (Desktop Tauri, 2026-11-18)** — sidecar connecté (auth réelle Postgres/Neon), KiCad IPC détecté (named pipe `\\.\pipe\%TEMP%\kicad\api.sock`), healthcheck `/api/health` 200, installeurs NSIS + MSI (fr-FR, en-US), logs JSON. **P6.3 close (2026-11-19)** — P6.3-b-2 (GlbViewer multi-sources, `28198eb`), P6.3-c1 (overlay SVG 4 couches + spec E2E geometric canvas, PR #131), P6.3-c2 (Next 16.4.6 + anti-FOUC next-themes, PR #130).

---

## État des versions

| Version | Statut |
|---------|--------|
| V3 | CLOS |
| V4-A | CLOS |
| V4-B | CLOS |
| V5 | CLOS |
| V6 | CLOS |
| V8 | CLOS |
| V7 | **CLOSE** — V7-A → V7-H validées (2026-11-10 → 2026-11-11) |
| V8 | **CLOS** — V8-B-6 intégralement clôturée (PR #64 → #74) |
| V8-C | **CLOSE** — V8-C-2a close (pipeline STEP/IGES + page détail) |
| V8-D | **CLOSE** — V8-D-4 close (comparaison OCCT + layout flex ; correctif `621e1a4` PR #128 — dette validation visuelle **partiellement résolue**), V8-D-5 / TÂCHE 1 close (panneaux rétractables), V8-D-5 / TÂCHE 2 close (assistant IA), V8-D-7 close (PRs #103 → #109), V8-D-8-a → V8-D-13-b **livrés** (PRs #112 → #127), **V8-D-14 close (Desktop Tauri, 2026-11-18)** |

---

## Actions critiques

- **Mot de passe admin** : `$env:ADMIN_PASSWORD` doit être défini dans l'environnement avant tout démarrage E2E admin. Les tests admin sont bloqués sans cela.
- **Hook BOM** : les fichiers doivent être encodés UTF-8 sans BOM. Vérifier avec `Get-Content -Encoding Byte` avant commit.
- **Nettoyage branches** : `refactor/v7-clean-ui` est obsolète (mergée dans `master` et `origin/master`, aucun commit en avance). Suppression candidate dans la session d'hygiène (`D-GIT-BRANCH-HYGIENE`).

---

## Session V8-B-6 (UI Reconstruction CAO — complétée)

### V8-B-6-a (État des lieux) — PR #64
Audit complet du workflow Reverse Engineering : UI (5 pages), actions serveur (8), API (aucune), modèles Prisma (4), workflow couvert (données, CAO, photos, validation), écarts identifiés (upload réel, preview 3D, export STL, suppression, etc.).

### V8-B-6-b (Upload réel CAO) — PR #65
Remplacement du champ URL texte par un `react-dropzone` réel dans le dialog "Ajouter un fichier CAO". Appelle `POST /api/upload/cad` (Cloudinary, 50 Mo) puis `addCadFile`. États `cadUploading` / `cadError`. Rafraîchissement via `router.refresh()`.

### V8-B-6-c (Preview 3D) — PR #66
Intégration de `ModelViewer` dans l'onglet "Dossier CAO". Dispatch automatique : `CadViewer` (STEP/IGES via occt-import-js) ou `StlViewer` (STL/OBJ/3MF via Three.js). Modale de preview 600px avec bouton "Voir en 3D" par fichier. État `previewOpen` / `previewSrc` / `previewName`.

### V8-B-6-d (Export STL fiable) — PR #67
Nouveau fichier `src/lib/export/cad-to-stl.ts` avec fonction `exportCadToStl` :
- STEP/IGES → STL via occt-import-js (Web Worker) + `STLExporter` (binaire)
- STL/OBJ/3MF → fichier existant (pas de conversion)
- Vérification d'étanchéité `isWatertight` (chaque arête partagée par exactement 2 faces)
- Bouton "Exporter STL" (icône Download) intégré dans l'onglet "Dossier CAO"

### V8-B-6-e (Logs structurés) — PR #68
28 logs structurés `[RE:...]` ajoutés dans 3 fichiers :
- `reverse-engineering-content.tsx` : upload, preview, export, statut, étape
- `cad-to-stl.ts` : conversion STL, vérification étanchéité
- `reverse-engineering.ts` : création projet, statut, étape, fichier CAO

Format : `console.info('[RE:etape] message', { métadonnées })`, `console.warn` (étanchéité), `console.error` (échec).

---

## Session V8-B-6 (UI Reconstruction CAO — complétée)

### V8-B-6-f (Logs manquants) — PR #70
Logs structurés `[RE:...]` ajoutés aux 8 boutons manquants du flux RE dans `reverse-engineering-content.tsx` :
- Navigation : Passage à la Méthode 4, Sélection demande
- Statut : Ouverture menu statut
- Workflow : Valider → Lancer Usinage
- Mesure : Suppression cote, Ajout cote
- Save : Sauvegarde dossier RE
- Workspace : Lancement analyse Workspace

Total : 18 logs `console.info('[RE:...]` couvrant tous les boutons du flux RE.

### V8-B-6-g (Correction upload CAO) — PR #72
AbortController 30s sur upload CAO + `cursor-pointer` sur dropzone + logs complets.

### V8-B-6-h (Éditeur 3D CadEditor) — PR #74
TransformControls (move/rotate/scale), redimensionnement canvas, croix fermeture, sauvegarde dimensions partielle.

---

## Session V8-C-2a (Pipeline STEP/IGES — close)

### V8-C-2a Tâche 1-4 (PR #77) — Infrastructure + POC + Import STEP/IGES
- `libcascade@3.1.0` installé (successeur officiel d'opencascade.js, browser-compatible, sans `fs`)
- WASM (40.77 MB) servi comme asset statique via `public/opencascade_single.wasm` (postinstall copy)
- `next.config.mjs` : `serverExternalPackages: ['libcascade']`
- Tauri CSP : `'unsafe-eval'` (couvre WASM) ; `tauri.conf.json` resources : `../../public/*.wasm`
- Build passe : `npm run build` → 15.2s, 74 pages statiques générées
- OCCT extraction prouvée : `BRepPrimAPI_MakeBox` → `BRepMesh_IncrementalMesh` → `TopExp_Explorer` (faces) → `BRep_Tool.Triangulation` → `Poly_Triangulation` → `THREE.BufferGeometry` (24 vertices, 12 indices, 6 faces)
- `src/lib/occt/import-step.ts` : `importCadFile` (STEPControl_Reader/IGESControl_Reader + oc.FS)
- `src/lib/occt/tessellate.ts` : `tessellateShape` (BRepMesh + TopExp_Explorer → BufferGeometry)
- `src/components/3d/occt-viewer.tsx` : composant viewer utilisant le pipeline
- `src/app/admin/reverse-engineering/reverse-engineering-content.tsx` : dispatch STEP/IGES → `OcctViewer`, STL/OBJ/3MF → `ModelViewer`

### V8-C-2a Tâche 5-6 (PR #78) — Page détail [id] (bouton "Ouvrir")
- Diagnostic : bouton "Ouvrir" inerte car `src/app/admin/reverse-engineering/[id]/` vide
- Création `src/app/admin/reverse-engineering/[id]/page.tsx` :
  - `force-dynamic`, `notFound()` pour 404 propre
  - `getReverseEngineeringProjectById(id)` → `REProjectWithRelations | null`
  - Rend `ReverseEngineeringContent` avec `project` + `isSequential` (depuis `searchParams.sequential`)
- Checks CI : Build, ESLint+Prettier, TypeScript, Vercel → tous verts

### V8-C-2a Tâche 7 — Clôture documentaire
- PROMPT_DE_REPRISE.md v7.4
- DECISIONS.md : décision (z) Pipeline STEP/IGES via libcascade
- INDEX.md : session V8-C-2a ajoutée
- ETAT_COURANT.md : HEAD `3b734f3`, dernière étape close = V8-C-2a

---

## Session V8-D-4 — Comparaison OCCT (close avec dette)

- `src/components/workspace/OcctCompareTool.tsx` : composant comparaison STEP/IGES (Cut/Common via BRepAlgoAPI, maillages + légende couleurs).
- `src/components/workspace/ViewerZone.tsx` : intégration mode "Comparer" + chargement comparateur.
- PR #91 : ajout comparaison OCCT (merge `6157b82` / commit `f65dd13`).
- PR #92 : auto-fit caméra `FitCamera`/`fitCameraToSphere` dans `OcctCompareTool` (merge `4a9f5c6` / commit `abf6662`).
- PR #93 : ajustement ratio layout `1fr_2fr_1fr` (merge `e13629b`).
- PR #94 : layout Workspace en flex `w-1/4 w-2/4 w-1/4` (merge `0edfb85` / commit `b2d85fe`) — layout validé visuellement (3 colonnes).
- **Dette :** `D-V8-D-4-COMPARE-VISUAL-VALIDATION` (preuve visuelle 4 couleurs rouge/bleu/orange/vert + logs `[OCCT:compare]` non fournie). `D-V8-D-4-TEST-FIXTURES-NON-TRACKED` : **résolue** — fixtures `public/models/cube-3mm.step` et `cube-3p5mm.step` trackées depuis `85ec27f` (PR #99, `git ls-files` confirmé le 2026-11-19). Aucune action requise.
- **Correctif PR #128 (`621e1a4`, merge `216ed3e`) :** `VisualComparisonOverlay.tsx` (4 modes : Original / Après Revue / Après Sourcing / Prêt Export — bleu / vert / ambre / violet) + slider d'opacité + `e2e/pcb/visual-comparison.spec.ts` (3 tests). **Résolution partielle v2 (P6.3-c1, PR #131, `7b5a7eb`)** : le rendu est désormais un **SVG géométrique** (4 couches, slider d'opacité) et non plus un placeholder ; une preuve visuelle E2E a été ajoutée (spec « geometric canvas », `e2e/pcb/visual-comparison.spec.ts`). Limites subsistantes : représentation **schématique indépendante des données CAO réelles**, logs `[OCCT:compare]` toujours absents en mode Desktop. La dette reste active (cf. `DETTES.md`).

---

## Session V8-D-5 — Panneaux rétractables (close avec dette)

- `src/components/workspace/WorkspaceLayout.tsx` : `WorkspaceContext` + états `collecteVisible`/`assistantVisible` + layout flex réactif (`w-2/4` → `w-3/4` → `flex-1`).
- `src/components/workspace/ViewerZone.tsx` : boutons `PanelLeft`/`PanelRight` (Masquer Collecte / Masquer Assistant) dans la barre de contrôle.
- PR #97 : merge `334706c` / commit `f74efc7`.
- Checks CI : Build pass, ESLint+Prettier pass, TypeScript pass.
- **Dette :** `D-V8-D-5-COLLAPSIBLE-VISUAL-VALIDATION` (validation visuelle des boutons de toggle non effectuée — upload de fichier bloqué par PowerShell 5.1).

---

## Session V8-D-5 / TÂCHE 2 — Assistant IA (close avec dettes)

- `src/components/workspace/MessageList.tsx` (nouveau) : extraction du rendu des messages du chat.
- `src/components/workspace/AssistantZone.tsx` : branchement de `MessageList` (suppression du rendu inline).
- `src/app/api/ai/chat/route.ts` : court-circuit `AI_MOCK` (drapeau non câblé en E2E, cf. `D-AI-MOCK-NON-CABLÉ`).
- `playwright.config.ts` : projet `workspace` (`storageState: '.auth/user.json'`, `dependencies: ['setup', 'ids-setup']`).
- `e2e/workspace/assistant-chat.spec.ts` (nouveau) : round-trip message → mock reply (`page.route('**/api/ai/chat')`, setter natif React).
- `public/models/cube-3mm.step`, `public/models/cube-3p5mm.step` : fixtures de test committées (arbitrage F).
- PR #99 : merge `b4fcc5f` / commit `85ec27f` (branche `feat/v8-d-5-assistant-ia`).
- Checks CI : Build pass, ESLint+Prettier pass, TypeScript pass, Vercel pass.
- **Dettes :** `D-V8-D-5-ASSISTANT-LLM-REAL` (pas de LLM réel), `D-CHAT-TESTABILITY` (textarea non pilotable par `fill`), `D-V8-D-5-USE-AI-CHAT-UNIFY` (double chemin client), `D-AI-MOCK-NON-CABLÉ` (drapeau non câblé), `D-REGISTRE-ETAT-NETTOYAGE` (registre `DETTES.md`).

---

## Écarts détectés (audit FIX-DOC-REPRISE, 2026-11-17)

**Constat :** 19 merges séparent `097d7e1` (dernier HEAD tracé) de `216ed3e`. Un seul (#110) correspond à la clôture documentaire V8-D-7 ; **18 PR (#111 → #128) ne sont tracées dans aucun registre** (ni `ETAT_COURANT.md`, ni `DETTES.md`, ni `DECISIONS.md`, ni `INDEX.md`, ni `PROMPT_DE_REPRISE.md` v8.0).

| PR | Merge | Objet (d'après message de commit) | Traçabilité |
|---|---|---|---|
| #110 | `d972891` | docs V8-D-7 clôture (5 fichiers) | ✅ tracée (`c66b234`) |
| #111 | `9e503e9` | fix V8-D-7-i/j : formulaire appelle API + lien menu PCB Studio | ❌ |
| #112 | `8f91d80` | feat V8-D-8-a : CLI Adapter `kicad-cli` (ERC, DRC, exports) | ❌ |
| #113 | `d3c1f8e` | fix V8-D-7-l : `frontendDist` Tauri → build Next.js racine | ❌ |
| #114 | `247a441` | feat V8-D-8-b : IPC Adapter (détection KiCad GUI, stubs) | ❌ |
| #115 | `e59daad` | feat V8-D-8-c : IPC Adapter — détection version KiCad + tests | ❌ |
| #116 | `08860cb` | feat V8-D-8-d : parsing ERC/DRC (lecture JSON kicad-cli) | ❌ |
| #117 | `b4b0fec` | feat V8-D-8-e : UI statut KiCad + tableau de bord PCB Studio | ❌ |
| #118 | `9e15f01` | feat V8-D-8-f : sourcing BOM (recherche, coût, alternatives) | ❌ |
| #119 | `14416e6` | feat V8-D-8 : PCB Design Studio complet (design-review, autoroute, GLB viewer) | ❌ |
| #120 | `292dd2d` | feat V8-D-10-a : sourcing engine + V8-D-9 mode auto | ❌ |
| #121 | `525d3ad` | refactor V8-D-11-a : real state analysis + V8-D-10-b sourcing UI | ❌ |
| #122 | `5aae7cd` | feat V8-D-11-b : PCB compliance panel UI (real-state violations) | ❌ |
| #123 | `e3e61b8` | feat V8-D-11-c : intégration sourcing + compliance panels | ❌ |
| #124 | `127556b` | feat V8-D-12-a : design review engine (règles + sévérité) | ❌ |
| #125 | `23f4b82` | feat V8-D-12-b : design review panel UI | ❌ |
| #126 | `0aee274` | feat V8-D-13-a : PCB export engine (BOM XLSX/CSV + Gerber ZIP) | ❌ |
| #127 | `1d873bd` | feat V8-D-13-b : PCB export UI buttons | ❌ |
| #128 | `216ed3e` | fix D-V8-D-4 : visual comparison overlay (4 couleurs + opacité) | ❌ |

**Conséquence :** cet audit documentaire (FIX-DOC-REPRISE) corrige le HEAD et signale les écarts ; il **ne les résorbe pas**. La résorption (entrées `INDEX.md`, décisions `DECISIONS.md`, statut des sous-étapes V8-D-8 → V8-D-13-b) nécessite un arbitrage du coordinateur.

---

## Dernière session

- **SESSION-2026-11-15-V8-D-5** (clôturée avec dette) : Panneaux rétractables (WorkspaceContext + PanelLeft/PanelRight) — PR #97 mergée, validation visuelle en attente (dette tracée).
- **SESSION-2026-11-15-V8-D-5-T2** (close avec dettes) : Assistant IA du workspace (squelette chat, MessageList, E2E) — PR #99 mergée (`b4fcc5f`).
- **FIX-DOC-REPRISE** (2026-11-17) : refonte de la traçabilité documentaire sur HEAD `216ed3e` — `ETAT_COURANT.md` (HEAD, statut, §Écarts détectés), `DETTES.md` (requalification `D-V8-D-4-COMPARE-VISUAL-VALIDATION`), `INDEX.md`, `PROMPT_DE_REPRISE.md` v8.1.
- **T3.1** (2026-11-17) : spec V8-D-14 rédigée — pont PCB ↔ desktop Tauri sous sidecar (10 bloquants B1→B10, arbitrage DB sidecar ouvert, 7 critères Done). `docs/v8-d14-pcb-desktop-spec.md`.
- **T3.1-quater** (2026-11-17) : décision (ar) actée — desktop = **sidecar connecté** (Next.js + Postgres/Neon) pour PCB/IA, catalogue offline Rust/SQLite ; spec amendée ; dette `D-V8-D-14-DB-CONFIG-POST-INSTALL` créée.
- **V8-D-14** (2026-11-18) : Desktop Tauri fonctionnel — sidecar connecté (auth réelle Postgres/Neon), KiCad IPC détecté (named pipe `\\.\pipe\%TEMP%\kicad\api.sock`), healthcheck `/api/health` 200, installeurs NSIS + MSI. Preuves : `[proxy] session=OK(ADMIN)`, `POST /api/pcb/ipc {action:"detect"}` → `available:true`.
- **P6.3-b-2** (2026-11-19) : câblage GlbViewer multi-sources Niveau 1 (source a statique + d upload, logs `[GLB:viewer]`, fallback `cube-test.glb`) — commit `28198eb`.
- **P6.3-c1** (2026-11-19) : overlay Comparer SVG 4 couches + spec E2E geometric canvas — PR #131 (merge `b193259`, commit `7b5a7eb`).
- **P6.3-c2** (2026-11-19) : fix Next.js 16.4.6 + anti-FOUC next-themes (`scriptProps`) — PR #130 (merge `40b3850`, commit `f71693c`).
- **Dettes (P6.3, 2026-11-19) :** `D-SESSIONS-P1-P6-NON-INDEXEES` (Moyenne), `D-PREUVES-NON-PERSISTEES` (Moyenne), `D-CLOUDINARY-KEY-LOGGED` (Moyenne), `D-NEXT-IMAGES-DOMAINS-DEPRECATED` (Basse). `D-V8-D-4-COMPARE-VISUAL-VALIDATION` : **résolution partielle v2** (PR #131, `7b5a7eb`).

---

## Session 2026-11-20 — Fast-Track P7 (Phases A/B/C — committées)

- Branche de travail : **`fast-track/p7-dashboard-pcb`** (créée depuis `master` à `d50f4c0`), **ahead 18**, **non poussée**.
- **Phase A** (A1→A8) : hygiène CI Prettier (A1 + style Phase B), schéma SQLite `components` + FTS5 (`0007`, `0008`), `PcbProject.kicadFilePath` + régularisation de la dérive Prisma (A3), lecteur `.kicad_pcb` (A4), pont Node `kicad-bridge` + `POST /api/pcb/place` (A6), `requireAdmin()` sur les 17 routes PCB (A8).
- **Phase B** (B.1→B.4) : LLM `openai/gpt-oss-120b` (JSON strict + Zod), `POST /api/pcb/analyze` (CDC → `PcbRequirement`) + bouton « Analyser », `GET /api/pcb/catalog/search` + injection candidats, `PcbProposal` persisté + `PATCH /api/pcb/proposals/[id]` + `ProposalsPanel`.
- **Phase C** (C.1→C.3.2c) : `src/lib/pcb/placement.ts` (px→mm, grille 2,54, références, 16 tests), `PlacementPanel` (dimensions via `parseKicadPcb`, repli 100×80), `POST /api/pcb/components` (persistance, 11 tests), `scripts/kicad/place_footprints.py` (batch transactionnel : 1 `LoadBoard`, 1 `SaveBoard`), `placeFootprints()` (15 tests), `POST /api/pcb/place/batch` (12 tests), bouton « Placer dans KiCad » (dry-run → persistance → placement).
- **Dette** : `D-FT-P7-PLACEMENT-LOCAL` → **soldée par C.3.1 + C.3.2c** (les overrides d'édition restent locaux, mais l'application persiste les positions et les envoie à KiCad).
- **Vérifications** : `prettier --check .` ✅ · `npm run typecheck` ✅ · `npm run build` ✅ · `npx vitest run` ✅ (24 fichiers) · `cargo test` (desktop) ✅.

---

## Session 2026-11-21 — Fast-Track P7 (Phase D — Fiabilité & capitalisation, committée)

- **V33 — Vérification déterministe** : `src/lib/pcb/verify-placement.ts` (pur, tolérances 0,01 mm / 0,5°) + `POST /api/pcb/place/verify` (relecture `parseKicadPcb` du disque) + verdict « N/N conformes » dans `PlacementPanel` — **29 tests**.
- **V34 — Envoi sûr** : `scripts/kicad/place_footprint(s).py` durcis (**verrou `.lck`**, contrôle bbox `Edge.Cuts`, **backup `.bak`**, **réconciliation avec restauration**), flags `--force` / `--allow-outside` ; `kicad-bridge.ts` (`parseResult` corrigé, rétrocompatible) ; routes `place` + `place/batch` enrichies (`verified` / `backup`) — **47 tests**.
- **V35 — Golden set** : `src/lib/pcb/golden-set/` (10 CDC réalistes, scorer **0.3 / 0.4 / 0.3**, orchestrateur **séquentiel** avec **isolation des échecs**) — **20 tests, 0 réseau**.
- **V39 — Compteur de prix** : `src/lib/pcb/price-total.ts` (pur) + `PriceCard` + `POST`/`GET /api/pcb/catalog/price` — le **404 de `CatalogTable` est corrigé** (il s'agissait d'une **écriture** de prix, pas d'une lecture) — **25 tests**.
- **V36 — Capitalisation** : `src/lib/pcb/capitalize.ts` (fiche `accomplished` validée Zod, stockée dans `PcbCheckpoint` label `accomplished`, **idempotente**, **aucune migration**) + `POST /api/pcb/capitalize` + `CapitalizeButton` — régimes `internal` / `reference` (+ licence) — **23 tests**.
- **Dettes Phase D** : `D-FT-P7-GOLDEN-CATEGORY-RECALL`, `D-FT-P7-GOLDEN-LIVE-RUN`, `D-FT-P7-CATALOG-PRICE-APPEND`.
- **Vérifications** : `prettier --check .` ✅ · `npm run typecheck` ✅ · `npx vitest run` ✅ (32 fichiers).

---

## Session 2026-11-21 — Fast-Track P7 (Phase E — Qualité de l'analyse, committée)

- **V31 — Provenance** : `PcbRequirement.source String?` (migration `20261121093328`, 1 `ALTER TABLE ADD COLUMN`) + `analyze-mapping.ts` (pur, 10 tests) + prompt exigeant une **citation exacte** / `inféré` / `catalog:<id>` ; **source absente → `status: to_verify`** ; UI « Source : … » + badge « à vérifier ».
- **V30 — Complétude + contradictions** : `cdc-quality.ts` (pur, 14 tests) — complétude /6, conflits d'unités (écart > 5 % ou familles différentes), `unsourced`, `toVerify` ; panneau « Qualité du CDC ». **DÉCISION : avertir seulement, ne pas bloquer.**
- **V32 — Double passe** : `consensus.ts` (pur, 12 tests) — valeurs stables, divergences, `onlyInPass1/2` ; **2 appels LLM séquentiels**, dégradation `failed`.
- **V37 — Réordonnancement** : `rank-candidates.ts` (pur, 11 tests) + classement **top-10 → top-5**, conditionné à `rankCandidates && doublePass && candidates.length > 5` ; dégradation `fallback`.
- **Dettes Phase E** : `D-FT-P7-DOUBLE-PASS-COST`, `D-FT-P7-DIVERGENCES-NON-PERSISTED`, `D-FT-P7-LLM-CALLS-X3`, `D-FT-P7-CDC-QUALITY-FALSE-POSITIVES`, `D-FT-P7-ORPHAN-PCB-COMPONENTS`.
- **Vérifications** : `prettier --check .` ✅ · `npm run typecheck` ✅ · `npx vitest run` ✅ (**318 tests / 36 fichiers**).

---

## Session 2026-11-22 — Post-Fast-Track : chaîne PCB de bout en bout (non commitée)

- **Itération A — vrai projet KiCad stable** : `C:\Users\pc\Documents\PartIVA\projets\carte-test\carte-test.kicad_pcb` + `.kicad_pro` créés ; `kicadFilePath` du projet `cmwo3y9z50000nsfc1ci309ll` patché ; KiCad GUI ouvert (`carte-test - KiCad 10.0`). Remplace le chemin temporaire `%TEMP%`.
- **Réconciliation KiCad** : `scripts/kicad/place_footprints.py` supprime désormais l'empreinte existante de même référence avant ajout (doublon `U1` : écart x/y de +100 mm détecté puis restauration depuis `.bak`).
- **Résolution des empreintes IA** : `src/lib/pcb/kicad-footprints.ts` (pur, 4 tests) — exact → autre bibliothèque → fuzzy → **fallback déterministe par préfixe de référence** (`U → Package_TO_SOT_THT:TO-220-3_Vertical`, `R → Resistor_SMD:R_0603_1608Metric`, …). Câblé dans `POST /api/pcb/requirements/source-components`. Corrige l'empreinte inexistante `Converter_DCDC:DCDC-Module_TO-220` (fuzzy `why: none`). Racine des bibliothèques configurable via `PARTIVA_KICAD_FOOTPRINTS_ROOT`.
- **Vérifications** : `npm run typecheck` ✅ (exit 0) · `npx vitest run` ✅ (**330 tests / 38 fichiers**) · `npx prettier --check .` ✅ (exit 0) · dry-run `POST /api/pcb/place` ✅ (`200 OK`, `wouldPlace: true`, empreinte de fallback).
- **E2E BOM complète (2026-11-22)** : `kicadFilePath` de `cmwqu1s0t0029o0fcugnkd0da` patché vers `carte-test` (`200 OK`, `exists: true`) ; **15/15 composants placés** via l'UI (« Valider et placer dans KiCad »), `✓ 15 placé(s) · 15 vérifié(s)`, canvas `0 → 15`, **0 erreur** d'empreinte/réconciliation ; fichier `.kicad_pcb` lu sur disque : 15 références attendues présentes (dont `U1` → `Package_TO_SOT_THT:TO-220-3_Vertical` à `69.69 / 91.28`).
- **En attente** : confirmation visuelle (KiCad GUI + canvas PartIVA) par le coordinateur.
- **Dettes** : `D-FT-P7-TURBOPACK-ON-F`, `D-FT-P7-KICAD-SYNC-POLLING`, `D-FT-P7-ORPHAN-PCB-COMPONENTS` (cf. `DETTES.md`).
- **Statut** : non commité.

---

## Session 2026-11-22 — Itérations C1 + C2 (plan C1→C5 acté)

- **C1.1 — données** : le résidu `%TEMP%` n'existe plus (chemin de `cmwqu1s0t0029o0fcugnkd0da` déjà patché vers `carte-test.kicad_pcb`). Arbitrage coordinateur : **conserver le projet** (19 composants / 18 exigences / 15 placements E2E). Projet officiel `cmwo3y9z50000nsfc1ci309ll` confirmé : chemin OK, 0 composant, 0 réseau.
- **C1.2 — garde-fou** : `src/lib/pcb/kicad-path.ts` (pur, 6 tests) + test de route → `PATCH /api/pcb/projects/[id]` refuse `%TEMP%`, `AppData\Local\Temp`, `/tmp/`, `C:\Temp\`. Dette `D-FT-P7-KICAD-PATH-UNRESTRICTED` **partiellement mitigée**.
- **C2 — faux positif GND** : **Option A retenue** (Option B inopérante : `PcbNet.pins` est un `Json?`, 0 net en base). `simulation.ts` : `pending = nets.length === 0`, règle `GROUND_PLANE` non évaluée dans ce cas, `checkedRules = 2`. `simulation.test.ts` (3 tests).
- **C2-bis — visibilité** : panneau « Conformité Physique » remonté **en tête** de la colonne droite ; badge global « **PAS ENCORE ANALYSÉ** » (gris) au lieu de « 1 CRITIQUE(S) » (rouge) ; `CompliancePanel` affiche « ◌ Pas encore analysé · 2 règles vérifiées » + message neutre.
- **Vérifications** : `npm run typecheck` ✅ (exit 0) · `npx vitest run` ✅ (**341 tests / 40 fichiers**) · `npx prettier --check .` ✅ · contrôle visuel navigateur ✅ (badge et panneau confirmés).
- **Dettes** : `D-FT-P7-GND-NETS-NOT-SEEDED` (nouvelle), `D-FT-P7-KICAD-PATH-UNRESTRICTED` (mitigée), `D-FT-P7-TEMP-PATH-GUARD` **non créée** (le garde-fou est implémenté, pas une dette).
- **Arrêt au C2-bis** conformément au prompt : C3 (canvas) non démarré.

---

## Session 2026-11-22 — Clôture documentaire Fast-Track (SYNC-1 → SYNC-3)

- **SYNC-1-bis** : audit des écarts documentaires. E10 (`DECISIONS.md` sans entrée Fast-Track), E11 (`INDEX.md` sans P7) et E12 (`INDEX.md` sans Post-Fast-Track) confirmés.
- **SYNC-2-a** : `docs/etat/DETTES.md` — 16 dettes actives (2 critiques + 14 fonctionnalités) + 2 dettes soldées portées ; 48 ajouts ; SHA256 `8C13E21C…`.
- **SYNC-2-b** : `docs/etat/DECISIONS.md` §15 — V1-V44 + Phases A-E (V45-V49, V30-bis → V37-bis, C1-C3) ; 103 ajouts / 1 suppression ; SHA256 `72B638BE…`. V6 absent (supprimé au cadrage).
- **SYNC-2-c** : `docs/sessions/INDEX.md` — sections Fast-Track P7 et Post-Fast-Track ; 23 ajouts / 1 suppression ; SHA256 `85DEEC3E…`.
- **SYNC-2-d** : `docs/sessions/FAST_TRACK_P7.md` — statut `CLOS le 2026-11-22` + §4 de traçabilité ; 12 ajouts / 2 suppressions ; SHA256 `FE781BA6…`.
- **SYNC-3 — code post-Fast-Track** : multi-provider LLM (Groq → Cerebras → OpenRouter → Google → OpenAI), compilation IA du CDC (6 catégories), sourcing composants avec résolution d'empreintes KiCad, glisser-déposer sur le canvas, affichage TND.
- **Revue SYNC-3** : condition tautologique corrigée dans `PriceCard.tsx` ; bloc mort retiré de `groq-client.ts` ; `.env.example` restauré (doublon `CEREBRAS_API_KEY`, clés `TOGETHER`/`DEEPINFRA` inutilisées, U+FFFD introduits).
- **Vérifications** : `npm run typecheck` ✅ (exit 0) · `npx vitest run` ✅ (**341 tests / 40 fichiers**) · `npx prettier --check .` ✅.
- **Dettes** : `D-FT-P7-CURRENCY-HARDCODED`, `D-FT-P7-CANVAS-ORIGIN-HARDCODED`, `D-FT-P7-SOURCING-AUTOLOAD-COST` (nouvelles).
- **Commit** : `20e5993` (code post-Fast-Track) + `57b0b00` (gouvernance documentaire).

---

## Session 2026-11-22 — Fusion master et prompt v8.13 (SYNC-4)

- **PR #141** : `fast-track/p7-dashboard-pcb` → `master`. CI initialement rouge sur ESLint (6 erreurs dans du code Fast-Track jamais linté) ; correctifs commités en `11220be` : import `prisma` inutilisé, clamp du menu canvas calculé dans le handler, `setState` synchrone dans l'effet du sourcing, apostrophe JSX échappée.
- **3 checks requis verts** : ESLint + Prettier, TypeScript, Build.
- **Merge** : merge commit `2224ebe` (2026-11-22T09:59:35Z), sans squash — les hashes documentés (`20e5993`, `57b0b00`, `520738a`) sont préservés.
- **Dettes soldées** : `D-FT-P7-PRISMA-DRIFT` (migration `20261120154239_regularize_fast_track_prisma_drift` : `RequestType` + `PcbProject.requestId`) et `D-FT-P7-HEAD-DIVERGENCE` (ce merge). Section critique du registre : **aucune dette active**.
- **Prompt v8.13** : HEAD passé de `e291ae5` à `2224ebe`, dernière étape close = SYNC-4, prochaine étape = C3 (canvas lisible). Publié dans une PR documentaire séparée.
- **Vérifications** : `npm run lint` ✅ · `npm run typecheck` ✅ · `npx vitest run` ✅ (**341 tests / 40 fichiers**) · `npx prettier --check .` ✅ · `git diff --check` ✅.
- **PR #143** : fix chemin plateau KiCad — `normalizeBoardPath` (Windows → POSIX) + override `PARTIVA_KICAD_BOARD` — merge `36302a6` (CI : lint/typecheck/build verts).
- **PR #144** : régénération prompt v8.14 (HEAD `36302a6`) — merge `93c7044`.
- **PR #146** : fix `normalizeBoardPath` platform-aware (win32 conserve le chemin drive, POSIX → `/c/x`) + tests batch alignés — merge `02f4661` (CI : lint/typecheck/build verts).
- **PR #148** : bundle du plateau KiCad réel `carte-test.kicad_pcb` (158 532 octets) dans `src/lib/pcb/boards/` + `outputFileTracingIncludes` pour le bundle Vercel + documentation de `PARTIVA_KICAD_BOARD` — merge `e3085a9` (CI : ESLint+Prettier/TypeScript/Build/Vercel verts). Variable posée sur Vercel Production et Preview. Vérifié en production (`part-5mrqer9sc`) : `Fichier KiCad introuvable : /c/Users/pc/...` disparu, lecture du plateau confirmée. **Décision C.4** : placement bout-en-bout réservé au mode hybride Tauri desktop/web ; production web suffisante à ce stade.

---

## Prochaine étape

**Fast-Track P7 — CLOS et fusionné sur `master`** (`2224ebe`, PR #141). La branche `fast-track/p7-dashboard-pcb` est entièrement intégrée.

**Prochaines étapes possibles :**
1. **C3 — canvas lisible** : symboles 2×, labels lisibles, couleurs par type, zoom/pan, grille 2,54 mm, espacement des composants, chemin propre.
2. **C4 — empreintes** : validation IPC sur le projet officiel `cmwo3y9z50000nsfc1ci309ll`.
3. **C5 — UX** : chemin KiCad lisible, bouton supprimer, finitions.
4. **Synchronisation inverse KiCad → app** (polling `GET /api/pcb/kicad/state` + merge des positions).
5. **Confirmation visuelle** du placement (KiCad GUI + canvas PartIVA) par le coordinateur — rejeu BOM technique déjà vert (15/15).
6. **Mesure des faux positifs** de `cdc-quality` sur le golden set (avant tout blocage éventuel).
7. **Runner live** du golden set (rejouer les 10 CDC contre Groq).
8. **Nettoyage des orphelins** : `PcbProjectWorkspace.tsx`, `PcbPriceCounter.tsx`, `PcbProposalDiff.tsx`, `PcbCanvas.addNodeAtCenter`.

*`master` = `e3085a9` ; branche protégée (3 checks requis, toute fusion par PR). Aucune nouvelle étape code ne doit être inventée sans spec (charte §9).*
