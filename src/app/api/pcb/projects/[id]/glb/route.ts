import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { exportGlb } from '@/lib/pcb/kicad-cli-adapter';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id },
    select: { id: true, kicadFilePath: true },
  });
  if (!project?.kicadFilePath?.trim()) {
    return NextResponse.json({ error: 'Projet sans fichier KiCad' }, { status: 400 });
  }
  const normalized = normalizeBoardPath(project.kicadFilePath);
  const boardPath = path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized);
  if (!existsSync(boardPath)) {
    return NextResponse.json(
      { error: `Fichier KiCad introuvable : ${boardPath}` },
      { status: 400 },
    );
  }

  const outPath = path.join(
    tmpdir(),
    `partiva-board-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.glb`,
  );
  try {
    const result = await exportGlb(boardPath, outPath);
    if (!result.success || !existsSync(outPath)) {
      return NextResponse.json(
        { ok: false, error: result.stderr || 'Export GLB impossible' },
        { status: 500 },
      );
    }
    const base64 = readFileSync(outPath).toString('base64');
    return NextResponse.json({ ok: true, base64, bytes: base64.length });
  } finally {
    try {
      unlinkSync(outPath);
    } catch {
      // fichier déjà absent
    }
  }
}
