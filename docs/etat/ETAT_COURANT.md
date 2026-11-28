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

## Session 2026-11-23 — procédure `tauri dev` (branche `fix/desktop-pcb-llm-env`)

- **Objectif** : remplacer le cycle build standalone / NSIS / MSI par `tauri dev` pour les itérations.
- **Code** : `desktop/scripts/dev-server.cjs` (nouveau) lit `%APPDATA%\PartIVA\db.toml` (ou `PARTIVA_*`), injecte `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3100`, `PARTIVA_DESKTOP=1` et les clés LLM, puis lance `next dev -p 3100` (Turbopack ; `--webpack` via `PARTIVA_DEV_WEBPACK=1`). `tauri.conf.json` : `beforeDevCommand` → `node ./scripts/dev-server.cjs`. `lib.rs` : si `tauri::is_dev()`, aucun sidecar et webview naviguée vers `http://localhost:3100/`. `logging.rs` : target `dev` conservée dans les logs.
- **Doc** : `docs/desktop-dev-workflow.md` (commande, config, différences vs installé, dépannage).
- **Vérifications** : `node --check` OK · `cargo check` OK · `GET /api/health` → 200 · `tauri dev` lancé : log `{"target":"dev","msg":"mode développement : sidecar désactivé, webview → http://localhost:3100/"}`, compilation de `/` par Next (requête du webview), processus app et port 3100 actifs.
- **À faire** : rejouer reset / drag-drop dans la fenêtre dev, puis committer et pousser la branche.

---

## Session 2026-11-23 (suite) — drag PCB live et synchronisation KiCad (branche `fix/desktop-pcb-llm-env`)

- **Drag-drop** : `libName` réexposé par `/api/pcb/board/render` depuis la BDD (le `.kicad_pcb` stocke l'empreinte sans bibliothèque) ; `force: true` envoyé par `PcbCanvas` ; message d'erreur réaffiché après `fetchBoard()` ; message `Déplacement {ref}` déplacé hors du périmètre du canvas. Lint `PcbCanvas.tsx` : 15 erreurs corrigées (`Btn` extrait au scope module, chargement initial différé).
- **KiCad** : `launch` auto ignore un plateau déjà ouvert (présence de `~<fichier>.lck`) ; le bouton `KiCad` passe `source=manual` pour forcer.
- **Synchronisation live (nouveau)** : `scripts/kicad/sync_board_live.py` pilote l'instance KiCad ouverte via l'API IPC (`kicad-python` 0.8.0, socket `%LOCALAPPDATA%\Temp\kicad\api.sock`). Déplace les empreintes dans l'éditeur (`update_items`) puis sauvegarde (`save`) : la fenêtre KiCad reflète le mouvement immédiatement, sans verrou `.lck`. `kicad-bridge.ts` expose `syncBoardLive()` ; `/api/pcb/place/batch` l'appelle en priorité en mode desktop et retombe sur l'écriture fichier (`--force`) si l'IPC est indisponible. Réponse enrichie `liveSynced`.
- **Prérequis IPC** : `kicad-python` installé dans le site-packages utilisateur de KiCad (`%USERPROFILE%\Documents\KiCad\10.0\3rdparty\Python311\site-packages`) et serveur d'API activé dans Préférences > Plugins. Sans ce prérequis, l'écriture fichier reste fonctionnelle.
- **Correctif perte de composants** : le live sync appelait `board.save()` depuis l'état mémoire de KiCad, écrasant les composants ajoutés entre-temps par l'écriture fichier (`.bak` 3 empreintes → fichier 1). Désormais le fichier est **toujours** persisté en premier par `placeFootprints`, puis le sync IPC ne fait que `update_items` sans sauvegarde. Vérifié : 3 → 4 → 5 empreintes après placements successifs, `GET /api/pcb/board/render` remonte `U1,R2,C1,R1,U3`. Composants perdus restaurés depuis le `.bak`.
- **Limite connue** : l'API IPC n'a pas de commande de rechargement de plateau ; un composant ajouté au fichier alors que KiCad est ouvert n'apparaît dans l'éditeur qu'après rechargement manuel (`Fichier > Recharger` dans KiCad). Tentative `run_action("common.Control.revert")` : casse l'IPC (timeout) et n'est pas réutilisable. L'app affiche une indication dans le toast du panneau Sourcing.
- **Vérifications** : `npm run typecheck` OK ; `eslint` sur les fichiers modifiés OK. Test end-to-end via CDP : `POST /api/pcb/place/batch` → `{"ok":true,"liveSynced":true,"message":"1 composant(s) déplacé(s) dans KiCad (live)"}`, log `[PCB:PLACE-BATCH] Sync live KiCad { board: 'carte-test.kicad_pcb', moved: [ 'J4' ] }`, position restaurée à l'identique après test. **Non commité / non poussé / pas de PR.**

---

## Session 2026-11-24 — élimination structurelle des fuites de quota LLM (branche `fix/desktop-pcb-llm-env`)

- **Objectif** : arrêter l'épuisement des quotas gratuits LLM à la racine (analyse CDC, sourcing, placement, cache, fallback).
- **Analyse** : trois causes structurelles — (1) appels LLM inutiles ou dupliqués (`analyze` ×3 par défaut, enrichissement mort de `parse`, normalisation LLM des MPN), (2) état (cache + cooldown) uniquement en mémoire, donc perdu à chaque instance serverless froide, (3) fallback inexistant et `maxTokens` surdimensionnés.
- **Correctifs (P11, Lots A→I)** : détail dans `docs/roadmap/P11_LLM_QUOTA_FIX.md`. Points clés : 1 appel par défaut pour `analyze` + idempotence par `cdcHash` ; `parse` sans LLM ; `query-normalizer` avec court-circuit MPN ; cache L2 Prisma (`llm_cache_entries`) + cooldown L2 (`llm_provider_cooldowns`) avec timeout DB 800 ms ; fallback Together/DeepInfra/Mistral/SambaNova + `hasLlmProvider()` ; `maxTokens` 1024–2560 ; cache sourcing invalidé par hash CDC.
- **Garde-fou build** : `src/lib/ai/providers-meta.ts` sépare les métadonnées fournisseurs du code serveur — `AssistantZone` (client) n'importe plus `providers.ts` → `groq-client` → Prisma/`pg`, ce qui cassait le build Turbopack (`Can't resolve 'dns'/'fs'/'net'/'tls'`).
- **Vérifications locales** : typecheck, lint, vitest 351/351, prettier, prisma validate/format.
- **Migration** : `20261124120000_add_llm_state` (cooldown, cache L2, `PcbProject.cdcHash`) et `20261124130000_add_llm_daily_usage` **appliquées le 2026-11-24** (`prisma migrate status` = *Database schema is up to date*). Drift historique résolu par `migrate resolve --applied` sur 3 migrations (colonnes déjà présentes).
- **Re-analyse (lot J)** : audit des 9 call sites IA — reste 7 fuites (F1–F7). Corrigées : **B1** coupe-circuit journalier dur (`llm-budget.ts`, 100 k tokens/j par défaut, migration `20261124130000_add_llm_daily_usage`), **B2** cache L2 chat/fiche, **B3** idempotence moteur + cache L2 description, **B4** rate limit photo + vision multi-providers, **B5** migration appliquée. Reste F6 (verrous/rate-limit en mémoire, acceptable mono-instance).
- **PR #153** mergée sur `master` (`fbf4daa`) avec 4 checks CI verts.

---

## Session 2026-11-24 — diagnostic netlist/placement (retour coordinateur)

- **Symptômes** : après Reset du plateau + Analyse CDC, le canvas est vide ; le Sourcing propose 6 composants au lieu de 16 ; la validation affectionne des positions chaotiques ; aucun ratnest et KiCad ne reflète pas le plateau.
- **Preuves (BDD + fichier)** : projet `cmwqu1s0t0029o0fcugnkd0da` → `dbComponents=21`, **`dbNets=0`**, `sourcingCache.components=6`, **`sourcingCache.nets=0`**, `cdcHash` identique ; fichier `.kicad_pcb` = 37 Ko / 6 empreintes, `.lck` présent (KiCad ouvert).
- **Causes** : (1) le cache sourcing sans nets est réutilisé indéfiniment (même `cdcHash`) et il n'existe aucun bouton pour le régénérer ; (2) le cache hit ne restaurait pas les nets en BDD ; (3) `handlePlaceOne` persistait et affichait les coordonnées du LLM en ignorant le tableau `optimized[]` renvoyé par `/api/pcb/place/batch` ; (4) le canvas ne lit les composants que depuis le fichier KiCad, donc il est vide tant que rien n'est replacé après un Reset.
- **Correctifs** : cache versionné v2 (entrée sans nets ignorée une fois), restauration des nets depuis le cache sans appel LLM, consigne prompt renforcée (nets obligatoires), bouton « Régénérer la netlist (LLM) », bouton « Tout placer (optimisé) » (un seul appel avec la netlist complète), coords optimisées utilisées pour la persistance et le canvas.
- **Limite connue** : KiCad ne peut pas charger une empreinte ajoutée dans son instance mémoire sans `Fichier > Recharger` ; le live sync IPC ne déplace que des empreintes déjà présentes.

---

## Session 2026-11-24 (suite) — cause racine du crash `place_footprints.py`

- **Preuve** : reproduction exacte sur une copie du plateau avec les 9 composants du cache → `items[2] : FootprintLoad echoue: 'SwigPyObject' object has no attribute 'FootprintLoad'`, stack `pcbnew.py:24225` (`plug.FootprintLoad(...)`).
- **Cause** : bug SWIG de **KiCad 10.0.8** — après la première mutation d'un board (`Add`/`Remove`), les proxies retournés par l'API perdent leurs méthodes (module `pcbnew`, objets `FOOTPRINT`, board relu). Le verrou `.lck` n'était pas en cause (`--force` était déjà passé).
- **Correctif** : charger **toutes** les empreintes avant toute mutation via une instance persistante `PCB_IO_KICAD_SEXPR`, capturer les empreintes existantes par référence une seule fois, et faire la réconciliation post-écriture dans un **processus Python neuf** (`--verify`).
- **Vérifié** : rejeu du payload défaillant (9 composants) → `{"ok":true,"placed":9,"verified":9}` sur une copie du plateau ; dry-run OK ; `py_compile` OK.
- **Suite (test réel, 15 composants)** : `sortie illisible du script Python (batch)` — KiCad 10 imprime ses avertissements SWIG (`memory leak...`) sur **stdout après** la ligne JSON ; le parseur prenait la dernière ligne. Corrigé : recherche de la dernière **ligne JSON valide** (`lastJsonLine`).

---

## Session 2026-11-24 (suite) — plumbing du placement électronique

- **Étape 1 (filet de sécurité)** : export de `calculateCost` et 7 nouveaux tests dans `placement.test.ts` (coût nul, chevauchement, hors plateau, classification nets, map `pinNet`, réduction de coût par `optimizePlacement`). Total : **358 tests**.
- **Étape 2 (données)** : `getFootprintSize()` dans `kicad-footprints.ts` (bbox approximative depuis les pads du `.kicad_mod`, cache par chemin) ; les dimensions réelles sont passées à `optimizePlacement` depuis `source-components` et `place/batch`. `isPowerNet`, `isGndNet` et `buildPinNetMap` ajoutés dans `placement.ts` (non encore utilisés dans le coût, conformément à la consigne).
- **Routage (voie A)** : squelette `scripts/kicad/route_board.py` (pistes en L pour nets à 2 pins via `PCB_TRACK`, zone GND en `ZONE` B.Cu) — **non câblé**, `py_compile` OK.
- **Non fait** : pénalités de découplage/bords/regroupement et harmonisation grille 2,54 mm (étapes 3 et 4, en attente du code validé par le coordinateur).

---

## Session 2026-11-24 (suite) — règles métier du CDC dans `calculateCost`

- **Règles ajoutées** (CDC régulation 24V→5V, Modbus RTU, sortie 0‑10V) : oscillateur `Y*` collé au MCU (cible 5 mm), régulateur éloigné des parties sensibles (min 20 mm) et rapproché du connecteur d'entrée 24 V (cible 8 mm), transceiver RS‑485 rapproché de son connecteur (cible 8 mm), connecteurs sur le **bord supérieur** (`yMm - originY` ≤ 3 mm).
- **Rôles non codés en dur** : `inferPlacementRole()` déduit `regulator|mcu|clock|serial|connector|sensitive` depuis `type`/`rationale`/`value` du LLM (vérifié sur les 15 composants réels du projet). `buildHints()` conserve le texte pour le voisinage RS‑485/24 V.
- **Origine du plateau** : `calculateCost` reçoit déjà `board.originY` — la règle 4 n'a donc **aucun plumbing supplémentaire** ; contrairement au pseudo-code qui supposait `Y=0`.
- **Poids** : 40/50/30/50/100 avec seuils (au lieu de `W·d²` brut), pour rester comparables à `wireLength`.
- **Vérifications** : typecheck 0, lint 0, vitest **361/361**, prettier 0. Grille 2,54 mm et routage réel toujours non traités.

---

## Session 2026-11-24 (suite) — vérification chiffrée des règles métier

- **Test hors-ligne** sur le projet réel (15 composants, nets `GND:3` + `VCC_5V:3`, plateau origine 59,69 / 81,28 mm) : la première version des règles **régressait** (coût 200 786 → 6 571 383) et classait mal les rôles (U2 en `serial`, C1/L1/R1 en `regulator`).
- **Corrections** : `inferPlacementRole` ordonné (MCU avant RS‑485, régulateur sur `dc-dc/buck/to-220` uniquement) ; `optimizePlacement` démarre le recuit du meilleur état (initial ou force dirigée) avec garantie de non-régression ; déplacements guidés par rôle (bord supérieur réparti en x, oscillateur hors du boîtier MCU, régulateur/RS‑485 à distance des pads) ; 800 itérations ; poids bord 600 / oscillateur 80 / entrée 24 V 60.
- **Résultat mesuré** : coût 824 071 → 212 982 ; `Y1↔U2` = 2,6 mm, `U1↔J1` = 4,7 mm, `U3↔J4` = 2,7 mm. **Limite** : seuls 1 connecteur sur 4 est à ≤ 3 mm du bord supérieur (J1/J2/J4 restent à 10–18 mm) — le recuit n'arrive pas à coordonner les 4 déplacements simultanés. Validation visuelle par le coordinateur toujours nécessaire.
- **Vérifications** : typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-24 (suite) — alignement forcé des connecteurs

- **Contrainte imposée** (et non plus seulement pénalisée) : initialisation des connecteurs à `y = originY + 3` avec répartition régulière sur X avant le recuit, verrouillage de Y et de la rotation pendant le recuit, exclusion des swaps impliquant un connecteur.
- **Garantie** : repli vers l'état contraint (et non vers l'état initial) si le recuit dégrade le coût, afin de ne pas contourner la contrainte du CDC.
- **Vérifié sur le projet réel** : 4/4 connecteurs à **3,0 mm** du bord supérieur ; `U1↔J1` = 4,5 mm, `U3↔J4` = 6,7 mm, `Y1↔U2` = 8,1 mm ; coût 824 071 → 379 968.
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-24 (suite) — routage assisté partiel

- **Rapport de contradictions validé** : nets à 3 pins (pas de L à 2 pins), nets absents du `.kicad_pcb` (`FindNet('GND')` = None), zone B.Cu sans vias inopérante, 13 composants sans net. Plan corrigé appliqué.
- **Script `route_board.py` finalisé** : création des `NETINFO_ITEM`, routage en arbre F.Cu (0,25 mm, `SetNet`), zone GND B.Cu + 1 via par pad GND, sauvegarde avec `.bak`.
- **Vérifié sur copie du plateau** (dry-run puis réel) : `{"ok":true,"routed":4,"zones":1,"vias":3,"createdNets":["GND","VCC_5V"]}` ; fichier relu = 4 `(segment`, 1 `(zone`, 3 `(via`, nets assignés.
- **Backend/UI** : `POST /api/pcb/route` lit `PcbNet`, bouton « Router la carte » avec toast « DRC non vérifié ».
- **Périmètre assumé** : routage partiel, pas de DRC ni de garantie d'absence de croisement ; seuls GND et VCC_5V sont câblés.

---

## Session 2026-11-24 (suite) — Phase 1.1 & 1.3 de la roadmap P12

- **1.1** : prompt `nets-only` réécrit en 4 blocs fonctionnels (alimentation, MCU, communication, analogique) avec consigne GND global et alimentation obligatoires ; `maxTokens` 768 → 1536.
- **1.3** : `GET`/`PATCH /api/pcb/requirements/nets` (add/update/delete, validation `REF.PIN`, `status: manual`), modal `NetlistEditorModal` dans Sourcing (tableau, ajout, suppression, édition des pins), synchronisation `sourcingCache.nets` et `clearLlmCacheAsync()`.
- **UI** : bouton « Éditer la Netlist » ; rafraîchissement du canvas via `pcb:board-refresh` après sauvegarde.
- **Vérifications** : typecheck 0, lint 0, vitest 361/361, prettier 0. Un test `reconstruct.test.ts` a été flaky une fois (passé en relance isolée puis en suite complète).

---

## Session 2026-11-24 (suite) — test de génération hiérarchique

- **Incident** : le premier essai a échoué — `openrouter` renvoyait un contenu sous forme de segments (`[{type:"text",...}]`) refusé par `callGroq`, puis `google` a timeout. `maxTokens: 1536` insuffisant pour une réponse structurée plus longue.
- **Correctifs** : normalisation des contenus segmentés dans `groq-client.ts`, `maxTokens` 3072 pour `nets-only`.
- **Résultat** : **7 nets générés** par Groq (`GND` 14 pins, `VCC_5V` 13, `OSC_IN`, `OSC_OUT`, `RS485_A`, `RS485_B`, `RS485_DE`) — la topologie est désormais complète.
- **Limite constatée** : le LLM invente des pins inexistants sur certaines empreintes (ex. `J4.3`/`J4.4` alors que J4 est un connecteur 2 pins) — à corriger via l'édition manuelle (1.3) ou une validation ultérieure.
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-24 (suite) — correctifs formulaire CDC interne

- **Symptômes rapportés** : compiler l'idée « allumage ampoule 9 V » donne une traduction correcte mais en EUR ; cliquer « Valider » ne pré-remplit pas les 7 blocs et ne navigue pas vers l'analyse.
- **Causes** : champs non contrôlés (`onChange` sans `value`) → réponses compilées invisibles ; type `multiselect` non rendu ; « Valider » ne faisait que poser un drapeau ; aucun contrôle de champs requis.
- **Correctifs** : champs contrôlés pour 5 types (dont multiselect), validation des champs `required` avec focus/scroll sur le premier manquant et retour au bloc concerné, création projet + redirection vers `/admin/pcb/{id}/cahier-des-charges`, règle « prix en DT/TND, jamais EUR/USD » dans le prompt `compile`, conversion filet `€→DT`, versioning de la clé cache `pcb:compile:v2`.
- **Vérifications** : typecheck 0, lint 0, vitest 361/361, prettier 0. E2E existants conservés (`select-*`/`input-*` conservés, redirection finale du dernier bloc inchangée).

---

## Session 2026-11-24 (suite) — liste des projets PCB redondante

- **Constat chiffré** : 13 projets en BDD dont **8 brouillons vides** (0 exigence / 0 composant / 0 net) créés par les soumissions répétées ; la page `/admin/pcb/projets` en affichait 11.
- **Correctifs** : filtrage des projets vides (note « N projets vides masqués »), listing de **tous** les projets ayant du contenu (y compris `requirements_validated` pour voir le projet lampe), bouton « Supprimer » sécurisé (uniquement brouillon sans composants), garde-fou dans `/api/pcb/requirements/parse` (refus d'un projet sans réponses ni description).
- **Résultat du filtre** : 13 → 5 projets visibles ; 7 vides masqués. Les 3 brouillons partiels restants peuvent être supprimés depuis l'UI par l'admin.
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-25 — ordre des cartes et des boutons (Layout PCB)

- **Colonne droite réordonnée** selon la démarche : 1 Cahier des charges → 2 Propositions IA → 3 Sourcing (nets/placement/routage) → 4 Placement manuel → 5 Revue de conception → 6 Conformité → 7 Visualisation → 8 Fabrication → tâche support : Audit magasin (auparavant en tête).
- **Boutons Sourcing numérotés** par ordre d'exécution : 1 Générer les nets → 2 Éditer la Netlist → 3 Tout placer → 4 Router la carte → 5 Régénérer le sourcing (outil de reprise, écrase les nets manuels ; `title` explicite).
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-25 (suite) — assistant pas-à-pas du Layout PCB

- **`PcbWizard.tsx`** : stepper collant en tête de la colonne droite, 5 étapes calculées depuis l'état réel du projet (exigences, nets, empreintes dans le fichier, segments/zones, conformité) : CDC → Netlist → Placement → Routage → Vérifications.
- Chaque étape est cliquable et fait défiler + met en évidence la carte concernée ; bandeau « À faire » avec bouton « Y aller → ». Le stepper peut être réduit.
- Ancres ajoutées sur les cartes (`card-cdc`, `card-proposals`, `card-sourcing`, `card-placement`, `card-review`). Le wizard **guide** vers les boutons existants sans dupliquer leur logique.
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-25 (suite) — assistant déplacé en bas du split gauche

- `PcbWizard` n'est plus en tête de colonne droite : il est rendu en **variante compacte** dans la barre inférieure du `PcbCanvas`, à droite des coordonnées du curseur (« symétrique » demandée).
- La colonne droite commence donc directement par la carte « Cahier des charges » ; les ancres de cartes restent valides pour le bouton « Y aller → ».
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-25 (suite) — Phase 1.2 Fallback intelligent

- **Validation des pins** : `getFootprintPadNumbers()` lit les pads réels du `.kicad_mod` (cache) ; `nets-only` filtre les `REF.PIN` inexistants, conserve les nets avec >= 2 pins valides, et ne supprime rien si le footprint est illisible.
- **Fallback heuristique** : composants orphelins reliés selon leur rôle (serial→connecteur RS‑485, clock→MCU, regulator→entrée 24 V), en n'utilisant que des pads existants ; nets marqués `source: heuristic`.
- **BDD** : colonne `PcbNet.source` (`llm|heuristic|manual`), migration `20261125120000_add_pcb_net_source` **appliquée** ; PATCH manuel marque `manual`.
- **UI** : bandeau « N nets inférés automatiquement » dans Sourcing + badge `IA?` dans le modal d'édition.
- **Vérifié** sur les 7 nets du test LLM : `J4.3`/`J4.4` supprimés (35 pins conservés / 2 rejetés). Les nets `RS485_A/B` devenus incomplets seront reconstruits par l'heuristique.
- **Limite assumée** : l'heuristique choisit les premiers pads disponibles du transceiver (ex. U3.1/U3.2) — l'affectation électrique exacte reste à vérifier par l'admin (nets marqués `IA?`).
- typecheck 0, lint 0, vitest 361/361, prettier 0.

---

## Session 2026-11-25 (suite) — Phase 3 Étape A (Freerouting en attente)

- **Audit préalable** : Java absent, aucun `freerouting.jar` ; `pcbnew.ExportSpecctraDSN` et `ImportSpecctraSES` disponibles ; `kicad-cli pcb drc --format json` disponible. Le prompt initial (DSN écrit à la main) écarté au profit de l'API KiCad.
- **`specctra.py`** : `export-dsn` et `import-ses` via pcbnew. Vérifié sur copie : DSN 371 lignes, 1 boundary, 13 padstacks, 5 nets.
- **`drc.ts`** : `runDrc()` parse le JSON (code non nul ignoré). Vérifié : 149 violations, 2 non-connectés.
- **Route** `POST /api/pcb/autoroute/freerouting` : export DSN → test java/jar → si absents, `ok:false` + `code:FREEROUTING_MISSING` + chemin DSN ; si présents, lance Freerouting, importe le SES, lance le DRC.
- **UI** : bouton « 4 bis. Routage complet (Freerouting) » ; bandeau d'installation clair (`tools/freerouting.jar` ou `FREEROUTING_JAR`).
- **Ancien stub** `autorouter.ts` remplacé par un simple re-export bridge ; `/api/pcb/autoroute` renvoie 410 avec redirection vers la nouvelle route.
- **Limite** : routage complet non exécutable tant que Java + jar ne sont pas fournis (Étape B).
- typecheck 0, lint 0, vitest 361/361, prettier 0, py_compile OK.

---

## Session 2026-11-25 (suite) — assignation des nets aux pads

- **`net_assign.py`** partagé : crée les `NETINFO_ITEM` manquants et assigne chaque pad de la netlist (`pad.SetNet`) avant routage/export DSN. Antis-SWIG : empreintes et pads capturés avant mutation.
- Appelé depuis `route_board.py` (routage assisté) et depuis `specctra.py` (`assign-nets`, utilisé par la route Freerouting **avant** l'export DSN — sinon le DSN déclarait des pads sans net).
- **`assignBoardNets()`** dans `kicad-bridge.ts` ; `/api/pcb/route` renvoie `assignedPads`/`missingPins`.
- **DRC comparé sur copie** : court-circuits **4 → 2** (les pads sont désormais sur leur net). Reste 157 violations, dominées par 90 `solder_mask_bridge` et 15 `clearance` dues au **chevauchement des composants** du placement, et 2 courts restants car la piste en L de VCC_5V traverse le boîtier U2 (pad 1 sur net 0).
- Conclusion : l'assignation des nets est corrigée ; le routage Manhattan sans évitement d'obstacles reste un brouillon.
- typecheck 0, lint 0, vitest 361/361, prettier 0, py_compile OK.

---

## Session 2026-11-25 (suite) — Phase 2 : congestion et chevauchements

- `calculateCost` : chevauchements réels `×100` (au lieu de ×5, gap 5 mm supprimé) + nouvelle pénalité de congestion `10·(2−écart_bords)²` sous 2 mm ; défaut de taille porté à 10×10 mm quand le footprint est illisible.
- `resolveOverlaps()` : passe déterministe finale qui écarte les paires encore chevauchantes le long de l'axe le moins coûteux (connecteurs déplacés uniquement en X).
- Tests ajoutés : congestion, chevauchement avec vraies dimensions, séparation de 3 composants initiaux chevauchants.
- **Mesuré sur le projet réel** (15 composants) : paires chevauchantes **3 → 0** ; après réécriture du plateau sur copie, DRC **149 → 81 violations**, `solder_mask_bridge` **89 → 64**, `clearance` **13 → 0**, `courtyards_overlap` **7 → 1**.
- typecheck 0, lint 0, vitest **364/364**, prettier 0.

---

## Session 2026-11-25 (suite) — Étape B Freerouting : câblage final en attente de Java

- **Prérequis vérifiés** : `java` absent, `tools/freerouting.jar` absent, `FREEROUTING_JAR` non défini. Exécution complète **non testable** à ce stade.
- **Route `/api/pcb/autoroute/freerouting` finalisée** : `-mp <passes>` (défaut 10, configurable `FREEROUTING_PASSES`, borné 1–50), message d'erreur avec lien Adoptium/GitHub pour l'installation, et renvoi des `logs` stdout/stderr (4000 derniers caractères) en cas d'échec.
- **UI** : le bandeau affiche les logs d'échec (`whitespace-pre-wrap`).
- La chaîne d'exécution DSN → Freerouting → SES → DRC était déjà câblée en Étape A ; il ne manque que le JRE + le jar.
- typecheck 0, lint 0, vitest 364/364, prettier 0.

---

## Session 2026-11-25 (suite) — Étape B : environnement installé et chaîne testée

- **Environnement** : JDK 21 Temurin installé via `winget` ; `freerouting-2.5.0.jar` récupéré mais **incompatible** (class 69 = Java 25) → employé `freerouting-2.0.1.jar` (Java 21), placé dans `tools/freerouting.jar` (gitignoré, 64,6 Mo).
- **Faille corrigée** : sans `--gui.enabled=false`, Freerouting ouvre sa GUI et le process ne termine pas. Ajout de ce flag, de `FREEROUTING_JAVA` (chemin explicite) et maintien de `-mp <passes>`.
- **Test complet sur copie du plateau** : assignation nets (6 pads) → DSN (21 200 o) → Freerouting 2 passes ≈ 1 s → SES importé (**10 pistes**) → DRC : 140 violations, 1 court, 3 non-connectés, 83 masques, 13 clearance.
- La chaîne **DSN → Freerouting → SES → DRC** est fonctionnelle de bout en bout. Le résultat reste perfectible car le plateau test n'avait pas le placement Phase 2.
- typecheck 0, lint 0, vitest 364/364, prettier 0.

---

## Session 2026-11-25 (suite) — barre de progression des actions

- **`ActionProgressProvider.tsx`** : contexte client partagé (`start(label)`, `finish(status)`), chronomètre mis à jour toutes les 200 ms, masquage automatique après 5 s.
- **`ActionProgressBar`** placée sur la ligne « Layout PCB » (colonne gauche) : libellé de l'action, temps écoulé, barre animée pendant l'exécution, vert « Terminé en X s » ou rouge « Échec après X s ».
- Toutes les actions du panneau Sourcing et du modal sont instrumentées : 1 Génération des nets, 2 Sauvegarde netlist, 3 Placement global (et placement unitaire), 4 Routage partiel, 4 bis Freerouting, 5 Régénération du sourcing.
- typecheck 0, lint 0, vitest 364/364, prettier 0.

---

## Session 2026-11-25 (suite) — orientation et courtyards

- **Tâche 1** : l'erreur Turbopack `Expected '</', got 'jsx text'` n'existe plus sur `master` (`page.tsx` 315 lignes, balises équilibrées, `tsc` 0) — elle provenait d'un état intermédiaire de la PR #184.
- **Tâche 2** : `optimizeRotations()` aligne à 0° connecteurs, régulateur, condensateurs (`role: capacitor` ajouté), MCU, horloge, transceiver ; appelée en fin d'`optimizePlacement`. Test unitaire ajouté.
- **Tâche 3** : `getFootprintSize()` lit désormais les courtyards `F.CrtYd`/`B.CrtYd` avant les pads, clé de cache `v2`. Vérifié : LQFP-48 10,3×10,3 mm, TO-220 10,5×4,9 mm (vs bbox pads plus petites). DRC après replacement : 81 → 80 violations, `courtyards_overlap` 1 → 0.
- **Tâche 4** : rapport d'analyse du wizard joint au commentaire de PR.
- typecheck 0, lint 0, vitest **365/365**, prettier 0.

---

## Session 2026-11-25 (suite) — wizard intelligent

- **Prérequis** : chaque étape du wizard vérifie l'état BDD avant d'autoriser le passage ; un clic sur une étape bloquée affiche un message explicite (toast).
- **Validation admin** : table `PcbWizardValidation` (projectId, step, validatedBy) + migration `20261125130000_add_pcb_wizard_validations` appliquée ; API `POST /api/pcb/wizard/validate` (validation / dévalidation) ; badge vert = validé, orange = calculé.
- **Nets IA?** : bandeau dédié dans le wizard avec bouton ouvrant directement le modal d'édition (événement `pcb:edit-netlist`).
- **Barre de progression** : pourcentage d'étapes **validées** (pas seulement calculées) avec compteur `X/5`.
- **Récapitulatif final** : pistes, violations DRC lues depuis `<board>.drc.json`, bouton « Exporter pour fabrication » désactivé (Phase 5) et bouton « Re-router » (événement `pcb:reroute`).
- typecheck 0, lint 0, vitest 365/365, prettier 0.

---

## Session 2026-11-25 (suite) — correctif client Prisma dev

- **Erreur** : `Cannot read properties of undefined (reading 'findMany')` sur `prisma.pcbWizardValidation` dans `page.tsx` — client Prisma généré avant l'ajout du modèle.
- **Correctif racine** : `dev-server.cjs` exécute désormais `npx prisma generate` avant de lancer `next dev`, afin que le client reflète toujours le schéma (y compris après l'ajout d'un modèle). `prisma generate` exécuté localement : requête `findMany` validée (0 validation en BDD).
- typecheck 0, lint 0, vitest 365/365, prettier 0.

---

## Session 2026-11-25 (suite) — édition des champs « à vérifier »

- **Compilation technique** : chaque exigence est désormais éditable inline (`RequirementValueEditor`) avec bouton « Enregistrer et valider » et raccourci ✓ pour valider tel quel.
- **API** `PATCH /api/pcb/requirements/technical-field` (requireAdmin, cible par `requirementId` ou `field`) : met `value`, `source: manual`, `status: confirmed`.
- **Qualité du CDC** : badge vert « 100 % des exigences validées manuellement » quand `toVerify = 0` et `unsourced = 0` (les compteurs sont recalculés depuis la BDD au `router.refresh()`).
- Test unitaire ajouté dans `cdc-quality.test.ts` ; update BDD validé en transaction rollback sur le projet `cmwv7z3q…` (18 exigences). Le projet « Test_Clignotant_LED » demandé n'existe pas en BDD.
- typecheck 0, lint 0, vitest **366/366**, prettier 0.

---

## Session 2026-11-25 (suite) — Tâche 2 Wizard défensif

- `GET /api/pcb/projects/[id]/board/status` : état BDD (`inDb`), disque (`onDisk`), `needsRepair` et `suggestedPath` (chemin standard `pcb-work/<id>/carte-test.kicad_pcb`).
- Helpers client `kicad-file.ts` : `createKicadFile()` (POST board `open`) et `repairKicadSync()` (PATCH chemin).
- **Matrice des séquences** dans `PcbWizard` : nets sans fichier → toast + « Créer le fichier » ; nets sans composants persistés → « Tout placer (persister) » ou « Régénérer le sourcing » ; placement sans nets → « Générer les nets » ; routage sans placement → « Tout placer » ; revue sans pistes → « Router la carte ».
- **Création automatique** : `handlePlaceOne`/`handlePlaceAll` appellent `ensureBoard()` avant le placement si `kicadFilePath` est vide.
- **Synchro 5 s** + `visibilitychange` dans le wizard ; bandeau « Réparer la synchronisation » si fichier sur disque absent de la BDD.
- `KicadFileInput` remonté par `key={kicadFilePath}` dans la page pour éviter l'état local périmé.
- Le projet « Test_Clignotant_LED » n'existe toujours pas en BDD ; état fichier vérifié sur `cmwqu1s0` (inDb=true/onDisk=true).
- typecheck 0, lint 0, vitest 366/366, prettier 0.

---

## Session 2026-11-25 (suite) — bouton Analyser masqué après résultat

- La page CDC calcule `analysisDone = requirements.length > 0 && cdcHash === hashKey(cdc)` (même source que la route `/api/pcb/analyze`). Si vrai, le bouton est remplacé par un badge vert « ✓ Analyse effectuée · N exigence(s) ».
- La page étant `force-dynamic`, un retour depuis le Layout PCB re-calcule l'état serveur : le bouton ne réapparaît pas. `AnalyzeButton` reçoit `hasExisting` pour afficher « Re-analyser… » et envoyer `force:true` uniquement si le CDC a changé.
- Vérifié en BDD sur `cmwv7z3q` (18 exigences, hash `igcvyg`) et `cmwqu1s0` (10, `1y1ovk2`) : hash stocké = hash calculé → analyse à jour.
- typecheck 0, lint 0, vitest 366/366, prettier 0.

---

## Session 2026-11-25 (suite) — champ « Nom du projet »

- `RequirementForm` : premier champ obligatoire « Nom du projet » (`input-project-name`), transmis à la compilation et à la création du projet.
- `/api/pcb/requirements/compile` : le nom est injecté dans le prompt comme contexte métier ; clé de cache versionnée `pcb:compile:v3:<name|description>`.
- `/api/pcb/requirements/parse` : `PcbProject.name` est renseigné avec ce nom (au lieu de « Nouveau projet PCB »), y compris lors de la mise à jour d'un projet existant.
- **Limite assumée** : il n'existe pas encore d'index RAG **par projet** (le RAG actuel porte sur les pièces) ; le nom est désormais structuré et persistant, donc prêt à être indexé ultérieurement pour la recherche de projets similaires.
- typecheck 0, lint 0, vitest 366/366, prettier 0.

---

## Session 2026-11-25 (suite) — wizard dynamique après validation CDC

- **Cause racine** : `/api/pcb/requirements/parse` (bouton « Valider » du formulaire) persiste `RequirementForm` + `RequirementAnswer`, **pas** de `PcbRequirement`. Le wizard testait `requirements.length > 0` → restait sur « Analyser le CDC ».
- Le wizard reçoit `cdcValidated = project.status === 'requirements_validated' || requirements.length > 0` et calcule l'**action suivante réelle** : analyser → générer les composants → générer les nets → tout placer → router → vérifier. Le libellé du bouton et le bandeau « À faire » suivent cette action.
- Passage en Sourcing : création automatique du fichier `.kicad_pcb` (status route idempotent) puis `router.refresh()` ; le bouton « Ouvrir un nouveau fichier » disparaît.
- Nouveaux événements wizard : `pcb:analyze` (analyse LLM via le panneau) et `pcb:generate-components` (sourcing forcé).
- typecheck 0, lint 0, vitest 366/366, prettier 0.

---

## Session 2026-11-25 (suite) — renumérotation des boutons Sourcing

- Ordre logique du parcours : **1** Générer les composants (LLM) → **2** Générer les nets → **3** Éditer la Netlist → **4** Tout placer → **5** Router la carte → **6** Routage complet (Freerouting).
- Libellés, `title`, bandeaux d'aide et libellés de la barre de progression alignés sur cette numérotation ; messages du wizard débarrassés des numéros d'étapes pour éviter toute ambiguïté.
- typecheck 0, lint 0, vitest 366/366, prettier 0.

---

## Session 2026-11-25 (suite) — synchronisation wizard ↔ boutons

- **`PcbActionBus`** : contexte partagé (registre d'actions) — le panneau Sourcing enregistre ses handlers sous des ids (`analyze`, `components`, `nets`, `edit-netlist`, `place`, `route`, `freeroute`, …) et le wizard appelle **exactement les mêmes fonctions** via `run(id)`. Suppression des événements window globaux.
- **Lien visuel** : la page calcule `nextActionId` depuis l'état BDD et le transmet au wizard et au panneau ; le bouton correspondant est entouré d'un anneau bleu avec badge « Étape en cours ».
- **Feedback** : `router.refresh()` après placement global pour que le wizard avance vers « Router la carte » ; les spinners existants des boutons restent affichés.
- typecheck 0, lint 0, vitest 366/366, prettier 0.

---

## Session 2026-11-26 — état BDD temps réel et déblocage du routage

- **Cause du blocage** : les props du wizard (`tracks`, `footprints`, `nextActionId`) venaient du rendu serveur et n'étaient rafraîchies qu'après placement. Après un routage réussi, `tracks` restait à 0 → le wizard restait sur « Router la carte ».
- **`computeWizardState`** (`src/lib/pcb/wizard-state.ts`) : source de vérité unique BDD + fichier disque, utilisée à la fois par la page et par `GET /api/pcb/projects/[id]/wizard-state`.
- **`PcbLiveStateProvider`** : polling 3 s + `visibilitychange` + `pcb:board-refresh` ; le wizard et le panneau Sourcing consomment le même état (plus d'anneau figé). `router.refresh()` après chaque action pour un retour immédiat.
- **Vérification** : 4 tests sur l'endpoint verrouillent la transition `route → review` quand une piste apparaît sur le plateau.
- typecheck 0, lint 0, vitest 370/370, prettier 0.

---

## Session 2026-11-26 (suite) — Reset = retour juste après validation CDC

- Le bouton Reset du panneau de droite réinitialisait seulement le fichier `.kicad_pcb`, laissant composants, nets et cache de sourcing en BDD ; le wizard ne pouvait donc pas revenir à l'étape « Générer les composants ».
- `POST /api/pcb/projects/[id]/board` avec `action: 'reset'` efface désormais dans une transaction : nets, composants (pins en cascade) et validations du wizard ; `sourcingCache` est vidé et `status` repasse à `requirements_validated`. Le CDC, les propositions, checkpoints et versions sont conservés.
- Restauration du plateau précédent si la transaction échoue, pour éviter un fichier vide avec des composants encore persistés. `open` reste inchangé.
- 4 tests sur l'endpoint (reset / open / restauration / admin).
- typecheck 0, lint 0, vitest 374/374, prettier 0.

---

## Session 2026-11-26 (suite) — Reset ferme la fenêtre KiCad précédente

- `POST /api/pcb/projects/[id]/board` avec `action: 'reset'` ferme désormais (mode desktop Windows uniquement) la fenêtre KiCad dont le titre contient le nom du plateau attaché au travail précédent, via `CloseMainWindow()` (WM_CLOSE gracieux, jamais `taskkill`).
- On attend la suppression du `.lck` (jusqu'à 3 s) avant de réécrire le plateau vide, pour éviter que l'état mémoire de KiCad n'écrase le fichier ; le nouveau plateau est ensuite ouvert.
- Le toast affiche le nombre de fenêtres fermées. 5 tests sur l'endpoint (dont la fermeture et la libération du verrou).
- typecheck 0, lint 0, vitest 375/375, prettier 0.

---

## Session 2026-11-26 (suite) — KiCad reflète enfin les étapes du layout

- **Symptôme** : le canvas « Layout PCB » était à jour, mais la fenêtre KiCad restait sur le plateau vide car elle ne recharge pas un fichier modifié en externe.
- **`kicad-desktop.ts`** : helpers partagés (fermeture gracieuse `CloseMainWindow`, attente `.lck`, ouverture) extraits de la route Board.
- **`action: 'reload'`** sur `POST /api/pcb/projects/[id]/board` : ferme la fenêtre KiCad et rouvre le plateau courant. Appelé automatiquement après nets, placement, routage et Freerouting ; bouton « Recharger dans KiCad » ajouté dans le panneau CDC pour l'état courant.
- Les toasts n'invitent plus à recharger manuellement. 6 tests sur l'endpoint.
- typecheck 0, lint 0, vitest 376/376, prettier 0.

---

## Session 2026-11-26 (suite) — wizard guide uniquement

- Le wizard n'exécute plus aucune action : suppression de `goNext`, des boutons d'action et des toasts avec `onClick` qui déclenchaient une étape. Il ne fait plus que naviguer (`goTo`) et valider l'étape.
- Guidage explicite : pour chaque étape, le wizard affiche le **libellé exact du bouton** à actionner et où le trouver ; le panneau Sourcing met ce bouton en évidence (anneau bleu pulsé + badge « À cliquer → »).
- `PcbActionBus` supprimé (plus aucun consommateur) ainsi que son provider et les `register` morts ; le surlignage repose uniquement sur `nextActionId` partagé par `PcbLiveStateProvider`.
- typecheck 0, lint 0, vitest 376/376, prettier 0.

---

## Session 2026-11-26 (suite) — séquence CDC → layout alignée

- **Étape 1** : « Générer les composants (LLM) » génère la BOM **et la place immédiatement sur le layout** via le même `placeComponents()` que l'étape 4 (selections IA par défaut, persist BDD + fichier + KiCad rouvert).
- **Étape 2** : « Générer les nets » crée les réseaux GND/VCC en BDD **et les assigne aux pads du plateau** (`assignBoardNets`) pour afficher les connexions sur le layout. Best-effort : sans Python KiCad, les nets restent valides en BDD et le toast le signale.
- **Étape 4** : le bouton est renommé « 4. Optimiser la répartition » (libellé aligné dans le wizard).
- 3 tests sur l'endpoint nets-only (cache / frais / KiCad indisponible).
- typecheck 0, lint 0, vitest 379/379, prettier 0.

---

## Session 2026-11-26 (suite) — chaîne Freerouting durcie

- **Diagnostic rejoué sur une copie du plateau réel** : assignation 6 pads → DSN 21 Ko → Freerouting 2.0.1/Java 21 → SES 6 wires + 3 vias → import 10 pistes → DRC.
- corrections : refus explicite si aucun net ou aucun pad assigné (`assignedPads = 0` ne produisait pas de pistes et renvoyait un succès trompeur), assainissement ANSI du DSN (Ω, µ, espaces fins) avant Freerouting, refus d'un SES sans `wire`, rapport DRC enrichi (`unconnected`, pads assignés, wires).
- toast du bouton 6 affiche pistes/connexions/violations et éléments non connectés.
- 5 tests sur l'endpoint Freerouting.
- **Limite** : la DRC reste non verte (140 violations sur le plateau de référence, dont 83 `solder_mask_bridge`, 13 `clearance`) — objet d'une phase séparée.
- typecheck 0, lint 0, vitest 384/384, prettier 0.

---

## Session 2026-11-26 (suite) — les pistes suivent le composant déplacé

- **Blocage** : « Valider et placer dans KiCad » remplaçait l'empreinte à sa nouvelle position mais laissait les segments sur l'ancienne → composant déconnecté de son propre routage.
- `place_footprints.py` déplace désormais les extrémités de pistes et les vias reliés aux pads de l'ancienne empreinte. Le delta est calculé **par pad** (donc valide aussi si la rotation change) ; l'autre extrémité du segment reste en place. Retour `movedTracks` remonté par `/api/pcb/place/batch`.
- Le toast indique le nombre d'extrémités suivies et invite à vérifier la DRC ; la fenêtre KiCad est rouverte après ce placement individuel (comme pour le placement global).
- **Vérifié sur une copie du plateau routé** : déplacement de U1 de 122,5 → 130 mm, `movedTracks: 2`, les deux extrémités VCC_5V suivent, les autres restent en place.
- typecheck 0, lint 0, vitest 384/384, prettier 0.

---

## Session 2026-11-26 (suite) — diagnostic du 404 HTML au placement

- Symptôme : `POST /api/pcb/place/batch 404` puis toast « Unexpected token '<', "<!DOCTYPE "... is not valid JSON » — le client tentait de parser une **page HTML 404** comme du JSON (route Next en recompilation/HMR après merge, pas un 404 JSON de l'API).
- Le projet `cmwwmezr7001iccfc6m1o9b3p` a été vérifié présent en BDD avec son `.kicad_pcb`, et la seule source de 404 JSON de la route est `Projet introuvable` — donc erreur transitoire de route, pas donnée manquante.
- `assertJsonResponse()` dans le panneau Sourcing : si la réponse n'est pas du JSON, message explicite « Route temporairement indisponible (404) — rechargez la page et réessayez » au lieu du token invalide.
- typecheck 0, lint 0, vitest 384/384, prettier 0.

---

## Session 2026-11-26 (suite) — carte CDC simplifiée

- Suppression du bouton « Recharger dans KiCad » de la carte **Cahier des charges** (le rechargement reste disponible là où il est utile : placement et étapes du wizard).
- La carte ne garde que « Consulter cahier des charges », « Ouvrir un nouveau fichier » (si absent) et « Reset ».
- Carte **Sourcing** : titre unifié « Sourcing (N) », état vide sans texte parasite, bouton « Lancer » qui déclenche la génération LLM (au lieu de « Relancer » qui ne rechargeait que l’affichage).
- typecheck 0, lint 0, vitest 384/384, prettier 0.

---

## Session 2026-11-26 (suite) — étape 2 du wizard renommée Sourcing

- L’étape 2 du wizard s’appelle désormais **Sourcing** (au lieu de « Netlist ») : elle couvre la génération des composants puis des connexions, pas seulement la netlist.
- Hint aligné : « Générer les composants puis les connexions ».
- typecheck 0, lint 0, vitest 384/384, prettier 0.

---

## Session 2026-11-26 (suite) — processus complet « Lancer »

- La carte Sourcing vide expose un bouton **Lancer** qui enchaîne composants (LLM) → placement optimisé → connexions → routage assisté → Freerouting (best-effort).
- Pendant l'exécution, aucun affichage n'est déclenché (pas de `pcb:board-refresh`, pas de rechargement KiCad) ; un bouton **Afficher le résultat** en bas de la carte déclenche l'affichage (layout + KiCad).
- KiCad est ouvert sous le nom du projet : action `show` renomme `carte-test.kicad_pcb` en `<projet>.kicad_pcb` (fermeture gracieuse puis réouverture).
- Après un routage, la carte ne garde que **Relancer** et **3. Éditer la Netlist** ; les autres boutons sont masqués ; le per-composant « Valider et placer dans KiCad » reste disponible.
- `KicadAutoOpen` ne relance plus KiCad automatiquement si le plateau est déjà routé (affichage gated par le bouton).
- Le canvas rend maintenant pistes, vias et zones (toggle « Cuivre »).
- typecheck 0, lint 0, vitest 386/386, prettier 0.

---

## Session 2026-11-26 (suite) — correction affichage + placement manuel

- Le processus complet affiche le bouton « Afficher le résultat » dès la fin du routage assisté (Freerouting continue en arrière-plan) ; le bouton reste désactivé jusqu'à la fin totale.
- Option manuelle : après le dernier « Valider et placer dans KiCad », les connexions et le routage se tracent automatiquement et le résultat s'affiche sous le nom du projet.
- typecheck 0, lint 0, vitest 386/386, prettier 0.

---

## Session 2026-11-26 (suite) — bouton Afficher + complétion manuelle

- Le résultat ne s'affiche qu'après actionnement du bouton « Afficher le résultat » (dans la carte Sourcing).
- En mode manuel (placement composant par composant), après le dernier composant un bouton « Placer routage et connexion » complète le schéma ; l'affichage reste gated par « Afficher le résultat ».
- typecheck 0, lint 0, vitest 386/386, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 1.2 Freerouting v2.6.0

- Jar v2.6.0 installé (checksum SHA-256 validé) ; v2.0.1 conservé en `tools/freerouting-2.0.1.jar.bak`.
- **Correction d'audit** : v2.6.0 nécessite Java 25 (class file 69) et non Java 21 ; Temurin 25.0.5.1 installé via winget. `javaBinary()` privilégie le JDK 25.
- Options CLI modernisées : `-mp`/`-inc` dépréciés → `--router.autorouter.max_passes 20`, `--router.autorouter.ignore_net_classes GND,VCC`, `--router.copperToEdgeClearanceUm=500`. `-dr` est en fait un flag de fichier de règles (déprécié), pas le rip-up (intégré par défaut).
- Timeout porté à 10 min ; capture stdout/stderr ; score 0-1000 extrait et renvoyé dans l'API + affiché dans le toast.
- Test sur carte référence : violations 47 → 30 (-36%), non-connectés 14 → 11, score 1000/1000, 28 pistes importées, 3,58 s.
- typecheck 0, lint 0, vitest 386/386, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 2 Placement séquentiel

- `PlacementComponent` gagne `locked`, `anchorX/Y`, `movementRangeMm`.
- Nouvelle passe `placeSequentially` : connecteurs verrouillés sur le bord supérieur, ICs au centre (±2 mm), passifs attachés à leur IC via les nets (angle doré), secondaires en bas.
- `forceDirected` / recuit / `resolveOverlaps` respectent les verrous et les ancrages.
- `inferPlacementRole` reconnaît le NE555 comme IC principal ; `calculateCost` pénalise l'éloignement des passifs de support (> 5 mm).
- Test clignotant LED : J1 en haut verrouillé, U1 au centre, R1/R2/C1 autour, LED en bas. Longueur des nets 355 → 172 mm.
- 3 tests de placement séquentiels ajoutés (total 389).
- typecheck 0, lint 0, vitest 389/389, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 3 DRC catégorisé

- `drc.ts` étendu : `DrcViolationDetail` (type, sévérité, description, position, catégorie, suggestion), `categories` (placement/routage/fabrication/autre) et `preExisting` extrait du log Freerouting.
- Classification : placement (courtyards_overlap, solder_mask_bridge), routage (clearance, unconnected_items, shorting_items, via_dangling), fabrication (silk_overlap, copper_edge_clearance, etc.).
- API `runDrc(boardPath, reportPath?, routingLogs?)` ; le toast affiche le résumé catégorisé ; bouton « Voir les détails DRC » avec position et suggestion.
- Test réel : 41 violations (11 placement / 30 routage / 0 fabrication), 11 non-connectés, 12 pré-existantes.
- 6 tests DRC ajoutés (395 total).
- typecheck 0, lint 0, vitest 395/395, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 4 Congestion globale

- `calculateCost` intègre une grille de densité 10×10 : au-delà de 3 composants dans une cellule, pénalité de 30 × (dépassement)².
- Test clignotant LED : longueur des nets stable à 172 mm, densité max 1 composant/cellule, aucun chevauchement, coût stable à 2677.
- 1 test de densité ajouté (396 total).
- typecheck 0, lint 0, vitest 396/396, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 5 Orientation par flux de signal

- `CRITICAL_NET_RE` (OSC, CLK, XTAL, VCC, VDD, RS485, UART, SPI, I2C) + `idealSignalRotation()` : angle du net critique arrondi à 0/90°.
- `calculateCost(components, adj, board, nets?)` pénalise une rotation perpendiculaire (ROTATION_WEIGHT 20).
- `optimizeRotations(components, nets?)` aligne les composants sur l'axe du net critique.
- Test clignotant LED : J1/U1/R1 à 90° (axe VCC vertical), R2/C1/D1 à 0°, longueur des nets stable à 172 mm.
- 2 tests d'orientation ajoutés (398 total).
- typecheck 0, lint 0, vitest 398/398, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 6 Validation interne

- Nouveau module `netlist-validation.ts` : `validateNetlist(components, nets)` vérifie nets ≥ 2 pins, broches existantes, broches dupliquées, alimentation/GND des composants U*/IC*, nets d'horloge (cristal + IC) et RS485 (transceiver + connecteur).
- Intégré dans `runFullFlow` avant le placement : erreur critique → toast + bandeau « Netlist invalide — placement bloqué » avec bouton « Éditer la Netlist ».
- Reset efface les erreurs de validation.
- Test clignotant LED : netlist valide passe ; suppression du net GND → « Le composant U1 n'a pas de connexion GND » et placement bloqué.
- 6 tests ajoutés (404 total).
- typecheck 0, lint 0, vitest 404/404, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 7 Score et itération

- Modèle Prisma `PcbRoutingAttempt` (score, tracks, violations, placement, routing) + migration `20261126120000_add_pcb_routing_attempts`.
- **Migration appliquée le 2026-11-26** (`npx prisma migrate deploy`, schema up to date). Vérification réelle : routage via API → score 1000, 41 pistes, 54 violations, 1 ligne persistée dans `pcb_routing_attempts`.
- Freerouting enregistre chaque tentative ; bouton « Re-router avec score minimum » avec restauration du plateau précédent si le score régresse (`ROUTE_NOT_IMPROVED`).
- Récapitulatif : score /1000, pistes, violations catégorisées ; historique en mini-graphe de progression.
- GET `/api/pcb/projects/[id]/routing-attempts` (fallback vide si table absente).
- Tests freerouting adaptés (mock copyFileSync + pcbRoutingAttempt). 404 total.
- typecheck 0, lint 0, vitest 404/404, prettier 0.

---

## Session 2026-11-26 (suite) — Étape 8 DFM JLCPCB + export

- `src/lib/pcb/dfm/jlcpcb-rules.ts` : profil JLCPCB (piste 0,1 mm, espacement 0,1 mm, perçage 0,3 mm, anneau 0,13 mm, bord 0,5 mm) + `validateDfm`.
- Route `POST /api/pcb/export/fabrication` : Gerbers + Drill via `kicad-cli`, BOM CSV et Pos CSV depuis la BDD, archive ZIP base64 renvoyée au client.
- UI : badge « ✓ Conforme JLCPCB » / « ✗ Non conforme JLCPCB » avec suggestions, bouton « Exporter pour JLCPCB » téléchargeant le zip (export autorisé même non conforme).
- `runKicadCli` exporté pour la route. Test réel : kicad-cli génère 5 Gerbers + 1 fichier drill ; DFM sur la carte test = 20 violations (shorting_items) → badge rouge.
- 5 tests DFM ajoutés (409 total).
- typecheck 0, lint 0, vitest 409/409, prettier 0.

---

## Session 2026-11-27 — Canvas 3D (hors roadmap)

- `Pcb3DViewer` (three.js / @react-three-fiber + drei) : bouton « Vue 3D » dans `PcbCanvas`, remplace le canvas 2D.
- Charge le GLB exporté par `kicad-cli pcb export glb` via `GET /api/pcb/projects/[id]/glb` (base64 → blob URL). Contrôles OrbitControls (rotation gauche, zoom molette, panoramique droit).
- Fallback paramétrique (substrat + boîtes composants + label « 3D non disponible ») si GLB absent ou illisible (ErrorBoundary), récupérant board/components depuis `/api/pcb/board/render`.
- Vérifié : endpoint GLB → 200, 358 Ko base64 ; page projet → 200. La boucle de chargement observée venait de l'onglet navigateur de test (HMR Turbopack), pas de l'application.
- 409 tests verts, typecheck 0, lint 0, prettier 0.

---

## Session 2026-11-27 (suite) — Option B correctifs

- Correctif 1 : `solder_mask_bridge` classé `routage` si un item est une piste/via, `placement` sinon. Placement passe de 15 à 0 sur la carte test.
- Correctif 2 : `source-components` valide les `REF.PIN` du LLM contre `getFootprintPadNumbers()` avant de persister le cache ; `droppedPins` + `warnings` renvoyés.
- Correctif 3 : `route_board.py` contourne les pads d'un autre net (couloir Y libre, 3 segments Manhattan).
- Correctif 4 : vias GND à 0,8 mm du pad avec piste de liaison (plus orphelins).
- Correctif 5 : empreinte U1 vérifiée — `Package_DIP:DIP-8_W7.62mm`, pads 1-8 corrects ; seuls 2 pads câblés (netlist incomplète, pas un défaut d'empreinte).
- Test E2E : reset → source → place → nets → route → Freerouting → score 1000 ; DRC placement 0.
- 1 test de catégorisation ajouté (410 total).
- typecheck 0, lint 0, vitest 410/410, prettier 0.

---

## Session 2026-11-27 (suite) — Option D Viewer 3D

- Sélection de composant au clic sur un marqueur : panneau avec référence, valeur, empreinte, nets connectés, position/rotation.
- Toggle « Afficher les nets » : ratsnests pointillés colorés par net (Palette 8 couleurs, `Line` drei).
- Bouton « Vue éclatée » : substrat, F.Cu, B.Cu et composants décalés en hauteur.
- Bouton « Capturer » : PNG téléchargeable via `preserveDrawingBuffer` + `toDataURL`.
- Test UI non réalisé : Better Auth renvoie 500 « Connection terminated due to connection timeout » (Neon momentanément injoignable). Compilation et 410 tests verts.
- typecheck 0, lint 0, vitest 410/410, prettier 0.

---

## Session 2026-11-27 (suite) — Option 3 correctifs routage

- Correctif 1 : `route_board.py` nettoie pistes/vias/zones existants au démarrage (idempotence) ; réutilise une zone GND si le nettoyage SWIG échoue.
- Correctif 2 : `find_safe_lane` vérifie les 3 segments du chemin L ; dégagement porté à 0,5 mm.
- Correctif 3 : `cleanBoardTracks` (specctra.py `clean-tracks`) appelé avant Freerouting ; sauvegarde du plateau AVANT nettoyage pour restauration.
- Correctif 4 : `ZONE_FILLER.Fill(board.Zones())` après création de la zone GND.
- Correctif 5 : DSN `(clearance 200)` → `(clearance 500)`.
- **Test hors ligne complet** (route → clean → DSN → Freerouting → SES → DRC) : violations **92 → 0**, non-connectés **14 → 0**, score **1000/1000**, 33 pistes. Cible dépassée (≤20 / ≤5 / ≥950).
- 410 tests verts, typecheck 0, lint 0, prettier 0.

---

## Session 2026-11-27 (suite) — Support 4 couches (Prompt 1)

- `configure_stackup.py` + `configureBoardLayers()` : configuration du nombre de couches cuivre (2 ou 4) via `SetCopperLayerCount`.
- `POST /api/pcb/projects/[id]/board` accepte `layers: 4` à l'ouverture ; `/api/pcb/route` détecte automatiquement le nombre de couches depuis le plateau.
- `route_board.py --layers 4` : plan VCC_5V sur In1.Cu, plan GND sur In2.Cu, vias F.Cu↔In1.Cu pour l'alimentation.
- Freerouting 2.6.0 reconnaît les plans internes dans le DSN (`(plane VCC_5V (polygon In1.Cu ...))`) et route en multi-couches.
- Vérifié : stackup 4 couches (F.Cu/In1.Cu/In2.Cu/B.Cu), DSN avec 4 layers + 2 plans, Freerouting COMPLETED. Test DRC complet 4 couches non finalisé : crash SWIG KiCad sur un plateau muté plusieurs fois en processus successifs (limite documentée, repartir d'un plateau vierge).
- typecheck 0, lint 0, vitest 410/410, prettier 0.

---

## Session 2026-11-27 (suite) — Prompt 2 Import de schémas

- Audit KiCad 10.0.5 : `kicad-cli sch` n'a **pas** de sous-commande `import` (seuls erc/export/upgrade). L'import(non-KiCad) se fait via l'interface graphique ; on implémente donc un parseur Eagle `.sch` XML en Python.
- `import_schematic.py` : détecte le format, extrait `parts` (référence, valeur, `attribute FOOTPRINT`) et `nets` (`pin ref="U1-8"` → `U1.8`), produit un rapport avec avertissements.
- Route `POST /api/pcb/import/schematic` (multipart) : persiste `PcbComponent` + `PcbNet` dans une transaction, renvoie le rapport.
- UI : bouton « Importer un schéma » dans la carte Sourcing + modal avec composants, nets et avertissements.
- Test hors ligne sur un `.sch` Eagle synthétique : 3 composants, 3 nets, 3 avertissements (2 sans empreinte, 1 pin orpheline). Test API non réalisé (Neon injoignable).
- typecheck 0, lint 0, vitest 410/410, prettier 0.

---

## Session 2026-11-27 (suite) — Prompt 3 Devis JLCPCB

- Audit : aucune credential `JLCPCB_*` dans `.env`. Procédure de candidature documentée dans `docs/TECHNIQUE.md` (api.jlcpcb.com, appId/accessKey/secretKey, signature JOP HMAC-SHA256 Base64).
- `jlcpcb-quote.ts` : `getJlcpcbQuote()` signe la requête (METHOD/PATH/TIMESTAMP/NONCE/BODY), lit dimensions + couches depuis le plateau, renvoie `{ok, configured, price, currency, deliveryDays}`.
- Route `POST /api/pcb/jlcpcb/quote` + bouton « Obtenir un devis JLCPCB » dans le récapitulatif.
- Test fallback vérifié : `configured:false` → message « configurez vos credentials JLCPCB dans .env (voir docs/TECHNIQUE.md) », aucun appel réseau. Test live impossible sans credentials.
- typecheck 0, lint 0, vitest 410/410, prettier 0.

---

## Session 2026-11-27 (suite) — Page d'accueil

- Nouvelle section **PCB Studio** sur la page publique : 4 piliers (placement intelligent, routage optimisé, vérifications intégrées, export fabrication), CTA « Ouvrir PCB Studio » et « Demander un devis PCB ».
- Badge du hero mis à jour pour mentionner PCB Studio.
- typecheck 0, lint 0, vitest 410/410, prettier 0.

---

## Session 2026-11-27 (suite) — Démarrage `tauri dev`

- Mesure : build Rust incrémental `cargo build --no-default-features` = 1,35 s ; les 56 s du journal venaient d'une compilation à froid (après Ctrl+C), pas d'un coût récurrent. Profil Cargo laissé inchangé pour ne pas invalider le cache.
- `desktop/scripts/dev-server.cjs` : `prisma generate` conditionnel (empreinte SHA-256 de `schema.prisma` + `prisma7.config.ts` + version Prisma, stamp dans `.next-desktop/prisma-client.stamp`), économie ~1,3 s + npx à chaque démarrage.
- Pré-chauffage de `/api/health` (sonde), `/` et `/login` dès que Next répond, pendant la compilation Rust : la webview n'attend plus la compilation de la page.
- Vérifié isolément : sans stamp = generate, stamp valide = ignoré, stamp modifié = generate ; sondes health/home/login = 200. typecheck 0, lint 0, vitest 410/410, prettier 0, `node --check` 0, `git diff --check` 0.
- PR #245 (en attente de CI). À vérifier au prochain lancement réel : logs `[dev] prisma generate ignoré` et `[dev] routes pré-chauffées`.

---

## Session 2026-11-27 (suite) — Première compilation CDC conservée

- Dans `/admin/pcb/[projectId]/cahier-des-charges`, la carte 1 « Idée générale » affichait `project.description`, écrasée à chaque validation. Nouveau champ `PcbProject.initialDescription` (+ migration `20261127110000_add_pcb_project_initial_description`), posé une seule fois par `/api/pcb/requirements/parse`.
- `RequirementForm` mémorise le premier texte renvoyé par `/api/pcb/requirements/compile` et l'envoie à la validation ; les recompilations ne l'écrasent pas. `description` reste le dernier texte validé (source de `cdcHash`/analyse). Repli sur `description` pour les projets antérieurs.
- Migration appliquée et colonne vérifiée en base. Test bout en bout sur le serveur 3100 avec projet temporaire : seconde validation faite, page = 200, contient `PREMIERE_COMPILATION_TEST`, ne contient ni la valeur précédente ni la nouvelle ; projet supprimé ensuite.
- Vérifié également au redémarrage du serveur de dev : `[dev] routes pré-chauffées: /=200, /login=200`.
- typecheck 0, lint 0, vitest 410/410, prettier 0, `git diff --check` 0.

---

## Session 2026-11-27 (suite) — Erreur de champ requis persistante

- `RequirementForm.handleAnswer()` mettait à jour la réponse mais ne effaçait jamais `error` : le message « Champ requis manquant : Quantité prévue » restait affiché après que l'utilisateur ait corrigé le champ.
- Correction : `setError(null)` dès qu'une réponse change (y compris via les cases à cocher, qui passent par `handleAnswer`).
- Vérifié en direct sur `/admin/pcb/nouveau` (serveur 3100) : compilation IA, quantité vidée, clic Valider → erreur affichée et retour au bloc Fabrication ; saisie de `100` → erreur absente immédiatement, sans nouveau clic.
- Deux projets de test crées pendant la manipulation ont été supprimés.
- typecheck 0, lint 0, vitest 410/410, prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 — Netlist auto-réparante et pédagogique

- `source-components/route.ts` : extraction des nets factorisée (`parseNetCandidates`), second essai LLM avec le prompt strict contenant les composants retenus et leurs **vrais pads** (`buildStrictNetsPrompt`). Échec après deux essais → HTTP 422 `LLM_NETLIST_EMPTY` avec `components` conservés et message pédagogique.
- `nets-only/route.ts` : `ensurePowerNets()` appliquée aux chemins cache et frais — VCC_5V/GND complétés pour chaque U* non couvert à partir de pads réels, marqués `heuristic`/`to_verify`, avec avertissement dans la réponse.
- `netlist-guidance.ts` (nouveau) : messages REF.PIN / nets vides / MCU sans VCC-GND + hélper pur testé (`netlist-guidance.test.ts`, 3 tests dont validation croisée avec `validateNetlist`). Le regex de validation est inchangé.
- Frontend : `fetchComponents()` gère le 422 sans perdre la BOM, bandeau d'action avec « Générer les nets » / « Éditer la Netlist », avertissement heuristique affiché, infobulle « ? » sur le champ Pins de la modale.
- Vérifié en direct sur 3100 : `U1-7, U2-3` → message REF.PIN ; `U1.7` seul → message « au moins deux broches » ; `U1.7, U2.3` → net sauvegardé ; infobulle présente ; nets-only sur un U1 sans alimentation → VCC_5V/GND créés avec avertissement. Projets temporaires supprimés.
- typecheck 0, lint 0, vitest 413/413, prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — Synchronisation d'affichage du plateau

- Diagnostic sur `cmwzjodye0010n8fckcuwtjrm` : le backend a bien routé (14 pistes + 1 zone, puis Freerouting 18 pistes/score 852), mais le fichier `carte-test.kicad_pcb` a été réécrit à vide à 00:45 (0 empreinte/0 piste) avant d'être rechargé ; le client a ensuite affiché un snapshot périmé.
- Correctifs (sans toucher au routage) : `PcbLiveStateProvider` ne laisse plus une réponse de polling en vol écraser un rendu serveur plus récent (génération + numéro de requête) ; `/api/pcb/board/render` renvoie `Cache-Control: no-store` et le canvas `fetch(..., cache:'no-store')` ; `ComponentSourcingPanel` conserve le résultat de `/api/pcb/route` pour afficher « Afficher les résultats » même si le polling est en retard.
- Nouvelle action `POST /api/pcb/projects/[id]/board {action:'sync'}` : relit le `.kicad_pcb` et renvoie compteurs + chemin, sans écriture ni ouverture KiCad. Bouton « Recharger depuis le fichier » dans le panneau Sourcing.
- Vérifié en direct : sync = 200 (2 empreintes/14 pistes/1 zone), header no-store présent, bouton cliquable, page affichant « 14 pistes · 9 violations DRC · 2 composants » et bouton « Afficher les résultats » présent. Les manipulations manuelles (Ctrl+R / retour-projet) avaient déjà rétabli l'affichage.
- Risque résiduel documenté : une fenètre KiCad ouverte peut réécrire le fichier par-dessus une écriture backend (locks présents dans le dossier) — non corrigé ici (hors périmètre routage).
- typecheck 0, lint 0, vitest 413/413, prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — Crash SWIG au placement

- Crash reproduit sur `cmwzjodye0010n8fckcuwtjrm` : `TypeError: 'SwigPyObject' object is not iterable` à `scripts/kicad/place_footprints.py:55` (`old_fp.Pads()` appelé après mutation du plateau) + leaks SWIG `PCB_IO_KICAD_SEXPR`.
- Correctif : nouvelle fonction `capture_pad_positions()` qui copie les positions des pads en entiers plains **avant toute mutation** ; `move_connected_tracks()` ne manipule plus que ces copies (plus aucun appel SWIG sur les empreintes). `gc.collect()` avant la sortie du processus pour limiter les leaks.
- Non impliqué volontairement : vider le plateau avant **chaque** placement écraserait les composants/pistes déjà posés. Chaque appel au script est déjà un processus Python neuf, et l'action `Reset` existante fournit un plateau vierge (`board/route.ts`).
- Test de non-régression `scripts/kicad/test_place_footprints.py` (3 tests unittest avec faux pads SWIG non itérables) + nouveau job CI `Scripts KiCad (Python)`.
- typecheck 0, lint 0, vitest 413/413, unittest 3/3, prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — F2 : netlist validée contre les pads réels

- **Helper partagé** `netlist-validation.ts` : `validateNetsAgainstFootprints(nets, padsByRef)` distingue `UNKNOWN_REFERENCE` (référence absente, broche retirée), `PAD_NOT_FOUND` (pad inexistant sur une empreinte lisible, broche retirée avec `available`), `PAD_NOT_READABLE` (empreinte illisible, broche conservée et composant `toVerify`). Ajout de `droppedNets`, `toVerify`, `stale` et `code` au `NetlistReport`.
- **Résolution d'empreinte** `kicad-footprints.ts` : `strategy: 'exact' | 'other-lib' | 'fuzzy' | 'fallback'` ; seul `fallback` déclenche `toVerify`. Sanitisation `safeFootprintPart()` (gère `/` et `\`, retire `..`) appliquée aussi à `getFootprintPadNumbers`/`getFootprintSize`. Les caches vides expirent après 60 s au lieu d'être figés.
- **`source-components/route.ts`** : cache v3 avec `netlistReport` et `rawProposal` persistés ; sur cache hit, le helper déterministe est rejoué sans LLM et le rapport réécrit. Phase 1 = BOM + brouillon de nets ; phase 2 = netlist stricte avec les pads réels, le brouillon servant d'indice. Maximum 3 appels LLM (BOM + 2 tentatives nets). 422 enrichi : `error: LLM_NETLIST_EMPTY` conservé à la racine, plus `netlistReport` (`code: INVALID_PINS`) et `rawProposal`. `maxDuration = 60`.
- **`nets-only/route.ts`** : même helper, `netlistReport` dans la réponse et le cache v3, fusion des `toVerify` issus des nets heuristiques. **`nets/route.ts`** : une édition manuelle marque `netlistReport.stale = true` au lieu de le supprimer.
- **Tests** : 5 cas de non-régression sur la route `source-components` (TO-220 lisible + `U2.4` retiré sans `toVerify` ; empreinte illisible conservée + `toVerify` ; fallback `U*` → `toVerify` ; 422 avec rapport et proposition brute ; cache hit sans LLM), 5 tests du helper, stratégies et path traversal dans `kicad-footprints.test.ts`.
- typecheck 0, lint 0, vitest 425/425 (50 fichiers), prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — F4 : édition atomique de la netlist

- Diagnostic : la modale envoyait une boucle de PATCH avec `oldName` comme identité ; les ajouts précédaient les suppressions (409 « Le net existe déjà » sur un remplacement), un échec en cours de boucle laissait un état partiel, et le compteur « N réseaux » venait du rendu serveur sans `router.refresh()`. Aucune contrainte d'unicité sur `pcb_nets(projectId, name)`.
- `netlist-plan.ts` (nouveau, pur) : `buildNetPlan(current, desired)` calcule un plan unique `{deleteIds, updates, creates, issues, unknownIds}` ; unicité des noms insensible à la casse, suppression avant ajout (swap et remplacement même nom supportés), id inconnu détecté comme dérive.
- `nets/route.ts` : nouveau `PUT` transactionnel (suppressions → renommages → ajouts, cache et rapport `stale` dans la même transaction) avec `maxDuration = 60` ; réponses 409 `NETLIST_CONFLICT` (avec la vérité serveur) et 422 `INVALID_NETLIST` (avec `issues`), aucune écriture dans ces deux cas. GET renvoie `netlistReport`. PATCH historique conservé et rendu atomique via le helper `syncCacheWithNets` partagé. `clearLlmCacheAsync()` appelé après commit.
- `NetlistEditorModal.tsx` : un seul PUT, plus de boucle ; resynchronisation `original`/`draft`/rapport depuis la réponse serveur (succès, 409, rechargement manuel), bandeau rapport F2 en lecture seule étiqueté « périmé », bouton « Recharger ». `ComponentSourcingPanel.tsx` : `router.refresh()` dans `onSaved` pour rafraîchir le compteur RSC.
- Tests : `netlist-plan.test.ts` (8 cas dont swap, remplacement même nom, id inconnu, doublons) et `nets/route.test.ts` (7 cas dont atomicité, 409, 422, stale, GET rapport, compat PATCH).
- typecheck 0, lint 0, vitest 441/441 (52 fichiers), prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — F1 : compilation CDC par extraction

- Diagnostic : le prompt de `compile/route.ts` imposait « complète », « les 6 obligatoires », « déduis une valeur raisonnable », « ne laisse aucune catégorie vide », « sois exhaustif », « remplis un MAXIMUM de champs » — le LLM inventait donc des spécifications et ignorait « pas de Wi-Fi / pas de batterie / pas d'écran tactile ». Le post-traitement écrasait en plus tous les statuts en `proposed`.
- `negative-constraints.ts` (nouveau, pur) : `extractNegativeConstraints()` (négations FR, alias WiFi/batterie/tactile/écran/relais/12V, exclusion des idiomes « pas de problème », « sans fil »), `checkConstraintViolations()` (détection dans `compiled` et les réponses, avec fenêtre de négation pour ne pas signaler « WiFi exclu »), `reconcileConflicts()` (conflits limités aux interdictions réellement extraites).
- `compile/route.ts` : prompt réécrit en **extraction** (aucune inférence, champs absents omis, interdictions absolues, conflits déclarés), `temperature: 0`, cache **v4**, `blockId` repris du référentiel serveur, champs requis manquants synthétisés en `À préciser`/`status:'missing'`, statuts `to_verify` pour violations et conflits. Réponse `{compiled, answers, constraints, conflicts, violations, needsReview, count}` ; aucune mise en cache si `needsReview`.
- `types.ts` : ajout de `CompileViolation` et `CompileConflict`. `RequirementForm.tsx` : badges « Contraintes extraites », « À préciser », « À vérifier », conflits arbitrables, violations recalculées au rendu par le même helper pur, garde-fou dans les deux chemins de validation, et `firstCompiledText` posé uniquement si la compilation est propre (il devient `initialDescription`).
- Tests : `negative-constraints.test.ts` (10 cas) et `compile/route.test.ts` (6 cas : prompt sans injonction à inventer, statuts et blockId serveur, violation → `needsReview` sans cache, conflits, cache v4, devises DT).
- typecheck 0, lint 0, vitest 458/458 (54 fichiers), prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — F3 : diagnostic fin des pins

- Diagnostic : F2 produisait `netlistReport.invalidPins` mais la modale ne l'affichait qu'en bandeau « génération », sans lien avec la saisie ; `normalizeNetPins()` filtrait silencieusement les pins mal formatés et la sauvegarde manuelle ne vérifiait pas les pads → message générique « au moins 2 pins valides ».
- `pin-diagnostics.ts` (nouveau, pur) : `splitPinInput`, `diagnosePins` (`BAD_FORMAT`, `UNKNOWN_REFERENCE`, `PAD_NOT_FOUND` avec `available`/`footprint`, `DUPLICATE_PIN`, `PAD_NOT_READABLE` non bloquant), `mergePinIssues` (déduplication par net+pin), `isBlockingPinIssue` ; `pinIssueMessage()` ajouté dans `netlist-guidance.ts` avec le nom du pin, la raison et les pads disponibles.
- `PinIssueReason` étendu de façon additive ; `NetIssue` étendu avec `code:'PIN_ISSUE'` et les champs `pin`/`reason`/`available`/`footprint`.
- `nets/route.ts` : GET expose `padsByRef`, `refs`, `footprintsByRef` (calculés via `getFootprintPadNumbers`) ; PUT diagnostique les pins **bruts** avant normalisation et refuse la sauvegarde avec un 422 `INVALID_NETLIST` détaillé si un pin est invalide — le mode dégradé (pads illisibles) reste non bloquant. Plan/transaction F4 et 409 inchangés.
- `NetlistEditorModal.tsx` : champ de pins remplacé par un éditeur de chips (rouge + `aria-invalid` + infobulle avec raison et pads disponibles, amber pour « à vérifier »), diagnostic local recalculé au rendu et fusionné avec les `serverIssues` (effacées dès édition du net), bouton « + REF.PIN ». Bandeau F2 conservé mais clairement daté de la génération.
- Tests : `pin-diagnostics.test.ts` (8 cas) et `nets/route.test.ts` (4 cas supplémentaires : GET pads, 422 détaillé, format invalide nommé, mode dégradé accepté).
- typecheck 0, lint 0, vitest 471/471 (55 fichiers), prettier 0, `git diff --check` 0. Un test unrelated (`reconstruct.test.ts`) a dépassé son timeout de 5 s lors du premier passage complet ; rejoué seul et au second passage complet : vert (flaky, non lié à F3).

---

## Session 2026-11-28 (suite) — F5 : verrou de plateau et course d'écriture

- Diagnostic : PR #250 (`cedd62f` / `3899d33`) a corrigé le crash SWIG immédiat (capture des pads avant mutation, `gc.collect()`, relecture en processus neuf, écriture `.tmp`/`.bak`), mais `place/batch/route.ts` passait `force: true` pour écraser le `.lck` d'une GUI KiCad ouverte ; un Ctrl+S dans KiCad pouvait ensuite écraser le fichier backend. `withMutex` du bridge est limité à un processus Node.
- `board-lock.ts` (nouveau) : `withBoardLock(boardPath, fn)` avec fichier `<plateau>.partiva.lock` (PID/date/opération), retry/timeout 30 s, récupération des locks périmés (5 min) ou au PID mort, relâchement même en erreur ; `readBoardStamp` / `assertBoardStamp` pour le fencing.
- `kicad-desktop.ts` : `prepareBoardForWrite()` ferme proprement la fenêtre KiCad si `.lck` présent et indique `released:false` si l'utilisateur refuse.
- `place/batch/route.ts` : plus de `force:true` (toujours `false`), 423 `BOARD_LOCKED_BY_KICAD` si la GUI garde le plateau, 423 `BOARD_LOCKED_BY_WRITER` sur contention, snapshot avant/après écriture avec rollback depuis le `.bak` et 409 `BOARD_CHANGED`, rafraîchissement uniquement d'une fenêtre déjà ouverte (jamais de seconde).
- `route/route.ts` et `autoroute/freerouting/route.ts` : toute la chaîne d'écriture enveloppée dans `withBoardLock` + fermeture gracieuse, avec les mêmes réponses 423. Audité : `projects/[id]/board/route.ts` (actions `show`/`reset`) ferme déjà gracieusement et restaure le plateau en cas d'échec BDD — laissé tel quel ; les écritures de `nets-only` restent couvertes par le mutex du bridge.
- `place_footprints.py` : fichiers `.tmp`, `.bak` et `.expected.json` suffixés par PID pour éviter les collisions inter-processus ; logique SWIG de #250 inchangée.
- Tests : `board-lock.test.ts` (9 cas : exclusion, timeout, lock périmé/PID mort, relâchement en erreur, fencing) et `place/batch/route.test.ts` (423 GUI, 409 changement, `force:false` même si le client demande `force:true`).
- typecheck 0, lint 0, vitest 482/482 (56 fichiers), prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — F6 : gating séquentiel du CDC

- Diagnostic : `wizard-state.ts` considérait le CDC validé dès que `project.requirements.length > 0` (`||`), donc une simple analyse partielle ouvrait le layout et autorisait « Lancer ». La page Cahier des charges n'avait aucun bouton « Passer au Layout PCB » conditionné, la page Layout aucun `redirect`, et `ComponentSourcingPanel` aucune connaissance du statut CDC. `/api/pcb/wizard/validate` n'imposait aucun prérequis.
- `cdc-gate.ts` (nouveau, pur) : `evaluateCdcGate` (statut `requirements_validated` comme seule source de vérité, exigences complètes et confirmées si elles existent, projets historiques sans exigences analysées tolérés) et `evaluateCdcCompleteness` (6 catégories + champs confirmés). `cdc-guard.ts` : `checkCdcGate(projectId)` renvoie 404/409 `CDC_NOT_VALIDATED`.
- UI : page Cahier des charges avec bouton « Passer au Layout PCB » désactivé, bandeau `?cdc=incomplete` et bouton « Valider le CDC complet » (`cdc-gate-actions.tsx`) ; page Layout avec `redirect()` serveur et transmission de `cdcValidated` ; panneau Sourcing avec tous les boutons de génération désactivés et message « Complétez et validez le cahier des charges avant de générer le PCB ».
- API : garde `checkCdcGate` sur `source-components` (sauf `peek`), `place/batch`, `route` et `freerouting` → 409 ; nouvelle route `requirements/validate` (422 `CDC_INCOMPLETE` si incomplet) ; `wizard/validate` applique la chaîne `analyze → nets → placement → routing → review` avec 409 `STEP_LOCKED`.
- Tests : `cdc-gate.test.ts`, `wizard-state.test.ts`, `requirements/validate/route.test.ts`, `wizard/validate/route.test.ts`, plus cas 409/peek dans les tests de routes existants et mise à jour du mock `wizard-state` pour un projet valide.
- typecheck 0, lint 0, vitest 501/501 (60 fichiers), prettier 0, `git diff --check` 0.

---

## Session 2026-11-28 (suite) — F6-bis : complétion du CDC depuis l'UI

- Suite au test final : le projet `cmx0fywjw00007kfc1ikp9pam` avait 13 exigences (6 `proposed`, 7 `confirmed`) mais aucune ligne `manufacturing`/`quality` ; le gating F6 affichait « Manquant : validation » à juste titre, mais l'UI ne permettait ni d'ajouter un champ manquant, ni de confirmer en masse, ni de relancer l'analyse (badge « Analyse effectuée » masquant `AnalyzeButton`).
- Nouvelles routes : `requirements/confirm-all` (passe toutes les lignes non confirmées en `confirmed`) et `requirements/add` (ajout d'un champ saisi, `confirmed`/`manual`, catégorie validée contre `CDC_CATEGORIES`).
- Page Cahier des charges : `cdc-completion-actions.tsx` (« Tout confirmer (N) », formulaire catégorie/champ/valeur avec catégories manquantes signalées) ; `AnalyzeButton` réapparaît tant que le statut n'est pas `requirements_validated`, même si le hash d'analyse est à jour.
- typecheck 0, lint 0, vitest 506/506 (62 fichiers), prettier 0, `git diff --check` 0.

---

## Prochaine étape

**Roadmap active :** `docs/roadmap/PCB_STUDIO_ROADMAP.md` (P12, 5 phases). Prochaine action retenue : **Phase 1.3 — édition manuelle de la netlist**, couplée à 1.1 (prompt hiérarchique), avant toute amélioration du placement ou du routage.

**Fast-Track P7 - CLOS et fusionné sur `master`** (`2224ebe`, PR #141). La branche `fast-track/p7-dashboard-pcb` est entièrement intégrée.

**Bloquants immédiats :**
- Aucun bloquant technique : PR #153 mergée (`fbf4daa`), migrations LLM appliquées. Reste à valider en environnement réel les logs `[LLM:usage]` / `[LLM:budget]` et le cache L2 partagé.

**Prochaines étapes possibles :**
1. **C3 — canvas lisible** : symboles 2×, labels lisibles, couleurs par type, zoom/pan, grille 2,54 mm, espacement des composants, chemin propre.
2. **C4 — empreintes** : validation IPC sur le projet officiel `cmwo3y9z50000nsfc1ci309ll`.
3. **C5 — UX** : chemin KiCad lisible, bouton supprimer, finitions.
4. **Synchronisation inverse KiCad → app** (polling `GET /api/pcb/kicad/state` + merge des positions).
5. **Confirmation visuelle** du placement (KiCad GUI + canvas PartIVA) par le coordinateur — rejeu BOM technique déjà vert (15/15).
6. **Mesure des faux positifs** de `cdc-quality` sur le golden set (avant tout blocage éventuel).
7. **Runner live** du golden set (rejouer les 10 CDC contre Groq).
8. **Nettoyage des orphelins** : `PcbProjectWorkspace.tsx`, `PcbPriceCounter.tsx`, `PcbProposalDiff.tsx`, `PcbCanvas.addNodeAtCenter`.

*`master` = `fbf4daa` (merge PR #153, 2026-11-24) ; branche protégée (fusion par PR, checks verts : Build/TypeScript/ESLint+Prettier/Vercel). Aucune nouvelle étape code ne doit être inventée sans spec (charte §9).*
