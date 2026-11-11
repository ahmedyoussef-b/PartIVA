# DETTES ACTIVES — PartIVA

**Dernière mise à jour :** 2026-11-11
**Source :** `PROMPT DE PASSATION — Superviseur IA Externe — v12` §3 (2026-11-10)
**Statut :** Registre actif — dettes non résolues uniquement (charte §10).

> **Garde-fou documentaire.** Ce registre est la **liste arbitrée** des dettes actives, alignée sur v10 §3. Les dettes non listées dans v10 ne sont **pas** portées ici : elles sont considérées comme non suivies. L'historique complet reste consultable via `git log -- docs/etat/DETTES.md` et `git show <commit>:docs/etat/DETTES.md`. Les **actions critiques** (non dettes) figurent dans `ETAT_COURANT.md` §« Actions critiques », pas dans ce registre (C1a).

---

## Haute

### `D-E24-E2E-TIMEOUT-SOURCES` — Timeout des tests `source=all`

- **Statut :** Active
- **Cause :** `POST /api/search {source:'all'}` interroge des sources externes non configurées (TraceParts, TecDoc, OpenSERP), ce qui prend ~32 s > timeout Playwright de 30 s.
- **Périmètre :** `e2e/admin/aggregation-tecdoc.spec.ts`, `e2e/admin/performance.spec.ts`, `playwright.config.ts`.
- **Effort estimé :** Faible (augmenter le timeout à 60 s, ou désactiver les sources non configurées en CI).
- **Bloquant :** Non (2 tests rouges sur 52 dans le projet `admin`).
- **Condition de résolution :** les 2 tests `source=all` passent en CI.

---

## Moyenne

### `D-ADMIN-TEST-COVERAGE` — Pas de tests E2E admin dédiés

- **Statut :** Active
- **Cause :** absence de couverture E2E dédiée au projet `admin` (au-delà des tests existants).
- **Périmètre :** `e2e/admin/`.
- **Effort estimé :** Moyen.
- **Bloquant :** Non.
- **Condition de résolution :** couverture E2E admin dédiée en place, tests verts en CI.

### `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` — Route admin download bloquée par auth

- **Statut :** Active (bloquée V1.5)
- **Cause :** `/api/admin/desktop-downloads/[version]/download` requiert `requireAdmin()`. Bloquée par `D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE` (V1.5).
- **Périmètre :** `e2e/admin/`, `src/app/api/admin/desktop-downloads/[version]/download/route.ts`.
- **Effort estimé :** Moyen.
- **Bloquant :** Oui (pour cette route).
- **Condition de résolution :** résoudre V1.5, ou tester via `request.get` avec cookie admin manuel dans `D-ADMIN-TEST-COVERAGE`.

### `D-TRACEPARTS-CREDENTIALS` — TraceParts en mode mock (substitut documenté)

- **Statut :** Active
- **Cause :** pas de credentials `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY`. Le connecteur fonctionne en `mode: 'mock'` (3 produits statiques dans `src/lib/data/traceparts.ts`). L'agrégateur émet un warning `SOURCE_MOCK` structuré. L'UI affiche un badge `Mock`.
- **Substitut en place :** le connecteur CADENAS (`industrial-catalog.ts`) sert de source réelle-ish (dataset embarqué, 11 items).
- **Périmètre :** `src/lib/data/traceparts.ts`, `src/lib/connectors/traceparts.ts`.
- **Effort estimé :** Moyen.
- **Bloquant :** Non.
- **Condition de résolution :** obtenir les credentials TraceParts, passer `traceparts.ts` en `mode: 'real'`, remplacer le mock statique par l'API REST v3 réelle, tester unitaire + runtime, retirer le badge `Mock`.


### `D-MIGRATION-CHECKSUM-MANUAL` — Checksum migration V7-D recalculé manuellement

- **Statut :** Active (documentée)
- **Cause :** la migration `20261110215229_v7d_cadfile_request_link` a été trackée manuellement en DB (`_prisma_migrations.checksum`) lors de V7-D-2.1-fix3, puis corrigée en V7-D-2.9-fix. Le checksum est désormais aligné sur le SHA256 réel du fichier (`82d167a2...`).
- **Action future :** tout nouveau dev qui clone le repo doit lancer `migrate dev` (qui recalculera le checksum si besoin) — pas de fix manuel nécessaire.
- **Condition de résolution :** documenté pour traçabilité (pas d'action corrective requise).

### `D-MIGRATION-FK-ONUPDATE` — Drift FK cad_files_requestId_fkey (résolue)

- **Statut :** Résolue (V7-D-2.9-fix)
- **Cause :** la FK `cad_files_requestId_fkey` avait été appliquée sans `ON UPDATE CASCADE` (V7-D-2.1-fix2, application manuelle), puis le fichier `migration.sql` commité en V7-D-2.7 contenait `ON UPDATE CASCADE`. Drift corrigé (DB alignée sur fichier).
- **Condition de résolution :** dette fermée.
---

## Basse

### `D-V2-CACHE-HIT-LATENCY-12S` — Mesure POST HIT à faire

- **Statut :** Active
- **Cause :** latence `GET /api/search` 12,76 s. Cause réelle diagnostiquée en V4-B : `GET /api/search` n'appelle jamais `aggregateSearch`, le cache n'est jamais sollicité en GET. Le correctif V4-B (`D-V2-SEARCH-GET-NO-AGGREGATE`) a routé GET vers `aggregateSearch`, mais la mesure POST HIT reste à faire.
- **Périmètre :** `src/app/api/search/route.ts`, `src/lib/connectors/aggregator.ts`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** mesure POST HIT documentée (latence cache validée).

### `D-WS-HISTORY-UNAUTH-REDIRECT` — `[search/history]` redirige `/login`

- **Statut :** Active
- **Cause :** `[search/history]` GET lance `NEXT_REDIRECT /login;307` quand `/workspace` est ouvert sans session.
- **Périmètre :** `src/app/api/search/history`, `src/app/workspace/`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** vérifier que `/api/search/history` répond `401 JSON` (pas redirect) sans session, ou que le client ne l'appelle pas sans session.

### `D-CAMPAGNE-ENCODING` — Mojibake historique (config VSCode appliquée)

- **Statut :** Active
- **Cause :** notes du registre mal encodées (UTF-8). Config VSCode appliquée ; le mojibake résiduel dans les fichiers historiques n'est pas corrigé.
- **Périmètre :** `docs/etat/`, fichiers historiques.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** encodage UTF-8 sans BOM vérifié sur les fichiers concernés, mojibake corrigé ou documenté comme historique.

### `D-GIT-BRANCH-HYGIENE` — 14 branches locales résiduelles

- **Statut :** Active
- **Cause :** branches issues de phases closes (V3, V4-A, V4-B, V5, V6, V8) non supprimées après merge, plus 2 branches de backup (`backup-dfb2dcf`, `backup-pre-rebase-e16`) et une branche au nom non conventionnel (`bonsoir`). Branche `refactor/v7-clean-ui` incluse (obsolète, mergée dans `master` et `origin/master`, aucun commit en avance — vérifié en 0-C-bis).
- **Périmètre :** `git branch` local (et vérification `origin` correspondant).
- **Effort estimé :** Faible (audit + suppression sélective, une session).
- **Bloquant :** Non.
- **Condition de résolution :** chaque branche est soit supprimée (si mergée et sans usage), soit documentée comme conservée avec motif. Preuve : `git branch` final + justification par branche.


### `D-PRISMA-MIGRATION-DRIFT-HISTORIQUE` — Lignes fantômes `_prisma_migrations` (add_analysis_data_to_part)

- **Statut :** Active
- **Cause :** 3 lignes dans `_prisma_migrations` pour la migration `20261101173317_add_analysis_data_to_part` (dont 2 avec finished_at: null, applied_steps_count: 0). **Pré-existant à V7-D**, non causé par V7-D.
- **Action future :** nettoyage manuel des lignes fantômes (hors scope V7).
- **Condition de résolution :** lignes fantômes supprimées ou documentées comme acceptées.

### `D-PRISMA-FORMAT-DIFF` — Bruit diff `prisma format` sur `schema.prisma`

- **Statut :** Active
- **Cause :** `prisma format` a réécrit intégralement `prisma/schema.prisma` (bruit diff dans le commit V7-D `7b2bcdc`, +1309/-684).
- **Action future :** commit séparé `chore(prisma): format` si le bruit devient gênant. **Non bloquant.**
- **Condition de résolution :** diff normalisé ou accepté.

### `D-ESLINT-IGNORE-DEPRECATED` — `.eslintignore` déprécié

- **Statut :** Active
- **Cause :** warning `.eslintignore` déprécié (Prisma 7 / ESLint 9). **Pré-existant**, non bloquant.
- **Action future :** migrer vers `eslint.config.mjs` `ignores` quand le temps le permettra.
- **Condition de résolution :** configuration ESLint migrée, warning absent.

### `D-CADFILE-DELETE` — Suppression fichier CAO import admin absente

- **Statut :** Active
- **Cause :** pas de bouton « supprimer » un fichier CAO dans `/admin/demandes/[id]/import-cad`.
- **Action future :** ajouter une Server Action `deleteCadFile` + bouton. **V7-E+.**
- **Condition de résolution :** suppression disponible et vérifiée.

### `D-CADFILE-XOR-GUARD` — Garde-fou XOR projectId/requestId absent

- **Statut :** Active
- **Cause :** pas de garde-fou Zod si un futur code passe `projectId` ET `requestId` simultanément à `prisma.cadFile.create`.
- **Action future :** ajouter `.refine()` dans le schéma Zod de `importCad` et `addCadFile`. **V7-E+.**
- **Condition de résolution :** garde-fou en place et testé.

### `D-PARTTEMPLATE-UI` — Pas d'UI de gestion des PartTemplates
- **Statut :** Active
- **Cause :** V7-F a créé les tables + Server Actions CRUD, mais pas d'UI (backend-only).
- **Périmètre :** `src/app/admin/part-templates/`.
- **Effort estimé :** Moyen.
- **Action future :** créer une page admin `/admin/part-templates` (liste + création + édition). **V7-H/V8.**
- **Condition de résolution :** UI disponible et testée.

### `D-RECONSTRUCT-UI` — Pas d'UI de reconstruction CAO
- **Statut :** Active
- **Cause :** V7-G a créé `reconstructFromCad` (backend-only), pas d'UI.
- **Périmètre :** `src/app/admin/demandes/[id]/import-cad/` (ou page dédiée).
- **Effort estimé :** Moyen.
- **Action future :** ajouter un formulaire (dimensions + matériau) qui appelle `reconstructFromCad`. **V7-H/V8.**
- **Condition de résolution :** UI disponible et testée.

### `D-RECONSTRUCT-PHOTOGRAMMETRY` — Photogrammétrie reportée V8
- **Statut :** Active
- **Cause :** décision (j)=A — pas de photogrammétrie en V7. Reconstruction uniquement à partir de CAO + mesures.
- **Périmètre :** V8.
- **Effort estimé :** Élevé (intégration colmap/meshroom).
- **Action future :** V8.
- **Condition de résolution :** pipeline photogrammétrie intégré et testé.

---

## Résolues

### `D-ENV-SHADOW-DB` — Branche Neon shadow configurée

- **Statut :** Résolue (V7-D-2.8-fix)
- **Cause :** `SHADOW_DATABASE_URL` manquante empêchait `migrate dev`.
- **Résolution :** branche Neon shadow créée (URL directe, sans -pooler, même projet ep-flat-paper-b221l3fy). `migrate dev` fonctionnel.
---

## Notes

- **Registre actif uniquement** (charte §10). Les dettes résolues ne figurent pas ici.
- **Actions critiques (non dettes) :** voir `ETAT_COURANT.md` §« Actions critiques » (mot de passe admin, hook BOM, `$env:ADMIN_PASSWORD`).
- **Source :** v10 §3 (2026-11-10). Toute modification ultérieure nécessite un arbitrage du coordinateur.
- **Historique :** `git log -- docs/etat/DETTES.md` + `git show <commit>:docs/etat/DETTES.md`.
