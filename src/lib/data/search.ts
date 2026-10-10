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

export type SpecSearchResult = {
  id: string;
  ptvReference: string | null;
  partNumber: string | null;
  name: string | null;
  status: string;
  matchedSpecs: { key: string; value: string }[];
  rank: number;
};

export async function searchPartsBySpecs(
  query: string,
  options: { key?: string; clientId?: string; limit?: number } = {},
): Promise<SpecSearchResult[]> {
  const { key, clientId, limit = 20 } = options;

  const keyFilter = key ? Prisma.sql`AND ps.key = ${key}` : Prisma.empty;
  const clientFilter = clientId ? Prisma.sql`AND p."clientId" = ${clientId}` : Prisma.empty;

  return prisma.$queryRaw<SpecSearchResult[]>`
    WITH matched AS (
      SELECT
        ps."partId",
        ps.key,
        ps.value,
        ts_rank(to_tsvector('french', ps.value), plainto_tsquery('french', ${query})) AS rank
      FROM part_specifications ps
      WHERE to_tsvector('french', ps.value) @@ plainto_tsquery('french', ${query})
        ${keyFilter}
    )
    SELECT
      p.id,
      p."ptvReference",
      p."partNumber",
      p.name,
      p.status::text AS status,
      json_agg(json_build_object('key', m.key, 'value', m.value) ORDER BY m.rank DESC) AS "matchedSpecs",
      MAX(m.rank)::float AS rank
    FROM matched m
    JOIN parts p ON p.id = m."partId"
    WHERE true
      ${clientFilter}
    GROUP BY p.id, p."ptvReference", p."partNumber", p.name, p.status
    ORDER BY rank DESC, p."ptvReference" ASC NULLS LAST
    LIMIT ${limit}
  `;
}

export type DimensionSearchResult = {
  id: string;
  ptvReference: string | null;
  partNumber: string | null;
  name: string | null;
  status: string;
  specKey: string;
  specValue: string;
  unit: string | null;
  toleranceMin?: number | null;
  toleranceMax?: number | null;
};

export async function searchPartsByDimensions(
  options: {
    min?: number;
    max?: number;
    key?: string;
    matchMode?: 'nominal' | 'tolerance';
    clientId?: string;
    limit?: number;
  } = {},
): Promise<DimensionSearchResult[]> {
  const { min, max, key, matchMode = 'nominal', clientId, limit = 20 } = options;

  const keyFilter = key ? Prisma.sql`AND ps.key = ${key}` : Prisma.empty;
  const clientFilter = clientId ? Prisma.sql`AND p."clientId" = ${clientId}` : Prisma.empty;

  if (matchMode === 'tolerance') {
    const minFilter =
      min !== undefined ? Prisma.sql`AND ps."toleranceMin" <= ${min}` : Prisma.empty;
    const maxFilter =
      max !== undefined ? Prisma.sql`AND ps."toleranceMax" >= ${max}` : Prisma.empty;

    return prisma.$queryRaw<DimensionSearchResult[]>`
      SELECT
        p.id,
        p."ptvReference",
        p."partNumber",
        p.name,
        p.status::text AS status,
        ps.key AS "specKey",
        ps.value AS "specValue",
        ps.unit,
        ps."toleranceMin",
        ps."toleranceMax"
      FROM part_specifications ps
      JOIN parts p ON p.id = ps."partId"
      WHERE ps."toleranceMin" IS NOT NULL
        AND ps."toleranceMax" IS NOT NULL
        ${minFilter}
        ${maxFilter}
        ${keyFilter}
        ${clientFilter}
      ORDER BY ps."toleranceMin" ASC NULLS LAST
      LIMIT ${limit}
    `;
  }

  const minFilter = min !== undefined ? Prisma.sql`AND ps.value::numeric >= ${min}` : Prisma.empty;
  const maxFilter = max !== undefined ? Prisma.sql`AND ps.value::numeric <= ${max}` : Prisma.empty;

  return prisma.$queryRaw<DimensionSearchResult[]>`
    SELECT
      p.id,
      p."ptvReference",
      p."partNumber",
      p.name,
      p.status::text AS status,
      ps.key AS "specKey",
      ps.value AS "specValue",
      ps.unit,
      NULL::float AS "toleranceMin",
      NULL::float AS "toleranceMax"
    FROM part_specifications ps
    JOIN parts p ON p.id = ps."partId"
    WHERE ps.value ~ '^[0-9.]+$'
      ${minFilter}
      ${maxFilter}
      ${keyFilter}
      ${clientFilter}
    ORDER BY ps.value::numeric ASC
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
