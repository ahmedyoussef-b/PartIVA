# Audit qualité + dette technique — E8-S02

**Date :** 2026-10-13
**Auteur :** Superviseur IA
**Statut :** Audit E8-S02

---

## 1. Baseline qualité

| Indicateur | Valeur | Statut |
|---|---|---|
| ESLint | 0/0 | ✅ |
| TypeScript | 0 erreur | ✅ |
| Prettier | 0 | ✅ |
| Build | 59 routes | ✅ |
| E2E | 284 passed / 0 failed / 4 skipped (288 listés) | ✅ |
| Prisma | 15 migrations | ✅ |

**Baseline tenue.**

**Détail build (59 routes) :** 24 pages statiques (○) + 35 routes dynamiques (ƒ) — incluant `/api/auth/[...all]`, `/api/health`, `/api/parts/*`, `/api/requests/*`, `/api/search`, `/api/search/photo`, `/api/search/vehicle`, `/api/search/vin`, `/api/sync`, `/api/upload`, plus pages admin/client/publiques.

**Détail E2E (288 tests listés dans 41 fichiers) :** 284 exécutés (284 passed / 0 failed / 4 skipped) + 4 skipped conditionnels (photo HF, backfill embeddings). Répartition par projet Playwright : chromium 201, admin 32, user 17, viewer 17, public 16, setup 3, warmup 1, ids-setup 1.

---

## 2. Dette technique

### 2.1 Synthèse

| Sévérité | Nombre | Cible |
|---|---|---|
| Haute | 0 | — |
| Moyenne | 5 | E7 (credentials) |
| Faible | 14 | E7/E8/documentée |

### 2.2 Dettes Moyennes (5) — reportées E7

- `D-photo-embedding-backfill` — HF_API_TOKEN absent (backfill 5 images seed, outil prêt `scripts/backfill-embeddings.ts`)
- `D-traceparts-credentials` — TRACEPARTS_TENANT_UID + TRACEPARTS_API_KEY (mode mock actif)
- `D-deploy-comptes` — comptes Vercel/Sentry/domaine absents (mode placeholder prêt)
- `D-tecdoc-credentials` — contrat commercial TecDoc/TecAlliance (mode mock actif)
- `D-tecdoc-auto-parts` — contrat TecDoc pour fitment réel (modèle Prisma + connecteur mock prêts)

**Les 5 Moyennes sont bloquées par des credentials/contrats externes.** Aucune n'est actionnable en code sans provisioning externe.

### 2.3 Dettes Faibles (14) — statut

| ID | Description | Cible | Statut |
|---|---|---|---|
| `D-e2e-constraints` | Regroupement 9 contraintes E2E documentaires (isolation, timeouts, auth dual, résidus, fixtures) | Session E2E dédiée | Documentée (`docs/e2e-constraints.md`) |
| `D-hnsw-drift` | Drift index HNSW (structurel — Prisma ne modélise pas HNSW sur `Unsupported`) | — (drift attendu) | Structurel, procédure documentée (`docs/migration-drift.md`) |
| `D-completeness-category-keys` | Liste requise globale (8 clés) vs par catégorie (nécessite migration `CategoryRequiredSpec`) | E7 (migration Prisma) | Reportée E7 |
| `D-completeness-blocking` | Complétude = suggestion passive (blocage = arbitrage workflow) | E7 (arbitrage workflow) | Reportée E7 |
| `D-openserp-inadapte` | OpenSERP = moteur SERP web, pas catalogue de pièces (rejeté R.5.16) | — (inadapté) | Clôturée par rejet |
| `D-powershell-utf8-bom` | PowerShell 5.1 ajoute BOM UTF8 sur fixtures JSON | Documentation | R.5.3 documentée |
| `D-searchsource-i18n-sync` | Synchronisation SearchSourceSchema ↔ i18n (R.5.2) | Documentation / refactor | Dette documentaire permanente (vérifiée E6-S10) |
| `D-wikidata-timeout` | Wikidata SPARQL peut dépasser timeout Playwright | Documentation | R.5.4 documentée |
| `D-cadenas-access` | CADENAS sans API self-service (CGU restrictives, pénalités chiffrées) | Session dédiée (contrat) | Abandonné MVP (D-E3-19) |
| `D-source-all-semantics` | `source: 'all'` = agrégé 3 sources (breaking change potentiel) | Documentation | Documentée |
| `D-playwright-prisma-esm` | Import Prisma direct dans specs Playwright échoue (ESM/CJS) | Documentation | R.5.7 documentée |
| `D-playwright-admin-storageState` | Tests API authentifiés → projet admin (storageState) | Documentation | R.5.8 documentée |
| `D-e2e-load-timeouts` | Suite complète > 600s sur filesystem `F:\` lent | Session E2E dédiée | Contournement isolation |
| `D-e2e-fetch-timeout` | Assertions UI async flaky sans timeout explicite | Session E2E dédiée | Pattern `toBeVisible({ timeout: 15_000 })` appliqué |
| `D-industrial-catalog-dataset` | Dataset HF `swan07/industrial-parts-data` — extrait embarqué (import complet E7) | Session dédiée (import dataset) | Mode embarqué fonctionnel (E6-S05) |
| `D-rebrickable-pattern` | Pattern Rebrickable — positionnement documenté, approfondissement E8 | E8 (stabilisation) | Documenté (`docs/positioning.md`) |

**Note :** `D-e2e-isolation`, `D-e2e-parts-residues`, `D-e2e-auth-dual`, `D-s03-t3-ecart`, `D-enums-non-utilises`, `D-ui-orphelins`, `D-docs-template`, `D-roadmap-retard`, `D-27-bis`, `D-44`, `D116` sont des dettes historiques E0/E1 soit résolues, soit regroupées dans `D-e2e-constraints`, soit documentées. `D-audit-mysql2` (Haute historique) est **acceptée et tracée** — `mysql2` transitif de `prisma`, non utilisé (PostgreSQL), fix = downgrade Prisma 6.19.3 (breaking) refusé, attente Prisma 8 (D116). **Ce n'est pas une dette Haute active** — c'est une vulnérabilité npm acceptée, non exploitable (driver PostgreSQL).

**Verdict dette :** 0 dette Haute actionnable. 5 Moyennes bloquées externes (E7). Faibles documentées ou reportées.

---

## 3. Couverture de tests

| Indicateur | Valeur |
|---|---|
| Specs E2E | 38 fichiers `.spec.ts` |
| Tests E2E | 288 listés (284 exécutés + 4 skipped) |
| Répartition par projet | chromium 201, admin 32, user 17, viewer 17, public 16, setup 3, warmup 1, ids-setup 1 |
| Répartition par dossier | e2e/ 24 specs, e2e/admin/ 8, e2e/viewer/ 2, e2e/user/ 2, e2e/public/ 2 |
| Fichiers source (TS/TSX) | 207 |
| Ratio specs / fichiers source | 38 / 207 ≈ 18,4% |

**Verdict :** couverture E2E **suffisante** pour le périmètre MVP — 284 tests couvrant les parcours critiques (auth, RBAC admin/user/viewer, CRUD pièces, recherche multi-source, agrégation, complétude, auto-parts VIN/fitment, placeholder, santé). La couverture est orientée E2E (Playwright) plutôt que tests unitaires (aucun framework de tests unitaires n'est installé — à envisager en phase de stabilisation ultérieure si besoin).

---

## 4. Sécurité

- ✅ Aucun token/key/secret en `NEXT_PUBLIC_` (Sécurité #7) — recherche `NEXT_PUBLIC_.*(token|key|secret|password)` sur `src/**/*.ts` et `src/**/*.tsx` = 0 résultat
- ✅ Variables d'env sensibles non exposées — `process.env` dans `src/lib/connectors` et `src/lib/data` = uniquement des variables serveur (`WIKIDATA_USER_AGENT`, `TRACEPARTS_TENANT_UID`, `TRACEPARTS_API_KEY`, `TECDOC_API_KEY`, `TECDOC_PROVIDER_ID`), aucune en `NEXT_PUBLIC_`
- ✅ `next-env.d.ts` non modifié (Règle #32) — working tree clean
- ✅ Auth BetterAuth 1.7.7, protection routes via `src/proxy.ts`, auth VIEWER+ sur routes API sensibles (`POST /api/search`, `POST /api/parts`, `/api/search/vehicle`, `/api/search/vin`)

**Verdict :** conforme.

---

## 5. Migrations Prisma

- 15 migrations présentes (liste exhaustive) :
  1. `20261005205235_init_core_schema`
  2. `20261005233326_add_request_machine_material`
  3. `20261007000000_add_better_auth_models`
  4. `20261007010000_add_better_auth_required_columns`
  5. `20261008100000_add_search_candidate`
  6. `20261009153819_add_part_client_relation`
  7. `20261009161856_apply_machine_material_enums`
  8. `20261009172217_extend_part_dossier_numerique`
  9. `20261009190000_complete_part_status_workflow`
  10. `20261009213221_add_part_version`
  11. `20261009222903_add_public_id_to_part_image_and_attachment`
  12. `20261010002927_add_part_search_index`
  13. `20261010133855_add_part_image_embedding`
  14. `20261010160000_add_scoring_weights`
  15. `20261013020211_add_vehicle_fitment_auto_parts`
- DB up to date (`npx prisma migrate status` = "Database schema is up to date!")
- Schéma valide (`npx prisma validate` = "The schema at prisma\schema.prisma is valid 🚀")
- Drift GIN/HNSW documenté (`D-hnsw-drift`, `docs/migration-drift.md`) — drift structurel attendu, procédure manuelle R.4.1-ter

**Verdict :** conforme.

---

## 6. Documentation

### 6.1 Existante (15 fichiers `docs/*.md` + README.md)

- `README.md` ✅ (présent)
- `docs/debts-documentation.md` — dettes documentaires (R.5.14)
- `docs/deployment.md` — guide de déploiement
- `docs/e2e-constraints.md` — 9 contraintes E2E regroupées
- `docs/e4-close-report.md` — rapport de clôture E4
- `docs/e5-s01-cadrage.md` — cadrage E5
- `docs/e5-s03-blocage.md` — rapport de blocage E5-S03
- `docs/e5-s04-openserp-inadapte.md` — requalification OpenSERP
- `docs/e6-close-report.md` — rapport de clôture E6
- `docs/e6-s01-cadrage.md` — cadrage E6
- `docs/e6-s04-cadrage.md` — cadrage E6-S04
- `docs/e6-s05-auto-parts-spec.md` — spécification auto-parts
- `docs/e6-s05-cadrage.md` — cadrage E6-S05
- `docs/e8-s01-cadrage.md` — cadrage E8 (E8-S01)
- `docs/migration-drift.md` — procédure drift R.4.1-ter
- `docs/positioning.md` — positionnement Rebrickable

### 6.2 Manquante ou à compléter (cibles E8)

- `docs/architecture.md` (E8-S03) — architecture technique détaillée
- `docs/production-checklist.md` (E8-S05) — checklist production + variables d'env
- `docs/e7-credentials.md` (E8-S06) — credentials requis pour E7
- `docs/e8-s02-audit.md` (ce fichier — E8-S02)
- `docs/e8-close-report.md` (E8-clôture)

**Verdict :** documentation de phase (E1 → E8) et technique (positioning, migration-drift, deployment, e2e-constraints, debts-documentation) présente. Les documents de production (architecture, checklist, credentials E7) sont les livrables des sessions E8-S03/S05/S06.

---

## 7. Points d'amélioration identifiés

*(Sans correction — E8 est documentaire)*

1. **Tests unitaires absents** — aucun framework de tests unitaires (Jest/Vitest) n'est installé. La couverture est 100% E2E (Playwright). À envisager si la stabilisation le justifie (coût/bénéfice à arbitrer — les 284 tests E2E couvrent déjà les parcours critiques).
2. **5 dettes Moyennes bloquées externes** — le déblocage nécessite un provisioning Coordinateur (HF_API_TOKEN, TRACEPARTS_*, comptes Vercel/Sentry/domaine, contrat TecDoc). E8-S06 documentera la procédure de provisioning.
3. **`D-industrial-catalog-dataset`** — le connecteur catalogue industriel utilise un extrait embarqué (10 pièces). L'import batch complet du dataset HF (E7) permettrait un catalogue exhaustif.
4. **`D-rebrickable-pattern`** — positionnement documenté (`docs/positioning.md`) mais approfondissement (cas d'usage concrets, concurrence, différenciation) à compléter en E8.
5. **Documentation de production incomplète** — `docs/architecture.md`, `docs/production-checklist.md`, `docs/e7-credentials.md` sont les livrables E8-S03/S05/S06 (en cours de phase).
6. **`D-audit-mysql2`** — vulnérabilité npm acceptée (mysql2 transitif de prisma, non utilisé). Suivi en attente Prisma 8 (D116). Non exploitable (driver PostgreSQL).

---

## 8. Verdict global

**Qualité :** ✅ conforme (baseline tenue 6/6, 0 dette Haute actionnable, sécurité conforme Sécurité #7, migrations à jour, schéma valide).

**Dette technique :** 5 Moyennes (reportées E7 — credentials externes), 14+ Faibles (documentées, reportées E7/E8, ou structurelles).

**Recommandations :**
- Poursuivre E8 (documentation projet E8-S03, déploiement E8-S04, checklist E8-S05, credentials E8-S06)
- E7 dès que les credentials sont provisionnés (déblocage des 5 Moyennes)

---

**Fin de l'audit E8-S02.**
