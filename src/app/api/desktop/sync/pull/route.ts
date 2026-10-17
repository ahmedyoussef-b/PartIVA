import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSyncTable } from '@/lib/sync/tables';

/**
 * E8P-S04 — GET /api/desktop/sync/pull?table=<name>&since=<ISO>&skip=<n>
 *
 * Pull unidirectionnel web → local (D-E8P-S01-2) :
 * - tables incrémentales (updatedAt) : filtre `since` si fourni ;
 * - tables full-refresh (fitment, part_image, part_version — sans updatedAt,
 *   D-E8P-S03-1) : `since` ignoré, la table est renvoyée en entier (paginée).
 * - pagination : take = pageSize (500) + skip côté client.
 *
 * Sécurité : whitelist des tables (getSyncTable), delegates Prisma uniquement,
 * champs exposés = miroir de la migration locale (search_vector et embeddings
 * exclus — respectivement tsvector web et D-E8P-S01-11 différé).
 */

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table) {
    return NextResponse.json({ message: 'Paramètre table manquant' }, { status: 400 });
  }

  const def = getSyncTable(table);
  if (!def) {
    return NextResponse.json({ message: 'Table inconnue' }, { status: 400 });
  }

  const sinceParam = searchParams.get('since');
  let since: Date | null = null;
  if (def.incremental && sinceParam) {
    const parsed = new Date(sinceParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ message: 'since invalide (ISO 8601 attendu)' }, { status: 400 });
    }
    since = parsed;
  }

  const skipParam = searchParams.get('skip');
  let skip = 0;
  if (skipParam !== null) {
    const parsedSkip = Number(skipParam);
    if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
      return NextResponse.json({ message: 'skip invalide (entier ≥ 0 attendu)' }, { status: 400 });
    }
    skip = parsedSkip;
  }

  const data = await fetchTable(def.name, since, skip, def.pageSize);

  return NextResponse.json(
    { table, count: data.length, since: sinceParam ?? null, skip, data },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

async function fetchTable(
  name: string,
  since: Date | null,
  skip: number,
  pageSize: number,
): Promise<unknown[]> {
  const updatedFilter = since ? { updatedAt: { gt: since } } : undefined;

  switch (name) {
    case 'part':
      return prisma.part.findMany({
        where: updatedFilter,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          partNumber: true,
          ptvReference: true,
          name: true,
          description: true,
          status: true,
          categoryId: true,
          clientId: true,
          material: true,
          autoCategory: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case 'vehicle':
      return prisma.vehicle.findMany({
        where: updatedFilter,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          engine: true,
          ktype: true,
          vin: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case 'fitment':
      return prisma.fitment.findMany({
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: { id: true, partId: true, vehicleId: true, notes: true, createdAt: true },
      });
    case 'part_image':
      return prisma.partImage.findMany({
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          partId: true,
          url: true,
          publicId: true,
          altText: true,
          caption: true,
          order: true,
          isPrimary: true,
          createdAt: true,
        },
      });
    case 'part_version':
      return prisma.partVersion.findMany({
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          partId: true,
          versionNumber: true,
          snapshot: true,
          auditLogId: true,
          createdById: true,
          createdAt: true,
        },
      });
    case 'part_specification':
      return prisma.partSpecification.findMany({
        where: updatedFilter,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          partId: true,
          key: true,
          value: true,
          unit: true,
          toleranceMin: true,
          toleranceMax: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case 'part_category':
      return prisma.partCategory.findMany({
        where: updatedFilter,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case 'material':
      return prisma.material.findMany({
        where: updatedFilter,
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          code: true,
          name: true,
          category: true,
          density: true,
          maxTemp: true,
          tensileStrength: true,
          hardness: true,
          frictionCoefficient: true,
          resistanceChemical: true,
          foodGrade: true,
          description: true,
          advantages: true,
          commonApplications: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    default:
      return [];
  }
}
