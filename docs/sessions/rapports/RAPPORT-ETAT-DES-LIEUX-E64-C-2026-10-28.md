# RAPPORT-ETAT-DES-LIEUX-E64-C-2026-10-28 — Opérations Booléennes

## 1. Module reconstruct actuel
- `generate-cad.ts` crée des `THREE.BufferGeometry` via switch sur `CadPartType`.
- Aucune logique de combinaison de formes (union/soustraction/intersection) présente.
- `select-candidates.ts` appelle `generateCadFromParams` pour un candidat généré unique.

## 2. Bibliothèques CSG disponibles
- `three-bvh-csg` : absent.
- `three-csg-ts` : absent.
- `manifold-3d` : absent.
- Seule dépendance 3D : `three ^0.186.1`, `@react-three/fiber`, `@react-three/drei`.

## 3. Options techniques
- A `three-bvh-csg` : rapide, expérimental, nécessite géométries watertight. Risque précision numérique.
- B `three-csg-ts` : BSP, plus simple/lent. Performance.
- C `manifold-3d` : robuste impression 3D, dépendance lourde.

## 4. Formes candidates prioritaires
- Trou dans un bloc (block - cylinder).
- Bossage sur une plaque (plate + cylinder).
- Cavité sphérique dans un bloc (block - sphere).

## 5. Modules isolés
- `src/core/ai-engine/skills/reconstruct/` isolé ; contact avec `select-candidates.ts`, `reconstruct.ts`, `/api/engine`, workspace UI. Changements limités au module réduisent régression.

## 6. Preuves
- package.json dépendances listées ci-dessus.
- types.ts extrait : CadPartType sans opérateur booléen.
