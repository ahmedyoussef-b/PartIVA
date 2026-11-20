import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  console.info('[PCB:REQUIREMENTS] Requête reçue', { timestamp: new Date().toISOString() });
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    // On cherche les demandes de type PCB, non consultées (PENDING)
    const requirements = await prisma.request.findMany({
      where: {
        type: 'PCB',
        status: 'PENDING',
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true, email: true } } },
    });

    console.info('[PCB:REQUIREMENTS] Données renvoyées', { count: requirements.length });
    return NextResponse.json({ data: requirements, count: requirements.length });
  } catch (error) {
    console.error('[PCB:REQUIREMENTS] Erreur', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}
