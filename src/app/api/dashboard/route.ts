import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export async function GET() {
  // Auth : admin uniquement — pattern maison `requireAdmin` (jette
  // 'Unauthorized' / 'Forbidden'). Réponses d'erreur en JSON propre pour
  // que le fallback de `getDashboard()` distingue 401/403/500 d'un HTML.
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    // Contrat attendu par src/app/admin/dashboard/page.tsx :
    // { requests, machines } avec `projects` requis par mapRequestToUi.
    // Le modèle Request n'a pas de relation `part` (schéma Prisma).
    const [requests, machines] = await Promise.all([
      prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { client: true, projects: true },
      }),
      prisma.machine.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ requests, machines });
  } catch (error) {
    console.error('[api/dashboard] Failed to fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
