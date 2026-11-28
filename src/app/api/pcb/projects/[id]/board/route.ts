import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';
import {
  closeBoardInDesktop,
  isBoardOpenInKicad,
  openBoardInDesktop,
} from '@/lib/pcb/kicad-desktop';
import { configureBoardLayers } from '@/lib/pcb/kicad-bridge';
import { computeWizardState } from '@/lib/pcb/wizard-state';

export const runtime = 'nodejs';

const EMPTY_BOARD_FALLBACK = `(kicad_pcb
	(version 20241229)
	(generator "pcbnew")
	(generator_version "9.0")
	(general (thickness 1.6) (legacy_teardrops no))
	(paper "A4")
	(layers (0 "F.Cu" signal) (2 "B.Cu" signal) (25 "Edge.Cuts" user))
	(setup (pad_to_mask_clearance 0))
	(net 0 "")
	(gr_line (start 100 100) (end 200 100) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000001"))
	(gr_line (start 200 100) (end 200 180) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000002"))
	(gr_line (start 200 180) (end 100 180) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000003"))
	(gr_line (start 100 180) (end 100 100) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000004"))
)
`;

function resolveTemplate(): string | null {
  const candidates = [
    path.join(process.cwd(), 'src', 'lib', 'pcb', 'boards', 'carte-test.kicad_pcb'),
    path.join(process.cwd(), 'boards', 'carte-test.kicad_pcb'),
    path.join(
      process.cwd(),
      'desktop',
      'server',
      'src',
      'lib',
      'pcb',
      'boards',
      'carte-test.kicad_pcb',
    ),
    path.join(
      process.cwd(),
      '.next',
      'standalone',
      'src',
      'lib',
      'pcb',
      'boards',
      'carte-test.kicad_pcb',
    ),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

function workRoot(): string {
  const override = process.env.PARTIVA_DATA_DIR?.trim();
  if (override) return override;
  const appdata = process.env.APPDATA;
  if (appdata) return path.join(appdata, 'PartIVA');
  return path.join(process.cwd(), 'data');
}

function stripFootprints(content: string): string {
  // Remove top-level (footprint ...) blocks to produce an empty workspace board.
  let out = '';
  let i = 0;
  while (i < content.length) {
    if (content.startsWith('(footprint', i)) {
      let depth = 0;
      let inString = false;
      let escape = false;
      for (; i < content.length; i++) {
        const ch = content[i];
        if (inString) {
          if (escape) escape = false;
          else if (ch === '\\') escape = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === '(') depth++;
        if (ch === ')') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
      }
      // also trim surrounding blank line
      while (out.endsWith('\n') || out.endsWith('\r') || out.endsWith('\t')) out = out.slice(0, -1);
      out += '\n';
      // skip leading whitespace/newlines after removed block
      while (i < content.length && (content[i] === '\n' || content[i] === '\r')) i++;
      continue;
    }
    out += content[i];
    i++;
  }
  return out.endsWith('\n') ? out : out + '\n';
}

function boardFileName(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const base = cleaned.length > 0 ? cleaned : 'carte';
  return `${base}.kicad_pcb`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    body = {};
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const action = typeof b.action === 'string' ? b.action : 'open';
  const source = b.source === 'manual' ? 'manual' : 'auto';
  const layers: 2 | 4 = b.layers === 4 ? 4 : 2;
  if (
    action !== 'open' &&
    action !== 'reset' &&
    action !== 'launch' &&
    action !== 'reload' &&
    action !== 'sync' &&
    action !== 'show'
  ) {
    return NextResponse.json({ error: 'action invalide' }, { status: 400 });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id },
    select: { id: true, kicadFilePath: true, name: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  // `sync` : relecture du plateau existant, sans aucune écriture ni ouverture
  // de fenêtre KiCad. Sert de bouton de déblocage quand l'affichage est figé
  // alors que le backend a déjà routé.
  if (action === 'sync') {
    const boardPath = project.kicadFilePath?.trim();
    if (!boardPath) return NextResponse.json({ ok: false, reason: 'no-file' }, { status: 200 });
    const abs = path.isAbsolute(boardPath) ? boardPath : path.join(process.cwd(), boardPath);
    if (!existsSync(abs)) {
      return NextResponse.json({ error: `Fichier KiCad introuvable : ${abs}` }, { status: 400 });
    }
    const raw = readFileSync(abs, 'utf8');
    const state = await computeWizardState(id);
    if (!state) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    return NextResponse.json(
      {
        ok: true,
        action,
        kicadFilePath: abs,
        bytes: Buffer.byteLength(raw, 'utf8'),
        footprints: state.footprints,
        tracks: state.tracks,
        zones: state.zones,
        componentsCount: state.componentsCount,
        nextActionId: state.nextActionId,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  // `reload` : KiCad ne recharge pas un fichier modifié en externe. On ferme
  // gracieusement la fenêtre puis on rouvre le plateau courant pour refléter
  // l'état réel après nets / placement / routage.
  if (action === 'reload') {
    const boardPath = project.kicadFilePath?.trim();
    if (!boardPath) return NextResponse.json({ ok: false, reason: 'no-file' }, { status: 200 });
    const abs = path.isAbsolute(boardPath) ? boardPath : path.join(process.cwd(), boardPath);
    if (!existsSync(abs)) {
      return NextResponse.json({ error: `Fichier KiCad introuvable : ${abs}` }, { status: 400 });
    }
    const closed = await closeBoardInDesktop(abs);
    openBoardInDesktop(abs);
    return NextResponse.json({
      ok: true,
      action,
      kicadFilePath: abs,
      closedWindows: closed.closed,
      lockReleased: closed.released,
    });
  }

  // `show` : affiche le résultat complet sous le nom du projet. Le fichier
  // courant (`carte-test.kicad_pcb`) est fermé, renommé `<projet>.kicad_pcb`
  // et rouvert dans KiCad. Le chemin est mis à jour en base.
  if (action === 'show') {
    const boardPath = project.kicadFilePath?.trim();
    if (!boardPath) return NextResponse.json({ ok: false, reason: 'no-file' }, { status: 200 });
    const abs = path.isAbsolute(boardPath) ? boardPath : path.join(process.cwd(), boardPath);
    if (!existsSync(abs)) {
      return NextResponse.json({ error: `Fichier KiCad introuvable : ${abs}` }, { status: 400 });
    }
    const closed = await closeBoardInDesktop(abs);
    const target = path.join(path.dirname(abs), boardFileName(project.name ?? 'carte'));
    let renamed = false;
    try {
      if (path.resolve(target) !== path.resolve(abs)) {
        if (existsSync(target)) unlinkSync(target);
        renameSync(abs, target);
        renamed = true;
      }
      await prisma.pcbProject.update({
        where: { id },
        data: { kicadFilePath: target },
      });
    } catch (e) {
      if (renamed) {
        try {
          renameSync(target, abs);
        } catch {
          // restauration impossible — l'erreur d'origine reste remontée
        }
      }
      console.error('[PCB:BOARD] show', e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Renommage impossible' },
        { status: 500 },
      );
    }
    openBoardInDesktop(target);
    return NextResponse.json({
      ok: true,
      action,
      kicadFilePath: target,
      renamed,
      closedWindows: closed.closed,
      lockReleased: closed.released,
    });
  }

  if (action === 'launch') {
    const boardPath = project.kicadFilePath?.trim();
    if (!boardPath) return NextResponse.json({ ok: false, reason: 'no-file' }, { status: 200 });
    const abs = path.isAbsolute(boardPath) ? boardPath : path.join(process.cwd(), boardPath);
    const exists = existsSync(abs);
    // Ouverture automatique (chargement projet) : on ne duplique pas une fenêtre
    // KiCad déjà ouverte sur ce plateau. Le bouton `KiCad` (source=manual) force
    // l'ouverture, utile si un verrou stale subsiste après un crash.
    const alreadyOpen = exists && source !== 'manual' && isBoardOpenInKicad(abs);
    if (exists && !alreadyOpen) openBoardInDesktop(abs);
    return NextResponse.json({
      ok: true,
      action,
      kicadFilePath: abs,
      exists,
      alreadyOpen,
    });
  }

  try {
    const template = resolveTemplate();
    const dir = path.join(workRoot(), 'pcb-work', id);
    mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, 'carte-test.kicad_pcb');
    const raw = template ? readFileSync(template, 'utf8') : EMPTY_BOARD_FALLBACK;
    const emptyBoard = template ? stripFootprints(raw) : raw;

    // Reset : on ferme d'abord le plateau du travail précédent pour qu'il ne
    // réécrive pas par-dessus le fichier vide une fois l'éditeur refermé.
    let closedWindows = 0;
    let lockReleased = true;
    if (action === 'reset' && project.kicadFilePath?.trim()) {
      const previous = project.kicadFilePath.trim();
      const absPrevious = path.isAbsolute(previous) ? previous : path.join(process.cwd(), previous);
      const closed = await closeBoardInDesktop(absPrevious);
      closedWindows = closed.closed;
      lockReleased = closed.released;
    }

    // En cas d'échec de la transaction BDD, on restaure le plateau précédent
    // pour ne pas laisser le fichier vide avec des composants encore persistés.
    let previousBoard: string | null = null;
    try {
      previousBoard = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
    } catch {
      previousBoard = null;
    }
    writeFileSync(dest, emptyBoard, 'utf8');

    if (layers === 4) {
      const configured = await configureBoardLayers(dest, 4);
      if (!configured.ok) {
        return NextResponse.json(
          { error: configured.error ?? 'Configuration 4 couches impossible' },
          { status: 500 },
        );
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (action === 'reset') {
          // On revient juste après la validation CDC : le cahier des charges
          // reste intact, tout ce qui en a été dérivé est effacé.
          await tx.pcbNet.deleteMany({ where: { projectId: id } });
          await tx.pcbComponent.deleteMany({ where: { projectId: id } }); // pins en cascade
          await tx.pcbWizardValidation.deleteMany({ where: { projectId: id } });
        }
        await tx.pcbProject.update({
          where: { id },
          data:
            action === 'reset'
              ? {
                  kicadFilePath: dest,
                  sourcingCache: Prisma.JsonNull,
                  status: 'requirements_validated',
                }
              : { kicadFilePath: dest },
        });
      });
    } catch (e) {
      if (previousBoard !== null) {
        try {
          writeFileSync(dest, previousBoard, 'utf8');
        } catch {
          // restauration impossible : l'erreur d'origine reste remontée
        }
      }
      throw e;
    }

    openBoardInDesktop(dest);
    return NextResponse.json({
      ok: true,
      action,
      kicadFilePath: dest,
      exists: true,
      layers,
      closedWindows,
      lockReleased,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur';
    console.error('[PCB:BOARD] open/reset', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
