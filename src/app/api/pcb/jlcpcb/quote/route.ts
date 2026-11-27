import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { getJlcpcbQuote, hasJLCPCBCredentials } from '@/lib/pcb/jlcpcb-quote';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const quantity = typeof body.quantity === 'number' ? body.quantity : 5;
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true, kicadFilePath: true },
  });
  if (!project?.kicadFilePath?.trim()) {
    return NextResponse.json({ error: 'Projet sans fichier KiCad' }, { status: 400 });
  }

  // Dimensions et couches depuis le plateau (fallback 100×80 / 2 couches).
  let widthMm = 100;
  let heightMm = 80;
  let layers: 2 | 4 = 2;
  try {
    const normalized = normalizeBoardPath(project.kicadFilePath);
    const abs = path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized);
    if (existsSync(abs)) {
      const raw = readFileSync(abs, 'utf8');
      const edge = raw.match(
        /Edge\.Cuts[\s\S]{0,200}?\(start\s+([\d.-]+)\s+([\d.-]+)\)[\s\S]{0,200}?\(end\s+([\d.-]+)\s+([\d.-]+)\)/,
      );
      if (edge) {
        widthMm = Math.abs(Number(edge[3]) - Number(edge[1])) || widthMm;
        heightMm = Math.abs(Number(edge[4]) - Number(edge[2])) || heightMm;
      }
      const copper = (raw.match(/\(\d+\s+"(?:F\.Cu|B\.Cu|In\d+\.Cu)"\s+signal\)/g) ?? []).length;
      layers = copper >= 4 ? 4 : 2;
    }
  } catch {
    // valeurs par défaut
  }

  if (!hasJLCPCBCredentials()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        'Pour obtenir un devis en temps réel, configurez vos credentials JLCPCB dans .env (voir docs/TECHNIQUE.md).',
    });
  }

  const quote = await getJlcpcbQuote({ widthMm, heightMm, layers, quantity });
  return NextResponse.json({
    ...quote,
    widthMm,
    heightMm,
    layers,
    quantity,
  });
}
