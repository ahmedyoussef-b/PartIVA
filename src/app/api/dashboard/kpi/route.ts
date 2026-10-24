import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [pendingCount, qualifyingCount, totalParts, completedLast30, totalClosedLast30] =
      await Promise.all([
        prisma.request.count({
          where: { status: 'PENDING' },
        }),
        prisma.request.count({
          where: { status: 'REVIEW' },
        }),
        prisma.part.count(),
        prisma.request.count({
          where: {
            status: 'COMPLETED',
            updatedAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.request.count({
          where: {
            status: { in: ['COMPLETED', 'REJECTED'] },
            updatedAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

    const demandesEnAttente = pendingCount + qualifyingCount;

    let tauxSucces = 0;
    if (totalClosedLast30 > 0) {
      tauxSucces = Number(((completedLast30 / totalClosedLast30) * 100).toFixed(1));
    } else if (completedLast30 > 0) {
      tauxSucces = 100;
    }

    return NextResponse.json(
      {
        demandesEnAttente,
        piecesEnBdd: totalParts,
        tauxSucces,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    console.error('[api/dashboard/kpi] Failed to fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI data' }, { status: 500 });
  }
}
