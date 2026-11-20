import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const parsedLimit = Number.parseInt(url.searchParams.get('limit') ?? '10', 10);
  const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 10 : parsedLimit, 1), 50);

  if (!q) {
    return NextResponse.json({ data: [], count: 0 });
  }

  const results = await prisma.componentCatalog.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { footprint: { contains: q, mode: 'insensitive' } },
        { supplierRef: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      category: true,
      footprint: true,
      symbol: true,
      supplier: true,
      supplierRef: true,
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });

  console.info('[PCB:CATALOG:SEARCH] Requête', { q, limit, count: results.length });
  return NextResponse.json({ data: results, count: results.length });
}