# RAPPORT-ETAT-DES-LIEUX-E70-2026-10-28 — Outils de Mesure 3D

## §1 Composants visualisation
- ViewerZone: props fileUrl/uploadedFileUrl, affiche CadViewer/ModelViewer.
- ModelViewer: dispatch par extension.
- CadViewer: occt-import-js worker, Canvas, OrbitControls.

## §2 Bibliothèques raycasting
- three-mesh-bvh: absent.
- @react-three/drei: présent (Html, Line, etc).
- three: présent, Raycaster natif.

## §3 Capacités existantes
- Aucun outil de mesure existant.
- OrbitControls présent.
- Pas d'overlay de mesure.

## §4 Options
A: three-mesh-bvh (absent, à installer) — performant.
B: Raycaster natif — simple, moins performant.
C: helpers drei — labels/lines.

## §5 Modules isolés
ViewerZone et viewers isolés; impact limité.

## §6 Preuves
package.json dépendances listées.
