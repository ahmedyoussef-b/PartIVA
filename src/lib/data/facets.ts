import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type FacetValue = {
  value: string;
  count: number;
};

export type FacetsResult = {
  total: number;
  materials: FacetValue[];
  statuses: FacetValue[];
};

export type FacetsParams = {
  q?: string;
  material?: string;
  status?: string;
  clientId?: string;
  limit?: number;
};

/** E12-R1c §5.3 — cache mémoire 30 s (pattern `traceparts.ts`). */
const FACETS_TTL_MS = 30_000;

let facetsCache: { key: string; data: FacetsResult; expiresAt: number } | null = null;

function cacheKey(params: FacetsParams): string {
  return JSON.stringify({
    q: params.q ?? null,
    material: params.material ?? null,
    status: params.status ?? null,
    clientId: params.clientId ?? null,
    limit: params.limit ?? 10,
  });
}

export async function getFacets(params: FacetsParams): Promise<FacetsResult> {
  const key = cacheKey(params);
  if (facetsCache && facetsCache.key === key && facetsCache.expiresAt > Date.now()) {
    return facetsCache.data;
  }
  const data = await computeFacets(params);
  facetsCache = { key, data, expiresAt: Date.now() + FACETS_TTL_MS };
  return data;
}

async function computeFacets(params: FacetsParams): Promise<FacetsResult> {
  const { q, material, status, clientId, limit = 10 } = params;

  // §5.2 : facettes calculées sur les résultats filtrés
  // (q + material + status + clientId s'appliquent aux 3 agrégations).
  const conditions: Prisma.Sql[] = [];
  if (q) {
    conditions.push(Prisma.sql`search_vector @@ plainto_tsquery('french', ${q})`);
  }
  if (material) {
    conditions.push(Prisma.sql`material = ${material}`);
  }
  if (status) {
    conditions.push(Prisma.sql`status::text = ${status}`);
  }
  if (clientId) {
    conditions.push(Prisma.sql`"clientId" = ${clientId}`);
  }

  const where =
    conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

  // Facette materials : toujours exclut les pièces sans matière (au moins
  // `material IS NOT NULL` → WHERE jamais « WHERE AND »).
  const materialConditions = [...conditions, Prisma.sql`material IS NOT NULL`];
  const materialWhere = Prisma.sql`WHERE ${Prisma.join(materialConditions, ' AND ')}`;

  const materialsRaw = await prisma.$queryRaw<FacetValue[]>`
    SELECT material AS value, COUNT(*)::int AS count
    FROM parts
    ${materialWhere}
    GROUP BY material
    ORDER BY count DESC, material ASC
    LIMIT ${limit}
  `;

  const statusesRaw = await prisma.$queryRaw<FacetValue[]>`
    SELECT status::text AS value, COUNT(*)::int AS count
    FROM parts
    ${where}
    GROUP BY status
    ORDER BY count DESC, status ASC
    LIMIT ${limit}
  `;

  const totalRaw = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM parts
    ${where}
  `;

  return {
    total: totalRaw[0]?.count ?? 0,
    materials: materialsRaw,
    statuses: statusesRaw,
  };
}
