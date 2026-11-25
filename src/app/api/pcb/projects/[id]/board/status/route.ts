import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

function standardBoardPath(projectId: string): string {
  const root =
    process.env.PARTIVA_DATA_DIR?.trim() ||
    (process.env.APPDATA
      ? path.join(process.env.APPDATA, 'PartIVA')
      : path.join(process.cwd(), 'data'));
  return path.join(root, 'pcb-work', projectId, 'carte-test.kicad_pcb');
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }
  const { id } = await params;
  const project = await prisma.pcbProject.findUnique({
    where: { id },
    select: { id: true, kicadFilePath: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  const inDb = !!project.kicadFilePath?.trim();
  let onDisk = false;
  if (inDb) {
    const normalized = normalizeBoardPath(project.kicadFilePath!);
    const abs = path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized);
    onDisk = existsSync(abs);
  }
  const suggested = standardBoardPath(id);
  const suggestedOnDisk = existsSync(suggested);
  return NextResponse.json({
    ok: true,
    inDb,
    onDisk,
    path: project.kicadFilePath ?? null,
    needsRepair: !inDb && suggestedOnDisk,
    suggestedPath: suggestedOnDisk ? suggested : null,
  });
}
