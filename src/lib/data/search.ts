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

export type ReferenceSearchResult = {
  id: string;
  ptvReference: string | null;
  partNumber: string;
  name: string;
  status: string;
  matchType: 'exact' | 'prefix';
};

export async function searchPartsByReference(
  query: string,
  options: { clientId?: string; limit?: number } = {},
): Promise<ReferenceSearchResult[]> {
  const { clientId, limit = 20 } = options;
  const normalizedQuery = query.trim().toUpperCase();

  const clientFilter = clientId ? Prisma.sql`AND "clientId" = ${clientId}` : Prisma.empty;

  return prisma.$queryRaw<ReferenceSearchResult[]>`
    SELECT
      id,
      "ptvReference",
      "partNumber",
      name,
      status::text AS status,
      CASE
        WHEN UPPER("ptvReference") = ${normalizedQuery}
          OR UPPER("partNumber") = ${normalizedQuery}
        THEN 'exact'
        ELSE 'prefix'
      END AS "matchType"
    FROM parts
    WHERE (
      UPPER("ptvReference") = ${normalizedQuery}
      OR UPPER("ptvReference") LIKE ${normalizedQuery + '%'}
      OR UPPER("partNumber") = ${normalizedQuery}
      OR UPPER("partNumber") LIKE ${normalizedQuery + '%'}
    )
      ${clientFilter}
    ORDER BY
      CASE WHEN UPPER("ptvReference") = ${normalizedQuery}
            OR UPPER("partNumber") = ${normalizedQuery}
           THEN 0 ELSE 1 END,
      "ptvReference" ASC NULLS LAST,
      "partNumber" ASC NULLS LAST
    LIMIT ${limit}
  `;
}
