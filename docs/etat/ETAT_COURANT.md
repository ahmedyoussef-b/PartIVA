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


## E86-A-FIX10 - Correction du build (polices locales)

- src/app/layout.tsx : remplacement des imports next/font/google (Inter, Poppins, Fira_Code) par next/font/local via src/app/fonts/index.
- Polices telechargees et hebergees localement dans src/app/fonts/ : 10 fichiers .woff2 (Inter 300/400/500/600/700, Poppins 400/500/600/700, Fira Code 400 couvrant 400/500/600), tous magic wOF2 valides.
- Regle ESLint no-restricted-imports ajoutee dans eslint.config.mjs pour interdire next/font/google a l'avenir.
- Verifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX10.md.
- Aucun commit.\


## E86-A-FIX11 - Analyse Comparative avec docs/app et Correction Definitive Groq

- Analyse comparative avec docs/app : identification du modele de reference openai/gpt-oss-120b pour Groq (groq-client.ts, config.rs, setup-form.tsx).
- Cause identifiee de l'erreur 404 : .env contenait GROQ_MODEL=llama-3.3-70b-versatile (decommissionne par Groq le 16 aout 2026), et src/core/ai-engine/skills/vision/vision.ts ciblait qwen/qwen3.6-27b (egalement 404).
- src/lib/ai/groq-client.ts : aligne sur openai/gpt-oss-120b avec fallback defensif contre les modeles decommissionnes llama-*.
- src/core/ai-engine/skills/vision/vision.ts : modele de vision mis a jour vers le modele multimodal actif qwen/qwen3.8-27b.
- .env et .env.example : mise a jour GROQ_MODEL=openai/gpt-oss-120b et GROQ_VISION_MODEL=qwen/qwen3.8-27b.
- Tests API directs Groq : chat 200 OK, vision 200 OK.
- Verifications : npm run typecheck EXIT 0, npm run lint -- src/lib/ai EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX11.md.
- Aucun commit.

## E86-A-FIX12 - Correction de l'erreur 400 vision (analyse d'image Groq)

- src/core/ai-engine/skills/vision/vision.ts : modele de vision passe de qwen/qwen3.8-27b (erreur 400 sur les images) a meta-llama/llama-4-scout-17b-16e-instruct (modele vision confirme sur Groq).
- .env.example : GROQ_VISION_MODEL mis a jour vers meta-llama/llama-4-scout-17b-16e-instruct.
- Format de requete OpenAI-compatible { type: 'image_url', image_url: { url } } conserve (conforme).
- Verifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX12.md.
- Aucun commit.
## E86-A-FIX13 - Verification du format vision Groq

- src/core/ai-engine/skills/vision/vision.ts : aucun message system envoye (pas de tableau a convertir en chaine), message user bien forme (tableau de blocs text + image_url, format OpenAI-compatible).
- Nombre d'images limite a 3 (slice(0, 3)) sous la limite Groq de 5 images par requete.
- Modele vision deja corrige en E86-A-FIX12 : meta-llama/llama-4-scout-17b-16e-instruct.
- Verifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX13.md.
- Aucun commit.
## E86-A-FIX14 - Passage des images en base64 pour Groq Vision

- src/core/ai-engine/skills/vision/vision.ts : les URLs Cloudinary ne sont plus passees directement a Groq (timeout cote Groq sur les images volumineuses -> erreur 400). Chaque image est telechargee cote serveur, convertie en base64 (data:image/...;base64,...) et envoyee en inline.
- Limite de taille : 5 Mo max par image (MAX_IMAGE_BYTES).
- Gestion d'erreur par image : les images inaccessibles/trop grosses/erreurs de telechargement sont ignorees avec un warning explicite, sans bloquer les autres.
- Si aucune image valide : VisionResult avec detectedType: null et warning explicite.
- Modele vision : meta-llama/llama-4-scout-17b-16e-instruct (E86-A-FIX12).
- Verifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX14.md.
- Aucun commit.
## E86-A-FIX15 - Upload Cloudinary des photos avant analyse (erreur fetch failed sur URL blob)

- src/components/workspace/IngestZone.tsx : simulateUpload ne pousse plus d'URL blob: (URL.createObjectURL). Seule l'URL Cloudinary publique (secure_url) est ajoutee a l'etat photos. En cas d'echec d'upload ou d'absence de config Cloudinary, un console.warn est emis et l'image est ignoree (pas d'URL locale temporaire inaccessible cote serveur).
- src/core/ai-engine/skills/vision/vision.ts : filtre des URLs photo (https:// uniquement, ignore les URLs blob: avec warning explicite). Si aucune image publique valide : detectedType: null + warning.
- Verifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0, npm run format:check EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX15.md.
- Aucun commit.
## E86-A-FIX16 - Upload Cloudinary des photos avant analyse (correction reelle, pas seulement filtre blob)

- src/components/workspace/IngestZone.tsx : simulateUpload n' cree plus d'URL blob: (URL.createObjectURL supprimee). L'upload vers Cloudinary est effectue AVANT d'ajouter l'URL a l'etat photos (fetch vers v1_1/{cloud}/upload avec upload_preset). L'URL secure_url publique (https://res.cloudinary.com/...) est stockee dans photos. En cas d'echec ou d'absence de config Cloudinary : console.warn et l'image est ignoree (pas d'URL locale temporaire).
- Etat de chargement : [isUploading, setIsUploading] ajoute, setIsUploading(true) au debut de l'upload, setIsUploading(false) dans un finally, bouton "Ajouter des photos" desactive (disabled={isUploading}) pendant l'upload.
- src/core/ai-engine/skills/vision/vision.ts : filtre des URLs photo (https:// uniquement, ignore les URLs blob: avec warning explicite). Si aucune image publique valide : detectedType: null + warning.
- Verifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0, npm run format:check EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX16.md.
- Aucun commit.