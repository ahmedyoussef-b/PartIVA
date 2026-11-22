import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { parseKicadPcb } from '@/lib/pcb/kicad-file-reader';
import { verifyPlacement } from '@/lib/pcb/verify-placement';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

const MAX_REQUESTED = 200;

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const projectId = typeof b.projectId === 'string' ? b.projectId.trim() : '';
  const requested = Array.isArray(b.requested) ? b.requested : [];

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }
  if (requested.length === 0) {
    return NextResponse.json({ error: 'requested requis (tableau non vide)' }, { status: 400 });
  }
  if (requested.length > MAX_REQUESTED) {
    return NextResponse.json(
      { error: `requested limité à ${MAX_REQUESTED} éléments` },
      { status: 400 },
    );
  }

  for (let i = 0; i < requested.length; i += 1) {
    const item = (requested[i] ?? {}) as Record<string, unknown>;
    if (typeof item.reference !== 'string' || !item.reference.trim()) {
      return NextResponse.json({ error: `requested[${i}].reference requis` }, { status: 400 });
    }
    if (typeof item.xMm !== 'number' || !Number.isFinite(item.xMm)) {
      return NextResponse.json(
        { error: `requested[${i}].xMm doit être un nombre` },
        { status: 400 },
      );
    }
    if (typeof item.yMm !== 'number' || !Number.isFinite(item.yMm)) {
      return NextResponse.json(
        { error: `requested[${i}].yMm doit être un nombre` },
        { status: 400 },
      );
    }
    if (
      item.rotation !== undefined &&
      (typeof item.rotation !== 'number' || !Number.isFinite(item.rotation))
    ) {
      return NextResponse.json(
        { error: `requested[${i}].rotation doit être un nombre` },
        { status: 400 },
      );
    }
  }

  const toleranceMm = b.toleranceMm === undefined ? undefined : b.toleranceMm;
  const rotationToleranceDeg =
    b.rotationToleranceDeg === undefined ? undefined : b.rotationToleranceDeg;

  if (
    toleranceMm !== undefined &&
    (typeof toleranceMm !== 'number' || !Number.isFinite(toleranceMm) || toleranceMm <= 0)
  ) {
    return NextResponse.json({ error: 'toleranceMm doit être un nombre > 0' }, { status: 400 });
  }
  if (
    rotationToleranceDeg !== undefined &&
    (typeof rotationToleranceDeg !== 'number' ||
      !Number.isFinite(rotationToleranceDeg) ||
      rotationToleranceDeg <= 0)
  ) {
    return NextResponse.json(
      { error: 'rotationToleranceDeg doit être un nombre > 0' },
      { status: 400 },
    );
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true, kicadFilePath: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }

  const boardPath = process.env.PARTIVA_KICAD_BOARD?.trim() || project.kicadFilePath;
  if (!boardPath) {
    return NextResponse.json({ error: 'Projet sans fichier KiCad' }, { status: 400 });
  }

  const abs = path.isAbsolute(normalizeBoardPath(boardPath))
    ? normalizeBoardPath(boardPath)
    : path.join(process.cwd(), normalizeBoardPath(boardPath));
  if (!existsSync(abs)) {
    return NextResponse.json({ error: `Fichier KiCad introuvable : ${abs}` }, { status: 400 });
  }

  try {
    const parsed = parseKicadPcb(readFileSync(abs, 'utf8'));

    const actual = parsed.components.map((c) => ({
      reference: c.reference,
      xMm: c.x,
      yMm: c.y,
      rotation: c.rotation,
    }));

    const requestedNormalized = requested.map((raw) => {
      const item = raw as Record<string, unknown>;
      return {
        reference: String(item.reference).trim(),
        xMm: item.xMm as number,
        yMm: item.yMm as number,
        rotation: typeof item.rotation === 'number' ? item.rotation : 0,
      };
    });

    const verification = verifyPlacement(requestedNormalized, actual, {
      toleranceMm: typeof toleranceMm === 'number' ? toleranceMm : undefined,
      rotationToleranceDeg:
        typeof rotationToleranceDeg === 'number' ? rotationToleranceDeg : undefined,
    });

    console.info('[PCB:VERIFY]', {
      projectId,
      checked: verification.checked,
      matched: verification.matched,
      ok: verification.ok,
    });

    return NextResponse.json({ verification });
  } catch (e) {
    console.error('[PCB:VERIFY] Erreur', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur de lecture du plateau' },
      { status: 500 },
    );
  }
}
