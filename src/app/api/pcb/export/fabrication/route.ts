import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { runKicadCli } from '@/lib/pcb/kicad-cli-adapter';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, kicadFilePath: true },
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

  const components = await prisma.pcbComponent.findMany({
    where: { projectId },
    select: {
      reference: true,
      name: true,
      footprint: true,
      catalogId: true,
      positionX: true,
      positionY: true,
      rotation: true,
    },
    orderBy: { reference: 'asc' },
  });

  const outputDir = path.join(
    tmpdir(),
    `partiva-fab-${projectId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  mkdirSync(outputDir, { recursive: true });

  const gerbers = await runKicadCli(['pcb', 'export', 'gerbers', '--output', outputDir, boardPath]);
  const drill = await runKicadCli(['pcb', 'export', 'drill', '--output', outputDir, boardPath]);
  if (!gerbers.success && !drill.success) {
    return NextResponse.json(
      {
        error: 'Export KiCad impossible',
        details: [gerbers.stderr, drill.stderr].filter(Boolean).join('\n').slice(-2000),
      },
      { status: 500 },
    );
  }

  // BOM CSV et Pick-and-Place CSV générés depuis la BDD.
  const bomLines = ['Reference,MPN,Description,Quantity,Footprint'];
  for (const c of components) {
    bomLines.push(
      [
        csvCell(c.reference),
        csvCell(c.catalogId),
        csvCell(c.name),
        csvCell(1),
        csvCell(c.footprint),
      ].join(','),
    );
  }
  writeFileSync(path.join(outputDir, 'bom.csv'), bomLines.join('\n'), 'utf8');

  const posLines = ['Ref,Val,Package,PosX,PosY,Rot,Side'];
  for (const c of components) {
    posLines.push(
      [
        csvCell(c.reference),
        csvCell(c.name),
        csvCell(c.footprint),
        csvCell(c.positionX),
        csvCell(c.positionY),
        csvCell(c.rotation),
        csvCell('top'),
      ].join(','),
    );
  }
  writeFileSync(path.join(outputDir, 'pos.csv'), posLines.join('\n'), 'utf8');

  const zip = new JSZip();
  let fileCount = 0;
  for (const file of readdirSync(outputDir)) {
    const full = path.join(outputDir, file);
    if (!existsSync(full) || file.endsWith('.zip')) continue;
    zip.file(file, readFileSync(full));
    fileCount += 1;
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  return NextResponse.json({
    ok: true,
    fileName: `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'pcb'}-fabrication.zip`,
    base64: buffer.toString('base64'),
    fileCount,
    gerberOk: gerbers.success,
    drillOk: drill.success,
  });
}
