import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  try {
    const attempts = await prisma.pcbRoutingAttempt.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        score: true,
        tracks: true,
        violations: true,
        placement: true,
        routing: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, attempts });
  } catch (e) {
    console.warn('[PCB:ROUTING-ATTEMPTS] Historique indisponible', e);
    return NextResponse.json({ ok: true, attempts: [] });
  }
}
