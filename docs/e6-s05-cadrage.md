# CADRAGE — E6-S05 (Catalogue Dockerisé alternatif)

**Session :** E6-S05 — Catalogue Dockerisé alternatif
**Type :** Technique (autonome — identification d'abord)
**Date :** 2026-10-13
**Statut :** ⏳ **En attente confirmation explicite D1-D10** (STOP-D renforcé — R.5.17)
**Baseline HEAD :** `294273a` (E6-S04)

---

## 0. Note préalable — R.5.17 (format de décision)

**Constat :** les décisions D1-D10 sont fournies **sans coche explicite** (options listées). C'est la **3ᵉ fois consécutive** (E5-S06, E6-S01, E6-S04).

**Lecture par déduction** (recommandations Superviseur) — **provisoire** :

| # | Question | Lecture | Confiance |
|---|---|---|---|
| D1 | E6-S05 = prochaine session ? | **Oui** | Haute |
| D2 | Périmètre : identifier ou intégrer ? | **Identifier** | Haute |
| D3 | Docker non obligatoire ? | **Oui** | Haute |
| D4 | Clôturer si rien de pertinent ? | **Oui** | Haute |
| D5 | Évaluer Elasticsearch/Meilisearch ? | **Oui** | Moyenne |
| D6 | Migration Prisma : non ? | **Non** | Haute |
| D7 | Tests E2E (si intégration) ? | **Oui** | Haute |
| D8 | `'catalog_x'` dans enum (si intégration) ? | **Oui** | Haute |
| D9 | Intégration agrégateur (si intégration) ? | **Oui** | Haute |
| D10 | R.5.17 : coche explicite ? | **Oui** | Haute |

**⚠️ STOP-D renforcé :** l'Exécutant **ne démarre pas** E6-S05 sans **confirmation explicite** du Coordinateur (coche). Le périmètre (Scénario A vs B) dépend de D2-D4 — une lecture par déduction est trop risquée pour cette session.

---

## 1. Contexte technique (Bloc 0 reconnaissance)

### 1.1 Architecture des connecteurs (E3-E5)

- **`SourceConnector`** (`src/lib/connectors/types.ts`) : interface `{ source, weight, timeoutMs?, isAvailable(), search() }`. `source` est une union `'local_db' | 'wikidata' | 'traceparts' | 'tecdoc'`.
- **`aggregateSearch()`** (`src/lib/connectors/aggregator.ts`) : `Promise.allSettled` + timeout global 5s, déduplication par `name` normalisé, score `sourceWeight × sourceScore + freshnessBonus`.
- **`searchWithFallback()`** : séquentiel, ordre `wikidata → traceparts → tecdoc → local_db`.
- **`SearchCandidate`** (`src/schemas/search.ts`) : schéma Zod normalisé (name, partNumber?, manufacturer?, specs?, scores?, metadata?, source).
- **`SearchSourceSchema`** : enum des sources (synchronisé avec `src/i18n/fr.ts` — R.5.2).

### 1.2 Sources actives (4)

| Source | Poids | Statut | Nature |
|---|---|---|---|
| `local_db` | 1.0 | ✅ Réel | Données métier PartIVA |
| `wikidata` | 0.8 | ✅ Réel | SPARQL endpoint public (label exact) |
| `traceparts` | 0.6 | 🟠 Mock | Catalogue fabricant (JWT à provisionner — E7) |
| `tecdoc` | 0.5 | 🟠 Mock | Référentiel automobile (contrat requis — E7) |

### 1.3 Sources rejetées/abandonnées

- **OpenSERP** (`D-openserp-inadapte`) : moteur SERP web, pas catalogue de pièces (E5-S04, R.5.16).
- **CADENAS** (`D-cadenas-access`) : aucune API self-service, CGU restrictives (E3-S04).

### 1.4 Leçon R.5.16

**Vérifier la nature d'une source (capturer une réponse réelle) AVANT de la retenir comme `SourceConnector`.** E3-S01 avait retenu OpenSERP sur hypothèse non vérifiée → E5-S04 a évité un connecteur inutile. E6-S05 applique la même rigueur.

---

## 2. Bloc 0 — Identification (R.5.16)

### 2.1 Candidats à évaluer

| Candidat | Type | Docker | API self-service | Pertinence PartIVA | Vérification |
|---|---|---|---|---|---|
| **Wikidata SPARQL** | Base connaissances | Non | ✅ Publique | Déjà intégré | — |
| **OpenCorporates** | Entreprises | Non | ❌ Payante | Faible | API payante → rejet |
| **GrabCAD** | Catalogue CAO | Non | ❓ À vérifier | Élevée | Vérifier API |
| **Thingiverse** | Catalogue 3D | Non | ✅ | Faible | Hobby → rejet |
| **McMaster-Carr** | Catalogue industriel | Non | ❌ Pas d'API | Élevée | Pas d'API → rejet |
| **TraceParts** | Catalogue CAO | Non | ✅ (mock) | Élevée | Déjà intégré (mock — E7) |
| **CADENAS** | Catalogue CAO | Non | ❌ | Élevée | Abandonné E3-S04 |
| **Elasticsearch + dataset** | Moteur + data | ✅ | ✅ | Dépend du dataset | Vérifier dataset industriel |
| **Meilisearch + dataset** | Moteur + data | ✅ | ✅ | Dépend du dataset | Vérifier dataset industriel |
| **Datasets Hugging Face** | Datasets | Non | ✅ | À évaluer | Chercher datasets industriels |
| **Datasets Kaggle** | Datasets | Non | ✅ | À évaluer | Chercher datasets pièces |

### 2.2 Critères de sélection

1. **Open-source** (licence permissive)
2. **Self-service** (pas de contrat, pas de credentials payants)
3. **Pertinence métier** (pièces industrielles, fabricants, normes)
4. **Mapping `SearchCandidate` possible** (R.5.16)
5. **Docker non obligatoire** (préférer API ou dataset — D3)

### 2.3 Critère de succès

- Au moins **1 candidat pertinent** identifié
- Sa **nature vérifiée** (réponse réelle capturée — R.5.16)
- **Mapping `SearchCandidate` possible**

### 2.4 Critère de STOP

- Si **aucun candidat pertinent** → STOP + rapport (Scénario B — clôture par décision)

### 2.5 Preuve attendue

- Tableau des candidats évalués
- Extrait de réponse réelle (si candidat retenu)
- Décision motivée

---

## 3. Scénario A — Intégration (si candidat pertinent)

**Si un candidat pertinent est identifié (et nature vérifiée R.5.16) :**

```
Bloc A — Schéma Zod (CatalogXResponseSchema)
Bloc B — Data layer (src/lib/data/catalogx.ts)
Bloc C — Connecteur (src/lib/connectors/catalogx.ts — implémente SourceConnector)
Bloc D — Ajout 'catalogx' à SearchSourceSchema + i18n fr.ts (R.5.2)
Bloc E — Intégration agrégateur (ALL_CONNECTORS + SOURCE_WEIGHTS + priority fallback)
Bloc F — Tests E2E (réels)
Bloc G — Validation globale (tsc, lint, prettier, build)
Bloc H — DEBT.md + SESSION.md + ROADMAP.md
```

**Contraintes :**
- Aucune migration Prisma (D6 = Non) — `SearchCandidate.source` est un champ String ouvert (pas d'enum Prisma)
- `'catalog_x'` ajouté à `SearchSourceSchema` (D8) + synchronisé i18n (R.5.2)
- Intégration agrégateur (D9) : `ALL_CONNECTORS` + `SOURCE_WEIGHTS` + ordre fallback
- Tests E2E réels (D7)

**Baseline cible :** +4-6 tests E2E (243 → 247-249).

---

## 4. Scénario B — Clôture par décision (si rien de pertinent)

**Si aucun candidat pertinent (ou nature non vérifiable) :**

```
Bloc A — Documenter la recherche (docs/e6-s05-catalogue-recherche.md)
Bloc B — DEBT.md : pas de nouvelle dette (ou D-catalogue-alternatif si pertinent partiel)
Bloc C — SESSION.md + ROADMAP.md
Bloc D — Validation + commit
```

**Baseline cible :** inchangée (243/2/4).

**Pattern E5-S04** : documenter, clôturer, ne pas forcer (R.5.16).

---

## 5. Baseline cible E6-S05

| Métrique | Avant (E6-S04) | Après (E6-S05) |
|---|---|---|
| ESLint | 0/0 | 0/0 |
| TypeScript | 0 err | 0 err |
| Prettier | 0 | 0 |
| Build | 57 routes | 57 routes (A et B) |
| E2E | 243/2/4 | **247-249/0/4** (A) / **243/2/4** (B) |
| Prisma | 14 migrations | 14 migrations (D6 = Non) |
| Dettes | 7 (4 M + 3 F) | 7 (A) / 7-8 (B) |

---

## 6. Décisions à confirmer explicitement (Coordinateur)

**⚠️ STOP-D renforcé — confirmation explicite requise (R.5.17).**

| # | Décision | Options | Recommandation | **Coche requise** |
|---|---|---|---|---|
| **D1** | E6-S05 = prochaine session ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D2** | Périmètre : identifier d'abord ? | Identifier / Intégrer | Identifier | **[ ] Identifier [ ] Intégrer** |
| **D3** | Docker non obligatoire ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D4** | Clôturer si rien de pertinent ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D5** | Évaluer Elasticsearch/Meilisearch ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D6** | Migration Prisma : non ? | Oui / Non | Non | **[ ] Non [ ] Oui** |
| **D7** | Tests E2E (si intégration) ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D8** | `'catalog_x'` dans enum (si intégration) ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D9** | Intégration agrégateur (si intégration) ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D10** | R.5.17 : coche explicite ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |

**⚠️ Confiance moyenne sur D5** — l'évaluation Elasticsearch/Meilisearch est une option parmi d'autres. Si le Coordinateur souhaite restreindre aux APIs open-source self-service (pas de moteur + dataset), D5 = Non.

**Action requise :** confirmer explicitement la lecture (coche) **ou** corriger les décisions qui diffèrent.

---

## 7. Ce que je produis sur confirmation D1-D10

**Sur confirmation explicite D1-D10 :** je produis le **rapport d'exécution E6-S05** :

1. **Bloc 0** — Identification des candidats (tableau évalué)
2. **Vérification nature** (R.5.16) — capture d'une réponse réelle si candidat retenu
3. **Scénario A ou B** selon le résultat :
   - **A** — intégration complète (schéma Zod, data layer, connecteur, enum, agrégateur, tests E2E)
   - **B** — clôture par décision (document de recherche, pas de connecteur)
4. **Validation** (tsc, lint, prettier, build)
5. **Commit** + mise à jour DEBT.md/SESSION.md/ROADMAP.md

---

**FIN DU CADRAGE E6-S05 — En attente confirmation explicite D1-D10 (R.5.17).**

**Note méta :** 3 sessions consécutives ont reçu des décisions sans coche. La lecture par déduction a été correcte, mais le risque augmente. Pour E6-S05, le périmètre (Scénario A vs B) dépend entièrement de D2-D4 — une lecture par déduction est trop risquée. **Confirmation explicite requise avant exécution.** R.5.17 (format `D1 = Oui`) est la plus urgente à appliquer.
