import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ALLOWED_STEPS = new Set(['analyze', 'nets', 'placement', 'routing', 'review']);

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const step = typeof body.step === 'string' ? body.step.trim() : '';
  const unvalidate = body.unvalidate === true;
  if (!projectId || !ALLOWED_STEPS.has(step)) {
    return NextResponse.json({ error: 'projectId ou étape invalide' }, { status: 400 });
  }

  if (unvalidate) {
    await prisma.pcbWizardValidation.deleteMany({ where: { projectId, step } });
  } else {
    const user = await getCurrentUser();
    await prisma.pcbWizardValidation.upsert({
      where: { projectId_step: { projectId, step } },
      create: { projectId, step, validatedBy: user?.email ?? user?.name ?? 'admin' },
      update: { validatedBy: user?.email ?? user?.name ?? 'admin' },
    });
  }

  const rows = await prisma.pcbWizardValidation.findMany({
    where: { projectId },
    select: { step: true },
  });
  console.info('[PCB:WIZARD] Validation', { projectId, step, unvalidate });
  return NextResponse.json({
    ok: true,
    validated: rows.map((r) => r.step),
  });
}
