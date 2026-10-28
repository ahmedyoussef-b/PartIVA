# RAPPORT-ETAT-DES-LIEUX-E70-B — Mesure d'Angle et de Diamètre

**Date :** 2026-10-28  
**Objectif :** Etat des lieux ciblé avant proposition d'implantation E70-B.  
**Contrainte respectée :** Aucun code modifié, aucune implantation proposée.

---

## §1 Audit de `MeasureTool.tsx`

### Fichier
`src/components/workspace/MeasureTool.tsx` (62 lignes), `'use client'`.

### Props
```ts
interface MeasureToolProps {
  enabled: boolean;
}
```

### Logique actuelle (mesure de distance uniquement)
- Hooks Three.js : `useThree()` fournit `camera`, `gl`, `scene`.
- État : `points: THREE.Vector3[]` (max 2 points), `raycaster` (ref), `mouse` (ref).
- Au clic sur le canvas DOM : raycasting contre `scene.children` (récursif), stocke le point d'intersection. Si 2 points déjà présents, recommence à 1 (`prev.length >= 2 ? [p] : [...prev, p]`).
- Rendu conditionnel : `if (!enabled || points.length === 0) return null;`
- Affichage :
  1. Sphère rouge (rayon 0.05) au premier point.
  2. Si 2 points : `Line` rouge entre les deux + `Html` (drei) affichant `first.distanceTo(second).toFixed(2)` (distance uniquement).

### Ce qui n'existe pas
- Aucun mode « angle » (3 points).
- Aucun mode « diamètre » (cercle).
- Aucun sélecteur de mode de mesure.
- Aucun calcul d'angle (`Vector3.angleTo` non utilisé).
- Aucune détection de cercle / courbe.

---

## §2 Audit des composants de visualisation

### `src/components/3d/cad-viewer.tsx` (324 lignes)

#### Intégration de `MeasureTool`
Ligne 8 : `import { MeasureTool } from '@/components/workspace/MeasureTool';`  
Ligne 306 : `{measureEnabled && <MeasureTool enabled={measureEnabled} />}`

#### Props pertinentes
```ts
interface CadViewerProps {
  src: string;
  height?: number;           // défaut 400
  timeoutMs?: number;        // défaut 120 000
  maxSizeMb?: number;        // défaut 50
  bare?: boolean;
  measureEnabled?: boolean;  // défaut false
  onDimensionsExtracted?: (dims: {
    length: number; width: number; height: number; diameter: number;
  }) => void;
}
```

#### Dépendances Three.js / drei
- `Canvas` depuis `@react-three/fiber`
- `Grid`, `OrbitControls` depuis `@react-three/drei`
- `* as THREE` depuis `three`

#### Parsing CAO
- Worker `/wasm/occt-import-js-worker.js` via `occt-import-js` v0.0.23.
- `normalizeGeometry(geometry)` : centre à l'origine, met à l'échelle pour `MODEL_EXTENT = 2.8`.
- `dimensions.diameter` (lignes 191-196) : `Math.max(maxX-minX, maxY-minY, maxZ-minZ)` — c'est la **plus grande dimension de la boîte englobante**, pas le diamètre d'un cercle détecté.

#### Rendu dans le `<Canvas>`
- Fond, lumières, Grid, maillage (`mesh` + `meshStandardMaterial`).
- `ViewerSceneBridge` (reset caméra), `OrbitControls`.
- `MeasureTool` conditionnel (`measureEnabled`).

### `src/components/3d/model-viewer.tsx` (100 lignes)

#### Routage
- Extensions CAO (`.step/.stp/.iges/.igs/.brep`) → `CadViewer`.
- Extensions maillage (`.stl/.gltf/.glb`) → `StlViewer`.
- Autre → carte de fallback.

#### Props
```ts
interface ModelViewerProps {
  src: string;
  alt?: string;
  height?: string | number;
  bare?: boolean;
  measureEnabled?: boolean;   // défaut false
  onDimensionsExtracted?: ...;
}
```
- `measureEnabled` et `onDimensionsExtracted` sont passés à `CadViewer`.
- **`StlViewer` ne reçoit PAS `measureEnabled`** : `StlViewerProps` ne définit pas cette prop, et l'appel ligne 99 ne la transmet pas. Mesure indisponible pour STL/GLTF aujourd'hui.

### `src/components/3d/stl-viewer.tsx` (202 lignes)

#### Props
```ts
interface StlViewerProps {
  src?: string;
  alt?: string;
  height?: string;
  bare?: boolean;
  // measureEnabled ABSENT
}
```
- Aucun outil de mesure intégré. Pas d'import `MeasureTool`.
- `buildNormalizedMesh` centre et met à l'échelle (`MODEL_EXTENT = 2.8`), identique à `cad-viewer`.

### `src/components/workspace/ViewerZone.tsx` (77 lignes)

#### État et intégration
- `measuring: boolean` (toggle via bouton « Mesurer » avec icône `Ruler`).
- Passe `measureEnabled={measuring}` à `CadViewer` et `ModelViewer`.
- Passe `onDimensionsExtracted` à `handleDimensionsExtracted` de `WorkspaceClient`.
- Affiche `CadViewer` si fichier CAO (`.step/.stp/.iges/.igs`), sinon `ModelViewer`.

#### Détection de fichier CAO
```ts
function isCad(url: string) {
  const ext = url.slice(url.lastIndexOf('.')).toLowerCase();
  return ['.step', '.stp', '.iges', '.igs'].includes(ext);
}
```
Note : `.brep` est absent de cette liste (alors que `model-viewer` le prend en charge via `CadViewer`).

---

## §3 Capacités Three.js disponibles

### Versions installées (`package.json`)
- `three`: `^0.186.1`
- `@react-three/fiber`: `^9.8.2`
- `@react-three/drei`: `^10.7.9`
- `three-mesh-bvh` : **NON installé** (absent de `package.json`).

### Calcul d'angle
- `THREE.Vector3.angleTo(vector: Vector3): number` — disponible nativement dans Three.js r0.186. Retourne l'angle en **radian** entre deux vecteurs (partant de l'origine).
- Pour un angle défini par 3 points (A, B, C avec sommet B) : `new THREE.Vector3().subVectors(A, B).angleTo(new THREE.Vector3().subVectors(C, B))`.
- Aucune dépendance supplémentaire requise.

### Détection de cercle / diamètre
- `THREE.Raycaster` : déjà utilisé dans `MeasureTool`, `intersectObjects(scene.children, true)` retourne `intersects[0].point` (point sur la géométrie maillée).
- **Aucune fonction native Three.js de détection de cercle** sur un maillage arbitraire. Le diamètre d'un cercle nécessite :
  1. Sélection de points sur le bord du cercle (au moins 3), ou
  2. Analyse des attributs de géométrie (pas accessible simplement depuis un `BufferGeometry` maillé triangulé), ou
  3. Une logique géométrique sur les points cliqués (circonscrite).
- `three-mesh-bvh` n'est pas nécessaire : le `Raycaster` natif suffit pour le point-picking sur les faces du maillage.

### Rendu des aides visuelles (drei)
- `Line` (déjà utilisé pour la distance) : réutilisable pour les segments d'angle et le cercle de diamètre.
- `Html` (déjà utilisé pour l'étiquette distance) : réutilisable pour afficher la valeur de l'angle et du diamètre.
- Pas de `Circle` ou d'arc natif dans drei pour dessiner un cercle de mesure ; il faudrait construire un `BufferGeometry` personnalisé ou utiliser plusieurs `Line`.

---

## §4 Cartographie des options d'implémentation

### Option A — Étendre `MeasureTool` avec un mode « angle » (3 points) et un mode « diamètre » (2 points + cercle)

- **Faisabilité :** Élevée. `MeasureTool` est isolé (62 lignes), état `points` déjà présent. Ajout d'une prop `mode: 'distance' | 'angle' | 'diameter'`, adaptation de la logique de clic (2 pts pour distance/diamètre, 3 pts pour angle), calcul via `Vector3.angleTo` et distance 2 pts pour le diamètre.
- **Risque :** Faible à moyen. Modification d'un seul fichier isolé. Le diamètre « cercle » est une approximation (distance entre 2 points opposés), pas une détection géométrique réelle.
- **Impact sur les flux stables :** Faible. `MeasureTool` est appelé par `CadViewer` via `measureEnabled`. Ajouter une prop `mode` optionnelle ne casse pas l'appelant actuel.

### Option B — Composants séparés (`AngleMeasureTool`, `DiameterMeasureTool`) intégrés dans `ViewerZone`

- **Faisabilité :** Moyenne. Nécessite dupliquer la logique de raycasting/clic de `MeasureTool` dans deux nouveaux composants, ou en extraire un hook commun.
- **Risque :** Moyen. Duplication de code (raycasting, gestion des points, rendu `Line`/`Html`). Plus de surface de modification.
- **Impact sur les flux stables :** Moyen. `ViewerZone` doit gérer 3 outils au lieu d'un, avec toggles distincts. `CadViewer`/`StlViewer` doivent accepter et propager les nouvelles props.

### Option C — Menu déroulant dans la barre d'outils pour choisir le mode (distance, angle, diamètre)

- **Faisabilité :** Élevée. `ViewerZone` dispose déjà d'une barre d'outils (bouton « Mesurer »). Ajout d'un `<select>` ou d'un `DropdownMenu` (déjà utilisé ailleurs dans le projet, ex: `@radix-ui/react-select`) pour choisir le mode, passé à `MeasureTool` via `CadViewer`.
- **Risque :** Faible. Ajout UI localisé dans `ViewerZone` + prop `mode` dans `MeasureTool`.
- **Impact sur les flux stables :** Faible. L'outil de mesure reste un seul composant ; seul son comportement interne change selon le mode sélectionné.

### Synthèse comparative

| Critère | Option A | Option B | Option C |
|---|---|---|---|
| Fichiers modifiés | 1 (`MeasureTool`) + appelants | 3+ nouveaux + appelants | 2 (`MeasureTool`, `ViewerZone`) |
| Duplication de code | Non | Oui (raycasting, points) | Non |
| Sélecteur de mode UI | Non (prop seulement) | Non | Oui (select dans ViewerZone) |
| Risque de régression | Faible | Moyen | Faible |
| Couplage avec `ViewerZone` | Faible | Moyen | Faible |

---

## §5 Modules isolés et points de contact

### Modules isolés (modifiables sans régression identifiée)
- `src/components/workspace/MeasureTool.tsx` : composant autonome, pas d'effet de bord externe, état local uniquement.
- `src/components/3d/cad-viewer.tsx` : reçoit `measureEnabled` et le transmet à `MeasureTool`. Isolé.
- `src/components/3d/viewer-shell.tsx` : `ViewerBridge`, `ViewerSceneBridge`, boutons reset/plein écran. Isolé.
- `src/components/workspace/ViewerZone.tsx` : orchestre l'affichage, état `measuring` local. Isolé.

### Modules avec lacune (à noter, non bloquants)
- `src/components/3d/stl-viewer.tsx` : ne supporte pas `measureEnabled` ni `MeasureTool`. Mesure indisponible pour STL/GLTF aujourd'hui.

### Points de contact avec `WorkspaceClient`
- `ViewerZone` transmet `onDimensionsExtracted` → `WorkspaceClient.handleDimensionsExtracted` (ligne 32-50 de `WorkspaceClient.tsx`), qui met à jour `extractedDimensions` et `dimensions` (champ `diameter` déjà présent, mais issu du bounding box, pas d'une mesure utilisateur).
- Aucune interaction actuelle entre l'outil de mesure interactif et l'état de `WorkspaceClient` (les mesures cliquées ne sont pas remontées).

---

## §6 Conclusion de l'état des lieux

- `MeasureTool` ne supporte que la **distance** (2 points). Aucun mode angle, aucun mode diamètre, aucun sélecteur de mode.
- Three.js r0.186.1 fournit nativement `Vector3.angleTo` pour l'angle. `Raycaster` natif suffit pour le point-picking (pas besoin de `three-mesh-bvh`).
- `CadViewer` et `ModelViewer` propagent `measureEnabled` ; `StlViewer` ne le supporte pas (lacune existante, hors scope E70-B si l'on se concentre sur CAO).
- `MeasureTool`, `ViewerZone`, `CadViewer`, `viewer-shell` sont isolés et modifiables sans régression.
- Trois options d'implémentation cartographiées (A, B, C) avec faisabilité, risque et impact.

### Arrêt
Conformément à la consigne, aucune implantation n'est proposée et aucun code n'a été modifié. Le superviseur dispose désormais des éléments pour choisir et proposer l'implantation E70-B (Option C recommandée pour l'UI de sélection de mode) en toute connaissance de cause.
