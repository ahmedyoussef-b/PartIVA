# P7 — Feuille de route d'implantation

**Version :** 1.0
**Date :** 2026-11-19
**Commit de référence :** `c9327ba`
**Statut :** En cours (implémentation accélérée P7)

---

## 1. Objet

Ce document trace les dettes ciblées par la phase P7, l'état technique de chacune, les briques disponibles et le plan d'action pour la suite. Il ne remplace pas le registre officiel des dettes (`docs/etat/DETTES.md`).

---

## 2. Dettes traitées en P7

### 2.1 `D-CLOUDINARY-KEY-LOGGED` — Fuite d'API Key dans les logs

- **État avant P7 :** Active — `console.log('[CLOUDINARY-CONFIG-FINAL]', ...)` dans `src/lib/cloudinary.ts` (lignes 9-14) imprimait la clé Cloudinary (`substring(0, 6)` = `844862`, soit la clé complète).
- **Action P7 :** suppression du bloc `console.log`. La logique `cloudinary.config()` est inchangée.
- **État après P7 :** Résolue (sous réserve de vérification runtime).

### 2.2 `D-NEXT-IMAGES-DOMAINS-DEPRECATED` — Dépréciation `images.domains`

- **État avant P7 :** Active — `next.config.mjs` déclarait `images.domains: ['res.cloudinary.com']` (déprécié au profit de `remotePatterns`).
- **Action P7 :** suppression de la clé `domains`. `remotePatterns` (`https` / `res.cloudinary.com`) est conservé et fonctionnel.
- **État après P7 :** Résolue (sous réserve de vérification runtime).

### 2.3 `D-V8-D-4-COMPARE-VISUAL-VALIDATION` — Rendu schématique vs rendu OCCT réel

- **État avant P7 :** Active — résolution partielle.
  - `src/components/pcb/VisualComparisonOverlay.tsx` produit un rendu **SVG schématique** : 4 couches colorées (`#3B82F6` / `#10B981` / `#F59E0B` / `#8B5CF6`), curseur d'opacité, compteur de couches. Géométrie paramétrée par la constante locale `PLATE`, **indépendante des données CAO réelles**.
  - Aucun import `libcascade` dans le composant, aucun maillage réel chargé. Le log `[OCCT:compare]` (ligne 57) est un simple `console.log` d'état UI.
  - Preuve visuelle E2E ajoutée (`e2e/pcb/visual-comparison.spec.ts`), mais logs runtime `[OCCT:compare]` absents en mode Desktop.
- **Verdict P7 :** **Non résolue** — le rendu reste schématique. Le câblage de la géométrie réelle constitue la prochaine étape (§4).

---

## 3. Briques techniques disponibles

| Brique | Emplacement | Rôle |
|---|---|---|
| `libcascade` `^3.1.0` | `package.json`, `next.config.mjs` (`serverExternalPackages`) | Binding WebAssembly OpenCascade.js |
| Tessellation | `src/lib/occt/tessellate.ts` | Maillage OCCT → triangles Three.js |
| Import STEP | `src/lib/occt/import-step.ts` | Lecture STEP/IGES via OCCT |
| Contexte OCCT | `src/components/3d/occt-context.tsx` | Partage de l'instance OCCT |
| Comparaison | `src/components/workspace/OcctCompareTool.tsx` | Comparaison de formes (déjà opérationnelle) |
| Section / Mesure | `src/components/workspace/OcctSectionTool.tsx`, `OcctMeasureTool.tsx` | Outils CAO dérivés |
| Visualisation | `src/components/3d/occt-viewer.tsx`, `cad-viewer.tsx`, `stl-viewer.tsx` | Rendu Three.js de maillages |

**Conclusion :** l'infrastructure OCCT existe et est fonctionnelle. P7 ne crée pas de socle technique ; il s'agit de **câbler** cet existant dans `VisualComparisonOverlay.tsx`.

---

## 4. Plan d'action — prochaine étape

**Objectif :** remplacer le SVG schématique de `VisualComparisonOverlay.tsx` par un rendu basé sur la géométrie CAO réelle.

1. **Sourcer la géométrie :** étendre les props du composant (aujourd'hui `projectId: string` seul) pour recevoir les formes / maillages des couches à comparer (STEP/IGES/STL).
2. **Réutiliser le pipeline :** importer `src/lib/occt/import-step.ts` et `src/lib/occt/tessellate.ts` (ou `OcctCompareTool`) pour obtenir les maillages.
3. **Rendu Three.js :** afficher les couches actives via un `<Canvas>` (cf. `occt-viewer.tsx` / `stl-viewer.tsx`), en conservant les couleurs par mode et le curseur d'opacité.
4. **Preuve :** fournir une capture du rendu réel (4 couleurs superposées) et prouver le log runtime `[OCCT:compare]` en mode Desktop, conformément à la condition de résolution de `D-V8-D-4` dans `docs/etat/DETTES.md`.

---

## 5. Contraintes de la phase P7

- Modifications ciblées uniquement.
- Aucun test E2E / unitaire exécuté pendant cette phase.
- Aucun commit automatique.
- Toute modification du périmètre nécessite un arbitrage du coordinateur.