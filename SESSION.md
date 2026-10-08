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
| **Stack** | Next.js 15 · TypeScript · Tailwind CSS · Prisma ORM · PostgreSQL · BetterAuth |
| **Repo** | `F:\PartIVA\` (local) |
| **Hosting prévu** | Vercel (web) + auto-hébergé (desktop Tauri) |
| **Phase actuelle** | MVP — Fondation technique (E0) |
| **Dernière session** | `E0-S07-7` |
| **Session en cours** | `E0-S07b` |
| **Statut global** | 🟢 E0-S07 clôturée — E0-S07b en cours (baseline restaurée, 9b7d3ab) |

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
| Tests E2E | ✅ 33/33 verts |

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

═══════════════════════════════════════════════════════════════
Fin SESSION.md — Prochaine MAJ en fin de session S001
═══════════════════════════════════════════════════════════════
