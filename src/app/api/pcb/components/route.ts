import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';

interface ComponentInput {
  reference: string;
  name: string;
  catalogId?: string | null;
  symbol?: string | null;
  footprint?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  rotation?: number | null;
  status?: string;
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
  const components = Array.isArray(b.components) ? (b.components as ComponentInput[]) : [];

  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }
  if (components.length === 0) {
    return NextResponse.json({ error: 'components requis (tableau non vide)' }, { status: 400 });
  }

  for (let i = 0; i < components.length; i += 1) {
    const c = components[i] ?? ({} as ComponentInput);
    if (typeof c.reference !== 'string' || !c.reference.trim()) {
      return NextResponse.json({ error: `components[${i}].reference requis` }, { status: 400 });
    }
    if (typeof c.name !== 'string' || !c.name.trim()) {
      return NextResponse.json({ error: `components[${i}].name requis` }, { status: 400 });
    }
    if (c.positionX !== undefined && c.positionX !== null && !Number.isFinite(c.positionX)) {
      return NextResponse.json(
        { error: `components[${i}].positionX doit être un nombre` },
        { status: 400 },
      );
    }
    if (c.positionY !== undefined && c.positionY !== null && !Number.isFinite(c.positionY)) {
      return NextResponse.json(
        { error: `components[${i}].positionY doit être un nombre` },
        { status: 400 },
      );
    }
    if (c.rotation !== undefined && c.rotation !== null && !Number.isFinite(c.rotation)) {
      return NextResponse.json(
        { error: `components[${i}].rotation doit être un nombre` },
        { status: 400 },
      );
    }
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }

  let created = 0;
  let updated = 0;

  for (const c of components) {
    const data = {
      reference: c.reference,
      name: c.name,
      catalogId: c.catalogId ?? null,
      symbol: c.symbol ?? null,
      footprint: c.footprint ?? null,
      positionX: c.positionX ?? null,
      positionY: c.positionY ?? null,
      rotation: c.rotation ?? 0,
      status: c.status ?? 'proposed',
    };

    // Pas de @@unique(projectId, reference) : findFirst + create/update.
    const existing = await prisma.pcbComponent.findFirst({
      where: { projectId, reference: c.reference },
      select: { id: true },
    });

    if (existing) {
      await prisma.pcbComponent.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.pcbComponent.create({ data: { projectId, ...data } });
      created += 1;
    }
  }

  console.info('[PCB:COMPONENTS] Persistés', { projectId, created, updated });

  return NextResponse.json({ created, updated, count: components.length });
}
