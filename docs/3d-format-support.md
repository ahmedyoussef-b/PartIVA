# Support des formats 3D — PartIVA

**Dernière mise à jour :** 2026-10-20
**Phase :** E16 — Visualiseur CAO (clôturée E16-R4)

## Formats supportés

| Format | Extension | Composant | Bibliothèque | Statut |
|---|---|---|---|---|
| STL | `.stl` | `StlViewer` | `three/addons/loaders/STLLoader.js` | ✅ |
| GLTF | `.gltf` | `StlViewer` | `@react-three/drei` (`useGLTF`) | ✅ |
| GLB | `.glb` | `StlViewer` | `@react-three/drei` (`useGLTF`) | ✅ |
| STEP | `.step`, `.stp` | `CadViewer` | `occt-import-js` (`ReadFile('step')` → `ReadStepFile`) | ✅ |
| IGES | `.iges`, `.igs` | `CadViewer` | `occt-import-js` (`ReadFile('iges')` → `ReadIgesFile`) | ✅ |
| BREP | `.brep` | `CadViewer` | `occt-import-js` (`ReadFile('brep')` → `ReadBrepFile`) | ⚠️ détecté, non testé E2E |

## Détection automatique

`ModelViewer` (`src/components/3d/model-viewer.tsx`) détecte le format via l'extension :

- `.step` / `.stp` / `.iges` / `.igs` / `.brep` → `CadViewer`
- `.stl` / `.gltf` / `.glb` → `StlViewer`
- Inconnu → carte de fallback explicite

`CadViewer` (`detectFormat`) mappe l'extension au format passé au worker :
`'iges'` ← `.iges`/`.igs`, `'brep'` ← `.brep`, `'step'` ← `.step`/`.stp`/défaut.
Le worker (`public/wasm/occt-import-js-worker.js`) appelle `occt.ReadFile(format, buffer, params)` :
API générique, **aucune limitation à STEP** (les trois formats dispatchent côté WASM).

## Limitations connues

| Limitation | Impact | Mitigation |
|---|---|---|
| Cold start WASM 7,25 Mo (7 604 031 o) | Premier rendu CAO lent | Chargé uniquement au montage de `CadViewer` ; E2E `test.setTimeout(120_000)` |
| Timeout défaut 120 s (`timeoutMs`) | Fichiers CAO très complexes | `timeoutMs` configurable par composant |
| Taille max 50 Mo (`maxSizeMb`) | Fichiers volumineux | `maxSizeMb` configurable par composant |
| Erreurs OCCT génériques | Message utilisateur peu détaillé (détails en console) | À améliorer (mapping erreur → message) |
| `.brep` non couvert par de tests E2E | Régression possible non détectée | Fixture + test à ajouter si besoin |
| Tests E2E admin IGES bloqués (DB) | Couverture admin incomplète | Dette `D-E16-IGES-ADMIN-E2E` — mitigée par le test public |

## Licences

- `occt-import-js` : LGPL-2.1 (`public/wasm/license.occt-import-js.txt`)
- OpenCascade (OCCT) : LGPL-2.1 (`public/wasm/license.occt.txt`)
- Fixture `public/models/test.iges` : copie de la référence `occt-import-js` (cube 10 mm, LGPL-2.1, `public/models/license.occt-import-js.txt`)

## Scripts de fixtures

- `scripts/generate-test-step.mjs` → `public/models/test.step` (cube ISO 10303-21 AP214, généré)
- `scripts/generate-test-iges.mjs` → `public/models/test.iges` (copie référence package, garde `existsSync`)
- `scripts/sync-occt-assets.mjs` → synchronise les assets WASM + licences vers `public/wasm/`

## Tests

- `e2e/public/iges-viewer.spec.ts` — IGES (public, sans auth, 2 tests : valide → canvas WebGL, invalide → erreur)
- `e2e/admin/cad-viewer.spec.ts` — STEP + timeout (admin)
- `e2e/admin/piece-detail.spec.ts` — intégration `ModelViewer` (admin)

Bancs de test : `/admin/3d-test` (STEP), `/admin/3d-test-timeout` (timeout 2 s), `/admin/3d-test-iges` (IGES), `/test/iges-viewer` (public).
