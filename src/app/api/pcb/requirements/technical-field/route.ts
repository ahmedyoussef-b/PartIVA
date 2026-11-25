import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const requirementId = typeof body.requirementId === 'string' ? body.requirementId.trim() : '';
  const field = typeof body.field === 'string' ? body.field.trim() : '';
  const value = typeof body.value === 'string' ? body.value.trim() : '';
  const source =
    typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'manual';

  if (!projectId || (!requirementId && !field)) {
    return NextResponse.json(
      { error: 'projectId et requirementId ou field requis' },
      { status: 400 },
    );
  }
  if (!value) {
    return NextResponse.json({ error: 'value requis' }, { status: 400 });
  }

  const requirement = requirementId
    ? await prisma.pcbRequirement.findFirst({ where: { id: requirementId, projectId } })
    : await prisma.pcbRequirement.findFirst({ where: { projectId, key: field } });
  if (!requirement) {
    return NextResponse.json({ error: 'Champ technique introuvable' }, { status: 404 });
  }

  const updated = await prisma.pcbRequirement.update({
    where: { id: requirement.id },
    data: { value, source, status: 'confirmed' },
  });
  console.info('[PCB:TECH-FIELD] Mis à jour', { projectId, key: updated.key, source });
  return NextResponse.json({
    ok: true,
    requirement: {
      id: updated.id,
      key: updated.key,
      value: updated.value,
      source: updated.source,
      status: updated.status,
    },
  });
}
