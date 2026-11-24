import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { placeFootprints, syncBoardLive, type BatchFootprintInput } from '@/lib/pcb/kicad-bridge';

export const runtime = 'nodejs';

const MAX_COMPONENTS = 200;

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
  const components = Array.isArray(b.components) ? b.components : [];
  const dryRunFlag = b.dryRun === true;
  const allowOutside = b.allowOutside === true;
  const optimizeFlag = b.optimize === true;

  if (b.force !== undefined && typeof b.force !== 'boolean') {
    return NextResponse.json({ error: 'force doit être un booléen' }, { status: 400 });
  }
  if (b.allowOutside !== undefined && typeof b.allowOutside !== 'boolean') {
    return NextResponse.json({ error: 'allowOutside doit être un booléen' }, { status: 400 });
  }
  if (b.optimize !== undefined && typeof b.optimize !== 'boolean') {
    return NextResponse.json({ error: 'optimize doit être un booléen' }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }
  if (components.length === 0) {
    return NextResponse.json({ error: 'components requis (tableau non vide)' }, { status: 400 });
  }
  if (components.length > MAX_COMPONENTS) {
    return NextResponse.json(
      { error: `components limité à ${MAX_COMPONENTS} éléments` },
      { status: 400 },
    );
  }

  for (let i = 0; i < components.length; i += 1) {
    const c = (components[i] ?? {}) as Record<string, unknown>;
    if (typeof c.reference !== 'string' || !c.reference.trim()) {
      return NextResponse.json({ error: `components[${i}].reference requis` }, { status: 400 });
    }
    if (typeof c.libName !== 'string' || !c.libName.trim()) {
      return NextResponse.json({ error: `components[${i}].libName requis` }, { status: 400 });
    }
    if (typeof c.footprintName !== 'string' || !c.footprintName.trim()) {
      return NextResponse.json({ error: `components[${i}].footprintName requis` }, { status: 400 });
    }
    if (typeof c.xMm !== 'number' || !Number.isFinite(c.xMm)) {
      return NextResponse.json(
        { error: `components[${i}].xMm doit être un nombre` },
        { status: 400 },
      );
    }
    if (typeof c.yMm !== 'number' || !Number.isFinite(c.yMm)) {
      return NextResponse.json(
        { error: `components[${i}].yMm doit être un nombre` },
        { status: 400 },
      );
    }
    if (
      c.rotation !== undefined &&
      (typeof c.rotation !== 'number' || !Number.isFinite(c.rotation))
    ) {
      return NextResponse.json(
        { error: `components[${i}].rotation doit être un nombre` },
        { status: 400 },
      );
    }
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

  console.info('[PCB:PLACE-BATCH]', {
    projectId,
    count: components.length,
    dryRun: dryRunFlag,
    optimize: optimizeFlag,
  });

  let working = components.map((raw) => {
    const c = raw as Record<string, unknown>;
    return {
      libName: String(c.libName).trim(),
      footprintName: String(c.footprintName).trim(),
      reference: String(c.reference).trim(),
      value: typeof c.value === 'string' ? c.value.trim() : undefined,
      xMm: c.xMm as number,
      yMm: c.yMm as number,
      layer: typeof c.layer === 'string' && c.layer.trim() ? c.layer.trim() : undefined,
      rotation: typeof c.rotation === 'number' ? c.rotation : undefined,
    };
  });

  if (optimizeFlag) {
    try {
      const nets = await prisma.pcbNet.findMany({
        where: { projectId },
        select: { name: true, pins: true },
      });
      const placementNets = nets.map((n) => ({
        name: n.name,
        pins: Array.isArray(n.pins) ? (n.pins as string[]) : [],
      }));

      let boardW = 80;
      let boardH = 60;
      let originX = 5;
      let originY = 5;
      try {
        const { parseKicadPcb } = await import('@/lib/pcb/kicad-file-reader');
        const { readFileSync } = await import('node:fs');
        const parsed = parseKicadPcb(readFileSync(abs, 'utf8'));
        if (parsed.dimensions.width > 0 && parsed.dimensions.height > 0) {
          boardW = parsed.dimensions.width;
          boardH = parsed.dimensions.height;
          originX = parsed.origin.x;
          originY = parsed.origin.y;
        }
      } catch {
        // fallback to defaults
      }

      const { optimizePlacement } = await import('@/lib/pcb/placement');
      const optimized = optimizePlacement(
        working.map((c) => ({
          reference: c.reference,
          xMm: c.xMm,
          yMm: c.yMm,
          rotation: c.rotation ?? 0,
        })),
        placementNets,
        { widthMm: boardW, heightMm: boardH, originX, originY },
      );
      working = working.map((c) => {
        const opt = optimized.find((o) => o.reference === c.reference);
        return opt ? { ...c, xMm: opt.xMm, yMm: opt.yMm, rotation: opt.rotation } : c;
      });
      console.info('[PCB:PLACE-BATCH] Optimized', { projectId, nets: placementNets.length });
    } catch (e) {
      console.warn('[PCB:PLACE-BATCH] Optimize failed, using provided coords', e);
    }
  }

  const footprints: BatchFootprintInput[] = working.map((c) => ({
    libName: c.libName,
    footprintName: c.footprintName,
    reference: c.reference,
    value: c.value,
    xMm: c.xMm,
    yMm: c.yMm,
    layer: c.layer,
    rotation: c.rotation,
  }));

  // Persistance TOUJOURS par le fichier : c'est la seule source de vérité qui
  // contient tous les composants (KiCad garde un état mémoire potentiellement
  // obsolète et ne doit jamais réécrire le plateau depuis cette mémoire).
  const result = await placeFootprints({
    boardPath: abs,
    footprints,
    dryRun: dryRunFlag,
    // KiCad reste ouvert pendant les manipulations : l'écriture fichier doit
    // ignorer le verrou `.lck`.
    force: true,
    allowOutside,
  });

  if (!result.ok) {
    console.error('[PCB:PLACE-BATCH] Erreur', result.error);
    return NextResponse.json(
      { error: result.error ?? 'Échec du placement batch' },
      { status: 500 },
    );
  }

  // Rafraîchissement de la fenêtre KiCad ouverte (sans sauvegarde) : les
  // déplacements de composants déjà connus de l'éditeur apparaissent en direct.
  // Les composants ajoutés depuis l'ouverture de KiCad ne sont pas dans sa
  // mémoire : ils nécessitent un rechargement manuel du plateau dans l'éditeur.
  let liveSynced = false;
  let liveMissing: string[] = [];
  if (!dryRunFlag && process.env.PARTIVA_DESKTOP === '1') {
    const live = await syncBoardLive({ boardPath: abs, footprints });
    if (live.ok) {
      liveSynced = (live.moved?.length ?? 0) > 0;
      liveMissing = live.missing ?? [];
      console.info('[PCB:PLACE-BATCH] Sync live KiCad', {
        board: live.board,
        moved: live.moved,
        missing: liveMissing,
      });
    } else {
      console.warn('[PCB:PLACE-BATCH] Sync live indisponible', {
        code: live.code,
        error: live.error,
      });
    }
  }

  console.info('[PCB:PLACE-BATCH] Résultat', {
    message: result.message,
    footprintCount: result.footprintCount,
  });

  // Auto-open removed: user opens KiCad explicitly from workspace controls.

  const payload: Record<string, unknown> = {
    ok: true,
    placed: result.footprintCount ?? 0,
    dryRun: dryRunFlag,
    message: result.message,
    liveSynced,
    ...(optimizeFlag
      ? {
          optimized: working.map((c) => ({
            reference: c.reference,
            xMm: c.xMm,
            yMm: c.yMm,
            rotation: c.rotation,
          })),
        }
      : {}),
    ...(liveMissing.length > 0
      ? { liveMissing, hint: 'Rechargez le plateau dans KiCad pour voir les nouveaux composants.' }
      : {}),
  };
  if (result.verified !== undefined) payload.verified = result.verified;
  if (result.backup !== undefined) payload.backup = result.backup;

  return NextResponse.json(payload);
}
