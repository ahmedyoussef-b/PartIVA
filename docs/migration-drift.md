# Procédure de gestion du drift Prisma (R.4.1-ter)

**Date :** 2026-10-14
**Statut :** Procédure manuelle validée (E6-S10) ; vérification E7-S05 effectuée avec Prisma 7
**Référence :** `D-hnsw-drift`, `D-tecdoc-auto-parts` (E6-S07)

---

## 1. Contexte

`SHADOW_DATABASE_URL` est configurée et chargée par `prisma7.config.ts`. `prisma migrate status` confirme les 15 migrations appliquées et le schéma à jour, mais ne vérifie pas les index personnalisés non modélisés. Le diff Prisma 7 avec `--from-migrations` et `--to-schema` révèle la différence HNSW.

Le drift est **structurel** et **attendu** :

- **Drift GIN** : index `parts_search_vector_idx` (GIN sur `search_vector tsvector`) créé en SQL brut par la migration `20261010002927_add_part_search_index` — **non modélisé** par Prisma (colonne `Unsupported("tsvector")`).
- **Drift HNSW** : index `part_images_embedding_hnsw` (HNSW sur `embedding vector(768)`) — **non modélisé** par Prisma (colonne `Unsupported("vector(768)")`).

**Critère de baseline** : **0 drift hors `part_images_embedding_hnsw`** (et hors GIN pré-existant).

---

## 2. Procédure manuelle (si le diff Prisma n'est pas disponible)

### Étape 1 — Créer la migration SQL manuellement

```bash
# Si migrate diff est indisponible, écrire la migration SQL à la main
# en s'alignant sur le schéma Prisma.
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

## 4. Vérification E7-S05 avec Prisma 7

La configuration du projet est `prisma7.config.ts` (et non `prisma.config.ts`) ; elle charge `SHADOW_DATABASE_URL` comme shadow database. Prisma 7 utilise `--to-schema` et la datasource shadow de cette configuration :

```powershell
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code
```

Code de sortie : `0` si aucun diff, `2` si une différence est détectée, `1` en cas d'erreur. La sortie E7-S05 ne montre que la suppression de l'index HNSW par Prisma. La procédure manuelle (§2) reste valable pour les modifications de schéma et doit préserver l'index HNSW.

---

## 5. Résultats E7-S05 (2026-10-14)

### Diff Prisma

Commande : `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code`

```text
[*] Changed the `part_images` table
  [-] Removed index on columns (embedding)
PRISMA_DIFF_EXIT_CODE=2
```

### Index vérifiés dans PostgreSQL

```text
part_images_embedding_hnsw
CREATE INDEX part_images_embedding_hnsw ON public.part_images USING hnsw (embedding vector_cosine_ops)

parts_search_vector_idx
CREATE INDEX parts_search_vector_idx ON public.parts USING gin (search_vector)
```

`prisma migrate status` : 15 migrations trouvées ; schéma à jour.

**Verdict :** drift HNSW structurel attendu et confirmé ; l'index HNSW existe en base, mais Prisma propose de le supprimer car il ne modélise pas cet index sur `Unsupported("vector(768)")`. L'index GIN de recherche est également présent. La sortie du diff n'indique aucune différence autre que l'index HNSW.

## 6. Références

- `D-hnsw-drift` (DEBT.md) — drift structurel HNSW
- `docs/e2e-constraints.md` — contraintes E2E
- `prisma/migrations/20261013020211_add_vehicle_fitment_auto_parts/migration.sql` — exemple appliqué
- R.4.1-ter — procédure drift documentée
