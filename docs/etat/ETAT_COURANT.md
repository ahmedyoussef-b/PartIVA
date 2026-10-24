# ÉTAT COURANT — PartIVA

**Dernière mise à jour :** 2026-10-24
**Commit HEAD :** à préciser (commit groupé E32-Bis en cours)
**Phase en cours :** E32-Bis — Remédiation bloquants CI avant commit (terminée)
**Statut du projet :** CI-ready

## 1. Objectif actuel

Phase de stabilisation CI/E2E close.

**E28 (2026-10-23).** Correction des 5 échecs E2E résiduels (`D-E27-E2E-RESIDUAL`) une fois la connectivité Neon rétablie :
- `e2e/api.spec.ts` — liste de tables du manifest desktop alignée sur `SYNC_TABLES` (ajout `material`, `request`).
- `e2e/part-attachments.spec.ts` — upload/DELETE Cloudinary sautés (`test.skip`) quand `CLOUDINARY_API_SECRET` absent (dépendance externe).
- `e2e/part-versions.spec.ts` — `getFirstPartId` sélectionne une part seedée possédant déjà des versions.
Commit `f32555c`.

**E29 (2026-10-23).**
- Commit design E30 : `feat(design): integrate TemplateMonster #535437 visual identity and tech tokens` (`d7265cc`).
- Commit config E2E : `fix(e2e): commit rate-limit disable config for Playwright webServer` (`6116414`).
- Suite E2E complète (345 tests) : **338 passés / 6 sautés / 0 échec fonctionnel**. Le seul échec (`backfill-embeddings.spec.ts`) est pré-existant et dépend d'un service d'embeddings HF local non démarré, sans rapport avec E28/E29.
- `E2E (Playwright)` ajouté aux `required_status_checks` de la branche `master` (côtés `ESLint + Prettier`, `TypeScript`, `Build`, `strict: true`).
- `D-E27-E2E-RESIDUAL` clôturée.

Voir le rapport : `docs/sessions/rapports/SESSION-2026-10-23-E29.md`.

## 2. Architecture et choix applicables

- **Stack :** Next.js 16.4.0, React 19.3.0, Prisma 7.10.0, TypeScript 5.9.3, Tailwind 4.3.3.
- **Base de données :** Neon (PostgreSQL, pgvector).
- **Desktop :** Tauri (export statique).
- **Tests :** Playwright (E2E), ESLint, Prettier, TypeScript.
- **Structure documentaire :** Réforme E26 terminée (5 commits).

## 3. Travaux en cours

- **E27** (CI, ✅ terminé) : correctifs poussés (`a75ecd9`, `a8a1d59`, `c980e2d`, `7159dfe`, `3d7664d`, `5a2ac01`, `1cc5733` — rapport) et validés en CI (run `39777704765`). Jobs `lint` / `typecheck` / `build` verts ; job `e2e` à 337/345.
- **E27-bis** (CI, ✅ terminé) : `required_status_checks` activés sur `master` sur `ESLint + Prettier`, `TypeScript`, `Build` ; `E2E (Playwright)` ajouté en E29. `enforce_admins` non modifié (état actuel : `false`).
- **E28** (E2E résiduels, ✅ terminé) : 5 échecs corrigés (commit `f32555c`).
- **E29** (validation finale + protection branche, ✅ terminé) : suite E2E 338 passés / 6 sautés / 0 échec fonctionnel ; `E2E (Playwright)` en check requis sur `master`.
- **E30** (design, ✅ terminé) : intégration identité visuelle tech + tokens (commit `d7265cc`).
- **E31** (design, ✅ terminé) : travaux de design en attente dans l'arbre de travail — intégrés au commit groupé E32-Bis.
- **E32** (KPI réels, ✅ terminé) : endpoint `/api/dashboard/kpi` alimentant le dashboard avec données réelles ; erreurs ESLint corrigées ; encodage UTF-8 restauré.

## 4. Blocages

- **D-E23-PRISMA-POOLER-TIMEOUT :** Un seul build vert. La dette reste active jusqu'à 2-3 runs consécutifs.
- **D-E22-PART-STATUS-BADGE :** Composant mixte Server/Client (fonctionnel).
- **D-E26-LEGACY-KILOCODE :** Fichier hérité `.kilocode/rules.md` (Faible).
- **D-E14-PRINT-ON-DEMAND :** Acceptée (facteur externe).

## 5. Décisions ayant un effet opérationnel

| ID | Décision | Date |
|---|---|---|
| `D-E16-STEP-1` | `occt-import-js` pour STEP/IGES | E16-R0b |
| `D-E18-AUDIT-1` | Routes API `/api/audit` et `/api/materials` créées | E18-R1 |
| `D-E22-UI-1` | Refonte dashboard (KPI, 3D 2 colonnes) | E22-R1 |
| `D-E23-CRUD-1` | Page `/admin/pieces/nouveau` créée | E23-R1 |
| `D-E24-PRISMA-1` | Pool Prisma explicite + `onPoolError` | E24-R1 |
| `D-E24-E2E-1` | Credentials E2E auto-suffisants | E24-R2 |
| `D-E27-E2E-1` | Le seed et la suite E2E lisent les **mêmes** variables (`E2E_*`) ; le rate limit Better Auth est levé **uniquement** en E2E via `E2E_DISABLE_RATE_LIMIT=true` | E27 |

## 6. Prochaine étape autorisée ou proposée

- Phase de stabilisation CI/E2E close (E27 → E27-bis → E28 → E29 toutes terminées). Aucun nouveau ID Tâche proposé.
- `E2E (Playwright)` est désormais un check requis sur `master` ; il peut être exigé pour toute PR/merge.
- **Point de vigilance CI :** le log du run ne doit **pas** contenir `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock` — sa présence signalerait que les secrets GitHub ne sont pas alignés sur `e2e/fixtures/users.ts`.
- **Opérationnel :** la base Neon est partagée CI ↔ local. Après chaque run CI, rejouer `npm run db:seed` en local avant toute exécution E2E locale (les identifiants diffèrent).

## 7. Notes

- `CONTEXT.md` (ancien) est archivé dans `docs/archive/CONTEXT.md`.
- `DEBT.md` (ancien) a été scindé en `DETTES.md` (actives) + archive (clôturées) en E3-S2, puis archivé dans `docs/archive/DEBT.md`.
