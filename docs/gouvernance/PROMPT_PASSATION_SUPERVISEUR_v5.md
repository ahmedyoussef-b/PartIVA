# PROMPT DE PASSATION — Superviseur IA Externe (PartIVA) — v5 (addendum à v4)

> **Ce document COMPLÈTE le prompt de passation v4** (`PROMPT_PASSATION_SUPERVISEUR_v4.md`).
> Toutes les règles de v4 (garde-fou, E2E-PROOF, E2E-RECORD-ORDER, E2E-PREREQS-GATE,
> E2E-ENV-STRICT, E2E-API-CHECK, logs structurés, anti-faux-semblant, format des prompts)
> restent **intégralement en vigueur**. Ne pas les répéter ici — se référer à v4.
> Ce document met à jour **l'état du projet** et **la liste des dettes**.

## 1. État du projet (au 2026-11-03, fin de session)

**Branche** : `master`. Dernier commit : `daf8969`.
**V1.1 et V1.2 sont closes.** Le repo est propre.

### V1.1 — Dettes d'infrastructure ENV + GROQ-CHECK (close)

**Commit** : `6ed5917` — `fix(campagne): V1.1 dettes infra ENV + GROQ-CHECK (7/7 preuves)`.

**Ce qui a été fait** :
- `scripts/campaign/check-env.ts` : chargement `.env.test` avec `override: true` (fallback `.env`),
  check DB réel (`SELECT 1`), check Groq réel (HTTP 200), garde-fou `llama-*`,
  logs structurés `[CAMPAIGN-CHECK-*]`, ajout de `groq` dans `ok` et dans `env-ready.json`.
- `.env.test` : ligne 4 scindée (`E101_STAGING_ACK=yes` / `ADMIN_EMAIL=...`).
- `docs/campagne-tests/README.md` : documentation de la chaîne d'env réelle
  (Next.js serveur / Playwright / scripts campaign / Prisma CLI).

**Preuves (7/7)** : typecheck, lint (0 err), build (68 pages), test:unit (52/52),
`campaign:check` positif (`ENV READY`, `groq:true`, `db:true`), `campaign:check` négatif
(`key_or_model_missing`, `ENV NOT READY: groq`, exit 1), Playwright workspace (15/2/0).

**Décision P1 actée** : les scripts `campaign:*` chargent `.env.test` avec `override: true`
(aligné sur `playwright.config.ts` et `e2e/global-setup.ts`). `.env.local` n'est **jamais**
chargé par la campagne — il n'affecte que le serveur Next.js.

### V1.2 — D4 Workspace (test partiel, sans 3D, avec Groq) (close)

**Commit** : `daf8969` — `test(workspace): V1.2 tests Groq réels (chat A), fallback B et engine C skippés avec dettes tracées (16/4/0)`.

**Ce qui a été fait** :
- `e2e/workspace/groq.spec.ts` (NOUVEAU) : 3 tests.
  - **V1.2-A** ✅ : appel Groq réel via `/api/ai/chat` (source !== 'mock', reply reçu). **Passed.**
  - **V1.2-B** ⏭️ : fallback mock — skippé. Dette `D-CHAT-FALLBACK-NOT-TESTABLE` tracée
    (mock de `/api/ai/chat` = faux-semblant, pas de test réel du fallback sans injection test-only).
  - **V1.2-C** ⏭️ : engine deep mode — skippé. Dette `D-ENGINE-GROQ-PROOF` tracée
    (`/api/engine` ne retourne aucun champ observable prouvant l'appel Groq — `route.ts:44`
    retourne `{ success: true, ...result }` sans indicateur).

**Décisions actées** :
- « Sans 3D » = ne pas interagir avec le canvas Three.js (mais accepter le montage de `ViewerZone`).
- `D-E57-DEEP-MODE-PLAYWRIGHT` laissé de côté (hors périmètre V1.2).
- V1.2-C contourne E57 via `request.post` (API directe), pas via l'UI.
- V1.2-D (Cloudinary) reporté en V1.5.
- Nouveau fichier `groq.spec.ts` (pas d'ajout dans `workspace.spec.ts`).

**Preuves** : typecheck, lint (0 err), build (68 pages), `groq.spec.ts` seul (1 passed, 2 skipped),
suite workspace complète (**16 passed, 4 skipped, 0 failed**).

**Note** : un flaky ponctuel sur `workspace.spec.ts` test #4 (`submit ingestion form triggers analyse`)
a été observé une fois (retry #1 passed), mais **non reproduit** dans le run de validation finale.
**Non confirmé** → pas de dette tracée pour l'instant. **À surveiller** dans les prochains runs.

## 2. Dettes actives (consolidées v4 + V1.1 + V1.2)

### Dettes d'infrastructure (V1.1)

| Dette | Priorité | Description | Source |
|---|---|---|---|
| `D-CAMPAGNE-COMMIT-SHA-INJECT` | Basse | `NEXT_PUBLIC_COMMIT_SHA` jamais injecté → warning systématique | V1.1 |
| `D-CAMPAGNE-ENV-READY-VERSIONED` | Basse | `docs/campagne-tests/env-ready.json` versionné → diff parasite à chaque `campaign:check` | V1.1 |
| `D-GROQ-CLIENT-DUPLICATE` | Basse | `getGroqApiKey()` dupliqué dans `src/lib/ai/groq-client.ts` et `src/lib/ai/config.ts` | Audit V1.1 |
| `D-CAMPAGNE-CHECK-NEGATIVE-TEST` | Moyenne | Test négatif Groq (`campaign:check` sans clé) non automatisable sans renommage manuel de `.env.test` | V1.1 |

### Dettes de testabilité (V1.2)

| Dette | Priorité | Description | Source |
|---|---|---|---|
| `D-CHAT-FALLBACK-NOT-TESTABLE` | Moyenne | Fallback `/api/ai/chat` non testable en E2E sans point d'injection test-only (header `x-test-no-groq` ou test unitaire de `GroqProvider.chat` avec `callGroq` mocké en erreur) | V1.2-B |
| `D-ENGINE-GROQ-PROOF` | Moyenne | `/api/engine` ne retourne aucun champ observable prouvant l'appel Groq (`route.ts:44` = `{ success: true, ...result }`). Solutions : ajouter `groqUsed: true` dans le payload, tracer la description enrichie, ou comparer les métadonnées avant/après | V1.2-C |

### Dettes pré-existantes (rappel v4)

| Dette | Priorité | Description |
|---|---|---|
| `D-CAMPAGNE-ENCODING` | Basse | Notes du registre mal encodées (UTF-8) |
| `D-CAMPAGNE-BUILD-FRESH` | Moyenne | Playwright doit rebuild avant test |
| `D-CAMPAGNE-RECORD-ORDER` | Basse | Ordre des commandes contractuel |
| `D-CAMPAGNE-ENV-TEST-SYNC` | ✅ **CORRIGÉE** (V1.1) | — |
| `D-CAMPAGNE-ENV-PRIORITY` | ✅ **CORRIGÉE** (V1.1) | — |
| `D-CAMPAGNE-CLOUDINARY-CHECK` | Basse | `campaign:check` doit valider Cloudinary (V1.5) |
| `D-CAMPAGNE-GROQ-CHECK` | ✅ **CORRIGÉE** (V1.1) | — |
| `D-ADMIN-TEST-COVERAGE` | Moyenne | Pas de tests E2E admin |
| `D-WS-REFACTOR` | Moyenne | Refactor UI workspace abandonné |
| `D-E57-DEEP-MODE-PLAYWRIGHT` | Haute | `<select>` React contrôlé non déclenchable sous Playwright (2 tests `test.fixme`) |

### Dettes conditionnelles (à surveiller)

| Dette | Condition | Description |
|---|---|---|
| `D-E2E-FLAKY-SUBMIT-INGESTION` | Si le flaky sur `workspace.spec.ts` test #4 se reproduit | Test instable (`submit ingestion form triggers analyse`) — retry #1 a passé une fois, non reproduit |
| `D-E2E-WEBSERVER-START-TIMING` | Si le flaky est lié au démarrage webServer | Timing au démarrage du `webServer` entre les projets |

## 3. Prochaines étapes (V1.3 → V1.5, puis V2)

| Phase | Domaine | Effort | Statut |
|---|---|---|---|
| **V1.3** | D13 — Reverse Engineering (test partiel) | Moyen | **À démarrer** |
| **V1.4** | D14 — Exports (test partiel) | Faible | En attente |
| **V1.5** | Dettes admin restantes (CLOUDINARY-CHECK, TEST-COVERAGE) | Faible | En attente |
| **V2** | Nouvelles fonctionnalités, connecteurs réels, E2E workspace supplémentaires | — | Après V1.5 |

### Ordre recommandé pour V1.3

1. **Audit V1.3** (garde-fou) : cartographie du domaine Reverse Engineering
   (routes, composants, appels Groq, fonctionnalités 3D, couverture E2E existante).
2. **Analyse du rapport** par le Superviseur (moi) → définition du périmètre exact.
3. **Implantation** (probablement subdivisée A/B/C, comme V1.2).
4. **Validation** avec preuves brutes (7/7 ou plus).
5. **Commit + push**.

### Ordre recommandé pour V1.4 et V1.5

Idem : audit → analyse → implantation → validation → commit.

## 4. Ce qui est stable et ne doit PAS être touché (sans raison impérieuse)

Rappel v4 + ajouts V1.1/V1.2 :

- Admin CRUD, Auth, flux clients existants.
- Modèles Prisma existants.
- Tests E2E workspace (**16 passed, 4 skipped, 0 failed**) et tests unitaires (12 suites, 52 tests).
- Cloudinary (configuré sur Vercel).
- `prisma7.config.ts` (priorité `DATABASE_URL` en premier — ne pas régresser).
- `.env.test` + `e2e/global-setup.ts` (infrastructure E2E locale).
- `src/app/admin/pieces/pieces-client.tsx` (simplifié, sans `PartDossier`).
- `src/app/admin/pieces/[id]/pieces-detail-client.tsx` (bouton Modifier).
- **`scripts/campaign/check-env.ts`** (V1.1 — 7/7 preuves, ne pas régresser).
- **`docs/campagne-tests/README.md`** (V1.1 — documentation chaîne d'env).
- **`e2e/workspace/groq.spec.ts`** (V1.2 — 1 test réel + 2 skipped avec dettes).

## 5. Ce qui est fragile (rappel v4 + ajouts V1.1/V1.2)

- **Intégrations externes** (Groq, Cloudinary, Neon) : toute modification doit être testée.
- **Modèles Groq actifs** : `openai/gpt-oss-120b` (chat) et `qwen/qwen3.8-27b` (vision).
  Ne pas utiliser `llama-*` (garde-fou dans `check-env.ts` et `groq-client.ts`).
- **Service Worker** : réparé en E95, surveiller les régressions.
- **Turbopack + encodage UTF-8** : un fichier avec un octet invalide casse le build (E106).
- **`.env.local`** : écrase `.env` silencieusement (Next.js serveur uniquement — jamais les scripts campaign).
- **`.env.test`** : doit rester en miroir des clés de `.env` nécessaires à la campagne
  (Cloudinary, Groq, auth E2E, DB test). Toute nouvelle clé doit être ajoutée aux deux.
- **`/api/engine`** : ne retourne aucun champ observable prouvant l'appel Groq (dette
  `D-ENGINE-GROQ-PROOF`). Ne pas modifier sans planifier l'observabilité.
- **`/api/ai/chat`** : fallback mock non testable sans point d'injection test-only (dette
  `D-CHAT-FALLBACK-NOT-TESTABLE`). Ne pas modifier pour rendre le test possible — planifier.

## 6. Commandes clés (inchangées, rappel)

```bash
# Vérifications
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run format:check

# E2E workspace (16 passed, 4 skipped, 0 failed)
npx playwright test e2e/workspace/ --project=workspace --reporter=list

# E2E workspace ciblé (groq.spec.ts — 1 passed, 2 skipped)
npx playwright test e2e/workspace/groq.spec.ts --project=workspace --reporter=list

# Campagne
npm run campaign:check       # Vérifie l'environnement (inclut Groq depuis V1.1)
npm run campaign:snapshot
npm run campaign:record
npm run campaign:dashboard
```

## 7. Leçons apprises (V1.1 + V1.2)

### Leçons Superviseur (pour moi)

10. **Leçon Superviseur 10** : un audit qui confirme les hypothèses du prompt de passation
    sans les vérifier est un audit inutile. L'audit V1.1 a infirmé 2 hypothèses sur 3
    (Cloudinary/Groq étaient bien dans `.env.test` ; `.env.local` n'était pas chargé par
    les scripts campaign) — c'est **la valeur** de l'audit.
11. **Leçon Superviseur 11** : quand un test mocke ce qu'il prétend tester, c'est un
    faux-semblant. Le skipper + tracer la dette est plus honnête que le laisser passer
    (V1.2-B, V1.2-C).
12. **Leçon Superviseur 12** : une preuve « suite complète » (E2E-PROOF) ne se remplace
    pas par des preuves ciblées isolées. Il faut insister jusqu'à l'obtenir (3 demandes
    pour V1.2-A+B+C, finalement obtenue).
13. **Leçon Superviseur 13** : ne pas présumer qu'un « flaky » rapporté par l'IA Interne
    est réel. Vérifier par des preuves (`.last-run.json`, `retries` config, run de
    reproduction). Si non reproduit, ne pas tracer la dette — surveiller.

### Leçons Campagne (à graver dans le registre)

| Leçon | Thème |
|---|---|
| 62 | Un audit qui confirme sans vérifier ne sert à rien |
| 63 | Mocker ce qu'on prétend tester = faux-semblant (bis) |
| 64 | La preuve « suite complète » est non négociable |
| 65 | Un flaky non reproduit n'est pas un flaky confirmé |
| 66 | `.env.local` n'affecte que Next.js serveur, jamais les scripts campaign |
| 67 | Un champ observable manquant = dette de testabilité, pas un bug |

## 8. Prompt de passation v5 — Fin

**Fin de l'addendum v5.** Ce document complète v4. Les deux doivent être lus ensemble.

À l'ouverture de la prochaine session :
1. **Confirmer** la lecture de v4 + v5 (règles + état).
2. **Confirmer** être prêt à reprendre le rôle de Superviseur.
3. **Demander** : « Quelle phase souhaites-tu démarrer ? (V1.3 reverse engineering,
   V1.4 exports, V1.5 dettes admin, ou autre ?) »
4. **Ne produis pas d'analyse statique.** Attends la réponse.

**La campagne V0+V1+V1.1+V1.2 est close. Le dépôt est propre. Bonne pause.** 🏖️
