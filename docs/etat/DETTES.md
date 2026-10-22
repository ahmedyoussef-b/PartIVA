# DETTES ACTIVES — PartIVA

**Dernière mise à jour :** 2026-10-22
**Source :** Scission de `DEBT.md` (E3-S2)
**Statut :** Dettes non résolues uniquement

## Moyenne (2)

### `D-E23-PRISMA-POOLER-TIMEOUT` — Timeout Prisma adapter-pg sur pooler Neon

- **Statut :** Active
- **Cause :** `adapter-pg` de Prisma 7 décroche sur le endpoint pooler Neon avec `channel_binding=require`. Le raw `pg` répond en ~640 ms sur la même URL.
- **Périmètre :** `src/lib/prisma.ts`, `prisma/schema.prisma`, CI/CD.
- **Effort estimé :** Faible (1 run de build valide à confirmer).
- **Bloquant :** Non (bloque la validation du build complet et l'exécution E2E).
- **Condition de résolution :** 2 à 3 builds consécutifs verts sur le pooler Neon.
- **Prochaine session :** Bloquée par `D-E26-CI-BRANCH-MISMATCH` (aucun run CI disponible pour vérifier les builds).

### `D-E24-E2E-TIMEOUT-SOURCES` — Timeout des tests `source=all`

- **Statut :** Active
- **Cause :** `POST /api/search {source:'all'}` interroge des sources externes non configurées (TraceParts, TecDoc, OpenSERP), ce qui prend ~32.8s > timeout Playwright de 30s.
- **Périmètre :** `e2e/admin/aggregation-tecdoc.spec.ts`, `e2e/admin/performance.spec.ts`, `playwright.config.ts`.
- **Effort estimé :** Faible (augmenter le timeout à 60s, ou désactiver les sources non configurées en CI).
- **Bloquant :** Non (2 tests rouges sur 52 dans le projet `admin`).
- **Condition de résolution :** les 2 tests `source=all` passent en CI.
- **Prochaine session :** Bloquée par `D-E26-CI-BRANCH-MISMATCH` (les tests `source=all` ne peuvent être exécutés en CI).

### `D-E27-E2E-RESIDUAL` - 5 echecs E2E pre-existants (hors authentification)
- **Note E27-bis :** Checks CI de base (`ESLint + Prettier`, `TypeScript`, `Build`) activés sur `master` via `required_status_checks` — `E2E (Playwright)` exclu (résiduels D-E27-E2E-RESIDUAL).

- **Statut :** Active
- **Cause :** 5 tests echouent independamment de l'authentification E2E (resolue en E27). Identiques au run de reference, sans regression :
  1. `e2e/api.spec.ts:180` (#24) - liste de tables du manifest desktop codee en dur (derive du manifest).
  2. `e2e/part-attachments.spec.ts:58` et `:100` (#59, #61) - configuration Cloudinary absente en local/CI.
  3. `e2e/part-versions.spec.ts:53` (#97) - hypothese de donnees non verifiee.
  4. 1 artefact Windows - `execFile` sous Windows (environnement d'execution).
- **Perimetre :** `e2e/api.spec.ts`, `e2e/part-attachments.spec.ts`, `e2e/part-versions.spec.ts`, environnement Windows.
- **Effort estime :** Moyen (1 a 2 sessions).
- **Bloquant :** Non pour la cloture de `D-E26-CI-BRANCH-MISMATCH` (auth resolue, 336/341 passes), mais empeche un run E2E entierement vert.
- **Condition de resolution :** les 5 tests passent en CI sur `master`.
- **Prochaine session :** E27 (session dediee, distincte de la cloture E27 auth).

## Faible (3)

### `D-E22-KPI-MOCK-DATA` — Données KPI factices

- **Statut :** Active
- **Cause :** Les KPI du dashboard utilisent des données en dur (`+ 2`, `+ 184 réf.`, `74.2%`) en attendant un endpoint d'agrégats.
- **Périmètre :** `src/app/admin/dashboard/dashboard-client.tsx`, `src/app/api/dashboard/route.ts`.
- **Effort estimé :** Moyen.
- **Bloquant :** Non.
- **Condition de résolution :** l'endpoint d'agrégats existe et alimente le dashboard.
- **Prochaine session :** E27 (à cadrer).

### `D-E22-PART-STATUS-BADGE` — Composant mixte Server/Client

- **Statut :** Active
- **Cause :** `PartStatusBadge` est un Server Component qui rend un composant client.
- **Périmètre :** `src/components/part-status-badge.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** le composant est entièrement client ou entièrement serveur, sans import du namespace Prisma *browser* dans le bundle serveur.
- **Prochaine session :** E27 (à cadrer).

### `D-E26-LEGACY-KILOCODE` — Fichier hérité `.kilocode/rules.md`

- **Statut :** Active
- **Cause :** `.kilocode/rules.md` contient 5 références mortes vers `PCT.md` et `SESSION.md` (archivés en E6). Le répertoire `.kilocode/` est un héritage remplacé par `.kilo/`.
- **Périmètre :** `.kilocode/` (suppression recommandée).
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** `.kilocode/rules.md` est supprimé, sans réécriture de son contenu (archivage optional).
- **Prochaine session :** E27 (nettoyage final).

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
- **Statut :** Résolue
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
- **Prochaine session :** E26-bis-C (infrastructure CI).

## Notes

- **Source :** Ce fichier est extrait de `DEBT.md` (E3-S2). Il ne contient que les dettes non résolues.
- **Mise à jour :** Les dettes clôturées doivent être retirées de ce fichier et documentées dans les rapports de session.
- **Archive :** L'historique des dettes clôturées est conservé dans `docs/archive/DEBT_HISTORIQUE.md`.
- **Clôture :** une dette n'est retirée qu'après vérification effective de sa résolution (charte §10).
