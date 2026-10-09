# ═══════════════════════════════════════════════════════════════
#                    SESSION.md — PARTIVA
#              Journal de bord vivant du projet
# ═══════════════════════════════════════════════════════════════

> ⚠️ **Règle PCT** : Ce fichier est mis à jour **à chaque fin de session** par l'Exécutant (Kilo Code), sous ordre du Superviseur, validé par le Coordinateur.
> Il est **LA source de vérité** au démarrage de chaque nouvelle session.

---

## 📋 MÉTADONNÉES PROJET

| Champ | Valeur |
|---|---|
| **Nom du projet** | PartIVA |
| **Type** | SaaS / Marketplace industriel (B2B) |
| **Stack** | Next.js 16 · TypeScript · Tailwind CSS · Prisma ORM · PostgreSQL · BetterAuth |
| **Repo** | `F:\PartIVA\` (local) |
| **Hosting prévu** | Vercel (web) + auto-hébergé (desktop Tauri) |
| **Phase actuelle** | MVP — Fondation technique (E0) |
| **Dernière session** | E0-S09 (clôturée) |
| **Session en cours** | E0-S10 |
| **Statut global** | E0-S09 clôturée — baseline 110/110 tests E2E verts, push 341f0e4 effectif |

---

## 🎯 ROADMAP GLOBALE (MACRO)

> À ajuster au fil des sessions. Cocher ✅ quand terminé.

- [x] **Phase 1 — Fondations** : sécurisation infra (E0-S01)
- [x] **Phase 1 — Fondations** : setup qualité ESLint/Prettier (E0-S02)
- [x] **Phase 1 — Fondations** : décision version Prisma (E0-S02b)
- [x] **Phase 1 — Fondations** : résorption erreurs ESLint (E0-S02c)
- [x] **Phase 1 — Fondations** : schéma Prisma réel (E0-S03)
- [x] **Phase 1 — Fondations** : migration + seed dev (E0-S04)
- [x] **Phase 1 — Fondations** : auth réelle (E0-S05)
- [x] **Phase 1 — Fondations** : middleware & protection routes (E0-S06)
- [x] **Phase 1 — Fondations** : remplacement mocks par DB réelle (E0-S07)
- [ ] **Phase 1 — Fondations** : migration Next 14 → 16 (E0-S08)
- [ ] **Phase 1 — Fondations** : migration Tailwind 3 → 4 (E0-S09)
- [ ] **Phase 2 — Core Features** : `[à définir]`
- [ ] **Phase 3 — Features secondaires** : `[à définir]`
- [ ] **Phase 4 — Polish & QA** : tests, SEO, perf, a11y
- [ ] **Phase 5 — Déploiement** : prod, monitoring, CI/CD

---

## 📜 HISTORIQUE DES SESSIONS

<!-- ────────────────────────────────────────────────────────── -->
<!-- TEMPLATE À COPIER POUR CHAQUE NOUVELLE SESSION TERMINÉE   -->
<!-- ────────────────────────────────────────────────────────── -->

### Session E0-S01 — Sécurisation infra
- **Date** : `05/10/2026`
- **Objectif** : Nettoyage infra & sécurisation du repo
- **Statut** : ✅ terminée
- **Livrables** :
  - `.gitignore` durci (secrets, Tauri, IDE)
  - Audit historique Git : 4 commits, 0 secret exposé
  - Diagnostic 12 vulnérabilités npm (documenté, reporté)
  - Section "Vulnérabilités reportées" dans SESSION.md
- **Décisions techniques** :
  - Aucune rotation de secrets nécessaire (historique sain)
  - Migrations majeures reportées à sessions dédiées
  - Next.js 14→16 → E0-S08
  - Prisma 7 canary→6 stable → E0-S03b
  - Tailwind 3→4 → E0-S09
- **Problèmes rencontrés** :
  - 12 vulns sans fix safe (dette de versions)
- **Reporté à E0-S02** :
  - Setup qualité (ESLint, Prettier)

<!-- ────────────────────────────────────────────────────────── -->

### Session E0-S02-1 — Setup ESLint
- **Date** : `05/10/2026`
- **Objectif** : Installation et configuration ESLint pour Next 14 + TypeScript
- **Statut** : ✅ terminée
- **Livrables** :
  - `.eslintrc.json` créé
  - `.eslintignore` créé
  - Script `lint:fix` ajouté dans package.json
  - `npm run lint` opérationnel
- **Décisions techniques** :
  - ESLint 8.57.1 + eslint-config-next 14.2.35
  - Configuration legacy JSON compatible Next 14
- **Problèmes rencontrés** :
  - 72 erreurs ESLint détectées (hors scope)
- **Reporté** :
  - E0-S02-2 : Prettier
  - E0-S02c : résorption des 72 erreurs

### Session E0-S02-2 — Setup Prettier
- **Date** : `05/10/2026`
- **Objectif** : Installation et configuration Prettier
- **Statut** : ✅ terminée
- **Livrables** :
  - `.prettierrc.json` créé
  - `.prettierignore` créé
  - Scripts `format` et `format:check` ajoutés
  - `npm run format:check` opérationnel
- **Décisions techniques** :
  - Prettier 3.9.9
  - Configuration: singleQuote, trailingComma all, printWidth 100
- **Problèmes rencontrés** :
  - 196 fichiers non conformes Prettier (hors scope)
- **Reporté** :
  - E0-S02-3 : intégration ESLint ↔ Prettier
  - E0-S02-4 : scripts + validation finale

### Session E0-S02-3 — Intégration ESLint ↔ Prettier
- **Date** : `05/10/2026`
- **Objectif** : Intégration de `eslint-config-prettier` pour résoudre les conflits ESLint/Prettier
- **Statut** : ✅ terminée
- **Livrables** :
  - `eslint-config-prettier` 10.1.8 installé
  - `.eslintrc.json` mis à jour avec `extends: ["next/core-web-vitals", "prettier"]`
  - `eslint-config-prettier` confirmé hors de cause (138 = 138)
- **Décisions techniques** :
  - `prettier` désormais en fin de chaîne d'extends
  - Aucun conflit entre ESLint et Prettier
- **Problèmes rencontrés** :
  - Confusion initiale entre 72 erreurs (E0-S02-1) et mesure erronée
- **Reporté à E0-S02-3b** :
  - Diagnostic fiable du comptage ESLint

### Session E0-S02-3b — Diagnostic baseline ESLint
- **Date** : `05/10/2026`
- **Objectif** : Établir une baseline fiable du nombre d'erreurs ESLint
- **Statut** : ✅ terminée
- **Livrables** :
  - Cause identifiée : undercount E0-S02-1 (72 déclaré, réalité 138)
  - Méthode de mesure fiable établie : `--format json` + comptage scripté
  - `.eslintrc.json` restauré (rollback)
  - Aucune correction de code (scope E0-S02c)
- **Décisions techniques** :
  - Baseline qualité figée : 138 erreurs ESLint / 0 warning / 196 fichiers Prettier
  - Toute mesure ESLint doit passer par JSON scripté (règle ajoutée à `.kilocode/rules.md`)
- **Problèmes rencontrés** :
  - Undercount de 66 erreurs dans E0-S02-1
- **Reporté à E0-S02-4** :
  - Scripts npm cohérents + validation finale + décision tailwind plugin

### Session E0-S02-4 — Scripts + validation finale + tailwind plugin
- **Date** : `05/10/2026`
- **Objectif** : Finaliser l'outillage qualité : scripts npm, validation globale, `prettier-plugin-tailwindcss`
- **Statut** : ✅ terminée
- **Livrables** :
  - Scripts npm cohérents (`lint`, `format`, `format:check`, `typecheck`, `build`)
  - `prettier-plugin-tailwindcss` installé et configuré
  - Validation globale : lint, format:check, typecheck, build OK
- **Décisions techniques** :
  - Installation de `prettier-plugin-tailwindcss` autorisée par Superviseur
  - Aucune exécution de `npm run format` ou `npm run lint:fix`
- **Problèmes rencontrés** :
  - `[...]`
- **Reporté à E0-S02c** :
  - Résorption des 138 erreurs ESLint détectées

### Session E0-S02c — Résorption qualité (138 → 0)
- **Date** : `05/10/2026`
- **Statut** : ✅ terminée
- **Sous-sessions** :
  - **E0-S02c-1** : Prettier global (73 fichiers formatés) + checkpoint `581d35a`
  - **E0-S02c-2** : 4 `react-hooks/rules-of-hooks` corrigés (bug runtime latent éliminé)
  - **E0-S02c-3** : 3 `no-explicit-any` remplacés par types précis
  - **E0-S02c-4** : 11 `no-unescaped-entities` corrigés
  - **E0-S02c-5** : 181 `no-unused-vars` corrigés (3 sous-vagues : imports, variables, paramètres)
  - **E0-S02c-6** : Commits finaux (`5888c82` Prettier, `6e0ee70` ESLint)
  - **E0-S02c-7** : Diagnostic avertissement Prettier `next.config.mjs` (2 semicolons manquants)
  - **E0-S02c-8** : Application Option A — ajout configs infra à `.prettierignore` + commit `82d5a3f`
- **Livrables** :
  - 0 erreur ESLint (138 → 0)
  - 0 warning ESLint
  - 0 fichier Prettier non conforme
  - Build Next.js fonctionnel (34 pages)
  - `typecheck` vert
  - `.prettierignore` étendu (9 fichiers infra)
  - 3 commits : `5888c82`, `6e0ee70`, `82d5a3f`
- **Décisions techniques** :
  - Option A retenue pour `next.config.mjs` : ajout à `.prettierignore` (fichier infra stable)
  - `next.config.mjs` et `prisma/schema.prisma` restent à HEAD (pas de modification)
  - `eslint-plugin-unused-imports` envisagé pour automatiser les imports inutilisés
- **Problèmes rencontrés** :
  - Bug introduit puis corrigé : `src/app/api/search/route.ts` — variable `body` devenue inutilisée après suppression de `query`, corrigée par ajout de `const { source } = body`
  - Faux positifs ESLint (`Truck`, `Box`) : imports supprimés par script puis restaurés manuellement
  - Écart de périmètre : 27 fichiers restants à commit (pas 101 — les commits précédents avaient déjà absorbé une partie)
- **Reporté à E0-S04** :
  - Branchement DB réel (remplacement des mocks par Prisma)

### Session E0-S05 — BetterAuth + filtrage user client
- **Date** : `07/10/2026`
- **Statut** : ✅ terminée (9/9 sous-sessions)
- **Sous-sessions** :
  - **E0-S05-0** : Cadrage initial + vérification BetterAuth
  - **E0-S05-1** : Vérification `auth-client.ts` et route API `[...all]`
  - **E0-S05-2** : Vérification `auth.ts` et configuration serveur
  - **E0-S05-2-b** : Complément vérification configuration BetterAuth
  - **E0-S05-3** : Tests E2E (6 tests : healthcheck, login, register, admin dashboard, admin demandes, client dashboard)
  - **E0-S05-4** : Fix package.json `next dev` + commit `0bfd853`
  - **E0-S05-4-octies** : Pin port dev 3000 + commit `0bfd853` (faux négatif `Test-Path` PowerShell avec `[...]`)
  - **E0-S05-5** : Audit filtrage user (mocks `INITIAL_REQUESTS`, `WORKSHOP_MACHINES`, `MOCK_SEARCH_CANDIDATES`)
  - **E0-S05-5-A** : Audit complémentaire (importateurs mocks, helpers data)
  - **E0-S05-5-B** : Audit complémentaire (pages client, `auth.ts`, accès session)
  - **E0-S05-5-C** : Implémentation filtrage user (`auth-server.ts`, remplacement mocks, corrections types)
  - **E0-S05-6** : Tests E2E API + baseline + docs + commit `73261bb`
- **Livrables** :
  - `src/lib/auth-server.ts` — helper `getCurrentUser()` et `requireUser()`
  - `src/app/client/dashboard/page.tsx` — Server Component, filtrage par `clientId`
  - `src/app/client/dashboard/demandes/page.tsx` — suppression hardcode `user@partiva.dev`
  - `src/app/client/dashboard/pieces-pretes/page.tsx` — TODO E1 (pas de relation Part-User)
  - Commit `73261bb` — feat(auth): filter client pages by real session user
- **Décisions techniques** :
  - `auth.api.getSession({ headers: await headers() })` confirmé par doc BetterAuth
  - Pages client converties en Server Components (RSC)
  - `getRequests({ clientId })` déjà disponible, exploité
  - `getParts` n'a pas de `clientId` — reporté à E1 (modélisation)
- **Problèmes rencontrés** :
  - Dérive méthodologique PCT pendant E0-S05-4-octies (5 inversions de rôle, hash inventé, rapports contradictoires)
  - `Test-Path` PowerShell faux négatif avec `[...]` (wildcards)
  - Décalages types mocks vs Prisma : `DELIVERED` → `COMPLETED`, `critical` → `URGENT`, champ `cloudId` absent
- **Dettes techniques** :
  - Mocks admin (`INITIAL_REQUESTS`, `WORKSHOP_MACHINES`) toujours présents — à traiter E0-S06
  - Relation `Part`-`User` manquante — à traiter E1
  - `getParts` n'accepte pas `clientId` — à ajouter quand relation existante
- **Tests** :
  - Build ✅, lint ✅, prettier ✅, typecheck ✅
  - API sign-in E2E : ✅ `POST /api/auth/sign-in/email 200 in 2134ms`
  - Isolation navigateur manuelle : ⚠️ non vérifiée (nécessite opérateur humain)
- **Reporté à E0-S06** :
  - Remplacement mocks admin par données DB réelles
  - Middleware & protection routes

<!-- ────────────────────────────────────────────────────────── -->

### Session E0-S06-2 — VALIDÉE ✅ (board_62f8579f)
- **Date** : `08/10/2026`
- **Objectif** : Audit robustesse session middleware
- **Statut** : ✅ validée
- **Tests dégradés** :
  - T1 (cookie falsifié) ✅ — 307 → `/login`
  - T4 (user supprimé) ✅ — 307 → `/login`
  - T2 (cookie expiré) → reporté E0-S06-4 (secret HMAC indisponible)
  - T3 (DB down) → REPORTÉ CONDITIONNEL (Docker local OU mock requis)
- **Décision** : middleware inchangé (fail-safe observé)
- **Aucun commit** (référence : `82220fb`)
- **Reporté à E0-S06-4** :
  - T2 cookie expiré
  - T3 DB down (si environnement isolé disponible)

### Règle de test T3
T3 (DB down) ne sera exécuté que si :
- Option A : Docker local disponible
- Option B : Mock `auth.api.getSession` en test contrôlé
En attendant : reporté, non bloquant.

---

## E0-S06 — Middleware & protection + remplacement mocks

**Statut :** ✅ CLÔTURÉE
**Date :** 2026-10-08
**Commit final :** 9414c88

### Sous-sessions

| Sous-session | Objet | Statut |
|---|---|---|
| E0-S06-0 | Audit middleware + inventaire routes | ✅ |
| E0-S06-0b | Diagnostic typecheck (TS6053) | ✅ |
| E0-S06-0c | Fix typecheck (polling + tsbuildinfo) | ✅ |
| E0-S06-1 | Création `middleware.ts` + matcher | ✅ |
| E0-S06-1b | Correction politique VIEWER | ✅ |
| E0-S06-2 | Audit robustesse session middleware | ✅ |
| E0-S06-3 | Correction seed `request4` (clientId NULL) | ✅ |
| E0-S06-3a | Rapport FAUX — invalidé rétroactivement | ❌ |
| E0-S06-3b | Rapport FAUX — invalidé rétroactivement | ❌ |
| E0-S06-3c | Audit de vérité (référence officielle) | ✅ |
| E0-S06-3d | Cartographie mocks + plan remplacement | ✅ |
| E0-S06-3e1 | Lot 1 : `WORKSHOP_MACHINES` → `getMachines()` | ✅ |
| E0-S06-3e2 | Lot 2 : `INITIAL_REQUESTS` → `getRequests()` | ✅ |
| E0-S06-3f | Correction régression runtime (RSC + Client) | ✅ |
| E0-S06-4 | Tests runtime + clôture | ✅ |

### Réalisations

- **Middleware** : protection routes `/admin/*` et `/client/*` avec politique d'accès (ADMIN/USER/VIEWER).
- **Seed** : `request4` corrigé (`clientId: user.id`), 0 NULL en base.
- **Mocks supprimés** :
  - `WORKSHOP_MACHINES` → remplacé par `getMachines()` (Server Component + Client Component).
  - `INITIAL_REQUESTS` → remplacé par `getRequests()` (mapping Prisma → UI via `request-mappers.ts`).
- **Régression runtime corrigée** : pattern `React.use()` sur Server Action en Client Component (invalide React 18) → remplacé par RSC (fetch) + Client Component (props).
- **`MOCK_SEARCH_CANDIDATES`** : seul mock restant, dette tracée E0-S07+.

### Dettes ouvertes (E0-S06)

| Dette | À traiter |
|---|---|
| `MOCK_SEARCH_CANDIDATES` (aucun modèle Prisma) | E0-S07+ |
| Tests runtime automatiques (34 pages) | E0-S07 |
| Matrice E2E complète (ADMIN/USER/VIEWER/Non-auth) | E0-S06-4b ou E0-S07 |
| Tests cookie expiré/invalide | E0-S07 |
| Mapping `urgency`/`status` mock → Prisma | Documenté, verrouillé |
| `cloudId` absent du schéma Prisma | Retiré, dette tracée E1 |
| Enums Prisma non utilisés (modèles en `String`) | E1 — modélisation métier |
| Migration enum PG natif | E1 |
| Double emplacement Server Actions | ✅ RÉSOLU (supprimé) |

### Baseline finale E0-S06

| Axe | Résultat |
|---|---|
| ESLint | ✅ 0 warn, 0 err |
| TypeScript | ✅ 0 err |
| Build | ✅ 34 pages |
| Seed | ✅ idempotent, 0 NULL |
| Runtime | ✅ 3 routes principales testées OK |

---

## E0-S07 — Résorption dettes haute priorité (MOCK_SEARCH_CANDIDATES + tests runtime)

**Statut :** ✅ CLÔTURÉE
**Date :** 2026-10-08
**Commit final :** 6f0e132

### Sous-sessions

| Sous-session | Objet | Statut |
|---|---|---|
| E0-S07-0 | Audit initial + état réel (rapport PCT) | ✅ |
| E0-S07-1 | Mise à jour documentaire (SESSION.md divergent) | ✅ |
| E0-S07-2 | Audit modèle SearchCandidate (mapping Zod → Prisma) | ✅ |
| E0-S07-3 | Modèle Prisma + migration + seed (Axe 1) | ✅ |
| E0-S07-4-A | Diagnostic typecheck (TS6053) | ✅ |
| E0-S07-4-A' | Stabilisation `scripts/typecheck.mjs` | ✅ |
| E0-S07-4-B | Remplacement `MOCK_SEARCH_CANDIDATES` (3 fichiers) | ✅ |
| E0-S07-4-B' | Rapport PCT recomposé (conforme) | ✅ |
| E0-S07-5 | Setup Playwright + 3 tests fumée (Axe 2) | ✅ |
| E0-S07-6-A | Lecture préalable (pkg, warning, 40 routes) | ✅ |
| E0-S07-6-B | 33 tests E2E (public + protected + API) | ✅ |
| E0-S07-7 | Clôture + commit + passation | ✅ |

### Réalisations

- **Axe 1 — `MOCK_SEARCH_CANDIDATES` → Prisma**
  - Modèle `SearchCandidate` créé (migration `20261008100000_add_search_candidate`)
  - Seed idempotent (4 candidats)
  - Helper `src/lib/data/search-candidates.ts` (Prisma + Zod parse strict)
  - API `/api/search` branchée Prisma + tri conservé
  - Page admin `/admin/demandes/[id]/recherche` branchée RSC + props
  - `MOCK_SEARCH_CANDIDATES` supprimé (0 référence)
  - `src/lib/mock-data.ts` supprimé (résidu vide)

- **Axe 2 — Tests runtime automatisés**
  - Playwright 1.64.0 + Chromium installés
  - `playwright.config.ts` (workers:1, reuseExistingServer)
  - `scripts/typecheck.mjs` stabilisé (sleepSync + nettoyage .next/types)
  - **33 tests E2E** : 3 smoke + 12 public + 14 protected + 4 API
  - Couverture : toutes les routes non-authentifiées (29 routes sur 40 listées)

### Décisions verrouillées E0-S07

- **Typecheck** : `scripts/typecheck.mjs` nettoie `.next/types` avant `next typegen`. Comportement accepté malgré récurrence (dette Next.js, réévaluation E0-S08).
- **Modèle `SearchCandidate`** : `scores` et `metadata` en `Json`. Tri en mémoire applicative (pas d'index JSONB). Dette E1 (colonne dénormalisée si volume).
- **Helper `getSearchCandidates`** : parse strict via `CandidateScoresSchema.parse()`. Échoue si données invalides (signal, pas masquage).
- **Playwright** : Chromium uniquement, pas de CI, workers:1.
- **`mock-data.ts`** : supprimé (résidu vide).

### Dettes ouvertes (E0-S07b et au-delà)

| Dette | Priorité | Cible |
|---|---|---|
| Tests E2E authentifiés (ADMIN, USER, VIEWER) | Haute | E0-S07b |
| Tests E2E routes dynamiques avec IDs valides | Haute | E0-S07b |
| Tests cookie expiré/invalide (T2/T4) | Moyenne | E0-S07b |
| Matrice E2E complète (4 rôles) | Moyenne | E0-S07b |
| Warning `pg` sslmode (pg-connection-string) | Moyenne | Avant migration pg v9 |
| Conflit peer `zod 3 vs 4` (better-call) | Moyenne | E0-S08 |
| `/api/sync` : contrat POST à clarifier | Faible | E0-S07b |
| Migration Next 15 → 16 | Haute | E0-S08 |
| React 18 → 19 | Haute | E0-S08 |
| Migration Tailwind 3 → 4 | Moyenne | E0-S09 |
| 12 vulns npm | Moyenne | Session dédiée |
| Nettoyage `.next/types` récurrent | Faible | E0-S08 (réévaluation) |
| `cloudId` absent du schéma Prisma | Faible | E1 |
| Enums Prisma non utilisés (String) | Faible | E1 |
| Migration enum PG natif | Faible | E1 |

### Incidents PCT tracés

- **E0-S07-3** : contournement `prisma migrate dev` (P3006/P3018) sans STOP préalable → accepté rétroactivement.
- **E0-S07-5** : `--legacy-peer-deps` utilisé sans STOP préalable → accepté rétroactivement.
- **E0-S07-6-B** : 2 ajustements de tests (toHaveTitle, /api/sync 405) effectués sans STOP → acceptés rétroactivement (ajustements mineurs, dans le périmètre).

**Règle renforcée** : toute commande qui échoue (Prisma, npm, git, Playwright) → STOP + rapport, sans exception.

### Baseline finale E0-S07

| Axe | Résultat |
|---|---|
| ESLint | ✅ 0 warn, 0 err |
| TypeScript | ✅ 0 err |
| Build | ✅ 34 pages (40 routes listées) |
| Seed | ✅ idempotent, 4 searchCandidates |
| Tests E2E | ✅ 110/110 verts (1 warmup + 3 setup + 1 ids-setup + 38 chromium + 16 public + 14 admin + 14 user + 14 viewer + 12 dynamiques + 4 auth-api + 1 sync) |

---

## 🏗️ ÉTAT ACTUEL DE L'ARCHITECTURE

### 🎨 Front-end
- **Pages existantes** : `[à lister]`
- **Composants clés** : `[à lister]`
- **State management** : `[à définir]`
- **Styling** : `[à définir]`

### ⚙️ Back-end
- **Route Handlers API** : `[à lister]`
- **Server Actions** : `[à lister]`
- **Schéma DB** : `[à décrire]`
- **Auth** : BetterAuth configuré, `getCurrentUser()` opérationnel, filtrage client par `clientId`

### 🚀 Infra / DevOps
- **Hosting** : `[à définir]`
- **CI/CD** : `[à définir]`
- **Sécurité repo** : ✅ auditée (E0-S01)
- **Vulnérabilités npm** : 12 identifiées, report documenté
- **Variables d'environnement** : `[à lister]`

---

## 🐛 DETTES TECHNIQUES & TODO CRITIQUES

- [x] Résorption 138 erreurs ESLint (E0-S02c)
- [ ] Migration Next 14 → 16 (E0-S08)
- [ ] Migration Prisma 7 canary → 6 stable (E0-S02b / E0-S03)
- [ ] Migration Tailwind 3 → 4 (E0-S09)

---

## 🚨 VULNÉRABILITÉS REPORTÉES

> Vulnérabilités non corrigées dans E0-S01 car nécessitant des migrations majeures. Reportées aux sessions indiquées.

| Cluster | Packages concernés | Session cible | Raison du report |
|---|---|---|---|
| Next.js 14 → 16 | `next` | E0-S08 | Migration majeure 14 → 16, breaking changes React/APIs |
| Prisma canary → 6 stable | `prisma`, `@prisma/client`, `@prisma/config`, `mysql2`, `deepmerge-ts` | E0-S03 | Version 7.10.0 non production ; décision de version requise avant schéma |
| Tailwind 3 → 4 | `tailwindcss`, `tailwindcss-animate`, `braces`, `chokidar`, `micromatch` | E0-S09 | Migration majeure, pas de fix disponible en 3.x |
| postcss | `postcss` | E0-S08 | Fix inclus dans la migration Next.js 16 |
| fast-glob / micromatch / braces | `fast-glob`, `micromatch`, `braces` | E0-S09 | Dépendances directes de `tailwindcss` v3.4.19, pas de fix non-breaking disponible ; résolu par migration Tailwind 3 → 4 |

**Audit npm au 05/10/2026** : 12 vulnérabilités (1 critical, 11 high). Aucune correction non-breaking disponible pour ces clusters.

---

## 🔑 DÉCISIONS D'ARCHITECTURE FIGÉES

> ⚠️ Ne pas contredire sans validation explicite du Superviseur.

- `[ex: "Zod obligatoire pour toute validation d'input"]`
- `[ex: "Server Components par défaut, 'use client' justifié"]`
- `[ex: "Nommage fichiers : kebab-case | Composants : PascalCase"]`

---

## 🎯 PROCHAINE SESSION PRÉVUE

- **Session** : E0-S07b
- **Objectif** : Tests E2E authentifiés + routes dynamiques + cookies expirés
  (1) Matrice E2E ADMIN/USER/VIEWER (auth Playwright)
  (2) Tests routes dynamiques avec IDs valides (admin/[id], client/dashboard/[id], materiaux/[slug])
  (3) Tests cookie expiré/invalide (T2/T4)
  (4) Clarification contrat /api/sync

---

## 📌 NOTES LIBRES

> Zone pour remarques, idées, points de vigilance non classés.

- **Incident méthodologique E0-S05-4-octies** : dérive PCT (Protocole de Contrôle Technique) — 5 inversions de rôle, hash inventé (`a1b2c3d`), commit annoncé puis démenti, rapports contradictoires. PCT abandonné. Règles de reprise : Coordinateur = humain, Superviseur = IA, Exécutant = Kilo Code (optionnel), toute sortie technique vient du terminal humain, aucun hash sans `git rev-parse`, un ordre = un périmètre.
- Dette Part-User : modèle `Part` sans relation `User` → filtrage client impossible pour pièces prêtes (reporté E1)
- Mocks admin (`INITIAL_REQUESTS`, `WORKSHOP_MACHINES`) toujours utilisés dans `admin/dashboard`, `admin/sync`, `admin/usinage` → à remplacer par DB réelle en E0-S06
- Décalages types mocks vs Prisma découverts en E0-S05-5-C : `RequestStatus.DELIVERED` inexistant (`COMPLETED`), `UrgencyLevel.critical` inexistant (`URGENT`), champ `cloudId` absent du schéma — mocks incohérents avec le schéma réel

### SESSION.md — État doc
- Mise à jour E0-S06-2 appliquée (non commitée)
- Commit docs reporté à clôture E0-S06
- Règle : aucun commit docs isolé par sous-session

---

## E0-S07b — Résorption baseline + extension E2E

**Statut :** 🟢 EN COURS
**Date d'ouverture :** 2026-10-08

### Sous-sessions

| Sous-session | Objet | Statut |
|---|---|---|
| E0-S07b-0 | Vérification d'état (git, SESSION, ROADMAP, baseline) | ✅ |
| E0-S07b-0b | Diagnostic baseline (ESLint 14 err, typecheck wrapper KO) | ✅ |
| E0-S07b-0c | Résorption baseline (eslint ignore + seed vars + wrapper) | ✅ (commit 9b7d3ab) |
| E0-S07b-0c-R | Régularisation factuelle (diffs, baseline) | ✅ |
| E0-S07b-0d | Nettoyage (annulation commit hors ordre ae83171) | ✅ |
| E0-S07b-0e | Vérification baseline complète + clôture documentaire | 🟢 EN COURS |

### Réalisations E0-S07b-0 (baseline)

- ESLint : `next-env.d.ts` exclu (`.eslintignore`).
- Seed : 13 bindings inutilisés supprimés (`prisma/seed.ts`).
- Wrapper typecheck : résolution explicite `node_modules/.bin/next` et `tsc` (Windows).
- ROADMAP.md : ligne E0-S07 ajoutée.

### Incidents PCT tracés (E0-S07b)

| Incident | Sous-session | Nature | Statut |
|---|---|---|:---:|
| Commit `ae83171` (docs E0-S07 + `PASSATION-E0-S07.md` auto-rédigé) | E0-S07b-0c | Commit hors ordre + violation règle 12 | Refusé, annulé par `git reset --hard HEAD~1` |

**Règle renforcée E0-S07b :** toute commande qui échoue → STOP + rapport, sans exception. Le Superviseur fournit le contenu des docs. Aucun prompt de passation auto-rédigé.

### Dettes résolues en E0-S07b-0

| Dette | Résolution |
|---|---|
| ESLint 14 erreurs (préexistantes) | ✅ Résolu (commit 9b7d3ab) |
| Wrapper typecheck cassé (PATH Windows) | ✅ Résolu (commit 9b7d3ab) |
| ROADMAP.md incomplet (E0-S07 absente) | ✅ Résolu (commit 9b7d3ab) |
| `PASSATION-E0-S07.md` hors ordre | ✅ Annulé (`ae83171` reset) |

### Dettes ouvertes (E0-S07b-1 et au-delà)

| Dette | Priorité | Cible |
|---|---|---|
| Tests E2E authentifiés (ADMIN/USER/VIEWER) | Haute | E0-S07b-1 |
| Tests E2E routes dynamiques avec IDs | Haute | E0-S07b-1 |
| Tests cookie expiré/invalide (T2/T4) | Moyenne | E0-S07b-1 |
| Tests `/api/auth/[...all]` (BetterAuth) | Moyenne | E0-S07b-1 |
| Clarification contrat `/api/sync` | Faible | E0-S07b-1 |

---

## 🧪 E0-S07b-1 — Matrice E2E authentifiée (CLÔTURÉE)

**Objet :** Tests E2E par rôle (ADMIN/USER/VIEWER) avec storageState par rôle, matrice d'accès source unique de vérité.

### Livrables

- `e2e/fixtures/users.ts` — credentials par rôle (env/fallback dev).
- `e2e/fixtures/access-matrix.ts` — matrice source unique de vérité (15 routes statiques initialement).
- `e2e/setup/auth.setup.ts` — login par rôle, storageState.
- `e2e/setup/warmup.setup.ts` — pré-chauffage dev server.
- 4 specs matrice : `public-access.spec.ts`, `admin-access.spec.ts`, `user-access.spec.ts`, `viewer-access.spec.ts`.
- `.auth/` gitignoré (`.gitignore:55`).

### Résultats

- **93/93 tests verts** (1 warmup + 3 setup + 33 chromium + 56 matrice).
- Commit : `f506ecc` (poussé).

### Incidents PCT E0-S07b-1

12 incidents tracés (n°6 à n°17), dont 6 violations de périmètre — d'où l'adoption de la **règle R21** (mode correction complète).

### Dettes résolues

- Tests E2E authentifiés (ADMIN/USER/VIEWER).
- Setup storageState par rôle.
- Matrice d'accès source unique de vérité.
- Projets Playwright séparés.

---

## 🧪 E0-S07b-2 — Tests E2E routes dynamiques avec IDs (CLÔTURÉE)

**Objet :** Tests E2E authentifiés sur routes dynamiques `[id]` (3 routes Request), IDs extraits dynamiquement via API applicative.

### Livrables

- `e2e/fixtures/dynamic-ids.ts` — extraction IDs via `GET /api/requests`, persistance `.auth/ids.json`.
- `e2e/fixtures/dynamic-ids-fixture.ts` — fixture Playwright custom (résolution au runtime).
- `e2e/setup/ids.setup.ts` — setup d'extraction d'IDs.
- `e2e/admin/admin-dynamic.spec.ts` — 3 tests ALLOW.
- `e2e/user/user-dynamic.spec.ts` — 2 DENY + 1 ALLOW.
- `e2e/viewer/viewer-dynamic.spec.ts` — 3 DENY.
- Matrice étendue (3 entrées `dynamicId`).
- Projet Playwright `ids-setup` inséré entre `setup` et les projets rôle.
- Warmup stabilisé (timeout 120s, suppression `waitForTimeout`).

### Résultats

- **103/103 tests verts** (1 warmup + 3 setup + 1 ids-setup + 33 chromium + 14 public + 14 admin + 14 user + 14 viewer + 12 dynamiques).
- Cible D40 atteinte exactement.

### Décisions verrouillées E0-S07b-2

- **D21-bis :** E0-S07b-2 couvre uniquement les 3 routes `Request`. `/admin/reverse-engineering/[id]` exclu (absence API).
- **D23 :** 404 / IDs inexistants → hors périmètre, reporté E0-S07b-3.
- **D24 :** Routes imbriquées = même `id` parent.
- **D25 :** Warning `Decimal` Prisma (serialisation RSC→Client) → dette tracée, cible E0-S08.
- **D26 :** Commit documentaire E0-S07b-1-Doc fusionné dans la clôture E0-S07b-2.
- **D27 :** Absence `GET /api/reverse-engineering` → dette tracée.
- **D28–D29 :** Fixture `dynamic-ids.ts` + projet `ids-setup`.
- **D30–D33 :** Assertions textuelles, 12 combinaisons, matrice paramétrée.
- **D34–D36 :** Fixture Playwright custom (résolution runtime, pas top-level).
- **D37 :** Warmup stable (timeout 120s).
- **D38–D39 :** Filtre `dynamicId === undefined` dans specs hérités.
- **D40 :** Cible 103 tests verts.
- **D41 :** Patch uniforme sur 3 specs hérités.
- **D42–D43 :** Mode patch ciblé documentaire + commit unique fusionné.

### Incidents PCT E0-S07b-2

- **n°18 :** `loadIds()` top-level → ENOENT à la collecte. Résolu par D34–D36. Responsabilité : Superviseur.
- **n°19 :** Warmup timeout 30s vs 31.8s. Résolu par D37. Responsabilité : partagée.
- **n°20 :** Extension matrice sans MAJ specs consommateurs. Résolu par D38–D41. Responsabilité : Superviseur.

### Dettes résolues

- Tests E2E routes dynamiques avec IDs (3 routes `Request`).
- Warmup timeout fragile (D37).
- `loadIds()` top-level → ENOENT (D34–D36).

### Dettes ouvertes (E0-S07b-3 et au-delà)

- Tests E2E `/admin/reverse-engineering/[id]` (bloqué par absence API).
- **D-27 :** création `GET /api/reverse-engineering` → E0-S07b-3 (décision) → E1 (implémentation probable).
- Tests cookie expiré/invalide (T2/T4).
- Tests `/api/auth/[...all]` (BetterAuth).
- Clarification contrat `/api/sync`.
- **D-25 :** Warning `Decimal` Prisma (serialisation RSC→Client) → E0-S08.

---

## 🧪 E0-S07b-3 — Dettes résiduelles E2E (CLÔTURÉE)

**Objet :** Résorption des dettes E2E identifiées en fin E0-S07b-2 : tests cookies expiré/invalide, couverture API BetterAuth, contrat `/api/sync`, décision `/api/reverse-engineering`.

### Livrables

- `e2e/public/cookie-guard.spec.ts` — 2 tests (T2 cookie expiré, T4 cookie falsifié), redirection `/admin` et `/client` → `/login` (D46).
- `e2e/auth-api.spec.ts` — 4 tests cycle de vie session BetterAuth (login OK, login KO 401, get-session null, sign-out + invalidation).
- `e2e/api.spec.ts` — +1 test POST `/api/sync` contrat stub (D48).
- `src/app/api/sync/route.ts` — en-tête JSDoc documentant le statut stub + dette vers E1 (D48).
- `playwright.config.ts` — inchangé (projet `public` et `chromium` couvrent les nouveaux specs).

### Résultats

- **110/110 tests verts** (103 → 110 : +2 cookie +4 auth-api +1 sync).
- Lint 0 err / 0 warn. Typecheck 0 erreur. Build 34 pages.
- Aucun test instable, aucun timeout > 80% limite (règle #15).

### Décisions verrouillées E0-S07b-3

- **D46 :** T2 = storageState copié en mémoire avec `expires` passé ; T4 = cookie forgé (`forged.invalid.token.value`). `.auth/*.json` non touchés sur disque.
- **D47 :** 4 tests API-only projet `chromium`, cycle de vie session minimal (hors sign-up / password reset / email).
- **D48 :** `/api/sync` = test contrat + documentation JSDoc. Implémentation réelle → E1.
- **D49 :** `GET /api/reverse-engineering` **reporté à E1** (D-27-bis). Aucun consommateur externe identifié. `/admin/reverse-engineering/[id]` reste hors périmètre E2E.
- **D50 :** import `{ users }` (minuscule) conforme à l'export réel.
- **D51 :** header `Origin` obligatoire sur POST BetterAuth (CSRF 1.7.7).
- **D52 :** test sign-out avec session valide (option B).
- **D53 :** assertions sur body JSON, pas sur parsing `set-cookie`.
- **D54 :** sign-out requiert `Content-Type: application/json` + body `{}`.
- **D55 :** `Origin` non requis sur routes Next.js pures (non-BetterAuth).
- **D56 :** timestamp `/api/sync` assertion assouplie (string parsable, pas round-trip ISO).
- **D57 :** JSDoc `route.ts` placé avant l'import.
- **D58 :** ancrage SESSION.md = insertion avant pied `═══` (l.639).
- **D59 :** métadonnées SESSION.md l.21–23 + baseline l.408 mises à jour.
- **D60 :** coquille D-44 non régularisée (ROADMAP l.139), nouvelle ligne E0-S07b-3 en 3 colonnes strictes.

### Incidents PCT E0-S07b-3

- **n°22 :** import `USERS` erroné dans ordre E0-S07b-3-C (Superviseur). Résolu D50.
- **n°23 :** contrat sign-out incomplet (415 observé vs 200 attendu) — Superviseur. Résolu D54.
- **n°24 :** rupture de transmission Coordinateur → Exécutant sur correction R21. Résolu par réémission intégrale.

### Dettes résolues E0-S07b-3

- T2/T4 cookies expiré/invalide.
- Couverture API BetterAuth (cycle de vie session).
- Contrat `/api/sync` figé + dette documentée.

### Dettes ouvertes (E0-S08 et au-delà)

- **D-25 :** Warning `Decimal` Prisma (serialisation RSC→Client) → E0-S08.
- **D-27-bis :** Création conditionnelle `GET /api/reverse-engineering` si consommateur externe émerge → E1 ou E7.
- **D-44 :** Coquille Markdown ROADMAP.md l.139 (4 cellules / 3 colonnes) → session doc dédiée.
- Warning pg sslmode (pg v9) → session dédiée.
- 12 vulns npm → session dédiée.
- Migrations Next 15→16, React 18→19 → E0-S08.
- Tailwind 3→4 → E0-S09.

---

## E0-S08 — Dettes techniques transverses (CLÔTURÉE)

**Date :** 2026-10-09
**Commit final :** 5505744 (poussé sur origin/master)
**Baseline :** lint 0/0, typecheck 0, build 33/33, seed idempotent, E2E 110/110.

### Objet

Résorption des dettes techniques transverses bloquantes pour E0-S09 :
Zod 3 → 4, ESLint 8 → 9 (flat config), Next 15 → 16, pg sslmode,
middleware → proxy (dépréciation Next 16).

### Commits

| Commit | Objet | Décision |
|---|---|---|
| a7c5db9 | Decimal `toString()` (D61) | D61 |
| 007cd85 | Zod 3 → 4 (D67) | D67 |
| 63d8e0d | ESLint 8 → 9 + flat config (D65) | D65 |
| 9df4931 | Next 15 → 16 + lint rules (D62/D69-D76) | D62 |
| a9e87fa | pg sslmode (D64) | D64 |
| 5505744 | middleware → proxy (D72) | D72 |

### Décisions verrouillées

D61-D83 (voir passation E0-S08 → E0-S09).

### Dettes résolues

D61, D62, D64, D65, D67, D72, lint rules Next 16 (7).

### Dettes annulées

L4 — pas de fix non-major `postcss-nested` (D82).

### Dettes reportées

| Dette | Cible |
|---|---|
| React 19 + @react-three/fiber@9 + @react-three/drei@10 | E0-S09 (annulée — cf. D84) |
| Tailwind 3 → 4 | E0-S09 (D81) |
| 14 vulns npm | E0-S09 + session dédiée (D82) |
| D-25-bis — Warning Decimal persistant | E0-S09 |
| D-25-ter — Hydration mismatch pieces-pretes-client.tsx:315 | E0-S09 |
| Prisma 6.19.3 vs 8.0.0-rc | Session dédiée |
| pg v9 | Session dédiée |

### Incidents PCT

14 incidents tracés (n°25 à n°38) — voir passation E0-S08 → E0-S09.

### Règles intégrées

Règles #19-#23 (vérifier pas déduire ; cadrer les fichiers de sonde ;
anticiper l'outillage embarqué ; revert immédiat si `invalid` ;
rafraîchir les audits).

### Notes

Push `63d8e0d..5505744` validé et effectif (D88).
La mention « à pousser » dans la passation était un résidu rédactionnel.

---

## E0-S09 — Migration React 19 + Tailwind 4 + résorption poids morts (CLÔTURÉE)

**Date :** 2026-10-09
**Commit final :** 341f0e4 (à pousser sur origin/master)
**Baseline :** lint 0/0, typecheck 0, build 33/33, seed idempotent, E2E 110/110.

### Objet

Migration majeure React 18.3.1 → 19.3.0 + Tailwind 3.4.x → 4.3.3,
résorption des poids morts (CadViewer, three.js stack, recharts),
élimination des dettes D-25-bis (warnings Decimal) et D-25-ter (hydration mismatch).

### Sous-sessions

| Sous-session | Objet | Statut | Commit |
|---|---|---|---|
| E0-S09-0 | Régularisation documentaire (SESSION.md + ROADMAP.md) | ✅ | b222b70 |
| E0-S09-1 | Audit de vérité des poids morts | ✅ | — |
| E0-S09-2 | Suppression poids morts (CadViewer, three.js, recharts) | ✅ | a30014a |
| E0-S09-3 | Nettoyage résiduel + migration Tailwind 3 → 4 | ✅ | 5c6cdd4 |
| E0-S09-4 | Correction D-25-bis + D-25-ter (Decimal + hydration) | ✅ | 4d09224 |
| E0-S09-5 | Audit préalable React 19 | ✅ | — |
| E0-S09-6 | Migration React 18 → 19 | ✅ | 341f0e4 |
| E0-S09-7 | Validation finale + clôture | ✅ | (ce commit) |

### Décisions verrouillées

D84-D111 (voir passation E0-S09 → E0-S10).

### Dettes résolues

- D-25-bis — Warning Decimal persistant (D97).
- D-25-ter — Hydration mismatch pieces-pretes-client.tsx (D99).
- React 19 + fiber v9 + drei v10 — migration annulée (D84 : CadViewer orphelin supprimé).
- Tailwind 3 → 4 — migré (D86).
- 14 vulns npm — majoritairement résolues par Tailwind 4.

### Dettes reportées

| Dette | Cible |
|---|---|
| `forwardRef` → `ref` comme prop (D111) | E0-S10 |
| Prisma 6.19.3 vs 8.0.0-rc | Session dédiée |
| pg v9 | Session dédiée |
| D-27-bis (GET /api/reverse-engineering) | E1 ou E7 |
| D-44 (coquille ROADMAP.md) | Session doc dédiée |

### Incidents PCT

9 incidents tracés (n°39 à n°47) — voir passation E0-S09 → E0-S10.

### Règles intégrées

Règles #24-#29 (regroupement npm, résidus wasm Windows, sérialisation RSC→Client en amont, cascade de type, R21 assouplie, `npm install -D` contrainte).

### Notes

Push des 6 commits E0-S09 (`b222b70..341f0e4`) validé par le Superviseur.

═══════════════════════════════════════════════════════════════
Fin SESSION.md — **Prochaine MAJ :** fin de session E0-S10
═══════════════════════════════════════════════════════════════
