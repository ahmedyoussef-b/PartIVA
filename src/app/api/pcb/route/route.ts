import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { routeBoard } from '@/lib/pcb/kicad-bridge';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const dryRun = body.dryRun === true;
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
  if (!project.kicadFilePath?.trim()) {
    return NextResponse.json({ error: 'Projet sans fichier KiCad' }, { status: 400 });
  }

  const normalized = normalizeBoardPath(project.kicadFilePath);
  const abs = path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized);
  if (!existsSync(abs)) {
    return NextResponse.json({ error: `Fichier KiCad introuvable : ${abs}` }, { status: 400 });
  }

  const rows = await prisma.pcbNet.findMany({
    where: { projectId },
    select: { name: true, pins: true },
  });
  const nets = rows
    .map((n) => ({
      name: n.name,
      pins: Array.isArray(n.pins) ? (n.pins as string[]) : [],
    }))
    .filter((n) => n.pins.length >= 2);
  if (nets.length === 0) {
    return NextResponse.json(
      { error: 'Aucun net exploitable — générez d’abord la netlist' },
      { status: 400 },
    );
  }

  const result = await routeBoard({ boardPath: abs, nets, dryRun });
  if (!result.ok) {
    console.error('[PCB:ROUTE] Erreur', result.error);
    return NextResponse.json({ error: result.error ?? 'Échec du routage' }, { status: 500 });
  }

  console.info('[PCB:ROUTE] Résultat', {
    projectId,
    routed: result.routed ?? 0,
    zones: result.zones ?? 0,
    vias: result.vias ?? 0,
    dryRun,
  });
  return NextResponse.json({
    ok: true,
    routed: result.routed ?? 0,
    zones: result.zones ?? 0,
    vias: result.vias ?? 0,
    createdNets: result.createdNets ?? [],
    dryRun,
    message: 'Routage assisté partiel — DRC non vérifié',
  });
}
