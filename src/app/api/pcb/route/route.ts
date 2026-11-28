import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { routeBoard } from '@/lib/pcb/kicad-bridge';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { BoardLockError, BoardLockedByKicadError, withBoardLock } from '@/lib/pcb/board-lock';
import { prepareBoardForWrite } from '@/lib/pcb/kicad-desktop';
import { checkCdcGate } from '@/lib/pcb/cdc-guard';

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
  const gate = await checkCdcGate(projectId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, message: gate.message }, { status: gate.status });
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

  try {
    return await withBoardLock(
      abs,
      async () => {
        if (!dryRun) {
          const prepared = await prepareBoardForWrite(abs);
          if (!prepared.released) throw new BoardLockedByKicadError(abs);
        }
        // Le nombre de couches est déduit du plateau ((stackup) écrit par pcbnew).
        const rawBoard = readFileSync(abs, 'utf8');
        const copperCount = (
          rawBoard.match(/\(\d+\s+"(?:F\.Cu|B\.Cu|In\d+\.Cu)"\s+signal\)/g) ?? []
        ).length;
        const layers: 2 | 4 = copperCount >= 4 ? 4 : 2;

        const result = await routeBoard({ boardPath: abs, nets, dryRun, layers });
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
          assignedPads: result.assignedPads ?? 0,
          missingPins: result.missingPins ?? 0,
          dryRun,
          message: 'Routage assisté partiel — DRC non vérifié',
        });
      },
      { operation: 'route' },
    );
  } catch (e) {
    if (e instanceof BoardLockedByKicadError) {
      return NextResponse.json(
        { error: 'BOARD_LOCKED_BY_KICAD', message: e.message, boardPath: abs },
        { status: 423 },
      );
    }
    if (e instanceof BoardLockError) {
      return NextResponse.json(
        { error: 'BOARD_LOCKED_BY_WRITER', message: e.message, boardPath: abs },
        { status: 423 },
      );
    }
    throw e;
  }
}
