# État courant du projet

**Date de mise à jour :** 2026-11-15
**HEAD actuel :** `334706c` (Merge PR #97 — V8-D-5 panneaux rétractables, close avec dette)
**Branche courante :** `master`
**Statut :** V7 close (V7-A → V7-H validées). V8 close (V8-B-6 intégralement clôturée). V8-C-2a close. V8-D-4 close (avec dettes). V8-D-5 / TÂCHE 1 close (avec dette : validation visuelle panneaux rétractables).

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
| V8-D | **EN COURS** — V8-D-4 close (comparaison OCCT + layout flex, dettes), V8-D-5 / TÂCHE 1 close (panneaux rétractables, dette validation visuelle) |

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
- **Dette :** `D-V8-D-4-COMPARE-VISUAL-VALIDATION` (preuve visuelle 4 couleurs rouge/bleu/orange/vert + logs `[OCCT:compare]` non fournie). `D-V8-D-4-TEST-FIXTURES-NON-TRACKED` (`public/models/cube-3mm.step`, `cube-3p5mm.step` non trackés).

---

## Session V8-D-5 — Panneaux rétractables (close avec dette)

- `src/components/workspace/WorkspaceLayout.tsx` : `WorkspaceContext` + états `collecteVisible`/`assistantVisible` + layout flex réactif (`w-2/4` → `w-3/4` → `flex-1`).
- `src/components/workspace/ViewerZone.tsx` : boutons `PanelLeft`/`PanelRight` (Masquer Collecte / Masquer Assistant) dans la barre de contrôle.
- PR #97 : merge `334706c` / commit `f74efc7`.
- Checks CI : Build pass, ESLint+Prettier pass, TypeScript pass.
- **Dette :** `D-V8-D-5-COLLAPSIBLE-VISUAL-VALIDATION` (validation visuelle des boutons de toggle non effectuée — upload de fichier bloqué par PowerShell 5.1).

---

## Dernière session

- **SESSION-2026-11-15-V8-D-5** (clôturée avec dette) : Panneaux rétractables (WorkspaceContext + PanelLeft/PanelRight) — PR #97 mergée, validation visuelle en attente (dette tracée).

---

## Prochaine étape

**V8-D-5 / TÂCHE 2** : assistant IA (workspace) — prompt à émettre par l'IA externe.

*(Options alternatives selon arbitrage : traitement dette `D-V8-D-5-COLLAPSIBLE-VISUAL-VALIDATION`, `D-V8-D-4-COMPARE-VISUAL-VALIDATION`.)*