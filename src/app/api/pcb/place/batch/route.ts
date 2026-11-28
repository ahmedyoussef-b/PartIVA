import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { placeFootprints, syncBoardLive, type BatchFootprintInput } from '@/lib/pcb/kicad-bridge';
import { getFootprintSize, resolveKicadFootprint } from '@/lib/pcb/kicad-footprints';
import {
  assertBoardStamp,
  BoardChangedError,
  BoardLockError,
  BoardLockedByKicadError,
  readBoardStamp,
  withBoardLock,
} from '@/lib/pcb/board-lock';
import {
  closeBoardInDesktop,
  isBoardOpenInKicad,
  openBoardInDesktop,
  prepareBoardForWrite,
} from '@/lib/pcb/kicad-desktop';
import { checkCdcGate } from '@/lib/pcb/cdc-guard';

export const runtime = 'nodejs';

const MAX_COMPONENTS = 200;

// Bounds réelles du plateau (Edge.Cuts). Sert à refuser une coordonnée invalide
// avant d'appeler le script Python, au lieu d'un 500 opaque.
async function readBoardBounds(
  boardPath: string,
): Promise<{ left: number; top: number; right: number; bottom: number } | null> {
  try {
    const { parseKicadPcb } = await import('@/lib/pcb/kicad-file-reader');
    const { readFileSync } = await import('node:fs');
    const parsed = parseKicadPcb(readFileSync(boardPath, 'utf8'));
    if (parsed.dimensions.width > 0 && parsed.dimensions.height > 0) {
      return {
        left: parsed.origin.x,
        top: parsed.origin.y,
        right: parsed.origin.x + parsed.dimensions.width,
        bottom: parsed.origin.y + parsed.dimensions.height,
      };
    }
  } catch {
    // plateau illisible : on ne bloque pas le placement pour autant
  }
  return null;
}

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
  const gate = await checkCdcGate(projectId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, message: gate.message }, { status: gate.status });
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
    select: { id: true, kicadFilePath: true, sourcingCache: true },
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

      const { optimizePlacement, inferPlacementRole, buildHints } =
        await import('@/lib/pcb/placement');
      // Le cache sourcing conserve le type et la rationale du LLM : on les
      // réinjecte ici pour que les règles métier connaissent les rôles.
      const cachedComponents =
        (project.sourcingCache as { components?: Array<Record<string, unknown>> } | null)
          ?.components ?? [];
      const cachedByRef = new Map(
        cachedComponents
          .filter((c) => typeof c.reference === 'string')
          .map((c) => [String(c.reference), c]),
      );
      const optimized = optimizePlacement(
        working.map((c) => {
          const size = getFootprintSize(c.libName, c.footprintName);
          const cached = cachedByRef.get(c.reference);
          const meta = {
            reference: c.reference,
            value: c.value ?? (typeof cached?.value === 'string' ? cached.value : null),
            type: typeof cached?.type === 'string' ? cached.type : null,
            footprint: `${c.libName}:${c.footprintName}`,
            rationale: typeof cached?.rationale === 'string' ? cached.rationale : null,
          };
          return {
            reference: c.reference,
            xMm: c.xMm,
            yMm: c.yMm,
            rotation: c.rotation ?? 0,
            role: inferPlacementRole(meta),
            hints: buildHints(meta),
            ...(size ? { widthMm: size.widthMm, heightMm: size.heightMm } : {}),
          };
        }),
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

  // Pré-validation : répare les empreintes inventées par le LLM et refuse
  // explicitement les données qui feraient échouer le script Python (500 opaque).
  const footprintsRoot =
    process.env.PARTIVA_KICAD_FOOTPRINTS_ROOT?.trim() ||
    'C:/Program Files/KiCad/10.0/share/kicad/footprints';
  const bounds = allowOutside ? null : await readBoardBounds(abs);
  const invalid: string[] = [];
  const repaired: string[] = [];
  for (const c of working) {
    const lib = c.libName.replace(/\.pretty$/i, '');
    const fp = c.footprintName.replace(/\.kicad_mod$/i, '');
    const exact = path.join(footprintsRoot, `${lib}.pretty`, `${fp}.kicad_mod`);
    if (!existsSync(exact)) {
      const resolved = resolveKicadFootprint(lib, fp, c.reference, footprintsRoot);
      const candidate = path.join(
        footprintsRoot,
        `${resolved.libName}.pretty`,
        `${resolved.footprintName}.kicad_mod`,
      );
      if (!existsSync(candidate)) {
        invalid.push(`${c.reference} : empreinte introuvable (${lib}:${fp})`);
        continue;
      }
      c.libName = resolved.libName;
      c.footprintName = resolved.footprintName;
      repaired.push(
        `${c.reference} : ${lib}:${fp} → ${resolved.libName}:${resolved.footprintName}`,
      );
    }
    if (
      bounds &&
      (c.xMm < bounds.left || c.xMm > bounds.right || c.yMm < bounds.top || c.yMm > bounds.bottom)
    ) {
      invalid.push(
        `${c.reference} : coordonnées hors du plateau (${c.xMm.toFixed(2)}, ${c.yMm.toFixed(2)} mm)`,
      );
    }
  }
  if (invalid.length > 0) {
    console.warn('[PCB:PLACE-BATCH] Données invalides', invalid);
    return NextResponse.json(
      {
        error: 'Données de placement invalides',
        details: invalid,
        hint: 'Régénérez la netlist/le sourcing ou activez l’option allowOutside pour forcer.',
      },
      { status: 400 },
    );
  }
  if (repaired.length > 0) {
    console.info('[PCB:PLACE-BATCH] Empreintes réparées', repaired);
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
  class PlacementFailure extends Error {}
  const stampBefore = readBoardStamp(abs);
  const wasOpen = isBoardOpenInKicad(abs);
  let backupPath: string | undefined;

  try {
    const payload = await withBoardLock(
      abs,
      async () => {
        // Plus d'écriture `--force` sous une GUI vivante : on ferme proprement,
        // et on renonce si l'utilisateur a des modifications non enregistrées.
        const prepared = await prepareBoardForWrite(abs);
        if (!prepared.released) throw new BoardLockedByKicadError(abs);
        assertBoardStamp(abs, stampBefore);

        const result = await placeFootprints({
          boardPath: abs,
          footprints,
          dryRun: dryRunFlag,
          force: false,
          allowOutside,
        });
        if (!result.ok) {
          console.error('[PCB:PLACE-BATCH] Erreur', result.error);
          throw new PlacementFailure(result.error ?? 'Échec du placement batch');
        }
        backupPath = result.backup;
        const stampAfterWrite = readBoardStamp(abs);

        // Sync live : seuls les composants déjà connus de la GUI sont déplacés.
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

        // Fencing : une sauvegarde KiCad pendant l'opération écrase nos changes.
        assertBoardStamp(abs, stampAfterWrite);

        // Rafraîchir UNIQUEMENT une fenêtre déjà ouverte : jamais de 2e fenêtre.
        if (!dryRunFlag && wasOpen && process.env.PARTIVA_DESKTOP === '1') {
          await closeBoardInDesktop(abs);
          openBoardInDesktop(abs);
        }

        console.info('[PCB:PLACE-BATCH] Résultat', {
          message: result.message,
          footprintCount: result.footprintCount,
        });

        const response: Record<string, unknown> = {
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
            ? {
                liveMissing,
                hint: 'Rechargez le plateau dans KiCad pour voir les nouveaux composants.',
              }
            : {}),
        };
        if (result.verified !== undefined) response.verified = result.verified;
        if (result.movedTracks !== undefined) response.movedTracks = result.movedTracks;
        if (result.backup !== undefined) response.backup = result.backup;
        return response;
      },
      { operation: 'place-batch' },
    );
    return NextResponse.json(payload);
  } catch (e) {
    if (e instanceof BoardLockedByKicadError) {
      return NextResponse.json(
        {
          error: 'BOARD_LOCKED_BY_KICAD',
          message: e.message,
          boardPath: abs,
        },
        { status: 423 },
      );
    }
    if (e instanceof BoardLockError) {
      return NextResponse.json(
        { error: 'BOARD_LOCKED_BY_WRITER', message: e.message, boardPath: abs },
        { status: 423 },
      );
    }
    if (e instanceof BoardChangedError) {
      if (backupPath && existsSync(backupPath)) {
        try {
          copyFileSync(backupPath, abs);
        } catch (rollbackError) {
          console.error('[PCB:PLACE-BATCH] Rollback impossible', rollbackError);
        }
      }
      return NextResponse.json(
        { error: 'BOARD_CHANGED', message: e.message, boardPath: abs },
        { status: 409 },
      );
    }
    if (e instanceof PlacementFailure) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    throw e;
  }
}
