/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { SearchCandidate, SearchInput } from './types';
import { embedTexts } from '@/lib/ai/cloudflare-embeddings';

const getPrisma = async () => {
  try {
    const mod = await import('@/lib/prisma');
    return mod.prisma;
  } catch {
    return null;
  }
};

export async function searchLocal(input: SearchInput): Promise<SearchCandidate[]> {
  const threshold = input.threshold ?? 0.7;
  const maxResults = input.maxResults ?? 10;

  try {
    const prisma = await getPrisma();
    if (!prisma) return [];

    const text = (input.ingestResult.extractedFeatures || []).join(' ') || 'part';
    let embedding: number[] | null = null;
    try {
      const [vec] = await embedTexts([text]);
      embedding = vec ?? null;
    } catch {
      embedding = null;
    }

    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      const rows = await (prisma as any).$queryRawUnsafe(
        `SELECT pi.id, pi.url, p.id as "partId", p.name, p."partNumber", p.description, p.material, c.name as "categoryName",
          1 - (pi.embedding <=> $1::vector) AS score
        FROM part_images pi
        JOIN parts p ON p.id = pi."partId"
        LEFT JOIN part_categories c ON c.id = p."categoryId"
        WHERE pi.embedding IS NOT NULL
        ORDER BY pi.embedding <=> $1::vector
        LIMIT $2`,
        vectorStr,
        maxResults * 2,
      );

      const candidates: SearchCandidate[] = (rows as any[]).map((row: any) => ({
        id: row.partId,
        source: 'local' as const,
        name: row.name || row.partNumber,
        score: Number(row.score),
        thumbnailUrl: row.url,
        metadata: {
          partNumber: row.partNumber,
          category: row.categoryName,
          material: row.material,
        },
      }));

      const filtered = candidates.filter((c) => c.score >= threshold).slice(0, maxResults);
      if (filtered.length > 0) return filtered;
    }

    const parts = await (prisma as any).part.findMany({
      take: maxResults * 2,
      include: {
        images: {
          take: 1,
          where: { isPrimary: true },
        },
        category: true,
      },
    });

    const candidates: SearchCandidate[] = (parts as any[]).map((part: any) => {
      let score = 0.5;
      if (input.ingestResult.extractedFeatures.includes('dimensions_provided')) {
        score += 0.15;
      }
      if (input.ingestResult.extractedFeatures.includes('photos_present')) {
        score += 0.1;
      }
      if (part.description) score += 0.05;
      if (part.images && part.images.length > 0) score += 0.05;
      if (score > 1) score = 1;

      return {
        id: part.id,
        source: 'local' as const,
        name: part.name || part.partNumber,
        score,
        thumbnailUrl: part.images?.[0]?.url,
        metadata: {
          partNumber: part.partNumber,
          category: part.category?.name,
          material: part.material,
        },
      };
    });

    return candidates.filter((c) => c.score >= threshold).slice(0, maxResults);
  } catch (error) {
    return [];
  }
}
