import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { importSchematic } from '@/lib/pcb/kicad-bridge';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'multipart/form-data requis' }, { status: 400 });
  const projectId = String(form.get('projectId') ?? '').trim();
  const file = form.get('file');
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  if (!(file instanceof File))
    return NextResponse.json({ error: 'fichier requis' }, { status: 400 });

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  const ext = path.extname(file.name).toLowerCase();
  const tmpPath = path.join(
    tmpdir(),
    `partiva-import-${projectId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`,
  );
  try {
    writeFileSync(tmpPath, Buffer.from(await file.arrayBuffer()));

    const result = await importSchematic(tmpPath);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Import impossible' }, { status: 422 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pcbNet.deleteMany({ where: { projectId } });
      await tx.pcbComponent.deleteMany({ where: { projectId } });
      if ((result.components ?? []).length > 0) {
        await tx.pcbComponent.createMany({
          data: result.components!.map((c) => ({
            projectId,
            reference: c.reference,
            name: c.value || c.reference,
            symbol: 'imported',
            footprint: c.footprint || null,
            positionX: 0,
            positionY: 0,
            rotation: 0,
            status: 'proposed',
          })),
        });
      }
      if ((result.nets ?? []).length > 0) {
        await tx.pcbNet.createMany({
          data: result.nets!.map((n) => ({
            projectId,
            name: n.name,
            pins: n.pins as object,
            source: 'manual',
            status: 'proposed',
          })),
        });
      }
    });

    return NextResponse.json({
      ok: true,
      format: result.format,
      components: result.components ?? [],
      nets: result.nets ?? [],
      warnings: result.warnings ?? [],
      counts: {
        components: result.components?.length ?? 0,
        nets: result.nets?.length ?? 0,
        warnings: result.warnings?.length ?? 0,
      },
    });
  } catch (e) {
    console.error('[PCB:IMPORT] Échec', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Import impossible' },
      { status: 500 },
    );
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // fichier déjà absent
    }
  }
}
