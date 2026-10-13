# Contraintes E2E — PartIVA

> Document de référence (E4-S06, D6). Regroupe les 7 dettes E2E Faibles
> en une dette unique `D-e2e-constraints`. Chaque contrainte est
> documentée avec son statut, son impact et son contournement.

---

## 1. `D-e2e-isolation` — Contrainte environnementale

**Statut** : acceptée (filesystem `F:\` lent + dev server Windows).

**Constat** : 1-2 échecs intermittents par run E2E complète (jamais les mêmes, jamais en isolation).

**Contournement** : exécuter les tests lents en isolation pour confirmer. Le correctif réel (déplacer le repo hors `F:\`) est hors périmètre projet.

**Règle** : R.5.11 — les timeouts E2E sur filesystem lent ne sont pas des échecs fonctionnels.

---

## 2. `D-e2e-load-timeouts` — Timeouts de charge

**Statut** : documentée (E4-S03).

**Constat** : la suite complète (236 tests) peut dépasser 600s sur `F:\`, provoquant 2 timeouts de charge (`api.spec.ts:16`, `cloudinary-upload.spec.ts:20`). Les tests passent en isolation.

**Contournement** : exécuter les tests lents en isolation. Décompte complet : 233 passed + 0 timeout-charge = 233 fonctionnels (E4-S05).

---

## 3. `D-e2e-fetch-timeout` — Assertions UI async

**Statut** : documentée (E4-S04).

**Constat** : les tests UI dépendant d'un fetch async (ex. `PartDossier` → `/api/parts/[id]/completeness`) peuvent être flaky sans timeout explicite.

**Contournement** : `toBeVisible({ timeout: 15_000 })` pour les assertions UI async. Appliqué en E4-S04 (test 1 flaky → déterministe).

---

## 4. `D-e2e-auth-dual` — Double mécanisme d'auth

**Statut** : documentée.

**Constat** : deux mécanismes coexistent :
- `authRequest` (projet `chromium`) — login API via `POST /api/auth/sign-in/email`
- `storageState` (projets `admin`/`user`/`viewer`) — `.auth/{role}.json`

**Contournement** : R.5.8 — les tests API authentifiés doivent être dans `e2e/admin/` (projet admin avec storageState), pas dans `e2e/` (projet chromium).

---

## 5. `D-e2e-skip-conditional` — Skip conditionnel

**Statut** : documentée.

**Constat** : skip conditionnel `part-versions.spec.ts` (test transition crée version) — skip si aucune pièce SUBMITTED en seed (consommée par un test antérieur).

**Contournement** : fixture `ensureSubmittedPart` (E2-S10) — création part SUBMITTED via Prisma/tsx en `beforeEach` ciblé. Le test versions ne skip plus (exécution déterministe).

---

## 6. `D-e2e-residues` — Résidus spécifications

**Statut** : documentée.

**Constat** : tests CRUD `e2e/part-specifications.spec.ts` (POST `e2e-spec-*`, `e2e-dup-*`, `e2e-patch-*`) créent des specs sans `afterEach`/`afterAll` de cleanup — seul `e2e-del-*` est nettoyé (DELETE explicite).

**Contournement** : nettoyage PR E2-S04 (`DELETE WHERE key LIKE 'e2e-%'` → 0, 25 specs seed intactes). Prévention : ajouter cleanup aux tests CRUD (session E2E dédiée).

---

## 7. `D-e2e-parts-residues` — Résidus parts

**Statut** : documentée.

**Constat** : tests E2E créant des parts sans cleanup : fixture `ensureSubmittedPart` (`E2E-RESET-*`, E2-S10) + tests `POST /api/parts` (`E2E-*`, E2-S11). Pas de `DELETE /api/parts/[id]` (route `[id]` = GET uniquement). Croissance cumulative : ~4 parts par run.

**Contournement** : ajouter `DELETE /api/parts/[id]` (audit cascade suppression) + cleanup `afterEach`/`afterAll` ciblé. Alternative : reseed périodique (`npx tsx prisma/seed.ts` — destructif).

---

## 8. `D-e2e-tecdoc-mock` — Tests TecDoc mock (E6-S08)

**Statut** : documentée (E6-S10).

**Constat** : les tests TecDoc (`e2e/tecdoc.spec.ts`, `e2e/tecdoc-vehicle.spec.ts`, `e2e/tecdoc-vin.spec.ts`) manipulent directement `process.env.TECDOC_API_KEY` / `process.env.TECDOC_PROVIDER_ID` pour forcer le mode mock (pattern `withMockMode`). Les tests sont **unitaires** (pas d'UI) — ils n'ont pas besoin du webServer Playwright, mais le config `reuseExistingServer` les lance quand même.

**Contournement** : exécuter les specs TecDoc en isolation (`npx playwright test e2e/tecdoc*.spec.ts --project=chromium`) — 26/26 passés en 5s. Le webServer timeout (filesystem `F:\` lent, `D-e2e-isolation`) n'affecte pas les tests unitaires si un serveur est déjà lancé.

**Note** : le mode réel (E6-S09) est conditionnel au contrat TecDoc (`D-tecdoc-credentials`) — test skip automatiquement si `TECDOC_API_KEY` absent.

---

## 9. `D-e2e-fixtures-tecdoc` — Fixtures enrichies (E6-S08)

**Statut** : documentée (E6-S10).

**Constat** : les fixtures TecDoc enrichies (`src/lib/data/tecdoc-fixtures.ts` — 60 pièces, 25 véhicules, 60 fitments) sont **embarquées** (pas de fetch runtime). Les tests de cohérence référentielle (fitments → produits + véhicules) sont exécutés en mode mock uniquement.

**Contournement** : validation Zod `TecDocFixturesSchema` au chargement (`validateFixtures()`). Les tests de cohérence (`fixtures — cohérence référentielle`, `fixtures — 50+ pièces, 20+ véhicules`) vérifient l'intégrité des fixtures.

**Règle** : toute modification des fixtures doit maintenir la cohérence référentielle (fitments → produits + véhicules existants) — sinon les tests échouent.

---

## Synthèse

| Contrainte | Classe | Contournement |
|---|---|---|
| `D-e2e-isolation` | Environnementale | isolation des tests lents |
| `D-e2e-load-timeouts` | Charge | isolation des tests lents |
| `D-e2e-fetch-timeout` | Flaky UI | `toBeVisible({ timeout: 15_000 })` |
| `D-e2e-auth-dual` | Auth | R.5.8 (projet admin + storageState) |
| `D-e2e-skip-conditional` | Déterminisme | fixture `ensureSubmittedPart` |
| `D-e2e-residues` | Résidus DB | cleanup ciblé (session dédiée) |
| `D-e2e-parts-residues` | Résidus DB | `DELETE /api/parts/[id]` (session dédiée) |
| `D-e2e-tecdoc-mock` | Mock env | isolation des specs TecDoc |
| `D-e2e-fixtures-tecdoc` | Fixtures | validation Zod + cohérence référentielle |

**Total** : 9 dettes Faibles regroupées en **1 dette** `D-e2e-constraints` (Faible).

**Règle R.5.13** : une session de performance peut légitimement ne pas optimiser si les mesures montrent que ce n'est pas nécessaire (E4-S05 — livrable = mesure instrumentée + documentation).
