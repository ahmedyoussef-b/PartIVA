import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/** Confirme en une action toutes les exigences proposées ou à vérifier. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  const updated = await prisma.pcbRequirement.updateMany({
    where: { projectId, status: { not: 'confirmed' } },
    data: { status: 'confirmed' },
  });
  console.info('[PCB:CDC] Confirmation en masse', { projectId, count: updated.count });
  return NextResponse.json({ ok: true, confirmed: updated.count });
}
