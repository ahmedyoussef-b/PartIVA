# ÉTAT COURANT — PartIVA

**Dernière mise à jour :** 2026-10-22
**Commit HEAD :** `b99b634` (E27 — corrections non commitées en attente de validation)
**Phase en cours :** E27 — correction du bug E2E persistant (diagnostic + correction validés)
**Statut du projet :** En cours

## 1. Objectif actuel

Fiabiliser la CI E2E : le job `e2e` échouait depuis 2 jours sur `POST /api/auth/sign-in/email`.

**E27 — diagnostic + correction (2026-10-22).** Cause racine établie avec preuve : divergence des variables
d'environnement entre l'étape `prisma db seed` et l'étape `playwright test` (le seed basculait sur sa branche
mock et ne créait pas les comptes `E2E_*`), aggravée par la limite de taux Better Auth (3 sign-in / 10 s
pour ~104 sign-ins par run), par deux régressions de compilation dans l'arbre de travail (TDZ + redéclarations
dans `prisma/seed.ts`, YAML dupliqué dans `ci.yml`) et par une régression de formatage Prettier qui faisait
échouer le job `lint` de la CI avant le job `e2e`.

Rapport complet : `docs/sessions/rapports/SESSION-2026-10-22-E27-DIAGNOSTIC-E2E.md`.

Validation locale après correction : `tsc --noEmit` exit 0, `npm run lint` exit 0, `npm run format:check` exit 0,
`npm run build` OK, `npm run db:seed` OK, **336 tests passés / 5 échecs (pré-existants, sans rapport avec l'auth)**
contre 159 passés / 17 échecs / 81 non exécutés auparavant. **Aucun commit effectué à ce stade.**

## 2. Architecture et choix applicables

- **Stack :** Next.js 16.4.0, React 19.3.0, Prisma 7.10.0, TypeScript 5.9.3, Tailwind 4.3.3.
- **Base de données :** Neon (PostgreSQL, pgvector).
- **Desktop :** Tauri (export statique).
- **Tests :** Playwright (E2E), ESLint, Prettier, TypeScript.
- **Structure documentaire :** Réforme E26 terminée (5 commits).

## 3. Travaux en cours

- **E27** (CI, ⏳) : Corrections du bug E2E **appliquées et validées localement**, non commitées — en attente du commit atomique (§7.8 du rapport E27).

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

- **ID Tâche :** `E27` — commit atomique des 3 correctifs (§7.8 du rapport E27), puis relance du job `e2e`.
- **Point de vigilance :** le log du nouveau run CI ne doit **pas** contenir `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock` — sa présence signalerait que les secrets GitHub ne sont pas alignés sur `e2e/fixtures/users.ts`.

## 7. Notes

- `CONTEXT.md` (ancien) est archivé dans `docs/archive/CONTEXT.md`.
- `DEBT.md` (ancien) a été scindé en `DETTES.md` (actives) + archive (clôturées) en E3-S2, puis archivé dans `docs/archive/DEBT.md`.
