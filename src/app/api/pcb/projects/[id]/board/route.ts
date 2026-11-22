import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
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
      const start = i;
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
  const action =
    typeof (body as Record<string, unknown>)?.action === 'string'
      ? ((body as Record<string, unknown>).action as string)
      : 'open';
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
    if (existsSync(abs)) openBoardInDesktop(abs);
    return NextResponse.json({ ok: true, action, kicadFilePath: abs, exists: existsSync(abs) });
  }

  try {
    const template = resolveTemplate();
    const dir = path.join(process.cwd(), 'data', 'pcb-work', id);
    mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, 'carte-test.kicad_pcb');
    const raw = template ? readFileSync(template, 'utf8') : EMPTY_BOARD_FALLBACK;
    const emptyBoard = template ? stripFootprints(raw) : raw;
    writeFileSync(dest, emptyBoard, 'utf8');

    await prisma.pcbProject.update({ where: { id }, data: { kicadFilePath: dest } });
    openBoardInDesktop(dest);
    return NextResponse.json({ ok: true, action, kicadFilePath: dest, exists: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur';
    console.error('[PCB:BOARD] open/reset', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
