# SPÉCIFICATION — E6-S05 Recherche Pièces Auto par Véhicule (Fitment)

**Session :** E6-S05 — Spécification auto-parts
**Type :** Cadrage / Spécification (session documentaire — **aucun code**)
**Date :** 2026-10-13
**Statut :** ⏳ **En attente confirmation explicite D1-D7** (STOP-D renforcé — R.5.17)
**Baseline HEAD :** `471255b` (E6-S05 catalogue industriel)

---

## 0. Note préalable — R.5.17 (format de décision)

**Constat :** les décisions D1-D7 sont fournies **sans coche explicite** (options listées). C'est la **4ᵉ fois consécutive** (E5-S06, E6-S01, E6-S04, E6-S05 catalogue).

**Lecture par déduction** (recommandations Superviseur) — **provisoire** :

| # | Question | Lecture | Confiance |
|---|---|---|---|
| D1 | E6-S05 = spécification auto-parts ? | **Oui** | Haute |
| D2 | Source retenue (E6-S07 mock) ? | **TecDoc mock (enrichi)** | Haute |
| D3 | Modèle fitment : Prisma ou JSON ? | **Prisma** | Haute |
| D4 | Migration Prisma autorisée (E6-S06) ? | **Oui** | **Moyenne** |
| D5 | Route API véhicule (`/api/search/vehicle`) ? | **Oui** | Haute |
| D6 | Filtrage matière plastique ? | **Oui** | Haute |
| D7 | Priorité sessions ? | **Séquentiel** | Haute |

**⚠️ Confiance moyenne sur D4** — la migration Prisma est une décision structurante (change `SearchCandidate`, ajoute tables `Vehicle`/`Fitment`). Si le Coordinateur préfère JSON, D4 = Non.

**⚠️ STOP-D renforcé :** confirmation explicite requise avant exécution (R.5.17).

---

## 1. Contexte

**Objectif :** Spécifier l'architecture de recherche de pièces auto par véhicule (fitment), avec un focus sur les pièces plastique.

**Livrable :** ce document (`docs/e6-s05-auto-parts-spec.md`) — spécification complète, **aucun code**.

**Sessions suivantes (séquentiel, D7) :**
- **E6-S06** — Modèle de données Prisma + migration (D4 = Oui)
- **E6-S07** — Connecteur TecDoc mock enrichi
- **E6-S08** — TecDoc réel (si contrat — `D-tecdoc-credentials`)

**Contexte existant :**
- Connecteur TecDoc mock existant (`src/lib/data/tecdoc.ts`, `src/lib/connectors/tecdoc.ts`) — 3 fixtures (plaquettes frein, filtre huile, amortisseur), recherche full-text + par référence, poids 0.5.
- `SearchCandidate` (`src/schemas/search.ts`) — schéma Zod (id, source, reference, name, manufacturer?, imageUrl?, cadAvailable, datasheetAvailable, scores, metadata?).
- `SourceConnector` (`src/lib/connectors/types.ts`) — interface (source, weight, timeoutMs?, isAvailable(), search()).

---

## 2. Bloc 0 — Évaluation des sources

**Objectif :** Documenter les sources évaluées, justifier le choix TecDoc.

### 2.1 Sources évaluées

| Source | Type | Fitment | Plastique | Contrat | Verdict |
|---|---|---|---|---|---|
| **TecDoc** | Standard aftermarket | ✅ VIN/KType | ✅ Catégorie | Oui (payant) | **Retenu (mock)** |
| RockAuto | Scraper API | ✅ make/model/year | ✅ | Non (crédits) | Alternative |
| NAPA | Scraper API | ✅ fitment guide | ✅ | Non (crédits) | Alternative |
| O'Reilly | Scraper API | ✅ year/make/model | ❌ | Non (crédits) | Rejeté |
| FAPI | OpenAPI | ✅ OEM cross-ref | ❓ | Non | À évaluer |
| auto-parts-db | Base statique | ❌ | ❌ | Non | Rejeté |

### 2.2 Décision

**TecDoc** (standard aftermarket, fitment complet VIN/KType, catégorie plastique).

- **Mode :** mock enrichi en E6-S07, réel en E6-S08 (contrat).
- **Contrat :** dette `D-tecdoc-credentials` (Moyenne) — déjà tracée.
- **Justification :** TecDoc est le standard européen aftermarket (TecAlliance). Fitment structuré (KType = identifiant véhicule TecDoc, VIN = décodage). Catégorisation générique (`genericArticleName`) permet le filtrage plastique.

### 2.3 Alternatives

- **RockAuto / NAPA** : scrapers API non officiels (crédits, CGU restrictives, instabilité). Alternatives si TecDoc non provisionné.
- **O'Reilly** : rejeté (pas de catégorie plastique).
- **FAPI** : à évaluer (OpenAPI, cross-ref OEM).
- **auto-parts-db** : rejeté (base statique, pas de fitment).

---

## 3. Bloc A — Modèle de données fitment (Prisma, D3)

**Objectif :** Spécifier les tables Prisma (E6-S06, D4 = Oui).

### 3.1 Table `Vehicle`

| Champ | Type | Contraintes | Exemple |
|---|---|---|---|
| `id` | String | `@id @default(cuid())` | — |
| `make` | String | — | "BMW" |
| `model` | String | — | "X5" |
| `year` | Int | — | 2019 |
| `engine` | String? | — | "3.0d" |
| `ktype` | String? | `@unique` | ID TecDoc |
| `vin` | String? | `@unique` | optionnel |
| `createdAt` | DateTime | `@default(now())` | — |
| `updatedAt` | DateTime | `@updatedAt` | — |

### 3.2 Table `Fitment`

| Champ | Type | Contraintes | Exemple |
|---|---|---|---|
| `id` | String | `@id @default(cuid())` | — |
| `partId` | String | FK → `Part.id` | — |
| `vehicleId` | String | FK → `Vehicle.id` | — |
| `notes` | String? | — | "avant 2018" |
| `createdAt` | DateTime | `@default(now())` | — |

**Relations :**
- `Part` ↔ `Fitment` : 1:N (une pièce fitte plusieurs véhicules)
- `Vehicle` ↔ `Fitment` : 1:N (un véhicule a plusieurs pièces)
- `@@unique([partId, vehicleId])` — un fitment est unique par (pièce, véhicule)

### 3.3 Extension `Part` (ou `SearchCandidate`)

| Champ | Type | Description |
|---|---|---|
| `material` | String? | ABS, PP, PC, PA, PUR, TPO |
| `category` | String? | body, interior, exterior, mechanical |
| `vehicleFitments` | Fitment[] | relation |

**Note :** `material` existe déjà comme clé `PartSpecification` (textuel, exclu de `REQUIRED_SPEC_KEYS` — `D-completeness-material` clôturée E6-S04). L'extension `Part.material` est un champ dénormalisé pour le filtrage rapide.

---

## 4. Bloc B — Extension `SearchCandidate`

**Objectif :** Spécifier les champs ajoutés à `SearchCandidate` (optionnels, rétro-compatibles).

### 4.1 Champs ajoutés

```typescript
// Extension SearchCandidate (champs optionnels, rétro-compatibles)
vehicleFitment?: {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engine?: string;
}[];
material?: string;                    // ABS, PP, PC, PA, PUR, TPO
category?: 'body' | 'interior' | 'exterior' | 'mechanical';
```

**Aucune migration destructive** — champs optionnels (`.optional()`).

### 4.2 Schéma Zod (E6-S06)

```typescript
// Extension de SearchCandidateSchema
vehicleFitment: z.array(z.object({
  make: z.string(),
  model: z.string(),
  yearFrom: z.number().int(),
  yearTo: z.number().int(),
  engine: z.string().optional(),
})).optional(),
material: z.string().optional(),
category: z.enum(['body', 'interior', 'exterior', 'mechanical']).optional(),
```

**R.5.2 :** si `category` devient un enum, synchroniser i18n `fr.ts`.

---

## 5. Bloc C — Interface `AutoPartsConnector`

**Objectif :** Spécifier l'interface du connecteur (E6-S07).

```typescript
interface AutoPartsConnector extends SourceConnector {
  /** Recherche par véhicule (make/model/year/engine). */
  searchByVehicle(params: {
    make: string;
    model: string;
    year: number;
    engine?: string;
  }): Promise<SearchCandidate[]>;

  /** Recherche par VIN (décodage TecDoc). */
  searchByVIN(vin: string): Promise<SearchCandidate[]>;

  /** Recherche par référence OEM. */
  searchByPartNumber(oeNumber: string): Promise<SearchCandidate[]>;

  /** Recherche par catégorie (+ matière plastique). */
  searchByCategory(params: {
    category: 'body' | 'interior' | 'exterior';
    material?: string;
  }): Promise<SearchCandidate[]>;
}
```

**Implémentation :** le connecteur TecDoc enrichi (E6-S07) implémente `AutoPartsConnector` (en plus de `SourceConnector`).

---

## 6. Bloc D — Routes API

**Objectif :** Spécifier les routes API (E6-S06/E6-S07, D5 = Oui).

### 6.1 POST /api/search/vehicle

**Body :** `{ make, model, year, engine?, category?, material? }`

**Response :** `{ candidates: SearchCandidate[], sourcesQueried: string[] }`

**Logique :** résolution Vehicle (make/model/year/engine) → Fitment → Part → SearchCandidate. Filtrage optionnel sur `category`/`material`.

### 6.2 POST /api/search/vin

**Body :** `{ vin }`

**Response :** `{ candidates: SearchCandidate[], vehicle: { make, model, year, engine } }`

**Logique :** décodage VIN (TecDoc) → Vehicle → Fitment → SearchCandidate.

### 6.3 POST /api/search/part-number

**Body :** `{ oeNumber }`

**Response :** `{ candidates: SearchCandidate[] }`

**Logique :** recherche par référence OEM (cross-ref TecDoc).

**Auth :** VIEWER+ (cohérent avec `POST /api/search` — `D-search-post-public` résolue E2-S07).

---

## 7. Bloc E — Focus plastique

**Objectif :** Spécifier le filtrage plastique (D6 = Oui).

### 7.1 Catégories plastique

| Catégorie | Pièces |
|---|---|
| `body` | pare-chocs, calandres, ailes, capots |
| `interior` | panneaux de porte, tableaux de bord, consoles |
| `exterior` | rétroviseurs, poignées, baguettes |

### 7.2 Matières plastique

| Matière | Nom |
|---|---|
| ABS | acrylonitrile butadiène styrène |
| ABS/PC | mélange ABS/polycarbonate |
| PP | polypropylène |
| PC | polycarbonate |
| PA | polyamide (nylon) |
| PUR | polyuréthane |
| TPO | polyoléfine thermoplastique |

**Cohérence :** ces matières sont un sous-ensemble de `materials` (`src/i18n/fr.ts` — POM-C, PA6, PA66, PEHD, PTFE, ABS, PETP...). `ABS` est déjà dans le modèle `Material`.

### 7.3 Filtrage

- `searchByCategory({ category: 'body', material: 'ABS' })`
- Filtre post-recherche sur `material` (le filtrage matière est appliqué après la résolution fitment)

---

## 8. Bloc F — Livrable

**Fichier cible :** `docs/e6-s05-auto-parts-spec.md` (ce document)

**Critère de succès :**
- Document complet (6 blocs : sources, modèle, SearchCandidate, interface, routes, plastique)
- Spécification Prisma (Vehicle, Fitment)
- Spécification interface (AutoPartsConnector)
- Spécification routes API (3 routes)
- Focus plastique documenté (catégories + matières)

**Critère de STOP :**
- Si le Coordinateur n'a pas confirmé D1-D7 → STOP + rapport

---

## 9. Baseline cible E6-S05

| Métrique | Avant (E6-S05 catalogue) | Après (E6-S05 spec) |
|---|---|---|
| ESLint | 0/0 | 0/0 |
| TypeScript | 0 err | 0 err |
| Prettier | 0 | 0 |
| Build | 57 routes | 57 routes |
| E2E | 256/0/4 | 256/0/4 |
| Prisma | 14 migrations | 14 migrations |
| Dettes | 5 (4 M + 1 F) | **6 (5 M + 1 F)** — `D-tecdoc-auto-parts` (Moyenne) |

**Nouvelle dette :** `D-tecdoc-auto-parts` (Moyenne) — contrat TecDoc pour recherche auto-parts (fitment).

**Note :** `D-tecdoc-credentials` (Moyenne) existe déjà (contrat TecDoc). `D-tecdoc-auto-parts` **précise** le périmètre (fitment auto-parts). Alternative : enrichir `D-tecdoc-credentials` au lieu d'ajouter une nouvelle dette (§10).

---

## 10. Plan des sessions E6-S05 → E6-S08

| Session | Objet | Type | Dépendances |
|---|---|---|---|
| **E6-S05** | Spécification auto-parts | Cadrage | — |
| **E6-S06** | Modèle Prisma + migration | Technique | D4 = Oui |
| **E6-S07** | Connecteur TecDoc mock enrichi | Technique | E6-S06 |
| **E6-S08** | TecDoc réel (si contrat) | Technique | `D-tecdoc-credentials` |

**Séquentiel** (D7).

**Après E6-S08 :** E6-S09 (nettoyage), E6-clôture. Puis phase E7 (déblocage des 5 Moyennes).

**Total E6 :** E6-S01, S04, S05 (catalogue), S05 (spec), S06, S07, S08, S09, clôture.

---

## 11. Décisions à confirmer explicitement (Coordinateur)

**⚠️ STOP-D renforcé — confirmation explicite requise (R.5.17).**

| # | Décision | Options | Recommandation | **Coche requise** |
|---|---|---|---|---|
| **D1** | E6-S05 = spécification ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D2** | Source retenue ? | TecDoc mock / RockAuto / NAPA | TecDoc mock | **[ ] TecDoc [ ] RockAuto [ ] NAPA** |
| **D3** | Modèle fitment ? | Prisma / JSON | Prisma | **[ ] Prisma [ ] JSON** |
| **D4** | Migration Prisma (E6-S06) ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D5** | Route API véhicule ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D6** | Filtrage plastique ? | Oui / Non | Oui | **[ ] Oui [ ] Non** |
| **D7** | Priorité sessions ? | Séquentiel / Parallèle | Séquentiel | **[ ] Séquentiel [ ] Parallèle** |

**⚠️ Confiance moyenne sur D4** — la migration Prisma est structurante. Si JSON préféré, D4 = Non (modèle JSON embarqué, pas de migration).

**Action requise :** confirmer explicitement la lecture (coche) **ou** corriger les décisions qui diffèrent.

---

## 12. Ce que je produis sur confirmation D1-D7

**Sur confirmation explicite D1-D7 :** je produis le **rapport d'exécution E6-S05** :

1. Ce document de spécification (`docs/e6-s05-auto-parts-spec.md`)
2. `DEBT.md` — nouvelle dette `D-tecdoc-auto-parts` (Moyenne)
3. `SESSION.md` — section E6-S05 (spécification)
4. `ROADMAP.md` — E6-S05 spécification clôturée
5. Validation (tsc, lint, prettier) + commit documentaire

**Sur validation D1-D7 + D4 = Oui :** E6-S06 (modèle Prisma + migration) sera la prochaine session technique.

---

**FIN DU CADRAGE E6-S05 (spécification auto-parts) — En attente confirmation explicite D1-D7 (R.5.17).**

**Note méta :** 4 sessions consécutives ont reçu des décisions sans coche. La lecture par déduction a été correcte, mais le risque augmente. Pour E6-S05 (spécification), D2 (source) et D4 (migration) impactent les sessions suivantes — **confirmation explicite requise avant exécution**. R.5.17 (format `D1 = Oui`) est la plus urgente à appliquer.
