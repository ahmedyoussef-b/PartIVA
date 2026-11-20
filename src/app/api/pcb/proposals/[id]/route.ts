import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const status = b.status === 'accepted' ? 'accepted' : b.status === 'rejected' ? 'rejected' : null;
  if (!status) {
    return NextResponse.json(
      { error: 'status doit être "accepted" ou "rejected"' },
      { status: 400 },
    );
  }

  console.info('[PCB:PROPOSAL] Décision', { id, status });

  // 1. Charger la proposition
  const proposal = await prisma.pcbProposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
  }
  if (proposal.status !== 'pending') {
    return NextResponse.json({ error: 'Proposition déjà résolue' }, { status: 409 });
  }

  // 2. Application si acceptée et action add_component
  let applicationError: string | null = null;
  if (status === 'accepted' && proposal.action === 'add_component') {
    const payload = proposal.payload as Record<string, unknown>;
    try {
      await prisma.pcbComponent.create({
        data: {
          projectId: proposal.projectId,
          reference: String(payload.reference ?? ''),
          name: String(payload.name ?? payload.reference ?? ''),
          footprint: typeof payload.footprint === 'string' ? payload.footprint : null,
          symbol: typeof payload.symbol === 'string' ? payload.symbol : null,
          positionX: typeof payload.positionX === 'number' ? payload.positionX : null,
          positionY: typeof payload.positionY === 'number' ? payload.positionY : null,
          rotation: typeof payload.rotation === 'number' ? payload.rotation : 0,
          status: 'proposed',
        },
      });
    } catch (e) {
      applicationError = e instanceof Error ? e.message : 'Erreur application';
    }
  }

  // 3. Mettre à jour le statut
  const updated = await prisma.pcbProposal.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
  });

  if (applicationError) {
    console.error('[PCB:PROPOSAL] Erreur application', applicationError);
    return NextResponse.json({ proposal: updated, applicationError });
  }

  console.info('[PCB:PROPOSAL] Résolu', { id, status });
  return NextResponse.json({ proposal: updated });
}
