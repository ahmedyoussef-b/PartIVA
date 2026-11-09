# DETTES ACTIVES — PartIVA

**Dernière mise à jour :** 2026-11-10
**Source :** `PROMPT DE PASSATION — Superviseur IA Externe — v10` §3 (2026-11-10)
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

---

## Notes

- **Registre actif uniquement** (charte §10). Les dettes résolues ne figurent pas ici.
- **Actions critiques (non dettes) :** voir `ETAT_COURANT.md` §« Actions critiques » (mot de passe admin, hook BOM, `$env:ADMIN_PASSWORD`).
- **Source :** v10 §3 (2026-11-10). Toute modification ultérieure nécessite un arbitrage du coordinateur.
- **Historique :** `git log -- docs/etat/DETTES.md` + `git show <commit>:docs/etat/DETTES.md`.