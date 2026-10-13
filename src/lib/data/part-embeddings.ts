import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { computeImageEmbedding, EmbeddingError } from '@/lib/embeddings';

export type EmbeddingBackfillResult = {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: { imageId: string; reason: string }[];
};

export async function backfillImageEmbeddings(
  options: {
    force?: boolean;
  } = {},
): Promise<EmbeddingBackfillResult> {
  const images = options.force
    ? await prisma.partImage.findMany({
        select: { id: true, url: true },
        orderBy: { createdAt: 'asc' },
      })
    : await prisma.$queryRaw<{ id: string; url: string }[]>`
        SELECT id, url FROM part_images WHERE embedding IS NULL ORDER BY "createdAt" ASC
      `;

  const result: EmbeddingBackfillResult = {
    total: images.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const image of images) {
    result.processed += 1;

    try {
      const vector = await computeImageEmbedding(image.url);
      const literal = `[${vector.map((v) => String(v)).join(',')}]`;
      await prisma.$executeRaw`
        UPDATE "part_images"
        SET "embedding" = ${Prisma.raw(`'${literal}'::vector(768)`)}
        WHERE id = ${image.id}
      `;
      result.succeeded += 1;
    } catch (cause) {
      const isConfig = cause instanceof EmbeddingError && cause.code === 'MISSING_TOKEN';
      result.failed += 1;
      result.errors.push({
        imageId: image.id,
        reason: isConfig
          ? 'HF_API_TOKEN absent'
          : `embedding échoué : ${cause instanceof Error ? cause.message : String(cause)}`,
      });
    }
  }

  return result;
}

export type PhotoSearchResult = {
  id: string;
  ptvReference: string | null;
  partNumber: string;
  name: string;
  description: string | null;
  status: string;
  imageId: string;
  imageUrl: string;
  similarity: number;
};

export async function searchPartsByPhoto(
  queryEmbedding: number[],
  options: { clientId?: string; limit?: number } = {},
): Promise<PhotoSearchResult[]> {
  const { clientId, limit = 20 } = options;

  const literal = `[${queryEmbedding.map((v) => String(v)).join(',')}]`;
  const queryVector = Prisma.raw(`'${literal}'::vector(768)`);

  const clientFilter = clientId ? Prisma.sql`AND p."clientId" = ${clientId}` : Prisma.empty;

  return prisma.$queryRaw<PhotoSearchResult[]>`
    SELECT
      p.id,
      p."ptvReference",
      p."partNumber",
      p.name,
      p.description,
      p.status::text AS status,
      pi.id AS "imageId",
      pi.url AS "imageUrl",
      (1 - (pi.embedding <=> ${queryVector})) AS similarity
    FROM part_images pi
    JOIN parts p ON p.id = pi."partId"
    WHERE pi.embedding IS NOT NULL
      ${clientFilter}
    ORDER BY pi.embedding <=> ${queryVector}
    LIMIT ${limit}
  `;
}
