# Architecture — PartIVA

**Date :** 2026-10-13
**Auteur :** Superviseur IA
**Statut :** Validé (E8-S03)

---

## 1. Vue d'ensemble

PartIVA est un **SaaS/marketplace industriel B2B** construit sur Next.js 16 (App Router), Prisma 7, PostgreSQL Neon (pgvector).

**4 piliers fonctionnels :**

1. **Recherche fédérée multi-sources** — agrégation local_db + wikidata + traceparts + tecdoc + industrial_catalog
2. **Reverse engineering** — refabrication à partir d'une pièce existante
3. **Scoring multi-critères** — pertinence + qualité + complétude
4. **Workflow de fabrication** — de la demande à la pièce produite

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16.4.0, React 19.3.0, Tailwind 4.3.3 |
| Backend | Next.js API Routes, Prisma 7.10.0 |
| Auth | BetterAuth 1.7.7 |
| Validation | Zod 4.6.5 |
| DB | PostgreSQL Neon, pgvector 0.8.0 |
| Tests | Playwright 1.64.0 |
| Qualité | ESLint 9, TypeScript 5.9.3, Prettier 3.9.9 |

---

## 3. Modules

### 3.1 Connecteurs (`src/lib/connectors/`)

| Fichier | Rôle |
|---|---|
| `types.ts` | Interface `SourceConnector` |
| `local-db.ts` | Connecteur base locale |
| `wikidata.ts` | Connecteur Wikidata |
| `traceparts.ts` | Connecteur TraceParts (mock/API) |
| `tecdoc.ts` | Connecteur TecDoc (mock/API) |
| `industrial-catalog.ts` | Connecteur catalogue HF |
| `aggregator.ts` | Agrégateur multi-sources |

**Interface `SourceConnector` :**

```typescript
interface SourceConnector {
  source: 'local_db' | 'wikidata' | 'traceparts' | 'tecdoc' | 'industrial_catalog';
  weight: number;
  timeoutMs?: number;
  isAvailable(): boolean;
  search(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<SearchCandidate[]>;
}
```

### 3.2 Data layer (`src/lib/data/`)

| Fichier | Rôle |
|---|---|
| `parts.ts` | CRUD pièces |
| `part-versions.ts` | Versions de pièces |
| `part-completeness.ts` | Complétude |
| `part-embeddings.ts` | Embeddings photo |
| `search.ts` | Recherche fédérée |
| `search-candidates.ts` | Candidats de recherche |
| `tecdoc.ts` | Data layer TecDoc |
| `traceparts.ts` | Data layer TraceParts |
| `wikidata.ts` | Data layer Wikidata |
| `industrial-catalog.ts` | Data layer catalogue HF |
| `multi-search.ts` | Recherche multi-modes |
| `reverse-engineering.ts` | Reverse engineering |
| `requests.ts` | Demandes |
| `materials.ts` | Matériaux |
| `machines.ts` | Machines |

### 3.3 Scoring (`src/lib/scoring/`)

| Fichier | Rôle |
|---|---|
| `weights.ts` | `SOURCE_WEIGHTS` (inter-sources) |
| `../scoring.ts` | `DEFAULT_WEIGHTS` (intra-candidat) |

**Taxonomie R.5.12 :**
- `SOURCE_WEIGHTS` = poids inter-sources (ce fichier)
- `DEFAULT_WEIGHTS` = poids intra-candidat (persisté en DB `ScoringWeights`)

### 3.4 API Routes (`src/app/api/`)

| Route | Rôle |
|---|---|
| `/api/auth/[...all]` | Auth BetterAuth |
| `/api/health` | Healthcheck |
| `/api/parts` | CRUD pièces |
| `/api/parts/[id]/*` | Sous-ressources pièces |
| `/api/requests` | Demandes |
| `/api/search` | Recherche fédérée |
| `/api/search/photo` | Recherche photo |
| `/api/search/vehicle` | Recherche véhicule (E6-S08) |
| `/api/search/vin` | Recherche VIN (E6-S08) |
| `/api/sync` | Synchronisation |
| `/api/upload` | Upload |

### 3.5 Modèle Prisma (`prisma/schema.prisma`)

**23 modèles** dont :
- `User`, `Session`, `Account`, `Verification` (auth)
- `Part`, `PartCategory`, `PartImage`, `PartSpecification`, `PartVersion`
- `Vehicle`, `Fitment` (auto-parts, E6-S07)
- `ReverseEngineeringProject`, `ReverseEngineeringStep`, `CadFile`
- `Supplier`, `PartSupplier`, `Attachment`
- `Request`, `Machine`, `Material`
- `SearchCandidate`, `ScoringWeights`
- `AuditLog`

---

## 4. Flux

### 4.1 Recherche fédérée

```
Client → /api/search → aggregator → [local_db, wikidata, traceparts, tecdoc, industrial_catalog]
                                  ↓
                              SearchCandidate[]
                                  ↓
                              scoring (SOURCE_WEIGHTS)
                                  ↓
                              résultats triés
```

### 4.2 Recherche par véhicule (E6-S08)

```
Client → POST /api/search/vehicle → data/tecdoc.searchByVehicle
                                  ↓
                              fixtures TecDoc mock
                                  ↓
                              Fitment[] → Part[]
```

### 4.3 Recherche par VIN (E6-S08)

```
Client → POST /api/search/vin → data/tecdoc.searchByVIN
                              ↓
                          Vehicle (VIN → KType)
                              ↓
                          Fitment[] → Part[]
```

### 4.4 Recherche photo + véhicule (E6-S08)

```
Client → searchByPhotoAndVehicle(photo, vehicle)
                              ↓
                          embedding photo + fitment
                              ↓
                          Part[] filtrés
```

---

## 5. Sécurité

- **Auth** : BetterAuth, sessions en DB
- **Tokens** : jamais `NEXT_PUBLIC_` (Sécurité #7)
- **Variables d'env** : serveur uniquement (`TECDOC_API_KEY`, `TRACEPARTS_*`, `HF_API_TOKEN`)
- **`next-env.d.ts`** : non modifié (Règle #32)

---

## 6. Tests

- **Playwright** : 38 specs, 288 tests
- **Projets** : chromium, admin, user, viewer, public, setup
- **Ratio** : ≈18,4% specs / fichiers source

---

## 7. Migrations

- **15 migrations** Prisma
- **Drift GIN/HNSW** documenté (`D-hnsw-drift`, `docs/migration-drift.md`)
- **Procédure** : `SHADOW_DATABASE_URL` absente → procédure manuelle

---

## 8. Déploiement

Voir [docs/deployment.md](docs/deployment.md).

---

## 9. Positionnement

Voir [docs/positioning.md](docs/positioning.md).

---

## 10. Références

- `docs/positioning.md` — Positionnement
- `docs/deployment.md` — Déploiement
- `docs/e2e-constraints.md` — Contraintes E2E
- `docs/migration-drift.md` — Drift migration
- `docs/e6-close-report.md` — Clôture E6
- `docs/e8-s02-audit.md` — Audit E8-S02

---

**Fin de l'architecture — E8-S03.**
