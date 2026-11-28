import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { clearLlmCacheAsync } from '@/lib/utils/llm-cache';
import {
  NET_TOO_SHORT_MESSAGE,
  PIN_FORMAT_MESSAGE,
  pinIssueMessage,
} from '@/lib/pcb/netlist-guidance';
import {
  buildNetPlan,
  normalizeNetPins,
  type CurrentNet,
  type NetInput,
  type NetIssue,
} from '@/lib/pcb/netlist-plan';
import { getFootprintPadNumbers } from '@/lib/pcb/kicad-footprints';
import { diagnosePins, isBlockingPinIssue } from '@/lib/pcb/pin-diagnostics';
import type { NetlistReport } from '@/lib/pcb/netlist-validation';

export const runtime = 'nodejs';
// Une seule transaction, mais relecture du projet + écriture du cache JSON.
export const maxDuration = 60;

type Action = 'add' | 'update' | 'delete';
type DbClient = Prisma.TransactionClient | typeof prisma;

interface NetRow {
  id: string;
  name: string;
  pins: string[];
  source: string | null;
}

const NET_SELECT = { id: true, name: true, pins: true, source: true } as const;

function toNetRow(n: { id: string; name: string; pins: unknown; source: string | null }): NetRow {
  return {
    id: n.id,
    name: n.name,
    pins: Array.isArray(n.pins) ? (n.pins as string[]) : [],
    source: n.source,
  };
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

async function readNets(projectId: string): Promise<NetRow[]> {
  const rows = await prisma.pcbNet.findMany({
    where: { projectId },
    select: NET_SELECT,
    orderBy: { name: 'asc' },
  });
  return rows.map(toNetRow);
}

interface FootprintContext {
  padsByRef: Record<string, string[]>;
  refs: string[];
  footprintsByRef: Record<string, string>;
}

/** Pads réels et références connues, pour le diagnostic F3 côté client. */
async function readFootprintContext(
  client: DbClient,
  projectId: string,
): Promise<FootprintContext> {
  const components = await client.pcbComponent.findMany({
    where: { projectId },
    select: { reference: true, footprint: true },
    orderBy: { reference: 'asc' },
  });
  const padsByRef: Record<string, string[]> = {};
  const footprintsByRef: Record<string, string> = {};
  for (const c of components) {
    const value = String(c.footprint ?? '');
    const [lib, name] = value.includes(':') ? value.split(':', 2) : ['', value];
    padsByRef[c.reference] = getFootprintPadNumbers(lib ?? '', name ?? '');
    footprintsByRef[c.reference] = value;
  }
  return { padsByRef, refs: components.map((c) => c.reference), footprintsByRef };
}

/** Rapport F2 tel qu'il est persisté dans le cache — jamais recalculé ici. */
async function readNetlistReport(
  client: DbClient,
  projectId: string,
): Promise<NetlistReport | null> {
  const project = await client.pcbProject.findUnique({
    where: { id: projectId },
    select: { sourcingCache: true },
  });
  const cache = (project?.sourcingCache ?? {}) as Record<string, unknown>;
  const raw = cache.netlistReport;
  return raw && typeof raw === 'object' ? (raw as NetlistReport) : null;
}

/**
 * Unique point d'écriture du cache pour le PATCH historique et le PUT F4 :
 * nets synchronisés + rapport de génération marqué périmé.
 */
async function syncCacheWithNets(
  client: DbClient,
  projectId: string,
): Promise<{ nets: NetRow[]; netlistReport: NetlistReport | null }> {
  const rows = await client.pcbNet.findMany({
    where: { projectId },
    select: NET_SELECT,
    orderBy: { name: 'asc' },
  });
  const nets = rows.map(toNetRow);
  const project = await client.pcbProject.findUnique({
    where: { id: projectId },
    select: { sourcingCache: true },
  });
  const previous = (project?.sourcingCache ?? {}) as Record<string, unknown>;
  const rawReport = previous.netlistReport;
  const netlistReport =
    rawReport && typeof rawReport === 'object'
      ? ({ ...(rawReport as NetlistReport), stale: true } as NetlistReport)
      : null;

  await client.pcbProject.update({
    where: { id: projectId },
    data: {
      sourcingCache: {
        ...previous,
        nets: nets.map(({ name, pins, source }) => ({ name, pins, source })),
        cacheVersion: 3,
        ...(netlistReport ? { netlistReport } : {}),
      } as object,
    },
  });
  return { nets, netlistReport };
}

function sameIds(a: string[], b: string[]): boolean {
  const setB = new Set(b);
  return a.length === b.length && new Set(a).size === setB.size && a.every((id) => setB.has(id));
}

function parseDesiredNets(raw: unknown): NetInput[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item) => {
    const n = (item ?? {}) as Record<string, unknown>;
    return {
      id: typeof n.id === 'string' && n.id.trim() ? n.id.trim() : undefined,
      name: typeof n.name === 'string' ? n.name : '',
      pins: Array.isArray(n.pins) ? n.pins : [],
      source: typeof n.source === 'string' ? n.source : undefined,
    };
  });
}

async function requireAdminOrResponse(): Promise<NextResponse | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }
}

export async function GET(req: Request) {
  const unauthorized = await requireAdminOrResponse();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId')?.trim() ?? '';
  if (!projectId) {
    return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  }
  const footprints = await readFootprintContext(prisma, projectId);
  return NextResponse.json({
    ok: true,
    nets: await readNets(projectId),
    netlistReport: await readNetlistReport(prisma, projectId),
    padsByRef: footprints.padsByRef,
    refs: footprints.refs,
    // Facultatif : permet un message « sur TO-220-3_Vertical » précis.
    footprintsByRef: footprints.footprintsByRef,
  });
}

/**
 * F4 — sauvegarde atomique de l'état complet de la netlist.
 * Un seul plan (suppressions → renommages → ajouts) dans une transaction :
 * plus de 409 « Le net existe déjà » lors d'un remplacement ou d'un swap.
 */
export async function PUT(req: Request) {
  const unauthorized = await requireAdminOrResponse();
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  if (!Array.isArray(body.nets)) {
    return NextResponse.json({ error: 'nets doit être un tableau' }, { status: 400 });
  }

  const desired = parseDesiredNets(body.nets);
  const expectedIds = Array.isArray(body.expectedIds)
    ? body.expectedIds.filter((v): v is string => typeof v === 'string')
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.pcbProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) return { kind: 'not_found' as const };

    const rows = await tx.pcbNet.findMany({
      where: { projectId },
      select: NET_SELECT,
      orderBy: { name: 'asc' },
    });
    const current: CurrentNet[] = rows.map(toNetRow);
    const currentIds = current.map((n) => n.id);

    if (expectedIds && !sameIds(expectedIds, currentIds)) {
      return {
        kind: 'conflict' as const,
        nets: current,
        netlistReport: await readNetlistReport(tx, projectId),
      };
    }

    const plan = buildNetPlan(current, desired);
    if (plan.unknownIds.length > 0) {
      return {
        kind: 'conflict' as const,
        nets: current,
        netlistReport: await readNetlistReport(tx, projectId),
      };
    }
    // Diagnostic F3 sur les pins BRUTS (avant normalisation, qui supprimerait
    // silencieusement les pins mal formatés). Pads illisibles = non bloquant.
    const footprints = await readFootprintContext(tx, projectId);
    const rawNets = desired.map((n) => ({
      name: n.name.trim(),
      pins: n.pins.filter((p): p is string => typeof p === 'string'),
    }));
    const pinIssues = diagnosePins({
      nets: rawNets,
      padsByRef: footprints.padsByRef,
      refs: footprints.refs,
      footprintsByRef: footprints.footprintsByRef,
    }).filter(isBlockingPinIssue);
    if (pinIssues.length > 0) {
      const issues: NetIssue[] = pinIssues.map((issue) => ({
        code: 'PIN_ISSUE',
        index: rawNets.findIndex((n) => n.name === issue.net),
        name: issue.net,
        message: pinIssueMessage(issue),
        net: issue.net,
        pin: issue.pin,
        reason: issue.reason,
        available: issue.available,
        footprint: issue.footprint,
      }));
      return { kind: 'invalid' as const, issues, nets: current };
    }
    if (plan.issues.length > 0) {
      return { kind: 'invalid' as const, issues: plan.issues, nets: current };
    }

    // Ordre volontaire : libère les noms avant de les réutiliser (swap,
    // suppression + recréation du même nom).
    if (plan.deleteIds.length > 0) {
      await tx.pcbNet.deleteMany({ where: { projectId, id: { in: plan.deleteIds } } });
    }
    for (const update of plan.updates) {
      await tx.pcbNet.update({
        where: { id: update.id },
        data: {
          name: update.name,
          pins: update.pins as object,
          source: 'manual',
          status: 'manual',
        },
      });
    }
    if (plan.creates.length > 0) {
      await tx.pcbNet.createMany({
        data: plan.creates.map((n) => ({
          projectId,
          name: n.name,
          pins: n.pins as object,
          source: 'manual',
          status: 'manual',
        })),
      });
    }

    const sync = await syncCacheWithNets(tx, projectId);
    return {
      kind: 'ok' as const,
      ...sync,
      applied: {
        deleted: plan.deleteIds.length,
        updated: plan.updates.length,
        created: plan.creates.length,
      },
    };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  }
  if (result.kind === 'conflict') {
    return NextResponse.json(
      {
        error: 'NETLIST_CONFLICT',
        message: 'La netlist a été modifiée depuis son chargement. Elle a été rechargée.',
        nets: result.nets,
        netlistReport: result.netlistReport,
      },
      { status: 409 },
    );
  }
  if (result.kind === 'invalid') {
    return NextResponse.json(
      {
        error: 'INVALID_NETLIST',
        message: result.issues[0]?.message ?? 'Netlist invalide',
        issues: result.issues,
        nets: result.nets,
      },
      { status: 422 },
    );
  }

  await clearLlmCacheAsync().catch((e) => {
    console.warn('[PCB:NETS] Clear LLM cache échoué', e);
  });
  console.info('[PCB:NETS] Sauvegarde atomique', { projectId, applied: result.applied });
  return NextResponse.json({
    ok: true,
    nets: result.nets,
    netlistReport: result.netlistReport,
    applied: result.applied,
  });
}

/** PATCH historique conservé pour compatibilité, mais déprécié. */
export async function PATCH(req: Request) {
  const unauthorized = await requireAdminOrResponse();
  if (unauthorized) return unauthorized;

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

  const result = await prisma.$transaction(async (tx) => {
    if (action === 'add') {
      const exists = await tx.pcbNet.findFirst({ where: { projectId, name } });
      if (exists) return { error: `Le net ${name} existe déjà`, status: 409 };
      const pins = normalizeNetPins(net.pins);
      if (pins.length < 2) return { error: invalidPinsMessage(net.pins), status: 400 };
      await tx.pcbNet.create({
        data: { projectId, name, pins: pins as object, source: 'manual', status: 'manual' },
      });
    } else if (action === 'update') {
      const target = await tx.pcbNet.findFirst({ where: { projectId, name: oldName } });
      if (!target) return { error: `Net ${oldName} introuvable`, status: 404 };
      const pins = normalizeNetPins(net.pins);
      if (pins.length < 2) return { error: invalidPinsMessage(net.pins), status: 400 };
      await tx.pcbNet.update({
        where: { id: target.id },
        data: { name, pins: pins as object, source: 'manual', status: 'manual' },
      });
    } else {
      const target = await tx.pcbNet.findFirst({ where: { projectId, name: oldName } });
      if (!target) return { error: `Net ${oldName} introuvable`, status: 404 };
      await tx.pcbNet.delete({ where: { id: target.id } });
    }
    return syncCacheWithNets(tx, projectId);
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  await clearLlmCacheAsync().catch((e) => {
    console.warn('[PCB:NETS] Clear LLM cache échoué', e);
  });
  console.info('[PCB:NETS] Modification manuelle (PATCH)', { projectId, action, name });
  return NextResponse.json({ ok: true, nets: result.nets, netlistReport: result.netlistReport });
}
