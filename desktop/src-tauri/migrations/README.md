# Migrations BDD locale — PartIVA Desktop (E8P)

## Vue d'ensemble

Miroir SQLite des tables web (PostgreSQL Neon), en **lecture seule**.
Sync **unidirectionnelle : web → local** (D-E8P-S01-2). Aucune donnée ne remonte vers le web.

Migrations exécutées au démarrage de l'application par `sqlx::migrate!("./migrations")`
(chemin relatif à `desktop/src-tauri/Cargo.toml` — voir `src/db.rs::connect()`).

## Tables synchronisées (miroir web)

| Table locale | Table web (Prisma) | Stratégie sync | `updated_at` | Migration |
|---|---|---|---|---|
| `part` | `Part` | Incrémentale (`updated_at`) | ✅ | 0001 |
| `vehicle` | `Vehicle` | Incrémentale (`updated_at`) | ✅ | 0001 |
| `fitment` | `Fitment` | **Full-refresh** | ❌ absente côté web | 0001 |
| `part_image` | `PartImage` | **Full-refresh** | ❌ absente côté web | 0002 |
| `part_version` | `PartVersion` | **Full-refresh** | ❌ absente côté web | 0002 |
| `part_specification` | `PartSpecification` | Incrémentale (`updated_at`) | ✅ | 0004 |
| `part_category` | `PartCategory` | Incrémentale (`updated_at`) | ✅ | 0004 |
| `material` | `Material` | Incrémentale (`updated_at`) | ✅ | 0005 |
| `request` | `Request` | Incrémentale (`updated_at`) | ✅ | 0006 |

**Option B (D-E8P-S03-1)** : les 3 tables sans `updated_at` sont synchronisées en
full-refresh — pas de migration Prisma côté web (baseline web = 15 migrations). À réévaluer
si la volumétrie croît fortement.

## Tables locales (non synchronisées)

| Table | Usage | Migration |
|---|---|---|
| `sync_metadata` | Suivi de sync : `last_sync_at`, `last_sync_since` (curseur `since`), `row_count`, `full_refresh_required` | 0003 |
| `components` | Catalogue de composants PCB (§10, V41) — **non synchronisé** (local) | 0007 |

## Choix de modélisation

- `enums` Prisma (`PartStatus`) → `TEXT` + contrainte `CHECK` (SQLite n'a pas d'enums)
- `DateTime` → `TEXT` ISO 8601 (format des horodatages du sync)
- `Boolean` → `INTEGER` (0/1) + `CHECK`
- `Json` (`PartVersion.snapshot`) → `TEXT` (JSON sérialisé)
- `tsvector` (`Part.search_vector`) → **non miroité** (généré côté web) — recherche plein
  texte locale à concevoir en E8P-S06+ (FTS5 SQLite)
- `vector(768)` (`PartImage.embedding`) → **non synchronisé** (D-E8P-S01-11 différé)
- Relations vers tables non synchronisées (`AuditLog`, `User`, `PartCategory`) → colonnes
  conservées **sans** foreign key (fidélité du miroir, pas d'intégrité référentielle croisée)

## Volumétries mesurées (seed, source DEBT.md `D-tecdoc-auto-parts`)

| Table | Lignes |
|---|---|
| `part` | 1 521 |
| `vehicle` | 500 |
| `fitment` | 1 505 |
| `part_image` | ⚠️ à mesurer en E8P-S04 |
| `part_version` | ⚠️ à mesurer en E8P-S04 |

## Tables web hors périmètre V1 (non miroitées)

`Supplier`/`PartSupplier`, `Attachment`, `User`,
`Session`/`Account`/`Verification`, `AuditLog`, `SearchCandidate`, `ScoringWeights`,
`ReverseEngineering*`, `CadFile`, `Machine`.

(Note historique : `PartSpecification`/`PartCategory` étaient absentes en E8P-S03 —
ajoutées en migration `0004` en E8P-S04, décision `D-E8P-S03-2 = B`.)

## Migrations

| Fichier | Contenu |
|---|---|
| `0001_init.sql` | `part`, `vehicle`, `fitment` + index |
| `0002_add_partimage_partversion.sql` | `part_image`, `part_version` + index |
| `0003_sync_metadata.sql` | `sync_metadata` + amorçage des lignes de suivi |
| `0004_add_partspec_partcategory.sql` | `part_specification`, `part_category` + index (E8P-S04 — Must §6.2) |
| `0005_add_material.sql` | `material` + index (E9-R4a) |
| `0006_add_request.sql` | `request` + index (E9-R4b-1) |
| `0007_add_component.sql` | `components` + index (V41 — §10, pas de `components_vec` : sqlite-vec = A7) |
| `0008_components_fts.sql` | `components_fts` (FTS5 standalone, tokenizer `porter unicode61`) — index reconstruit après sync (A7.1-b) |

Vérification : `cargo test` (test `db::tests::migrations_apply_on_empty_db` — crée les
11 tables + `_sqlx_migrations` sur une base vide).
