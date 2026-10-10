# Scripts PartIVA

Scripts CLI de maintenance et d'outillage.

## `backfill-embeddings.ts` — Backfill des embeddings photo

Peuple la colonne `part_images.embedding` (`vector(768)`, pgvector) pour les
images existantes, via le service d'embeddings Hugging Face Inference API
(`clip-ViT-B-32`, 768 dimensions).

### Exécution

```bash
npm run db:backfill-embeddings
# ou directement :
npx tsx scripts/backfill-embeddings.ts
```

### Prérequis

- `HF_API_TOKEN` dans le fichier `.env` racine (le script charge `.env` via
  `dotenv/config`). **Jamais** `NEXT_PUBLIC_` (sécurité #7 — secret serveur).
- Base de données accessible (`DATABASE_URL` dans `.env`).

### Comportement

| Situation | Comportement |
|---|---|
| `HF_API_TOKEN` absent | Sortie documentée, **exit 0** — dégradation gracieuse (R3 E2-S05). Tous les embeddings restent NULL. |
| `HF_API_TOKEN` présent | Télécharge chaque image (`embedding IS NULL`), calcule l'embedding, met à jour la colonne. Idempotent : les images déjà plongées sont ignorées. |
| Échec téléchargement/embedding d'une image | Comptabilisé dans `errors[]`, le backfill continue sur les images suivantes. |

### Sortie

```
BACKFILL_RESULT: {
  "total": 5,
  "processed": 5,
  "succeeded": 5,
  "failed": 0,
  "skipped": 0,
  "errors": []
}
```

### Vérification post-exécution

```sql
SELECT COUNT(*) FROM part_images WHERE embedding IS NULL;
-- Attendu : 0 après un backfill réussi
```

### Notes

- **Idempotent** — filtre `embedding IS NULL` (requête `$queryRaw` car Prisma
  ne filtre pas les colonnes `Unsupported`).
- **Coût API** — 1 appel HF Inference par image non plongée (dette
  `D-embedding-api-cost`).
- **Dette** `D-photo-embedding-backfill` — exécution réelle en attente du
  provisionnement du token HF.

## `test-cloudinary.mjs` — Test d'upload Cloudinary

Vérifie le chemin succès `uploadToCloudinary()` (E1-S06-A).

## `typecheck.mjs` — Wrapper typecheck

Nettoie `.next/types` avant `next typegen` puis exécute `tsc --noEmit`
(stabilisé en E0-S07-4-A').
