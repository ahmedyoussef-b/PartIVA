# Procédure de gestion du drift Prisma (R.4.1-ter)

**Date :** 2026-10-13
**Statut :** Validée (E6-S10 — procédure manuelle, Option 2 SHADOW_DATABASE_URL)
**Référence :** `D-hnsw-drift`, `D-tecdoc-auto-parts` (E6-S07)

---

## 1. Contexte

`SHADOW_DATABASE_URL` est **absente** de l'environnement. `prisma migrate diff` (qui nécessite une base shadow) n'est donc **pas exécutable** pour vérifier mécaniquement le drift.

Le drift est **structurel** et **attendu** :

- **Drift GIN** : index `parts_search_vector` (GIN sur `search_vector tsvector`) créé en SQL brut par la migration `20261010002927_add_part_search_index` — **non modélisé** par Prisma (colonne `Unsupported("tsvector")`).
- **Drift HNSW** : index `part_images_embedding_hnsw` (HNSW sur `embedding vector(768)`) — **non modélisé** par Prisma (colonne `Unsupported("vector(768)")`).

**Critère de baseline** : **0 drift hors `part_images_embedding_hnsw`** (et hors GIN pré-existant).

---

## 2. Procédure manuelle (en l'absence de SHADOW_DATABASE_URL)

### Étape 1 — Créer la migration SQL manuellement

```bash
# Générer le diff (nécessite SHADOW_DATABASE_URL — absente)
# Alternative : écrire la migration SQL à la main, en s'alignant sur le schéma Prisma.
```

Rédiger `prisma/migrations/<timestamp>_<nom>/migration.sql` manuellement, en traduisant les changements du schéma Prisma en SQL (CREATE TABLE, ALTER TABLE, CREATE INDEX, ADD CONSTRAINT).

**Règle** : exclure systématiquement tout `DROP INDEX "part_images_embedding_hnsw"` généré par le diff — l'index HNSW existe en DB et doit être préservé (drift structurel, `D-hnsw-drift`).

### Étape 2 — Appliquer la migration SQL directement

```bash
npx prisma db execute --file prisma/migrations/<timestamp>_<nom>/migration.sql
```

### Étape 3 — Marquer la migration comme appliquée

```bash
npx prisma migrate resolve --applied <timestamp>_<nom>
```

### Étape 4 — Vérifier

```bash
npx prisma migrate status
# Attendu : "Database schema is up to date!" + N migrations found
```

---

## 3. Référence — E6-S07 (exemple appliqué)

Migration `20261013020211_add_vehicle_fitment_auto_parts` :

- Créée manuellement (procédure ci-dessus)
- `DROP INDEX "part_images_embedding_hnsw"` **volontairement exclu** (préservation HNSW)
- Appliquée via `prisma db execute` + `prisma migrate resolve --applied`
- Vérification : `prisma migrate status` = 15 migrations, up to date

---

## 4. Quand SHADOW_DATABASE_URL sera disponible

Si le Coordinateur provisionne `SHADOW_DATABASE_URL` (base shadow PostgreSQL) :

```bash
# Vérification mécanique du drift
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url $SHADOW_DATABASE_URL
```

La procédure manuelle (§2) reste valide — elle est la **source de vérité** en l'absence de shadow DB.

---

## 5. Références

- `D-hnsw-drift` (DEBT.md) — drift structurel HNSW
- `docs/e2e-constraints.md` — contraintes E2E
- `prisma/migrations/20261013020211_add_vehicle_fitment_auto_parts/migration.sql` — exemple appliqué
- R.4.1-ter — procédure drift documentée
