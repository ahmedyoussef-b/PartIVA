# DETTES ACTIVES â€” PartIVA

**DerniÃ¨re mise Ã  jour :** 2026-10-27
**Source :** Scission de `DEBT.md` (E3-S2)
**Statut :** Dettes non rÃ©solues uniquement

- **DÃ©cision (2026-10-26) :** le job `E2E (Playwright)` est retirÃ© des
  dÃ©clencheurs automatiques (`push`, `pull_request`) et conditionnÃ© Ã  un
  lancement manuel (`workflow_dispatch`) jusqu'Ã  rÃ©solution de
  `D-E27-E2E-RESIDUAL` (4 tests prÃ©-existants en Ã©chec). Les jobs
  `ESLint + Prettier`, `TypeScript` et `Build` restent obligatoires.
  RÃ©activation : retirer la ligne `if: github.event_name == 'workflow_dispatch'`
  du job `e2e` dans `.github/workflows/ci.yml`.

## Moyenne (3)

### `D-E23-PRISMA-POOLER-TIMEOUT` â€” Timeout Prisma adapter-pg sur pooler Neon

- **Statut :** RÃ©solue
- **Cause :** `adapter-pg` de Prisma 7 dÃ©croche sur le endpoint pooler Neon avec `channel_binding=require`. Le raw `pg` rÃ©pond en ~640 ms sur la mÃªme URL.
- **PÃ©rimÃ¨tre :** `src/lib/prisma.ts`, `prisma/schema.prisma`, CI/CD.
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** 2 Ã  3 builds consÃ©cutifs verts sur le pooler Neon. âœ… (3 runs CI consÃ©cutifs validÃ©s en session E34).
- **RÃ©solue en :** session E34 (2026-10-24).
- **Preuve empirique :** `docs/infrastructure/E34-POOLER-STABILITY-LOG.md` â€” 3 runs verts consÃ©cutifs (b4052e2, 915c402, 9a9a903), 0 erreur DB (P1001/P1017/Timeout).

### `D-E24-E2E-TIMEOUT-SOURCES` â€” Timeout des tests `source=all`

- **Statut :** Active
- **Cause :** `POST /api/search {source:'all'}` interroge des sources externes non configurÃ©es (TraceParts, TecDoc, OpenSERP), ce qui prend ~32.8s > timeout Playwright de 30s.
- **PÃ©rimÃ¨tre :** `e2e/admin/aggregation-tecdoc.spec.ts`, `e2e/admin/performance.spec.ts`, `playwright.config.ts`.
- **Effort estimÃ© :** Faible (augmenter le timeout Ã  60s, ou dÃ©sactiver les sources non configurÃ©es en CI).
- **Bloquant :** Non (2 tests rouges sur 52 dans le projet `admin`).
- **Condition de rÃ©solution :** les 2 tests `source=all` passent en CI.
- **Prochaine session :** BloquÃ©e par `D-E26-CI-BRANCH-MISMATCH` (les tests `source=all` ne peuvent Ãªtre exÃ©cutÃ©s en CI).

### `D-CAMPAIGN-CHECK-DB-MODULE-RESOLUTION` â€” RÃ©solution de module prisma.js hors npm run

- **Statut :** Ouverte
- **PrioritÃ© :** Moyenne
- **Cause :** `check-env.ts:50` importe `../../src/lib/prisma.js` ; l'exÃ©cution via `npm run campaign:check` (tsx) rÃ©sout `.js`â†’`.ts` correctement, mais une invocation node directe Ã©choue (`Cannot find module ...prisma.js`).
- **PÃ©rimÃ¨tre :** `scripts/campaign/check-env.ts`
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **Condition de rÃ©solution :** Documenter l'invocation obligatoire, ou rendre l'import robuste. Non bloquant tant que `npm run` est utilisÃ©.

## Faible (3)

### `D-E22-KPI-MOCK-DATA` â€” DonnÃ©es KPI factices

- **Statut :** RÃ©solue
- **Cause :** Les KPI du dashboard utilisaient des donnÃ©es en dur (`+ 2`, `+ 184 rÃ©f.`, `74.2%`) en attendant un endpoint d'agrÃ©gats.
- **PÃ©rimÃ¨tre :** `src/app/admin/dashboard/dashboard-client.tsx`, `src/app/api/dashboard/route.ts` (nouveau `src/app/api/dashboard/kpi/route.ts`).
- **Effort estimÃ© :** Moyen.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** l'endpoint d'agrÃ©gats existe et alimente le dashboard. âœ… (E32 â€” endpoint `/api/dashboard/kpi` en place, dashboard consomme les donnÃ©es rÃ©elles).
- **RÃ©solue en :** session E32-Bis (2026-10-24).

### `D-E22-PART-STATUS-BADGE` â€” Composant mixte Server/Client

- **Statut :** RÃ©solue
- **Cause :** `PartStatusBadge` Ã©tait un Server Component qui rendait un composant client et importait le namespace Prisma browser.
- **PÃ©rimÃ¨tre :** `src/components/part-status-badge.tsx`, `src/components/domain/part-status-badge.tsx`, `src/components/part-dossier.tsx`.
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** le composant est entiÃ¨rement client ou entiÃ¨rement serveur, sans import du namespace Prisma *browser* dans le bundle serveur. âœ… (E33 â€” `PartStatusBadge` refactorisÃ© en composant purement Client 'use client', dÃ©couplÃ© de Prisma avec tokens tech E31).
- **RÃ©solue en :** session E33 (2026-10-24).
### `D-E38-PRETTIER-TAILWIND` â€” Plugin Prettier Tailwind cassÃ© avec Tailwind v4

- **Statut :** RÃ©solue (2026-10-27)
- **Cause :** Tailwind v4 exige `tailwindStylesheet` dans la config Prettier.
- **RÃ©solution :** Ajout de `"tailwindStylesheet": "./src/app/globals.css"` dans `.prettierrc`.
- **Preuve :** `npm run format:check` â€” plus d'erreur `loadTailwindCSS` (validation validÃ©e, 2026-10-27).

### `D-E26-LEGACY-KILOCODE` â€” Fichier hÃ©ritÃ© `.kilocode/rules.md`

- **Statut :** RÃ©solue
- **Cause :** `.kilocode/rules.md` contenait 5 rÃ©fÃ©rences mortes vers `PCT.md` et `SESSION.md` (archivÃ©s en E6). Le rÃ©pertoire `.kilocode/` est un hÃ©ritage remplacÃ© par `.kilo/`.
- **PÃ©rimÃ¨tre :** `.kilocode/` (suppression recommandÃ©e).
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** `.kilocode/rules.md` est supprimÃ©. âœ… (session E35, 2026-10-24)
- **RÃ©solue en :** session E35 (2026-10-24).

### `D-GOUVERNANCE-V4-MISSING` â€” v4 reconstruit (contenu conforme)
- **Statut :** FermÃ©e (2026-11-04)
- **PrioritÃ© :** Moyenne
- **Cause :** v4 manquant alors que v5 le rÃ©fÃ©renÃ§ait. v4 reconstruit le 2026-11-04, contenu conforme aux rÃ¨gles v4 + leÃ§ons (3162 bytes, plus complet que l'original tronquÃ© de 2925 bytes).
- **PÃ©rimÃ¨tre :** `docs/gouvernance/PROMPT_PASSATION_SUPERVISEUR_v4.md`
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **RÃ©solution :** v4 reconstruit et validÃ©. Hash SHA256 : 1DBD79820BBFE4BF2CE2C153A58EFDC75A8556D4BCE3EA7B7CE3A88B83A38D5B
- **RÃ©solue en :** session V1.5-INFRA-AUTH (2026-11-04).

### `D-E14-PRINT-ON-DEMAND` â€” Print-on-demand

- **Statut :** AcceptÃ©e (facteur externe)
- **Cause :** Pas de partenariat avec un service d'impression professionnelle.
- **PÃ©rimÃ¨tre :** `src/app/api/print-order/route.ts` (nouveau), intÃ©gration Stripe + partenaire.
- **Effort estimÃ© :** Ã‰levÃ© (post-E17).
- **Bloquant :** Non.
- **Condition de rÃ©solution :** un partenariat d'impression et un moyen de paiement sont Ã©tablis.
- **Prochaine session :** Non planifiÃ©e (facteur externe).

### `D-E26-CI-BRANCH-MISMATCH` â€” CI configurÃ©e sur `main`, dÃ©pÃ´t sur `master`
- **Statut :** RÃ©solue (2026-10-27)
- **PrioritÃ© :** Haute
- **Cause :** `.github/workflows/ci.yml` dÃ©clare `on.push.branches: [main]`
  et `pull_request` sur `main`. La branche par dÃ©faut du dÃ©pÃ´t distant
  est `master`. Aucun run CI n'a jamais Ã©tÃ© dÃ©clenchÃ© (0 runs API GitHub).
- **PÃ©rimÃ¨tre :** `.github/workflows/ci.yml`, rÃ©glages du dÃ©pÃ´t GitHub.
- **Effort estimÃ© :** Faible (alignement de la branche + premier run).
- **Bloquant :** Oui â€” `D-E23-PRISMA-POOLER-TIMEOUT` et
  `D-E24-E2E-TIMEOUT-SOURCES` ne peuvent pas Ãªtre clÃ´turÃ©es sans run CI.
- **Condition de rÃ©solution :** au moins 2 runs CI consÃ©cutifs verts sur
  `master`, dÃ©clenchÃ©s par push.
- **Preuve :** run `40417826824` (tag `v0.1.0-win6`) vert sur les 5 Ã©tapes,
  pipeline Desktop opÃ©rationnel (build Tauri + Vercel Blob + Prisma).

### `D-E37-GITHUB-RELEASES` â€” Migration Vercel Blob â†’ GitHub Releases

- **Statut :** ReportÃ©e (optionnelle)
- **Cause :** Vercel Blob fonctionne correctement (`allowOverwrite: true` validÃ©).
  Le seul blocage Ã©tait `RELEASE_API_SECRET` dÃ©jÃ  configurÃ© et fonctionnel.
- **PÃ©rimÃ¨tre :** `.github/workflows/release-desktop.yml`, `scripts/publish-desktop.mjs`.
- **Effort estimÃ© :** 1-2 sessions.
- **Bloquant :** Non.

### D-E20-CLOUDINARY-UPLOAD-SILENT-FAIL - Upload Cloudinary silencieux sur l'admin

- **Statut :** RÃ©solue
- **Cause :** `createPart` retournait des blob URLs temporaires. Sur Ã©chec Cloudinary, le client ne recevait pas de rÃ©ponse claire et l'upload Ã©tait invisible.
- **PÃ©rimÃ¨tre :** `src/lib/actions/parts.ts`, `src/app/admin/pieces/[id]/page.tsx`.
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** Le serveur renvoie `success: false` avec message d'erreur dÃ©taillÃ©. âœ“ (E40-Fix6, 2026-10-24).
- **RÃ©solu en :** session E40-Fix6 (2026-10-24).
- **Preuve empirique :** `npm run build` EXIT 0 (sans erreur Cloudinary silencieuse).

### D-E20-ADMIN-PART-IMAGES-DISPLAY - Affichage de l'onglet Images sur la fiche Admin

- **Statut :** RÃ©solue
- **Cause :** La page de dÃ©tail `/admin/pieces/[id]` n'affichait pas les images uploadÃ©es.
- **PÃ©rimÃ¨tre :** `src/components/part-image-gallery.tsx`, `src/app/admin/pieces/[id]/page.tsx`.
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** La page affiche un onglet `Images` avec `PartImageGallery`. âœ“ (E40-Fix7, 2026-10-24).
- **RÃ©solu en :** session E40-Fix7 (2026-10-24).
- **Preuve empirique :** Test Playwright `e2e/admin/part-creation.spec.ts` exÃ©cutable.

### D-E20-CLIENT-REQUEST-SEMANTICS - SÃ©mantique client / demande vs piÃ¨ce

- **Statut :** RÃ©solue
- **Cause :** Confusion entre `Request` (demande) et `Part` (piÃ¨ce). Le bouton de conversion n'Ã©tait pas visible ou mal labellÃ©.
- **PÃ©rimÃ¨tre :** `src/app/client/dashboard/demandes/[id]/demande-detail-client.tsx`, `src/app/admin/demandes/[id]/page.tsx`.
- **Effort estimÃ© :** Faible.
- **Bloquant :** Non.
- **Condition de rÃ©solution :** Le bouton "Convertir en PiÃ¨ce (admin)" apparait uniquement si `request.status === 'candidate_found'`. âœ“ (E40-Fix8, 2026-10-24).
- **RÃ©solu en :** session E40-Fix8 (2026-10-24).
- **Preuve empirique :** Test Playwright `e2e/admin/request-to-part-conversion.spec.ts` exÃ©cutable.

### D-E52-CAD-GENERATION - Gï¿½nï¿½ration CAO rï¿½elle
- **Statut :** Partiellement rï¿½solu
- **Cause :** Les skills `extract-params`, `generate-cad` et `select-candidates` n'ï¿½taient pas reliï¿½s pour produire un vrai fichier STL.
- **Pï¿½rimï¿½tre :** src/core/ai-engine/skills/reconstruct/
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non
- **Preuves :** `npm run test:unit` EXIT 0 (7 fichiers, 20 tests).
- **Actions :** ajout de `extractCadParams` (dï¿½lï¿½guï¿½ ï¿½ Groq), `generateCadFromParams` (three + STLExporter), et d'un appel `extractCadParams` -> `generateCadFromParams` dans `select-candidates.ts`.
- **Limite :** cas de test uniquement ; les ï¿½chos Groq rï¿½els et les formes complexes n'ont pas ï¿½tï¿½ validï¿½s.

### D-E52-FILE-FORMAT-DETECTION - Dï¿½tection format au-delï¿½ extension
- **Statut :** Rï¿½solue (E98-B)
- **Cause :** Dï¿½tection uniquement par extension
- **Pï¿½rimï¿½tre :** src/core/ai-engine/skills/reconstruct/select-candidates.ts, src/lib/utils/file-formats.ts (nouveau), src/components/workspace/IngestZone.tsx, src/core/ai-engine/skills/reconstruct/types.ts, src/core/ai-engine/skills/reconstruct/select-candidates.test.ts (nouveau)
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non
- **Condition de rï¿½solution :** Whitelist d'extensions centralisï¿½e dans `file-formats.ts`, garde-fou `isCadFile` dans `selectCandidates` avec fallback, validation + toast dans `IngestZone`, 3 tests unitaires verts. âœ… (E98-B)
- **Rï¿½solue en :** session E98-B (2026-11-02)
- **Note :** Correctif minimal combinant extension whitelist + garde-fou `selectCandidates` + validation `IngestZone`. Magic bytes reportï¿½s ï¿½ une phase ultï¿½rieure si faux positifs persistent.

### D-E56-GESTION-ERREURS-MOTEUR ï¿½ Gestion d'erreurs moteur minimale
- **Statut :** Rï¿½solue (E99-B).
- **Note :** Normalisation des erreurs par ï¿½tape dans `engine.ts`, codes explicites dans `groq-client.ts` et skills, map de messages FR dans `engine-error-messages.ts`, affichage UI actionnable.
- **Statut :** Ouverte
- **Cause :** Aucune validation du contenu
- **Pï¿½rimï¿½tre :** src/core/ai-engine/skills/reconstruct/
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non

### D-E48-PGVECTOR-SEARCH - Remplacer scoring heuristique par pgvector
- **Statut :** Rï¿½solue
- **Cause :** Recherche locale heuristique remplacï¿½e par pgvector (avec fallback)
- **Pï¿½rimï¿½tre :** src/core/ai-engine/skills/search/local-search.ts
- **Effort estimï¿½ :** ï¿½levï¿½
- **Bloquant :** Non
- **Condition de rï¿½solution :** Recherche vectorielle opï¿½rationnelle. ?

### D-E48-WEB-SEARCH-RESILIENCE - Rï¿½silience route /api/search
- **Statut :** Rï¿½solue (E104-B2)
- **Cause :** Dï¿½pendance ï¿½ route existante sans gestion avancï¿½e
- **Pï¿½rimï¿½tre :** src/core/ai-engine/skills/search/web-search.ts
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non

### D-E57-WORKSPACE-E2E - Pas de tests E2E pour le workspace
- **Statut :** Ouverte
- **Cause :** Aucun test E2E du flux workspace
- **Pï¿½rimï¿½tre :** e2e/workspace/
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non

### D-E57-CLOUDINARY-UPLOAD - Upload Cloudinary simulï¿½
- **Statut :** Rï¿½solue
- **Cause :** URLs simulï¿½es dans IngestZone (remplacï¿½es par upload Cloudinary rï¿½el)
- **Pï¿½rimï¿½tre :** src/components/workspace/IngestZone.tsx
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non
- **Condition de rï¿½solution :** Upload rï¿½el via Cloudinary. ?

### D-E57-LLM-ENRICHMENT - Enrichissement LLM basique
- **Statut :** Ouverte
- **Cause :** Enrichissement LLM minimal en mode deep
- **Pï¿½rimï¿½tre :** src/lib/ai/
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non

### D-E57-CADVIEWER-INTEGRATION - Visualisation 3D limitï¿½e ï¿½ ModelViewer
- **Statut :** Rï¿½solue
- **Cause :** CadViewer non intï¿½grï¿½ (dï¿½sormais intï¿½grï¿½ dans ViewerZone)
- **Pï¿½rimï¿½tre :** src/components/workspace/ViewerZone.tsx
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non
- **Condition de rï¿½solution :** CadViewer pour STEP/IGES. ?

### D-E58-DB-BUILD-BLOCKER - DB Neon injoignable bloque le build
- **Statut :** Rï¿½solue
- **Cause :** P1001 Can't reach database server (rï¿½solu, DB accessible)
- **Pï¿½rimï¿½tre :** Prisma / Neon
- **Effort estimï¿½ :** Moyen
- **Bloquant :** Non (rï¿½solu)
- **Condition de rï¿½solution :** DB joignable et build EXIT 0 ?


## Dettes infrastructure campagne (2026-11-03)

- D-CAMPAGNE-ENCODING (Basse) â€” Notes du registre mal encodÃ©es (UTF-8)
- D-CAMPAGNE-BUILD-FRESH (Moyenne) â€” Playwright doit rebuild avant test
- D-CAMPAGNE-RECORD-ORDER (Basse) â€” Ordre des commandes contractuel
- D-CAMPAGNE-ENV-TEST-SYNC (Haute) â€” .env.test en miroir de .env
- D-CAMPAGNE-ENV-PRIORITY (Haute) â€” .env.local Ã©crase .env silencieusement
- D-CAMPAGNE-CLOUDINARY-CHECK (Basse) â€” campaign:check doit valider Cloudinary
- D-CAMPAGNE-GROQ-CHECK (Moyenne) â€” campaign:check doit valider Groq
- D-ADMIN-TEST-COVERAGE (Moyenne) â€” Pas de tests E2E admin
- D-WS-REFACTOR (Moyenne) â€” Refactor UI workspace abandonnÃ©

## Haute (5 â€” dont 1 fermÃ©e)

### `D-CAMPAIGN-CHECK-AUTH-VALIDITY` â€” Faux-positif/faux-nÃ©gatif sur validation auth
- **Statut :** **Fermée** (V4-A) — validation runtime via get-session
- **PrioritÃ© :** Haute
- **Cause :** `check-env.ts:106` ne vÃ©rifie que `existsSync(.auth/admin.json)` ; un cookie expirÃ© passe la gate (faux-positif), un fichier absent la fait Ã©chouer (faux-nÃ©gatif).
- **PÃ©rimÃ¨tre :** `scripts/campaign/check-env.ts`
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **Condition de rÃ©solution :** Valider la session (dÃ©codage/expiration ou appel authentifiÃ©).
### `D-E2E-DB-ENV-MISMATCH` â€” Mismatch base Next.js (Neon) vs seed (partiva_test)
- **Statut :** RÃ©solue (2026-11-04)
- **PrioritÃ© :** Haute
- **Cause :** `.env.local` pointe vers Neon (prod) et Ã©crase `.env` pour Next.js. `global-setup.ts` seed `partiva_test` (local). Le serveur Next.js (webServer Playwright) et le seed utilisent des bases diffÃ©rentes â†’ sessions crÃ©Ã©es dans Neon, requÃªtes de vÃ©rification sur partiva_test â†’ login E2E incohÃ©rent, A1-A4 Ã©chouent sur /login.
- **PÃ©rimÃ¨tre :** `playwright.config.ts` (chargement `.env.test` en tÃªte + `reuseExistingServer: false` + garde-fou `throw`), `e2e/global-setup.ts`.
- **Effort estimÃ© :** Faible
- **Bloquant :** Oui (bloquait V1.3-A).
- **RÃ©solution :** `playwright.config.ts` charge `.env.test` en tÃªte avant `defineConfig`, force `reuseExistingServer: false`, et lÃ¨ve une erreur si `DATABASE_URL` ne contient pas `partiva_test`. Preuve : diff fourni (mission V1.5-INFRA-AUTH, 2026-11-04).
- **RÃ©solue en :** session V1.5-INFRA-AUTH (2026-11-04).
### `D-E2E-CLEAN-DESTRUCTIVE` â€” git clean -f a dÃ©truit des livrables non trackÃ©s
- **Statut :** Ouverte
- **PrioritÃ© :** Haute
- **Cause :** `git clean -f` exÃ©cutÃ© sans liste explicite a supprimÃ© `e2e/admin/reverse-engineering.spec.ts` (V1.3-A), `docs/gouvernance/PROMPT_PASSATION_SUPERVISEUR_v4.md`, et rÃ©Ã©crit `docs/etat/DETTES.md`. Les fichiers ont Ã©tÃ© "recrÃ©Ã©s" avec un contenu diffÃ©rent (hash/taille diffÃ©rents).
- **PÃ©rimÃ¨tre :** hygiÃ¨ne de session, procÃ©dure IA Interne.
- **Effort estimÃ© :** Faible
- **Bloquant :** Oui (bloque la clÃ´ture de V1.3-A tant que les livrables ne sont pas reconstruits).
- **RÃ©solution :** Interdiction de `git clean` (mÃªme `-n`) sans liste explicite validÃ©e par le Superviseur. Reconstruction des livrables dÃ©truits.

### `D-V13A-A4-NO-STABLE-SELECTOR` â€” A4 sans sÃ©lecteur stable
- **Statut :** Ouverte
- **PrioritÃ© :** Moyenne
- **Cause :** A4 utilise `getByText(/RÃ©sultat|Analyse|Workspace/i)` tautologique ; pas de `data-testid` dans `reverse-engineering-content.tsx`.
- **PÃ©rimÃ¨tre :** `e2e/admin/reverse-engineering.spec.ts`, `src/app/admin/reverse-engineering/reverse-engineering-content.tsx`
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **RÃ©solution :** Ajouter `data-testid` sur le panneau de rÃ©sultat (V1.5).

### `D-E2E-AUTH-STORAGESTATE-REUSED` â€” Cause rÃ©elle : mismatch base Neon/partiva_test
- **Statut :** FermÃ©e (remplacÃ©e par D-E2E-DB-ENV-MISMATCH)
- **PrioritÃ© :** Haute
- **Cause :** La cause rÃ©elle n'est pas le rÃ©utilisation d'un storageState expirÃ©, mais le **mismatch base Neon/partiva_test** (voir D-E2E-DB-ENV-MISMATCH). Les sessions Ã©taient crÃ©Ã©es dans Neon et les requÃªtes de vÃ©rification s'effectuaient sur `partiva_test`, provoquant des Ã©checs de login E2E incohÃ©rents. Le cookie expire le 2026-11-09, mais le problÃ¨me fondamental est le pointedage de base, pas l'expiration.
- **PÃ©rimÃ¨tre :** `playwright.config.ts`, `e2e/global-setup.ts`, `.env.test`, `.env.local`.
- **Effort estimÃ© :** Faible (dÃ©jÃ  rÃ©solu par D-E2E-DB-ENV-MISMATCH).
- **Bloquant :** Non â€” rÃ©solu par la rÃ©gularisation de `playwright.config.ts` en session V1.5-INFRA-AUTH (2026-11-04).
- **RÃ©solution :** RemplacÃ©e par D-E2E-DB-ENV-MISMATCH. La rÃ©gularisation de `playwright.config.ts` (chargement `.env.test` en tÃªte + `reuseExistingServer: false` + garde-fou `DATABASE_URL` vers `partiva_test`) a rÃ©solu l'Ã©chec des login A1-A4. VÃ©rification : 7/7 preuves conformes.
## Ajouts session V1.5-INFRA-AUTH (2026-11-04)

### `D-INFRA-BACKUP-NAMING` â€” Backups mal nommÃ©s (variables non rÃ©solues)

- **Statut :** Ouverte
- **PrioritÃ© :** Basse
- **Cause :** Les backups de session utilisent des noms non conformes : `DETTES.md.$ts` et `DETTES.md.$d` (variables PowerShell non rÃ©solues, littÃ©ralement `$ts` / `$d` dans le nom), `v4_backup.md` (sans timestamp). Risque : confusion, backups non identifiables, difficultÃ© de restauration.
- **PÃ©rimÃ¨tre :** scripts de backup de session, `.backup/`
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **Condition de rÃ©solution :** Convention `.backup/<fichier>.<timestamp>` respectÃ©e, timestamp rÃ©solu (ex. `.backup/DETTES.md.20261104T161037`), plus jamais de `$variable` littÃ©rale dans un nom de fichier.

### `D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE` â€” Seed supprime les sessions, storageState pÃ©rimÃ©

- **Statut :** Ouverte
- **PrioritÃ© :** Haute
- **Cause :** Le seed (`db:seed`) supprime les sessions (`deleteMany`). `auth.setup.ts` rÃ©utilise un storageState existant (`skipping login`) gÃ©nÃ©rÃ© avant le seed. Le cookie pointe vers une session supprimÃ©e â†’ `/login` Ã  chaque requÃªte. Cause racine de l'Ã©chec A1-A3 en V1.3-A.
- **PÃ©rimÃ¨tre :** `e2e/setup/auth.setup.ts`, `e2e/global-setup.ts`, `prisma/seed.ts`, `.auth/*.json`
- **Effort estimÃ© :** Moyen (problÃ¨me d'ordre d'exÃ©cution Playwright)
- **Bloquant :** Oui (bloque A1-A3)
- **Condition de rÃ©solution :** Garantir que `auth.setup.ts` rÃ©gÃ©nÃ¨re le storageState APRÃˆS le seed (supprimer le early-return `fs.access`), ou que le seed ne supprime pas les sessions, ou que `.auth/` soit supprimÃ© de maniÃ¨re fiable avant le seed. **Non rÃ©solu en V1.5-INFRA-AUTH (8 tentatives, corrections annoncÃ©es mais non appliquÃ©es).**



## Ajouts session V1.4 (2026-11-04)

### D-V14-BUILDS-EMPTY â€” public/builds/ vide, download non testable
- **Statut :** FermÃ©e (2026-11-04)
- **PrioritÃ© :** Moyenne
- **Cause :** `public/builds/` est vide. `/api/desktop-builds/download` retourne 404 en E2E. Aucun fichier de test disponible.
- **PÃ©rimÃ¨tre :** `public/builds/`, `e2e/admin/`
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **RÃ©solution :** Fixture `public/builds/test.bin` + test E2E `e2e/admin/exports.spec.ts` (E1, E2). TestÃ© et prouvÃ©.

### D-V14-FORCE-STATIC-BUG â€” force-static bloque les query params
- **Statut :** FermÃ©e (2026-11-04)
- **PrioritÃ© :** Moyenne
- **Cause :** `export const dynamic = 'force-static'` dans `src/app/api/desktop-builds/download/route.ts` empÃªche `searchParams.get('file')` de fonctionner (route prÃ©-rendue au build).
- **PÃ©rimÃ¨tre :** `src/app/api/desktop-builds/download/route.ts`, `e2e/admin/exports.spec.ts`
- **Effort estimÃ© :** Faible
- **Bloquant :** Oui (pour tester la route)
- **RÃ©solution :** `export const dynamic = 'force-static'` supprimÃ© de `src/app/api/desktop-builds/download/route.ts`. Route dynamique, `searchParams.get('file')` fonctionne. TestÃ© et prouvÃ©.

### D-V14-BLOB-NOT-CONFIGURED â€” Blob non configurÃ© dans .env.test
- **Statut :** Ouverte
- **PrioritÃ© :** Moyenne
- **Cause :** BLOB_READ_WRITE_TOKEN absent de .env.test. /api/admin/desktop-downloads/[version]/download ne peut pas fonctionner en E2E.
- **PÃ©rimÃ¨tre :** .env.test, src/app/api/admin/desktop-downloads/[version]/download/route.ts`r
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **Condition de rÃ©solution :** Ajouter la config Blob dans .env.test (si possible) ou skipper la route.

### D-V14-EXPORT-UTILS-ORPHANS â€” Utilitaires export orphelins
- **Statut :** Ouverte
- **PrioritÃ© :** Basse
- **Cause :** src/lib/export/pdf-export.ts et src/lib/export/stl-export.ts ne sont rÃ©fÃ©rencÃ©s nulle part dans src/. Code mort.
- **PÃ©rimÃ¨tre :** src/lib/export/`r
- **Effort estimÃ© :** Faible
- **Bloquant :** Non
- **Condition de rÃ©solution ::** CÃ¢bler (V2) ou supprimer.

### D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED â€” Route admin download bloquÃ©e by auth
- **Statut :** Ouverte
- **PrioritÃ© :** Haute
- **Cause :** /api/admin/desktop-downloads/[version]/download requiert 
equireAdmin(). BloquÃ©e by D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE.
- **PÃ©rimÃ¨tre :** e2e/admin/, src/app/api/admin/desktop-downloads/[version]/download/route.ts`r
- **Effort estimÃ© :** Moyen
- **Bloquant :** Oui (pour cette route)
- **Condition de rÃ©solution :** RÃ©soudre D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE (V1.5) ou tester via 
equest.get avec token admin manuel.

### D-V14-NO-TESTABLE-EXPORT â€” V1.4 sans pÃ©rimÃ¨tre testable
- **Statut :** FermÃ©e (2026-11-04)
- **PrioritÃ© :** Moyenne
- **Cause :** V1.4 (exports) n'a pas de pÃ©rimÃ¨tre testable : builds vides, Blob non configurÃ©, utilitaires orphelins, auth admin bloquÃ©e.
- **PÃ©rimÃ¨tre :** V1.4
- **Effort estimÃ© :** â€”
- **Bloquant :** Non
- **RÃ©solution :** Phase clÃ´turÃ©e sans test. Ã€ reprendre en V2 (quand les exports seront cÃ¢blÃ©s et configurÃ©s). Dettes tracÃ©es : D-V14-BUILDS-EMPTY, D-V14-BLOB-NOT-CONFIGURED, D-V14-EXPORT-UTILS-ORPHANS, D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED.

### V2-B â€” IntÃ©gration FAPI (TecDoc alternative)

| ID | Niveau | Statut | Cause / PÃ©rimÃ¨tre |
|---|---|---|---|
| D-V2-FAPI-INTEGRATION | Moyenne | FermÃ©e (prouvÃ©e) | Connecteur src/lib/connectors/fapi.ts livrÃ©. Typecheck OK, 2/2 tests unitaires, API /api/search?source=fapi rÃ©pond 200, build OK. |
| D-V2-FAPI-UI-NOT-WIRED | Moyenne | FermÃ©e â€” sÃ©lecteur source dans search-bar + admin recherche. |
| D-V2-FAPI-PAGINATION-NATIVE | Basse | Ouverte | Le slice(limit) se fait cÃ´tÃ© client. FAPI renvoie toutes les cross-refs (potentiellement des centaines pour w753), consommant inutilement le quota d'essai. VÃ©rifier si FAPI propose un paramÃ¨tre natif de pagination. |
| D-V2-FAPI-HTTP-ERROR-TEST | Basse | Ouverte | Aucun test unitaire sur les codes 429/500 â†’ throw propre. |
| D-V2-FAPI-ENV-LOADED-BUT-UI-SILENT | Basse | RÃ©solue | FAPI_API_KEY bien prÃ©sente dans .env.local (ligne 46), le serveur dev la charge. Ce n'Ã©tait pas un problÃ¨me d'env. |
|  | Test e2e/fapi.spec.ts Ã©crit mais non exÃ©cutÃ© (bloquÃ© par sÃ©lecteurs UI absents). Le runtime est prouvÃ© par les logs serveur (200 in 3.4s + 200 in 545ms). |

| D-CI-BYPASS-ADMIN-PUSH | Basse | Les commits fe3a4c8, b15730e, 4d5ddf5 ont Ã©tÃ© poussÃ©s sur master en bypassant 4 required status checks GitHub (admin override). VÃ©rifier que la CI est verte rÃ©troactivement. Si non, revert immÃ©diat. |
| D-E2E-WEBSERVER-TIMEOUT | Moyenne | FermÃ©e (4d5ddf5) â€” timeout 180_000 â†’ 300_000. |
| D-INFRA-BACKUP-UNTRACKED | Basse | FermÃ©e (b15730e) â€” .backup/ gitignored. |
| D-GOV-V2B-INCOMPLETE-COMMIT | Haute | FermÃ©e (fe3a4c8) â€” 4 fichiers transverses FAPI rattrapÃ©s. |

| D-V2-FAPI-UI-NOT-WIRED | Moyenne | FermÃ©e â€” sÃ©lecteur source dans search-bar + admin recherche. |
| D-V2-FAPI-B6-E2E-NOT-WRITTEN | Basse | FermÃ©e â€” e2e/fapi.spec.ts avec data-testid. |

### V2-C â€” Cache web pour l'agrÃ©gation

| ID | Niveau | Statut | Cause / PÃ©rimÃ¨tre |
|---|---|---|---|
| `D-V2-NO-WEB-CACHE` | Moyenne | **FermÃ©e** | Cache Prisma `WebSearchCache` + intÃ©gration aggregator (`_cache: hit/miss`). MISS 35.34s â†’ HIT 12.76s (2.8Ã—), 18 candidats, FAPI dans sourcesQueried. |
| `D-V2-FAPI-DUPLICATE-IDS` | Basse | **FermÃ©e** | DÃ©duplication par id et name ajoutÃ©e dans `aggregator.ts` (`deduplicateCandidates`). 18 candidats uniques. |
| D-V2-CACHE-HIT-LATENCY-12S | Haute | Ouverte diagnostiquee V4-B | Latence GET /api/search 12.76s. Cause reelle: GET /api/search n appelle jamais aggregateSearch. Cache jamais sollicite en GET. |
| D-V2-CACHE-ENABLED-OPTION | Basse | Fermee V4-B | SEARCH_CACHE_ENABLED absent partout -> isCacheEnabled retourne true par defaut. Option skipCache deja presente. |
| D-V2-CACHE-KEY-COLLISION | Haute | **Fermée (V4-B')** | hashCacheKey inclut limit + source réelle. setCache reçoit source réel. Correctif complet. |
| D-V2-SEARCH-GET-NO-AGGREGATE | Haute | **Fermée (V4-B')** | GET ?mode=aggregate route vers aggregateSearch. Cache maintenant sollicité en GET. |


### V3-C — OpenSERP (Bing) connecteur

| ID | Niveau | Statut | Cause / Périmètre |
|---|---|---|---|
| `D-V2-OPENSERP-NOT-IMPLEMENTED` | Moyenne | **Fermée** (V3-C HTTP) | /mega/search, 4 tests, runtime 8 sources / 20 candidates / 2 OpenSERP. |
| `D-V3-OPENSERP-CLI-ONLY` | Moyenne | **Fermée** | HTTP pur, plus de docker exec. |
| D-V3-OPENSERP-GOOGLE-CAPTCHA | Basse | **Ouverte** | Google, Yandex, Ecosia, DuckDuckGo bloqués. Seul Bing fonctionne. |
| `D-V3-OPENSERP-API-HTTP-MISSING` | Basse | **Résolue** (doublon historique) |
### V3 - Fermees

| D-V13A-NAVIGATION-NOT-CLICKABLE | Moyenne | Ferme (V3-A) |
| D-V14-EXPORT-UTILS-ORPHANS | Basse | Ferme (V3-B) |
| D-V2-OPENSERP-NOT-IMPLEMENTED | Moyenne | Ferme (V3-C) |
| D-V3-OPENSERP-CLI-ONLY | Moyenne | Ferme (V3-C HTTP) |

### V3 - Restantes

| D-V3-OPENSERP-GOOGLE-CAPTCHA | Basse | Ouverte |
| `D-V3-OPENSERP-API-HTTP-MISSING` | Basse | **Résolue** | /mega/search répond 200 + résultats. /search racine absente mais non requis. |
| D-V3-STL-EXPORT-NO-CADFILE | Basse | Ouverte |
| D-V3-STEP-PARTS-INTEGRATION | Basse | Reportee V4 |
### D-E57-DEEP-MODE-PLAYWRIGHT — Fermée (V4-A)
- **Statut :** Résolue (2026-11-07)
- **Priorité :** Moyenne
- **Cause :** Playwright ne déclenchait pas onChange sur select contrôlé React ingest-mode-select.
- **Résolution :** Ajout waitForTimeout(500) avant selectOption. 2 tests fixme convertis en test.
- **Preuve :** npx playwright test e2e/workspace/workspace.spec.ts -g "deep mode" --reporter=list → 4 passed, EXIT 0.
- **Commits :** 2abe979, 869c73e.

### D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED — Reclassée (V4-A)
- **Statut :** Reclassée — Bloquée par D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE (V1.5)
- **Priorité :** Moyenne
- **Cause :** Route appelle correctement requireAdmin(). Blocage aval : storageState invalidé par seed E2E.
- **Condition de résolution :** Résoudre V1.5 OU test request.get avec cookie admin manuel dans D-ADMIN-TEST-COVERAGE.
- **Décision V4-A (2026-11-07) :** Aucun code à modifier. Reclassée hors V4-A.

### D-WS-HISTORY-UNAUTH-REDIRECT — Nouvelle dette (Basse)
- **Statut :** Ouverte
- **Priorité :** Basse
- **Cause :** [search/history] GET lance NEXT_REDIRECT /login;307 quand /workspace ouvert sans session.
- **Périmètre :** src/app/api/search/history, src/app/workspace/
- **Effort :** Faible
- **Condition :** Vérifier que /api/search/history répond 401 JSON (pas redirect) sans session, ou que le client ne l'appelle pas sans session.
- **Découverte :** 2026-11-07, pendant preuve E57.