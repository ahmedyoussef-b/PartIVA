import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { clearLlmCacheAsync } from '@/lib/utils/llm-cache';
import { NET_TOO_SHORT_MESSAGE, PIN_FORMAT_MESSAGE } from '@/lib/pcb/netlist-guidance';

export const runtime = 'nodejs';

type Action = 'add' | 'update' | 'delete';

function normalizePins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim())
    .filter((p) => /^[A-Za-z0-9_]+\.[^\s]+$/.test(p));
}

// On ne touche pas au regex de validation : on choisit seulement le message
// le plus utile selon que l'utilisateur a saisi des pins mal formatés ou trop
// peu de pins.
function invalidPinsMessage(raw: unknown): string {
  const filled = Array.isArray(raw)
    ? raw.filter((p) => typeof p === 'string' && p.trim().length > 0).length
    : 0;
  return filled >= 2 ? PIN_FORMAT_MESSAGE : NET_TOO_SHORT_MESSAGE;
}

async function readNets(projectId: string) {
  const rows = await prisma.pcbNet.findMany({
    where: { projectId },
    select: { id: true, name: true, pins: true, source: true },
    orderBy: { name: 'asc' },
  });
  return rows.map((n) => ({
    id: n.id,
    name: n.name,
    pins: Array.isArray(n.pins) ? (n.pins as string[]) : [],
    source: n.source,
  }));
}

async function syncSourcingCache(projectId: string): Promise<void> {
  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { sourcingCache: true },
  });
  const previous = (project?.sourcingCache ?? {}) as Record<string, unknown>;
  const nets = await readNets(projectId);
  const previousReport =
    previous.netlistReport && typeof previous.netlistReport === 'object'
      ? (previous.netlistReport as Record<string, unknown>)
      : null;
  await prisma.pcbProject.update({
    where: { id: projectId },
    data: {
      sourcingCache: {
        ...previous,
        nets: nets.map(({ name, pins, source }) => ({ name, pins, source })),
        cacheVersion: 3,
        // Une édition manuelle invalide le rapport de génération : on le garde
        // pour l'affichage F3/F4, mais marqué comme périmé.
        ...(previousReport ? { netlistReport: { ...previousReport, stale: true } } : {}),
      } as object,
    },
  });
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId')?.trim() ?? '';
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, nets: await readNets(projectId) });
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const action = body.action as Action;
  const net = (body.net ?? {}) as Record<string, unknown>;
  const name = typeof net.name === 'string' ? net.name.trim() : '';
  const oldName = typeof body.oldName === 'string' ? body.oldName.trim() : name;

  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  if (!['add', 'update', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'action invalide (add|update|delete)' }, { status: 400 });
  }
  if (!name && action !== 'delete') {
    return NextResponse.json({ error: 'net.name requis' }, { status: 400 });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  if (action === 'add') {
    const exists = await prisma.pcbNet.findFirst({ where: { projectId, name } });
    if (exists) {
      return NextResponse.json({ error: `Le net ${name} existe déjà` }, { status: 409 });
    }
    const pins = normalizePins(net.pins);
    if (pins.length < 2) {
      return NextResponse.json({ error: invalidPinsMessage(net.pins) }, { status: 400 });
    }
    await prisma.pcbNet.create({
      data: { projectId, name, pins: pins as object, source: 'manual', status: 'manual' },
    });
  } else if (action === 'update') {
    const target = await prisma.pcbNet.findFirst({ where: { projectId, name: oldName } });
    if (!target) return NextResponse.json({ error: `Net ${oldName} introuvable` }, { status: 404 });
    const pins = normalizePins(net.pins);
    if (pins.length < 2) {
      return NextResponse.json({ error: invalidPinsMessage(net.pins) }, { status: 400 });
    }
    await prisma.pcbNet.update({
      where: { id: target.id },
      data: { name, pins: pins as object, source: 'manual', status: 'manual' },
    });
  } else {
    const target = await prisma.pcbNet.findFirst({ where: { projectId, name: oldName } });
    if (!target) return NextResponse.json({ error: `Net ${oldName} introuvable` }, { status: 404 });
    await prisma.pcbNet.delete({ where: { id: target.id } });
  }

  await syncSourcingCache(projectId);
  await clearLlmCacheAsync();
  const nets = await readNets(projectId);
  console.info('[PCB:NETS] Modification manuelle', { projectId, action, name, count: nets.length });
  return NextResponse.json({ ok: true, nets });
}
