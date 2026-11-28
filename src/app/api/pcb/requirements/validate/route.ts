import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { cdcCategoryLabel, evaluateCdcCompleteness } from '@/lib/pcb/cdc-gate';

export const runtime = 'nodejs';

/** Finalise le cahier des charges : stats validé uniquement si tout est confirmé. */
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
    select: {
      id: true,
      status: true,
      requirements: { select: { category: true, key: true, value: true, status: true } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  // Formulaire 7 blocs déjà validé (statut posé par /parse) : rien à faire.
  if (project.status === 'requirements_validated') {
    return NextResponse.json({ ok: true, status: project.status, alreadyValidated: true });
  }

  const completeness = evaluateCdcCompleteness(project.requirements);
  if (!completeness.ready) {
    return NextResponse.json(
      {
        error: 'CDC_INCOMPLETE',
        message: `Cahier des charges incomplet : ${completeness.missing.map(cdcCategoryLabel).join(', ')}.`,
        missing: completeness.missing,
      },
      { status: 422 },
    );
  }

  await prisma.pcbProject.update({
    where: { id: projectId },
    data: { status: 'requirements_validated' },
  });
  console.info('[PCB:CDC] Validation finale', { projectId });
  return NextResponse.json({
    ok: true,
    status: 'requirements_validated',
    validatedAt: new Date().toISOString(),
  });
}
