import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

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

/// KiCad pose `~<fichier>.lck` tant que le plateau est ouvert. On s'en sert pour
/// éviter qu'un rechargement de page n'ouvre une seconde fenêtre sur le même projet.
function isBoardOpenInKicad(absPath: string): boolean {
  return existsSync(path.join(path.dirname(absPath), `~${path.basename(absPath)}.lck`));
}

/**
 * Ferme gracieusement (WM_CLOSE, jamais taskkill) la fenêtre KiCad qui affiche
 * le plateau du travail précédent. Le nom de fichier est passé par variable
 * d'environnement pour éviter toute injection dans le script PowerShell.
 */
async function closeBoardInDesktop(
  absPath: string,
): Promise<{ closed: number; released: boolean }> {
  if (process.env.PARTIVA_DESKTOP !== '1' || process.platform !== 'win32') {
    return { closed: 0, released: true };
  }
  const fileName = path.basename(absPath);
  const script = [
    '$name = $env:PARTIVA_BOARD_NAME',
    "if (-not $name) { Write-Output '0'; exit }",
    '$procs = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {',
    "  ($_.ProcessName -ieq 'pcbnew' -or $_.ProcessName -ieq 'kicad') -and",
    '  $_.MainWindowTitle -and',
    '  $_.MainWindowTitle.IndexOf($name, [System.StringComparison]::OrdinalIgnoreCase) -ge 0',
    '})',
    '$closed = 0',
    'foreach ($p in $procs) { try { if ($p.CloseMainWindow()) { $closed++ } } catch {} }',
    'Write-Output ([string]$closed)',
  ].join('\n');

  let closed = 0;
  try {
    const result = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
      env: { ...process.env, PARTIVA_BOARD_NAME: fileName },
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    });
    closed = Number.parseInt(String(result.stdout ?? '').trim(), 10) || 0;
  } catch (e) {
    console.warn('[PCB:BOARD] fermeture KiCad impossible', e);
  }

  // KiCad supprime son `.lck` à la fermeture : on attend cette libération avant
  // de réécrire le plateau, sinon son état mémoire peut écraser le fichier vide.
  const lockPath = path.join(path.dirname(absPath), `~${path.basename(absPath)}.lck`);
  for (let i = 0; i < 20 && existsSync(lockPath); i++) {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return { closed, released: !existsSync(lockPath) };
}

function openBoardInDesktop(absPath: string): void {
  if (process.env.PARTIVA_DESKTOP !== '1') return;
  try {
    if (process.platform === 'win32') {
      const child = spawn('cmd', ['/c', 'start', '', absPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
      return;
    }
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    const child = spawn(cmd, [absPath], { detached: true, stdio: 'ignore' });
    child.unref();
  } catch (e) {
    console.warn('[PCB:BOARD] open board failed', e);
  }
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
  if (action !== 'open' && action !== 'reset' && action !== 'launch') {
    return NextResponse.json({ error: 'action invalide' }, { status: 400 });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id },
    select: { id: true, kicadFilePath: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

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
      closedWindows,
      lockReleased,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur';
    console.error('[PCB:BOARD] open/reset', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
