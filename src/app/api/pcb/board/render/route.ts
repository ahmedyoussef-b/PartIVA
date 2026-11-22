import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { parseKicadPcb } from '@/lib/pcb/kicad-file-reader';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = (searchParams.get('projectId') ?? '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
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
    return NextResponse.json({
      ok: true,
      board: {
        origin: parsed.origin,
        dimensions: parsed.dimensions,
        edges: parsed.edges ?? [],
      },
      components: parsed.components.map((c) => ({
        reference: c.reference,
        value: c.value ?? '',
        x: c.x,
        y: c.y,
        rotation: c.rotation,
        layer: c.layer,
        footprint: c.library ? `${c.library}:${c.name}` : c.name,
        pads: c.pads ?? [],
        graphics: c.graphics ?? [],
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur lecture board';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
