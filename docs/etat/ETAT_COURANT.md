# ÉTAT COURANT — PartIVA

**Dernière mise à jour :** 2026-10-22
**Commit HEAD :** `1cc5733` (E27 — corrections validées en CI, rapport `1cc5733` intégré)
**Phase en cours :** E27 — correction du bug E2E persistant (diagnostic + correction validés)
**Statut du projet :** En cours

## 1. Objectif actuel

Fiabiliser la CI E2E : le job `e2e` échouait depuis 2 jours sur `POST /api/auth/sign-in/email`.

**E27 — diagnostic + correction (2026-10-22).** Cause racine établie avec preuve : divergence des variables
d'environnement entre l'étape `prisma db seed` et l'étape `playwright test` (le seed basculait sur sa branche
mock et ne créait pas les comptes `E2E_*`), aggravée par la limite de taux Better Auth (3 sign-in / 10 s
pour ~104 sign-ins par run), par deux régressions de compilation dans l'arbre de travail (TDZ + redéclarations
dans `prisma/seed.ts`, YAML dupliqué dans `ci.yml`), par une régression de formatage Prettier qui faisait
échouer le job `lint` de la CI avant le job `e2e`, et par 2 bloqueurs de CI découverts en observant les logs
des runs (job `build` : 4 routes `[id]` pré-rendues interrogeaient la base ; projet `public` : dépendance non
déclarée à `.auth/admin.json`).

Rapport complet : `docs/sessions/rapports/SESSION-2026-10-22-E27-DIAGNOSTIC-E2E.md`.

**Validation CI (run `39777704765`, commit `5a2ac01`) :**
`ESLint + Prettier` ✅ · `TypeScript` ✅ · `Build` ✅ · `E2E (Playwright)` ❌ **337 passés / 4 échecs / 4 skipped**.
Les 2 lignes de vigilance sont **absentes** : ni branche mock du seed, ni `429` sur `sign-in`.
Les 4 échecs restants sont **pré-existants et sans rapport avec l'authentification** (tests 24, 59, 61, 97).
Progression : 159 passés / 17 échecs / 81 non exécutés (run `59fdba2`) → **337 passés / 4 échecs**.

**Le job E2E reste non vert** à cause des 4 échecs pré-existants : `E2E (Playwright)` ne doit donc pas être
ajouté aux checks requis tant qu'ils ne sont pas corrigés.

## 2. Architecture et choix applicables

- **Stack :** Next.js 16.4.0, React 19.3.0, Prisma 7.10.0, TypeScript 5.9.3, Tailwind 4.3.3.
- **Base de données :** Neon (PostgreSQL, pgvector).
- **Desktop :** Tauri (export statique).
- **Tests :** Playwright (E2E), ESLint, Prettier, TypeScript.
- **Structure documentaire :** Réforme E26 terminée (5 commits).

## 3. Travaux en cours

- **E27** (CI, ✅ terminé) : correctifs poussés (`a75ecd9`, `a8a1d59`, `c980e2d`, `7159dfe`, `3d7664d`, `5a2ac01`, `1cc5733` — rapport) et validés en CI (run `39777704765`). Jobs `lint` / `typecheck` / `build` verts ; job `e2e` à 337/345.
- **E27-bis** (CI, ✅ terminé) : `required_status_checks` activés sur `master` — **uniquement** sur `ESLint + Prettier`, `TypeScript`, `Build`. **E2E (Playwright) exclu** (4 échecs pré-existants — `D-E27-E2E-RESIDUAL`). `enforce_admins` non modifié (état actuel : `false`).

## 4. Blocages

- **D-E23-PRISMA-POOLER-TIMEOUT :** Un seul build vert. La dette reste active jusqu'à 2-3 runs consécutifs.
- **D-E27-E2E-PREEXISTING-FAILURES :** 4 tests E2E échouaient déjà avant E27 et restent en échec, sans rapport avec l'authentification — `api.spec.ts:180` (liste de tables du manifest desktop codée en dur), `part-attachments.spec.ts:58` et `:100` (configuration Cloudinary absente en local), `part-versions.spec.ts:53` (hypothèse de données). À traiter dans une session dédiée.
- **D-E22-KPI-MOCK-DATA :** Données KPI factices en attendant un endpoint d'agrégats.
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

- **ID Tâche :** `E27-bis` — activer `required_status_checks` sur `master` (3 checks de base), puis traiter `D-E27-E2E-RESIDUAL` (4 échecs pré-existants) avant d'envisager d'exiger le job `E2E (Playwright)`.
- **ID Tâche proposé :** `E28` — correction des 4 échecs E2E pré-existants (`D-E27-E2E-RESIDUAL`) avant réactivation éventuelle de `E2E (Playwright)` en check requis.
- **Point de vigilance CI :** le log du run ne doit **pas** contenir `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock` — sa présence signalerait que les secrets GitHub ne sont pas alignés sur `e2e/fixtures/users.ts`.
- **Opérationnel :** la base Neon est partagée CI ↔ local. Après chaque run CI, rejouer `npm run db:seed` en local avant toute exécution E2E locale (les identifiants diffèrent).

## 7. Notes

- `CONTEXT.md` (ancien) est archivé dans `docs/archive/CONTEXT.md`.
- `DEBT.md` (ancien) a été scindé en `DETTES.md` (actives) + archive (clôturées) en E3-S2, puis archivé dans `docs/archive/DEBT.md`.
