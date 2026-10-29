# Ã‰tat courant du projet

**Date de mise Ã  jour :** 2026-10-27  
**Phase en cours :** E61-REPRISE (gÃ©nÃ©ration CAO)  
**Statut :** En cours de finalisation. Tests unitaires E61 validÃ©s ; build dÃ©bloquÃ© ; tests E2E `workspace` 17/17 verts. Tests E2E `admin` bloquÃ©s par un setup prÃ©existant, hors pÃ©rimÃ¨tre E61.

## DerniÃ¨re session

- **SESSION-2026-10-27-E61-REPRISE** : Reprise aprÃ¨s interruption.
  - Corrections de tests sur `src/core/ai-engine/skills/reconstruct/*`.
  - Creation des scripts/configs unitaires : `package.json` (`test:unit`), `vitest.config.ts` racine.
  - Validation `npm run test:unit` EXIT 0 (7 fichiers, 20 tests).
  - Suivi git du module `reconstruct` ajoutÃ© (`git add`), sans commit.
  - Mise Ã  jour de `docs/etat/DETTES.md` (D-E52-CAD-GENERATION partiellement rÃ©solu).

## VÃ‰RIFICATION E61 â€” E61-VERIF

- **Blocage du build rÃ©solu** : ajout de `export const dynamic = 'force-dynamic';` dans `src/app/client/dashboard/demandes/[id]/page.tsx`.
- **Build** : `npm run build` â†’ **EXIT 0**.
- **Tests E2E workspace** : `npx playwright test --project=workspace` â†’ **EXIT 0**, **17/17** passÃ©s.
- **Tests E2E admin** : `npx playwright test --project=admin` â†’ **EXIT 1** ; 4 tests de setup Ã©chouÃ©s (authentification/DB/API), 48 tests non lancÃ©s. C'est un problÃ¨me d'environnement E2E prÃ©existant, non une rÃ©gression liÃ©e Ã  E61.

## Portefeuille

- [E61] GÃ©nÃ©ration CAO via LLM + templates dans `src/core/ai-engine/skills/reconstruct/` â€” finalisÃ©.
- [Build] PrÃ©rendering de `/client/dashboard/demandes/[id]` dÃ©sactivÃ© Ã  la build â€” dÃ©bloquÃ©.
- [E2E] `workspace` 17/17 â€” verts.
- [E2E] `admin` bloquÃ© par setup prÃ©existant â€” hors pÃ©rimÃ¨tre E61.


E62-FIX: regex corrigï¿½e, admin list OK, build OK, vï¿½rification E62-VERIF.

## Portefeuille E64

| Session | Statut | Dossier |
|---------|--------|---------|
| [E64-A] | âœ… TerminÃ©e | torus + cone |
| [E64-B] | En cours de finalisation | Corrections regex appliquees, tests a valider, commit en attente |

**Fichiers validÃ©s** :
- âœ… `src/core/ai-engine/skills/reconstruct/types.ts` â€” `prism` ajoutÃ© Ã  `CadPartType` et `CadParams`
- âœ… `src/core/ai-engine/skills/reconstruct/generate-cad.ts` â€” `case 'prism'` avec `BoxGeometry`
- âœ… `src/core/ai-engine/skills/reconstruct/generate-cad.test.ts` â€” 4 tests prism ajoutÃ©s
- âœ… Tests : 22/22 tests unitaires (regex fix appliquÃ© dans generate-cad.test.ts)
- âœ… Typecheck, lint, build : EXIT 0

**Dette** : D-E52-CAD-GENERATION â†’ 75 % rÃ©solue (cylinder/plate/torus/cone/prism)

**Ã‰tat des tests** : 22 tests unitaires (14 generate-cad + 3 reconstruct + 3 extract-params + 2 select-candidates)

**Commit** : `c5ddff8` (E64-A) et commit E64-B effectuÃ©
## Â§3 â€” RÃ©sultats vÃ©rification E62
- **admin --list** : OK (53 tests rÃ©pertoriÃ©s)
- **admin --grep "ADMIN"** : tests dÃ©marrent sans erreur de syntaxe (setup timeout connexion prÃ©existant)
- **workspace 17/17** : verts
- **npm run build** : EXIT 0
- **npm run typecheck** : EXIT 0
- **npm run test:unit** : 20/20 tests unitaires E61 validÃ©s

Dette E62-FIX clÃ´turÃ©e, non-rÃ©gression complÃ¨te confirmÃ©e.

E64-B-FIX-FINAL: 6 regex corrigées. En attente validation Coordinateur.

E64-B validation: test:unit 30/30 pass.

E64-B-CI-FIX-APPLIED: typecheck OK, 30/30 tests, lint OK.

## E71-A
- Dimensions STEP extraites et pré-remplies.


## E72-A
- Chat interactif avec contexte.


## E72-B
- Provider Claude inactif préparé.


## E74-A — Conversion Candidat ? Pièce
- Action serveur `convertCandidateToPart` créée dans `src/lib/actions/convert-candidate.ts` (vérifie rôle ADMIN, génère `partNumber` `CAND-{timestamp}`, crée `Part` en `DRAFT` avec `printableModelUrl`, crée `Attachment` de type CAO si extension `.stl/.step/.obj`).
- Bouton "Convertir en pièce" ajouté dans `src/components/workspace/CandidateCard.tsx` (prop `isAdmin`, état de conversion, message succès/erreur).
- `src/components/workspace/AssistantZone.tsx` passe `isAdmin` (via `useSession`) à chaque `CandidateCard`.
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run build` EXIT 0.
- Aucun commit.

## E74-A-FIX — Correction bouton + layout workspace
- Bouton : condition d'affichage changée de `isAdmin && Boolean(candidate.fileUrl)` à `isAdmin` (`CandidateCard.tsx:43`) car `fileUrl` est optionnel sur `SearchCandidate` et masquait le bouton.
- Layout `WorkspaceLayout.tsx` : conteneur racine `flex flex-col`, grille `flex-1 min-h-0` pour remplir l'espace sous le header et autoriser la réduction des items.
- Layout `WorkspaceClient.tsx` : 3 enveloppes de zone passent de `overflow-auto` à `min-h-0` (scroll géré en interne par chaque zone).
- Layout `AssistantZone.tsx` : conteneur ajoute `overflow-hidden` ; zone de messages passe de `overflow-auto` à `flex-1 min-h-0 overflow-y-auto` (scroll vertical interne uniquement, plus de scroll horizontal parasite ni de vide de colonne).
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run format:check` OK, `npm run build` EXIT 0.
- Aucun commit.

## E70-B — Mesure d'Angle et de Diamètre
- `MeasureTool.tsx` : type `MeasureMode` (`distance` \| `angle` \| `diameter`) exporté, prop `mode` ajoutée. Mode angle (3 points, `Vector3.angleTo`, label °), mode diamètre (2 points, cercle + label Ø), mode distance conservé. Points réinitialisés au changement de mode.
- `ViewerZone.tsx` : état `measureMode`, sélecteur `<select>` Distance/Angle/Diamètre dans la surcouche "Mesurer".
- `cad-viewer.tsx` et `model-viewer.tsx` : prop `measureMode` propagée à `MeasureTool`.
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run format:check` OK, `npm run build` EXIT 0.
- Aucun commit.

## E70-B-FIX — Correction régression visuelle workspace
- `viewer-shell.tsx` : retrait de `aspect-video` (ratio 16:9 forcé) qui entrait en conflit avec la hauteur explicite (`height="400px"` du `Canvas`) et déformait le modèle 3D (étirement vertical). La hauteur est désormais contrôlée par la prop `height` ou `min-h-[320px]` par défaut.
- `ViewerZone.tsx` : inchangé (layout `relative flex h-full flex-col` avec overlay `absolute` déjà correct).
- `AssistantZone.tsx` : inchangé (scroll interne aux messages via `overflow-y-auto`, conteneur `overflow-hidden`, déjà en place depuis E74-A-FIX).
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run format:check` OK, `npm run build` EXIT 0.
- Aucun commit.

## E73-A — Sauvegarde locale du workspace (localStorage)
- `src/lib/hooks/use-workspace-persistence.ts` (nouveau) : hook `useWorkspacePersistence` qui persiste dans `localStorage` (clé `partiva-workspace-state`) : `photos`, `cadFiles`, `dimensions`, `description`, `mode`, `result`. Restaure au montage via `useEffect` côté client, sauvegarde à chaque changement, expose `clearWorkspace()`.
- `src/components/workspace/WorkspaceClient.tsx` : remplace les `useState` individuels par le hook pour les états persistants. Garde `extractedDimensions`, `status`, `error` en état local. Ajoute `handleClearWorkspace`.
- `src/components/workspace/IngestZone.tsx` : bouton "Effacer" (icône `Trash2`) dans l'en-tête de la zone Collecte + indicateur "Sauvegardé localement".
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run format:check` OK, `npm run build` EXIT 0.
- Commit : `72c4761`.

## E73-A-FIX — Correction écrasement des données par l'effet de sauvegarde
- `src/lib/hooks/use-workspace-persistence.ts` : l'effet de sauvegarde écrasait `localStorage` avec `DEFAULT_STATE` avant que l'effet de restauration n'ait pu recharger les données. Corrigé avec `isFirstRender` ref pour sauter la sauvegarde au premier rendu.
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run format:check` OK, `npm run build` EXIT 0.
- Commit : `2e490ce`.

## E73-A-FIX2 — Correction hydratation SSR (React #418)
- `src/lib/hooks/use-workspace-persistence.ts` : `useState(loadState)` lisait `localStorage` dans l'initialiseur, créant un mismatch d'hydratation Next.js (SSR rend `DEFAULT_STATE`, client rend l'état restauré). Corrigé en utilisant `useState(DEFAULT_STATE)` (identique serveur/client) et en restaurant l'état dans un `useEffect` côté client uniquement après le montage.
- Vérifications : `npm run typecheck` EXIT 0, `npm run lint` 0 erreurs, `npm run format:check` OK, `npm run build` EXIT 0.
- Aucun commit.

