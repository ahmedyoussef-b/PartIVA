import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { CDC_CATEGORIES } from '@/lib/pcb/cdc-gate';

export const runtime = 'nodejs';

/** Ajoute un champ technique manquant saisi par l'utilisateur (jamais inventé). */
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  const value = typeof body.value === 'string' ? body.value.trim() : '';
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  if (!(CDC_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
  }
  if (!key || !value) {
    return NextResponse.json({ error: 'key et value requis' }, { status: 400 });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  const requirement = await prisma.pcbRequirement.create({
    data: { projectId, category, key, value, status: 'confirmed', source: 'manual' },
  });
  console.info('[PCB:CDC] Champ ajouté', { projectId, category, key });
  return NextResponse.json({ ok: true, requirement });
}
