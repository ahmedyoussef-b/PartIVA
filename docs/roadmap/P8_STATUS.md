# P8 — État du câblage OCCT (`VisualComparisonOverlay`)

**Version :** 1.0
**Date :** 2026-11-19
**Commit de référence :** `6d7a246`
**Statut :** Implémentation faite — non testée (build/lint/E2E proscrits par le prompt P8)

---

## 1. Imports ajoutés

| Import | Origine | Usage |
|---|---|---|
| `Canvas`, `useFrame` | `@react-three/fiber` | Rendu WebGL + boucle de rendu (auto-rotation) |
| `OrbitControls` | `@react-three/drei` | Navigation caméra (zoom/pan/rotate) |
| `* as THREE` | `three` | Types `BufferGeometry`, `Group` |
| `importCadFile` | `@/lib/occt/import-step` | Lecture STEP/IGES → `TopoDS_Shape` |
| `tessellateShape` | `@/lib/occt/tessellate` | `TopoDS_Shape` → `THREE.BufferGeometry` |

---

## 2. Props modifiées

```ts
export interface GeometrySource {
  url: string;
  name?: string;      // détermine le format (step/iges)
  color?: string;     // surcharge la couleur du mode
  mode?: ComparisonMode;
}

interface VisualComparisonOverlayProps {
  projectId: string;          // conservé (compat. caller)
  layers?: GeometrySource[];  // NOUVEAU — sources CAO réelles
  autoRotate?: boolean;       // NOUVEAU — rotation lente (défaut false)
}
```

- `projectId` **conservé** : `src/app/admin/pcb/[projectId]/page.tsx:129` n'est pas modifié (appel actuel `projectId` seul).
- `layers` **optionnel** : sans `layers`, le composant retombe sur le SVG schématique (compat. e2e existante).
- `autoRotate` **optionnel** : active la rotation du groupe via `useFrame`.

---

## 3. Logique interne

- `LayerMesh` (interne) : `fetch` → `importCadFile` → `tessellateShape` → `<mesh>` + `meshStandardMaterial` (couleur, opacité). Dispose la géométrie en cas de remplacement/démontage.
- `LayerGroup` (interne) : encapsule les meshes dans un `<group>` et applique la rotation via `useFrame` si `autoRotate`.
- Rendu conditionnel :
  - `layers.length > 0` → `<Canvas>` Three.js.
  - sinon → SVG schématique (repli, 4 couleurs, `data-testid="visual-comparison-canvas"`).
- Contrôles conservés : boutons de mode (4), slider d'opacité (10 % → 100 %), compteur `N couche(s) active(s)`.
- Logs runtime ajoutés : `[OCCT:compare] LayerMesh chargement` / `[OCCT:compare] LayerMesh prêt` / `[OCCT:compare] LayerMesh erreur`.

---

## 4. Points bloquants / risques

1. **Chargement asynchrone** — `LayerMesh` charge et tesselle au montage (useEffect). Pas d'état de chargement UI (le mesh apparaît quand prêt). À améliorer si besoin (spinner).
2. **Pérennité e2e** — `e2e/pcb/visual-comparison.spec.ts` cible `polygon` et les couleurs hex dans `visual-comparison-canvas`. Le repli SVG est conservé **sans `layers`**, donc la spec reste verte dans le flux actuel (aucune source CAO fournie par la page). Si le caller passe `layers`, le Canvas ne contiendra plus de `<polygon>` → la spec « geometric canvas » devra être adaptée.
3. **SSR / bundle** — `libcascade` (wasm) est importé statiquement dans le module (comme `occt-viewer.tsx`). Le build SSR passe aujourd'hui pour ce pattern ; non vérifié ici (build proscrit par le prompt P8).
4. **`importCadFile`** utilise un chemin FS fixe `/tmp/input.<format>` — deux chargements concurrents (plusieurs `LayerMesh`) peuvent entrer en collision. Acceptable pour P8 ; à durcir (chemins uniques) si le nombre de couches augmente.
5. **Données réelles non branchées** — la page `admin/pcb/[projectId]` ne fournit pas encore de `layers` (aucune source STEP/IGES persistée par projet). Le câblage est prêt mais inactif en production tant que le caller ne passe pas de sources.

---

## 5. Prochaine étape

- Brancher `layers` depuis la source de données du projet (fichiers CAO du projet PCB).
- Ajouter un état de chargement par couche.
- Adapter `e2e/pcb/visual-comparison.spec.ts` si le rendu Canvas devient le chemin par défaut.
- Vérifier build + lint + E2E (hors périmètre P8).