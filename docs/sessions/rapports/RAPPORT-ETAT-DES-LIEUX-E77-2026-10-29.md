# Rapport d'État des Lieux Ciblé — E77 : Modes de Rendu (Filaire / X-Ray / Section)

Date : 2026-10-29
Périmètre : `src/components/3d/*`, `src/components/workspace/ViewerZone.tsx`, capacités Three.js.

## 1. Composants de visualisation 3D

### 1.1 CadViewer (`src/components/3d/cad-viewer.tsx`)
- Entrée : `src` (STEP/IGES/BREP) + props `height`, `timeoutMs`, `maxSizeMb`, `bare`, `measureEnabled`, `measureMode`, `onDimensionsExtracted`.
- Matériau appliqué : `meshStandardMaterial` avec `color={MODEL_COLOR}` (#94a3b8), `side={THREE.DoubleSide}`, `metalness=0.15`, `roughness=0.45`.
- Aucun mode de rendu (wireframe/xray/section) implémenté.
- Géométrie normalisée dans `normalizeGeometry`.

### 1.2 ModelViewer (`src/components/3d/model-viewer.tsx`)
- Routeur d'extension : CAD → CadViewer, mesh (STL/GLTF/GLB) → StlViewer, sinon fallback.
- Passe les props `measureEnabled`, `measureMode`, `onDimensionsExtracted` à CadViewer ; à StlViewer uniquement `src`, `alt`, `height`, `bare` (pas de mesure).
- Aucune prop de mode de rendu.

### 1.3 StlViewer (`src/components/3d/stl-viewer.tsx`)
- Matériau : `MeshStandardMaterial({ color: MODEL_COLOR, metalness: 0.15, roughness: 0.45 })`.
- GLTF via `useGLTF` + primitive (matériaux embarqués, non contrôlés).
- Aucun mode de rendu implémenté.

### 1.4 ViewerShell (`src/components/3d/viewer-shell.tsx`)
- Conteneur HTML avec boutons Reset/Plein écran flottants.
- `ViewerBridge` expose `reset()` uniquement.
- Point d'extension possible pour toolbar (boutons supplémentaires).

## 2. Capacités Three.js (v0.186.1, `three: ^0.186.1`)

- `wireframe` : propriété booléenne sur `Material` (et `MeshStandardMaterial`/`MeshBasicMaterial`). Disponible.
- `transparent` + `opacity` : disponibles sur tous les matériaux. Pour X-ray, combiner `transparent=true`, `opacity<1`, `depthWrite=false` (optionnel).
- `clippingPlanes` : propriété `Material.clippingPlanes: Plane[]` ; nécessite `renderer.localClippingEnabled = true` (R3F : `<Canvas gl={{ localClippingEnabled: true }}>`). Disponible.
- `MeshBasicMaterial` : disponible pour rendu filaire pur si besoin.

## 3. ViewerZone (`src/components/workspace/ViewerZone.tsx`)

- Barre d'outils existante : bouton "Mesurer" (toggle) + `<select>` de mode de mesure conditionnel.
- Passe `measureEnabled`, `measureMode` aux viewers (CadViewer/ModelViewer).
- `displayUrl` = fileUrl || uploadedFileUrl. `isCadFile` détermine le viewer.
- Points de contact : `onDimensionsExtracted` callback remonté au parent.

## 4. Options d'implantation

### Option A — Sélecteur dans ViewerZone + slider section
- Faisabilité : haute. Toolbar déjà présente, pattern établi (state local + props).
- Risque : faible. Modifications localisées.
- Impact : ajoute props `renderMode`, `sectionPlane` aux viewers.

### Option B — Composant `RenderModeSelector.tsx` séparé
- Faisabilité : moyenne. Nouveau composant à créer.
- Risque : moyen (duplication de logique, tests supplémentaires).
- Impact : plus modulaire mais surdimensionné.

### Option C — Intégration directe dans CadViewer/ModelViewer via props
- Faisabilité : haute. Props déjà pattern (measureEnabled).
- Risque : moyen (dispersion de la logique dans plusieurs viewers).
- Impact : cohérent avec mesure, mais StlViewer doit aussi être mis à jour.

Recommandation préliminaire (pour décision Superviseur) : Option A ou C, à trancher.

## 5. Modules isolés

- `ViewerZone`, `CadViewer`, `ModelViewer`, `StlViewer`, `ViewerShell` sont des composants autonomes, importés par `WorkspaceClient` (à vérifier) via `ModelViewer`/`ViewerZone`.
- Aucune dépendance circulaire détectée dans les imports lus.
- Points de contact avec `WorkspaceClient` : props `fileUrl`, `uploadedFileUrl`, `onDimensionsExtracted`.

## 6. Conclusion

Aucun mode de rendu n'est implémenté. Les capacités Three.js requises sont disponibles. Les viewers sont isolés et modifiables sans régression majeure sous réserve de préserver les props existants et les tests E2E (data-testid `viewer-shell`, `cad-viewer-canvas`).

## 7. Arrêt

Aucune modification de code effectuée. Rapport prêt pour proposition d'implantation par le Superviseur.
