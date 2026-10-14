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

**Option B (D-E8P-S03-1)** : les 3 tables sans `updated_at` sont synchronisées en
full-refresh — pas de migration Prisma côté web (baseline web = 15 migrations). À réévaluer
si la volumétrie croît fortement.

## Tables locales (non synchronisées)

| Table | Usage | Migration |
|---|---|---|
| `sync_metadata` | Suivi de sync : `last_sync_at`, `last_sync_since` (curseur `since`), `row_count`, `full_refresh_required` | 0003 |

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

`PartSpecification`, `PartCategory`, `Supplier`/`PartSupplier`, `Attachment`, `User`,
`Session`/`Account`/`Verification`, `AuditLog`, `SearchCandidate`, `ScoringWeights`,
`Request`, `ReverseEngineering*`, `CadFile`, `Machine`, `Material`.

⚠️ `PartSpecification` et `PartCategory` sont classées **Must** dans le cadrage
(`docs/e8-desktop-tauri-scope.md` §6.2) mais hors du périmètre de l'ordre E8P-S03 :
à ajouter en migration `0004` avec le client sync (E8P-S04/S05) ou session dédiée.

## Migrations

| Fichier | Contenu |
|---|---|
| `0001_init.sql` | `part`, `vehicle`, `fitment` + index |
| `0002_add_partimage_partversion.sql` | `part_image`, `part_version` + index |
| `0003_sync_metadata.sql` | `sync_metadata` + amorçage des lignes de suivi |

Vérification : `cargo test` (test `db::tests::migrations_apply_on_empty_db` — crée les
6 tables + `_sqlx_migrations` sur une base vide).
