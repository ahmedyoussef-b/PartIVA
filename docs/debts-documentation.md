# Dettes documentaires — PartIVA

> Document de référence (E5-S06, D7). Regroupe les dettes Faibles
> **clôturées par décision** (documentées, pas corrigées par code).
> Chaque dette est documentée avec sa nature, sa décision et sa justification.

---

## 1. `D-ts6133-noUnusedLocals` — Faux positifs TS6133

**Statut** : ✅ **clôturée** (E5-S06, D3 = Documenter).

**Nature** : avec `--noUnusedLocals`, TypeScript signale 30+ avertissements TS6133 — imports `React` dans composants `'use client'` (requis par JSX transform React 19) + variables de test non lues. **Faux positifs.**

**Constat** : `tsconfig.json` **n'active pas** `--noUnusedLocals` (absent de `compilerOptions`). `tsc --noEmit` = **0 erreur**.

**Décision** : **ne pas activer** `--noUnusedLocals`. La dette est clôturée par décision — aucune correction de code nécessaire.

**Justification** : activer `--noUnusedLocals` nécessiterait des `// eslint-disable` ou `// @ts-expect-error` sur 30+ occurrences (imports React requis par JSX transform). Le coût (bruit) dépasse le bénéfice. `tsc --noEmit` sans `--noUnusedLocals` est la configuration de référence (0 erreur).

---

## 2. `D-scoring-weights-table-unused` — Table `scoring_weights` vide

**Statut** : ✅ **clôturée** (E5-S06, D4 = Documenter).

**Nature** : la table `scoring_weights` (Prisma, migration `20261010160000_add_scoring_weights`) existe mais contient **0 ligne**. `loadScoringWeights()` retourne `DEFAULT_WEIGHTS` (fallback). La table n'est ni peuplée ni utilisée en production.

**Constat** : `DEFAULT_WEIGHTS` (`src/lib/scoring.ts:25`) est la **source de vérité** des poids intra-candidat. `loadScoringWeights()` (`src/lib/scoring.ts:107`) retourne `DEFAULT_WEIGHTS` si la table est vide — comportement actuel (table vide).

**Décision** : **Option C** — documenter la table comme **non utilisée** (héritage E2-S06). `DEFAULT_WEIGHTS` reste la source de vérité. Dette clôturée.

**Justification** :
- **Option A** (peupler) : nécessite une migration Prisma (insérer les poids par défaut) + code de chargement. Complexité injustifiée — `DEFAULT_WEIGHTS` suffit.
- **Option B** (supprimer) : migration Prisma **destructive**. Risque. Hors périmètre E5-S06 (D5 = Non, aucune migration).
- **Option C** (documenter) : la table est un héritage E2-S06 (score multi-critères). `DEFAULT_WEIGHTS` est la source de vérité. Aucune action requise.

**Note** : si une UI admin d'ajustement des poids est créée (E6+), la table sera peuplée à ce moment. En attendant, `DEFAULT_WEIGHTS` est la référence.

---

## 3. `D-openserp-inadapte` — OpenSERP inadapté au périmètre

**Statut** : ✅ **clôturée** (E5-S04, requalification).

**Nature** : OpenSERP (karust/openserp) est un **moteur SERP web** (Google, Yandex, Baidu, Bing, DuckDuckGo, Ecosia), **pas un catalogue de pièces industrielles**. Aucun champ `partNumber`/`manufacturer`/`cadAvailable` dans les réponses. Mapping `SearchCandidate` impossible.

**Constat** : découverte Bloc 0 E5-S04 — `/health` retourne `engines: [google, yandex, baidu, bing, duckduckgo, ecosia]`. Docker provisionné (conteneur `openserp` healthy, port 7000) mais inadapté au périmètre.

**Décision** : OpenSERP **rejeté** comme source de pièces (D-E5-S04-1). Aucun `openserpConnector` créé (D-E5-S04-2). Docker provisionné = actif pour usages futurs (D-E5-S04-4).

**Document de référence** : `docs/e5-s04-openserp-inadapte.md`.

**Leçon** : R.5.16 — vérifier la nature d'une source (capturer une réponse réelle) avant de la retenir comme `SourceConnector`. E3-S01 avait retenu OpenSERP sur hypothèse non vérifiée.

---

## 4. `D-e2e-constraints` — Contraintes E2E regroupées

**Statut** : ✅ **documentée** (E4-S06, D6).

**Nature** : regroupement de 7 dettes E2E Faibles en une dette unique.

**Détail** :
1. `D-e2e-isolation` — filesystem `F:\` lent, 1-2 échecs intermittents/run, jamais en isolation
2. `D-e2e-load-timeouts` — suite complète > 600s, 2 timeouts de charge passent en isolation
3. `D-e2e-fetch-timeout` — assertions UI async flaky, pattern `toBeVisible({ timeout: 15_000 })`
4. `D-e2e-auth-dual` — double auth (`authRequest` chromium + `storageState` admin/user/viewer), R.5.8
5. `D-e2e-skip-conditional` — skip conditionnel `part-versions.spec.ts`, fixture `ensureSubmittedPart`
6. `D-e2e-residues` — résidus specs CRUD `e2e-spec-*` sans cleanup
7. `D-e2e-parts-residues` — résidus parts `E2E-*` sans cleanup, ~4 parts/run

**Document de référence** : `docs/e2e-constraints.md`.

**Contournements** : isolation des tests lents, `toBeVisible({ timeout: 15_000 })`, R.5.8 (projet admin), fixture `ensureSubmittedPart`, cleanup ciblé (session dédiée).

---

## 5. `D-hnsw-drift` — Drift index HNSW (structurel)

**Statut** : ✅ **documentée** (E4-S05) — drift **structurel** attendu.

**Nature** : Prisma ne modélise pas les index HNSW sur colonnes `Unsupported("vector(768)")`. `migrate dev` tente de dropper l'index `part_images_embedding_hnsw`.

**Constat** : l'index existe en DB (`pg_indexes` : `part_images_embedding_hnsw USING hnsw (embedding vector_cosine_ops)`). La migration SQL `20261010133855_add_part_image_embedding` est la source de vérité.

**Décision** : **non corrigeable** sans migration Prisma (D-E3-2) — le drift reprendra à chaque `migrate dev`. Critère de baseline : **0 drift hors `part_images_embedding_hnsw`**.

---

## 6. `D-embedding-model-deviation` — Déviation modèle embedding

**Statut** : ✅ **documentée** (E2-S05).

**Nature** : le modèle embedding utilisé (`Xenova/all-MiniLM-L6-v2` ou équivalent) peut dévier de la référence production. Documentée comme écart acceptable pour le MVP.

**Décision** : acceptée pour le MVP. Revoir en E6 si le modèle production diffère.

---

## Récapitulatif

| Dette | Sévérité | Statut | Décision |
|---|---|---|---|
| `D-ts6133-noUnusedLocals` | Faible | ✅ clôturée (E5-S06) | Documenter — `--noUnusedLocals` désactivé |
| `D-scoring-weights-table-unused` | Faible | ✅ clôturée (E5-S06) | Documenter — `DEFAULT_WEIGHTS` source de vérité |
| `D-openserp-inadapte` | Faible | ✅ clôturée (E5-S04) | Rejeté — moteur SERP web |
| `D-e2e-constraints` | Faible | ✅ documentée (E4-S06) | Regroupement 7 contraintes |
| `D-hnsw-drift` | Faible | ✅ documentée (E4-S05) | Structurel — non corrigeable |
| `D-embedding-model-deviation` | Faible | ✅ documentée (E2-S05) | Acceptée MVP |

**6 dettes Faibles documentaires clôturées** (E5-S06 : 2 nouvelles clôtures — `D-ts6133`, `D-scoring-weights-table`).

---

**FIN DU DOCUMENT — Dettes documentaires clôturées par décision (pas de correction code).**
