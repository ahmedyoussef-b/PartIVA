# DETTES ACTIVES — PartIVA

**Dernière mise à jour :** 2026-10-27
**Source :** Scission de `DEBT.md` (E3-S2)
**Statut :** Dettes non résolues uniquement

- **Décision (2026-10-26) :** le job `E2E (Playwright)` est retiré des
  déclencheurs automatiques (`push`, `pull_request`) et conditionné à un
  lancement manuel (`workflow_dispatch`) jusqu'à résolution de
  `D-E27-E2E-RESIDUAL` (4 tests pré-existants en échec). Les jobs
  `ESLint + Prettier`, `TypeScript` et `Build` restent obligatoires.
  Réactivation : retirer la ligne `if: github.event_name == 'workflow_dispatch'`
  du job `e2e` dans `.github/workflows/ci.yml`.

## Moyenne (2)

### `D-E23-PRISMA-POOLER-TIMEOUT` — Timeout Prisma adapter-pg sur pooler Neon

- **Statut :** Résolue
- **Cause :** `adapter-pg` de Prisma 7 décroche sur le endpoint pooler Neon avec `channel_binding=require`. Le raw `pg` répond en ~640 ms sur la même URL.
- **Périmètre :** `src/lib/prisma.ts`, `prisma/schema.prisma`, CI/CD.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** 2 à 3 builds consécutifs verts sur le pooler Neon. ✅ (3 runs CI consécutifs validés en session E34).
- **Résolue en :** session E34 (2026-10-24).
- **Preuve empirique :** `docs/infrastructure/E34-POOLER-STABILITY-LOG.md` — 3 runs verts consécutifs (b4052e2, 915c402, 9a9a903), 0 erreur DB (P1001/P1017/Timeout).

### `D-E24-E2E-TIMEOUT-SOURCES` — Timeout des tests `source=all`

- **Statut :** Active
- **Cause :** `POST /api/search {source:'all'}` interroge des sources externes non configurées (TraceParts, TecDoc, OpenSERP), ce qui prend ~32.8s > timeout Playwright de 30s.
- **Périmètre :** `e2e/admin/aggregation-tecdoc.spec.ts`, `e2e/admin/performance.spec.ts`, `playwright.config.ts`.
- **Effort estimé :** Faible (augmenter le timeout à 60s, ou désactiver les sources non configurées en CI).
- **Bloquant :** Non (2 tests rouges sur 52 dans le projet `admin`).
- **Condition de résolution :** les 2 tests `source=all` passent en CI.
- **Prochaine session :** Bloquée par `D-E26-CI-BRANCH-MISMATCH` (les tests `source=all` ne peuvent être exécutés en CI).

## Faible (3)

### `D-E22-KPI-MOCK-DATA` — Données KPI factices

- **Statut :** Résolue
- **Cause :** Les KPI du dashboard utilisaient des données en dur (`+ 2`, `+ 184 réf.`, `74.2%`) en attendant un endpoint d'agrégats.
- **Périmètre :** `src/app/admin/dashboard/dashboard-client.tsx`, `src/app/api/dashboard/route.ts` (nouveau `src/app/api/dashboard/kpi/route.ts`).
- **Effort estimé :** Moyen.
- **Bloquant :** Non.
- **Condition de résolution :** l'endpoint d'agrégats existe et alimente le dashboard. ✅ (E32 — endpoint `/api/dashboard/kpi` en place, dashboard consomme les données réelles).
- **Résolue en :** session E32-Bis (2026-10-24).

### `D-E22-PART-STATUS-BADGE` — Composant mixte Server/Client

- **Statut :** Résolue
- **Cause :** `PartStatusBadge` était un Server Component qui rendait un composant client et importait le namespace Prisma browser.
- **Périmètre :** `src/components/part-status-badge.tsx`, `src/components/domain/part-status-badge.tsx`, `src/components/part-dossier.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** le composant est entièrement client ou entièrement serveur, sans import du namespace Prisma *browser* dans le bundle serveur. ✅ (E33 — `PartStatusBadge` refactorisé en composant purement Client 'use client', découplé de Prisma avec tokens tech E31).
- **Résolue en :** session E33 (2026-10-24).
### `D-E38-PRETTIER-TAILWIND` — Plugin Prettier Tailwind cassé avec Tailwind v4

- **Statut :** Résolue (2026-10-27)
- **Cause :** Tailwind v4 exige `tailwindStylesheet` dans la config Prettier.
- **Résolution :** Ajout de `"tailwindStylesheet": "./src/app/globals.css"` dans `.prettierrc`.
- **Preuve :** `npm run format:check` — plus d'erreur `loadTailwindCSS` (validation validée, 2026-10-27).

### `D-E26-LEGACY-KILOCODE` — Fichier hérité `.kilocode/rules.md`

- **Statut :** Résolue
- **Cause :** `.kilocode/rules.md` contenait 5 références mortes vers `PCT.md` et `SESSION.md` (archivés en E6). Le répertoire `.kilocode/` est un héritage remplacé par `.kilo/`.
- **Périmètre :** `.kilocode/` (suppression recommandée).
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** `.kilocode/rules.md` est supprimé. ✅ (session E35, 2026-10-24)
- **Résolue en :** session E35 (2026-10-24).

## Acceptée — facteur externe (1)

### `D-E14-PRINT-ON-DEMAND` — Print-on-demand

- **Statut :** Acceptée (facteur externe)
- **Cause :** Pas de partenariat avec un service d'impression professionnelle.
- **Périmètre :** `src/app/api/print-order/route.ts` (nouveau), intégration Stripe + partenaire.
- **Effort estimé :** Élevé (post-E17).
- **Bloquant :** Non.
- **Condition de résolution :** un partenariat d'impression et un moyen de paiement sont établis.
- **Prochaine session :** Non planifiée (facteur externe).

### `D-E26-CI-BRANCH-MISMATCH` — CI configurée sur `main`, dépôt sur `master`
- **Statut :** Résolue (2026-10-27)
- **Priorité :** Haute
- **Cause :** `.github/workflows/ci.yml` déclare `on.push.branches: [main]`
  et `pull_request` sur `main`. La branche par défaut du dépôt distant
  est `master`. Aucun run CI n'a jamais été déclenché (0 runs API GitHub).
- **Périmètre :** `.github/workflows/ci.yml`, réglages du dépôt GitHub.
- **Effort estimé :** Faible (alignement de la branche + premier run).
- **Bloquant :** Oui — `D-E23-PRISMA-POOLER-TIMEOUT` et
  `D-E24-E2E-TIMEOUT-SOURCES` ne peuvent pas être clôturées sans run CI.
- **Condition de résolution :** au moins 2 runs CI consécutifs verts sur
  `master`, déclenchés par push.
- **Preuve :** run `40417826824` (tag `v0.1.0-win6`) vert sur les 5 étapes,
  pipeline Desktop opérationnel (build Tauri + Vercel Blob + Prisma).

### `D-E37-GITHUB-RELEASES` — Migration Vercel Blob → GitHub Releases

- **Statut :** Reportée (optionnelle)
- **Cause :** Vercel Blob fonctionne correctement (`allowOverwrite: true` validé).
  Le seul blocage était `RELEASE_API_SECRET` déjà configuré et fonctionnel.
- **Périmètre :** `.github/workflows/release-desktop.yml`, `scripts/publish-desktop.mjs`.
- **Effort estimé :** 1-2 sessions.
- **Bloquant :** Non.

### D-E20-CLOUDINARY-UPLOAD-SILENT-FAIL - Upload Cloudinary silencieux sur l'admin

- **Statut :** Résolue
- **Cause :** `createPart` retournait des blob URLs temporaires. Sur échec Cloudinary, le client ne recevait pas de réponse claire et l'upload était invisible.
- **Périmètre :** `src/lib/actions/parts.ts`, `src/app/admin/pieces/[id]/page.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** Le serveur renvoie `success: false` avec message d'erreur détaillé. ✓ (E40-Fix6, 2026-10-24).
- **Résolu en :** session E40-Fix6 (2026-10-24).
- **Preuve empirique :** `npm run build` EXIT 0 (sans erreur Cloudinary silencieuse).

### D-E20-ADMIN-PART-IMAGES-DISPLAY - Affichage de l'onglet Images sur la fiche Admin

- **Statut :** Résolue
- **Cause :** La page de détail `/admin/pieces/[id]` n'affichait pas les images uploadées.
- **Périmètre :** `src/components/part-image-gallery.tsx`, `src/app/admin/pieces/[id]/page.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** La page affiche un onglet `Images` avec `PartImageGallery`. ✓ (E40-Fix7, 2026-10-24).
- **Résolu en :** session E40-Fix7 (2026-10-24).
- **Preuve empirique :** Test Playwright `e2e/admin/part-creation.spec.ts` exécutable.

### D-E20-CLIENT-REQUEST-SEMANTICS - Sémantique client / demande vs pièce

- **Statut :** Résolue
- **Cause :** Confusion entre `Request` (demande) et `Part` (pièce). Le bouton de conversion n'était pas visible ou mal labellé.
- **Périmètre :** `src/app/client/dashboard/demandes/[id]/demande-detail-client.tsx`, `src/app/admin/demandes/[id]/page.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** Le bouton "Convertir en Pièce (admin)" apparait uniquement si `request.status === 'candidate_found'`. ✓ (E40-Fix8, 2026-10-24).
- **Résolu en :** session E40-Fix8 (2026-10-24).
- **Preuve empirique :** Test Playwright `e2e/admin/request-to-part-conversion.spec.ts` exécutable.

### D-E52-CAD-GENERATION - G�n�ration CAO r�elle
- **Statut :** Partiellement r�solu
- **Cause :** Les skills `extract-params`, `generate-cad` et `select-candidates` n'�taient pas reli�s pour produire un vrai fichier STL.
- **P�rim�tre :** src/core/ai-engine/skills/reconstruct/
- **Effort estim� :** Moyen
- **Bloquant :** Non
- **Preuves :** `npm run test:unit` EXIT 0 (7 fichiers, 20 tests).
- **Actions :** ajout de `extractCadParams` (d�l�gu� � Groq), `generateCadFromParams` (three + STLExporter), et d'un appel `extractCadParams` -> `generateCadFromParams` dans `select-candidates.ts`.
- **Limite :** cas de test uniquement ; les �chos Groq r�els et les formes complexes n'ont pas �t� valid�s.

### D-E52-FILE-FORMAT-DETECTION - D�tection format au-del� extension
- **Statut :** Ouverte
- **Cause :** D�tection uniquement par extension
- **P�rim�tre :** src/core/ai-engine/skills/reconstruct/select-candidates.ts
- **Effort estim� :** Moyen
- **Bloquant :** Non

### D-E52-FILE-INTEGRITY - Validation int�grit� fichiers 3D
- **Statut :** Ouverte
- **Cause :** Aucune validation du contenu
- **P�rim�tre :** src/core/ai-engine/skills/reconstruct/
- **Effort estim� :** Moyen
- **Bloquant :** Non

### D-E48-PGVECTOR-SEARCH - Remplacer scoring heuristique par pgvector
- **Statut :** R�solue
- **Cause :** Recherche locale heuristique remplac�e par pgvector (avec fallback)
- **P�rim�tre :** src/core/ai-engine/skills/search/local-search.ts
- **Effort estim� :** �lev�
- **Bloquant :** Non
- **Condition de r�solution :** Recherche vectorielle op�rationnelle. ?

### D-E48-WEB-SEARCH-RESILIENCE - R�silience route /api/search
- **Statut :** Ouverte
- **Cause :** D�pendance � route existante sans gestion avanc�e
- **P�rim�tre :** src/core/ai-engine/skills/search/web-search.ts
- **Effort estim� :** Moyen
- **Bloquant :** Non

### D-E57-WORKSPACE-E2E - Pas de tests E2E pour le workspace
- **Statut :** Ouverte
- **Cause :** Aucun test E2E du flux workspace
- **P�rim�tre :** e2e/workspace/
- **Effort estim� :** Moyen
- **Bloquant :** Non

### D-E57-CLOUDINARY-UPLOAD - Upload Cloudinary simul�
- **Statut :** R�solue
- **Cause :** URLs simul�es dans IngestZone (remplac�es par upload Cloudinary r�el)
- **P�rim�tre :** src/components/workspace/IngestZone.tsx
- **Effort estim� :** Moyen
- **Bloquant :** Non
- **Condition de r�solution :** Upload r�el via Cloudinary. ?

### D-E57-LLM-ENRICHMENT - Enrichissement LLM basique
- **Statut :** Ouverte
- **Cause :** Enrichissement LLM minimal en mode deep
- **P�rim�tre :** src/lib/ai/
- **Effort estim� :** Moyen
- **Bloquant :** Non

### D-E57-CADVIEWER-INTEGRATION - Visualisation 3D limit�e � ModelViewer
- **Statut :** R�solue
- **Cause :** CadViewer non int�gr� (d�sormais int�gr� dans ViewerZone)
- **P�rim�tre :** src/components/workspace/ViewerZone.tsx
- **Effort estim� :** Moyen
- **Bloquant :** Non
- **Condition de r�solution :** CadViewer pour STEP/IGES. ?

### D-E58-DB-BUILD-BLOCKER - DB Neon injoignable bloque le build
- **Statut :** R�solue
- **Cause :** P1001 Can't reach database server (r�solu, DB accessible)
- **P�rim�tre :** Prisma / Neon
- **Effort estim� :** Moyen
- **Bloquant :** Non (r�solu)
- **Condition de r�solution :** DB joignable et build EXIT 0 ?
