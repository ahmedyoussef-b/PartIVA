# ÉTAT HISTORIQUE — PartIVA — Vérifications E61 → E92

**Type :** Archive historique
**Date :** 2026-11-11 (extrait de ETAT_COURANT.md)
**Source :** `docs/etat/ETAT_COURANT.md` (lignes 53-303 avant purge V8-P0-3)

> **Note :** ce fichier est un **archive** de l'historique des vérifications et fixes E61 → E92. Il n'est **pas** chargé systématiquement dans le contexte de travail (charte §14 — sobriété documentaire). L'état courant est dans `docs/etat/ETAT_COURANT.md`.

---

## VÉRIFICATION E61 — E61-VERIF

- **Blocage du build résolu** : ajout de `export const dynamic = 'force-dynamic';` dans `src/app/client/dashboard/demandes/[id]/page.tsx`.
- **Build** : `npm run build` → **EXIT 0**.
- **Tests E2E workspace** : `npx playwright test --project=workspace` → **EXIT 0**, **17/17** passés.
- **Tests E2E admin** : `npx playwright test --project=admin` → **EXIT 1** ; 4 tests de setup échoués (authentification/DB/API), 48 tests non lancés. C'est un problème d'environnement E2E préexistant, non une régression liée à E61.

## Portefeuille

- [E61] Génération CAO via LLM + templates dans `src/core/ai-engine/skills/reconstruct/` — finalisé.
- [Build] Prérendering de `/client/dashboard/demandes/[id]` désactivé à la build — débloqué.
- [E2E] `workspace` 17/17 — verts.
- [E2E] `admin` bloqué par setup préexistant — hors périmètre E61.

E62-FIX: regex corrigée, admin list OK, build OK, vérification E62-VERIF.

## Portefeuille E64

| Session | Statut | Dossier |
|---------|--------|---------|
| [E64-A] | ✅ Terminée | torus + cone |
| [E64-B] | En cours de finalisation | Corrections regex appliquées, tests à valider, commit en attente |

Fichiers validés :

- ✅ src/core/ai-engine/skills/reconstruct/types.ts — prism ajouté à CadPartType et CadParams
- ✅ src/core/ai-engine/skills/reconstruct/generate-cad.ts — case 'prism' avec BoxGeometry
- ✅ src/core/ai-engine/skills/reconstruct/generate-cad.test.ts — 4 tests prism ajoutés
- ✅ Tests : 22/22 tests unitaires (regex fix appliqué dans generate-cad.test.ts)
- ✅ Typecheck, lint, build : EXIT 0

Dette : D-E52-CAD-GENERATION → 75 % résolue (cylinder/plate/torus/cone/prism)

État des tests : 22 tests unitaires (14 generate-cad + 3 reconstruct + 3 extract-params + 2 select-candidates)

Commit : c5ddff8 (E64-A) et commit E64-B effectué

## §3 — Résultats vérification E62

- admin --list : OK (53 tests répertoriés)
- admin --grep "ADMIN" : tests démarrent sans erreur de syntaxe (setup timeout connexion préexistant)
- workspace 17/17 : verts
- npm run build : EXIT 0
- npm run typecheck : EXIT 0
- npm run test:unit : 20/20 tests unitaires E61 validés

Dette E62-FIX clôturée, non-régression complète confirmée.

E64-B-FIX-FINAL: 6 regex corrigées. En attente validation Coordinateur.

E64-B validation: test:unit 30/30 pass.

E64-B-CI-FIX-APPLIED: typecheck OK, 30/30 tests, lint OK.

## E71-A

- Dimensions STEP extraites et pré-remplies.

## E72-A

- Chat interactif avec contexte.

## E72-B

- Provider Claude inactif préparé.

## E74-A — Conversion Candidat → Pièce

- Action serveur convertCandidateToPart créée dans src/lib/actions/convert-candidate.ts (vérifie rôle ADMIN, génère partNumber CAND-{timestamp}, crée Part en DRAFT avec printableModelUrl, crée Attachment de type CAO si extension .stl/.step/.obj).
- Bouton "Convertir en pièce" ajouté dans src/components/workspace/CandidateCard.tsx (prop isAdmin, état de conversion, message succès/erreur).
- src/components/workspace/AssistantZone.tsx passe isAdmin (via useSession) à chaque CandidateCard.
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run build EXIT 0.
- Aucun commit.

## E74-A-FIX — Correction bouton + layout workspace

- Bouton : condition d'affichage changée de isAdmin && Boolean(candidate.fileUrl) à isAdmin (CandidateCard.tsx:43) car fileUrl est optionnel sur SearchCandidate et masquait le bouton.
- Layout WorkspaceLayout.tsx : conteneur racine flex flex-col, grille flex-1 min-h-0 pour remplir l'espace sous le header et autoriser la réduction des items.
- Layout WorkspaceClient.tsx : 3 enveloppes de zone passent de overflow-auto à min-h-0 (scroll géré en interne par chaque zone).
- Layout AssistantZone.tsx : conteneur ajoute overflow-hidden ; zone de messages passe de overflow-auto à flex-1 min-h-0 overflow-y-auto (scroll vertical interne uniquement, plus de scroll horizontal parasite ni de vide de colonne).
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run format:check OK, npm run build EXIT 0.
- Aucun commit.

## E70-B — Mesure d'Angle et de Diamètre

- MeasureTool.tsx : type MeasureMode (distance | angle | diameter) exporté, prop mode ajoutée. Mode angle (3 points, Vector3.angleTo, label °), mode diamètre (2 points, cercle + label Ø), mode distance conservé. Points réinitialisés au changement de mode.
- ViewerZone.tsx : état measureMode, sélecteur <select> Distance/Angle/Diamètre dans la surcouche "Mesurer".
- cad-viewer.tsx et model-viewer.tsx : prop measureMode propagée à MeasureTool.
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run format:check OK, npm run build EXIT 0.
- Aucun commit.

## E70-B-FIX — Correction régression visuelle workspace

- viewer-shell.tsx : retrait de aspect-video (ratio 16:9 forcé) qui entrait en conflit avec la hauteur explicite (height="400px" du Canvas) et déformait le modèle 3D (étirement vertical). La hauteur est désormais contrôlée par la prop height ou min-h-[320px] par défaut.
- ViewerZone.tsx : inchangé (layout relative flex h-full flex-col avec overlay absolute déjà correct).
- AssistantZone.tsx : inchangé (scroll interne aux messages via overflow-y-auto, conteneur overflow-hidden, déjà en place depuis E74-A-FIX).
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run format:check OK, npm run build EXIT 0.
- Aucun commit.

## E73-A — Sauvegarde locale du workspace (localStorage)

- src/lib/hooks/use-workspace-persistence.ts (nouveau) : hook useWorkspacePersistence qui persiste dans localStorage (clé partiva-workspace-state) : photos, cadFiles, dimensions, description, mode, result. Restaure au montage via useEffect côté client, sauvegarde à chaque changement, expose clearWorkspace().
- src/components/workspace/WorkspaceClient.tsx : remplace les useState individuels par le hook pour les états persistants. Garde extractedDimensions, status, error en état local. Ajoute handleClearWorkspace.
- src/components/workspace/IngestZone.tsx : bouton "Effacer" (icône Trash2) dans l'en-tête de la zone Collecte + indicateur "Sauvegardé localement".
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run format:check OK, npm run build EXIT 0.
- Commit : 72c4761.

## E73-A-FIX — Correction écrasement des données par l'effet de sauvegarde

- src/lib/hooks/use-workspace-persistence.ts : l'effet de sauvegarde écrasait localStorage avec DEFAULT_STATE avant que l'effet de restauration n'ait pu recharger les données. Corrigé avec isFirstRender ref pour sauter la sauvegarde au premier rendu.
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run format:check OK, npm run build EXIT 0.
- Commit : 2e490ce.

## E73-A-FIX2 — Correction hydratation SSR (React #418)

- src/lib/hooks/use-workspace-persistence.ts : useState(loadState) lisait localStorage dans l'initialiseur, créant un mismatch d'hydratation Next.js (SSR rend DEFAULT_STATE, client rend l'état restauré). Corrigé en utilisant useState(DEFAULT_STATE) (identique serveur/client) et en restaurant l'état dans un useEffect côté client uniquement après le montage.
- Vérifications : npm run typecheck EXIT 0, npm run lint 0 erreurs, npm run format:check OK, npm run build EXIT 0.
- Aucun commit.

## E86-A-FIX10 - Correction du build (polices locales)

- src/app/layout.tsx : remplacement des imports next/font/google (Inter, Poppins, Fira_Code) par next/font/local via src/app/fonts/index.
- Polices téléchargées et hébergées localement dans src/app/fonts/ : 10 fichiers .woff2 (Inter 300/400/500/600/700, Poppins 400/500/600/700, Fira Code 400 couvrant 400/500/600), tous magic wOF2 valides.
- Règle ESLint no-restricted-imports ajoutée dans eslint.config.mjs pour interdire next/font/google à l'avenir.
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX10.md.
- Aucun commit.

## E86-A-FIX11 - Analyse Comparative avec docs/app et Correction Définitive Groq

- Analyse comparative avec docs/app : identification du modèle de référence openai/gpt-oss-120b pour Groq (groq-client.ts, config.rs, setup-form.tsx).
- Cause identifiée de l'erreur 404 : .env contenait GROQ_MODEL=llama-3.3-70b-versatile (décommissionné par Groq le 16 août 2026), et src/core/ai-engine/skills/vision/vision.ts ciblait qwen/qwen3.6-27b (également 404).
- src/lib/ai/groq-client.ts : aligné sur openai/gpt-oss-120b avec fallback défensif contre les modèles décommissionnés llama-*.
- src/core/ai-engine/skills/vision/vision.ts : modèle de vision mis à jour vers le modèle multimodal actif qwen/qwen3.8-27b.
- .env et .env.example : mise à jour GROQ_MODEL=openai/gpt-oss-120b et GROQ_VISION_MODEL=qwen/qwen3.8-27b.
- src/app/admin/setup/setup-form.tsx : valeurs par défaut du formulaire setup alignées (GROQ_MODEL=openai/gpt-oss-120b, GROQ_VISION_MODEL=qwen/qwen3.8-27b).
- Vérifications : npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX11.md.
- Aucun commit.

## E86-A-FIX12 - Correction de l'erreur 400 vision (analyse d'image Groq)

- src/core/ai-engine/skills/vision/vision.ts : modèle de vision passé de qwen/qwen3.8-27b (erreur 400 sur les images) à meta-llama/llama-4-scout-17b-16e-instruct (modèle vision confirmé sur Groq).
- .env.example : GROQ_VISION_MODEL mis à jour vers meta-llama/llama-4-scout-17b-16e-instruct.
- Format de requête OpenAI-compatible { type: 'image_url', image_url: { url } } conservé (conforme).
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX12.md.
- Aucun commit.

## E86-A-FIX13 - Vérification du format vision Groq

- src/core/ai-engine/skills/vision/vision.ts : aucun message system envoyé (pas de tableau à convertir en chaîne), message user bien formé (tableau de blocs text + image_url, format OpenAI-compatible).
- Nombre d'images limité à 3 (slice(0, 3)) sous la limite Groq de 5 images par requête.
- Modèle vision déjà corrigé en E86-A-FIX12 : meta-llama/llama-4-scout-17b-16e-instruct.
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX13.md.
- Aucun commit.

## E86-A-FIX14 - Passage des images en base64 pour Groq Vision

- src/core/ai-engine/skills/vision/vision.ts : les URLs Cloudinary ne sont plus passées directement à Groq (timeout côté Groq sur les images volumineuses -> erreur 400). Chaque image est téléchargée côté serveur, convertie en base64 (data:image/...;base64,...) et envoyée en inline.
- Limite de taille : 5 Mo max par image (MAX_IMAGE_BYTES).
- Gestion d'erreur par image : les images inaccessibles/trop grosses/erreurs de téléchargement sont ignorées avec un warning explicite, sans bloquer les autres.
- Si aucune image valide : VisionResult avec detectedType: null et warning explicite.
- Modèle vision : meta-llama/llama-4-scout-17b-16e-instruct (E86-A-FIX12).
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX14.md.
- Aucun commit.

## E86-A-FIX15 - Upload Cloudinary des photos avant analyse (erreur fetch failed sur URL blob)

- src/components/workspace/IngestZone.tsx : simulateUpload ne pousse plus d'URL blob: (URL.createObjectURL). Seule l'URL Cloudinary publique (secure_url) est ajoutée à l'état photos. En cas d'échec d'upload ou d'absence de config Cloudinary, un console.warn est émis et l'image est ignorée (pas d'URL locale temporaire inaccessible côté serveur).
- src/core/ai-engine/skills/vision/vision.ts : filtre des URLs photo (https:// uniquement, ignore les URLs blob: avec warning explicite). Si aucune image publique valide : detectedType: null + warning.
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0, npm run format:check EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX15.md.
- Aucun commit.

## E86-A-FIX16 - Upload Cloudinary des photos avant analyse (correction réelle, pas seulement filtre blob)

- src/components/workspace/IngestZone.tsx : simulateUpload ne crée plus d'URL blob: (URL.createObjectURL supprimée). L'upload vers Cloudinary est effectué AVANT d'ajouter l'URL à l'état photos (fetch vers v1_1/{cloud}/upload avec upload_preset). L'URL secure_url publique (https://res.cloudinary.com/...) est stockée dans photos. En cas d'échec ou d'absence de config Cloudinary : console.warn et l'image est ignorée (pas d'URL locale temporaire).
- État de chargement : [isUploading, setIsUploading] ajouté, setIsUploading(true) au début de l'upload, setIsUploading(false) dans un finally, bouton "Ajouter des photos" désactivé (disabled={isUploading}) pendant l'upload.
- src/core/ai-engine/skills/vision/vision.ts : filtre des URLs photo (https:// uniquement, ignore les URLs blob: avec warning explicite). Si aucune image publique valide : detectedType: null + warning.
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0, npm run format:check EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX16.md.
- Aucun commit.

## E86-A-FIX17 - Restauration de l'upload de photos et CAO (régression E86-A-FIX15/16)

- src/components/workspace/IngestZone.tsx : fallback URL.createObjectURL(file) rétabli quand Cloudinary échoue ou est non configuré. L'utilisateur voit sa photo dans ViewerZone (URL blob locale résolue côté client). Le filtre blob: dans vision.ts empêche l'envoi à Groq (pas de fetch failed). État de chargement isUploading conservé (bouton désactivé pendant l'upload).
- Vérifications : npm run lint EXIT 0, npm run typecheck EXIT 0, npm run build EXIT 0, npm run format:check EXIT 0.
- Rapport : docs/sessions/rapports/SESSION-2026-10-30-E86-A-FIX17.md.
- Aucun commit.

## E86-A-FIX18: upload Cloudinary photos implémenté (IngestZone.tsx).

## E90-0: audit préalable (rapport docs/sessions/rapports/SESSION-2026-10-31-E90-0.md).

## E90-A: schéma + types (migration DB échouée P1000, generate OK).

## E90-A1: migration P1000 (DB auth), client généré OK.

## E90-A: db push OK (analysisData column), generate OK, tsc EXIT 0.

## E90-B: persistance archivePart + engine analysisData; tsc/unit OK.

## E90-C: onglet Analyse dans PartDossier; tsc EXIT 0.

## E91-0: audit recherche (rapport SESSION-2026-10-31-E91-0.md).

## E91-A: mapper search-mapper.ts + type SearchResultItem exporté; tsc OK.

## E91-B: route /api/search flag engine; tsc/unit OK.

## E91-C: toggle engine dans SearchBar; tsc/unit OK.

## E92-0: audit reverse engineering (rapport SESSION-2026-10-31-E92-0.md).

## E92-A: Server Action analyzeReverseEngineeringProject; tsc/unit OK.

## E92-B: bouton+modale Analyser dans onglet CAD RE; tsc/unit OK.

## Campagne tests réels admin (2026-11-03) — CLÔTURÉE

- 5 bugs corrigés : recherche, actualiser, Cloudinary, édition pièce, création partielle.
- 3 dettes d'accessibilité corrigées : PartDossier retiré, bouton Fiche, galerie images (suppression, lightbox, workspace).
- Logs structurés `[ADMIN-EDIT-PART]`, `[ADMIN-IMAGE-UPLOAD]`, `[ADMIN-IMAGE-DELETE]` conservés dans le code.
- Typecheck exit 0, lint 0 erreurs, build vert.
- 13 leçons gravées, 9 dettes d'infrastructure tracées (voir DETTES.md).
- **Date** : 2026-11-02
- **Statut** : Clôturée (B1+B2)

**Livré :**

- src/lib/connectors/aggregator.ts : retry avec backoff exponentiel, circuit-breaker par connecteur, propagation sourcesFailed/sourceDurationsMs + structuredWarnings (SOURCE_FAILED, SOURCE_TIMEOUT, CIRCUIT_OPEN)
- src/lib/connectors/aggregator.test.ts : 4 tests (succès, timeout, retry, circuit-breaker)
- src/core/ai-engine/skills/search/search.ts : mode quick avec fallback web si local vide, warnings structurés
- src/core/ai-engine/skills/search/local-search.ts, web-search.ts, aggregate.ts : warnings structurés (SEARCH_*)
- src/lib/ai/engine-error-messages.ts : messages FR actionnables (SEARCH_LOCAL_EMPTY, SEARCH_WEB_FALLBACK_USED, SEARCH_WEB_FAILED, SEARCH_EMBEDDING_FAILED)
- src/core/ai-engine/skills/search/search.test.ts : tests adaptés + nouveaux tests fallback
- docs/etat/DETTES.md : D-E48-WEB-SEARCH-RESILIENCE passée en Résolue (E104-B1+B2)

**Commits** : aa50156 (B1), 141f4e8 (B2)

---
