-- DropIndex (drift Prisma — R.4.1 : attendu et documenté, ne pas corriger)
DROP INDEX "parts_search_vector_idx";

-- pgvector E2-S05 (édition manuelle A.2.2 — Prisma ne génère ni l'extension ni l'index HNSW)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "part_images" ADD COLUMN     "embedding" vector(768);

-- HNSW index E2-S05 (édition manuelle A.2.2 — Prisma ne modélise pas les index HNSW)
CREATE INDEX "part_images_embedding_hnsw" ON "part_images" USING hnsw ("embedding" vector_cosine_ops);
