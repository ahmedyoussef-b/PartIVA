import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type SearchResult = {
  id: string;
  ptvReference: string | null;
  partNumber: string;
  name: string;
  description: string | null;
  status: string;
  rank: number;
};

export async function searchParts(
  query: string,
  options: { clientId?: string; limit?: number } = {},
): Promise<SearchResult[]> {
  const { clientId, limit = 20 } = options;

  const clientFilter = clientId ? Prisma.sql`AND "clientId" = ${clientId}` : Prisma.empty;

  return prisma.$queryRaw<SearchResult[]>`
    SELECT
      id,
      "ptvReference",
      "partNumber",
      name,
      description,
      status::text AS status,
      ts_rank(search_vector, plainto_tsquery('french', ${query})) AS rank
    FROM parts
    WHERE search_vector @@ plainto_tsquery('french', ${query})
      ${clientFilter}
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}
