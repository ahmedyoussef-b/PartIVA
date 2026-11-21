import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { saveAccomplishedSnapshot } from '@/lib/pcb/capitalize';

export const runtime = 'nodejs';

function unauthorized(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return unauthorized(e);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const projectId = typeof b.projectId === 'string' ? b.projectId.trim() : '';

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }

  let regime: 'internal' | 'reference' = 'internal';
  if (b.regime !== undefined) {
    if (b.regime !== 'internal' && b.regime !== 'reference') {
      return NextResponse.json(
        { error: "regime doit valoir 'internal' ou 'reference'" },
        { status: 400 },
      );
    }
    regime = b.regime;
  }

  let licence: string | null = null;
  if (b.licence !== undefined && b.licence !== null) {
    if (typeof b.licence !== 'string') {
      return NextResponse.json({ error: 'licence doit être une chaîne' }, { status: 400 });
    }
    const trimmed = b.licence.trim();
    licence = trimmed.length > 0 ? trimmed : null;
  }

  if (regime === 'reference' && !licence) {
    return NextResponse.json(
      { error: 'licence requise pour un modèle de référence' },
      { status: 400 },
    );
  }

  console.info('[PCB:CAPITALIZE-API]', { projectId, regime });

  try {
    const result = await saveAccomplishedSnapshot(projectId, { regime, licence });

    if (!result) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      checkpointId: result.checkpointId,
      kind: result.snapshot.kind,
      regime: result.snapshot.regime,
      components: result.snapshot.components.length,
      acceptedProposals: result.snapshot.acceptedProposals.length,
    });
  } catch (e) {
    console.error('[PCB:CAPITALIZE-API] Erreur', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
