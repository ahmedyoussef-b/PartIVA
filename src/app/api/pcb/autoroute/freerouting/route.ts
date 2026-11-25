import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { assignBoardNets, exportDsn, importSes } from '@/lib/pcb/kicad-bridge';
import { runDrc } from '@/lib/pcb/drc';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);
const ROUTING_TIMEOUT_MS = 5 * 60 * 1000;

function freeroutingJar(): string | null {
  const configured = process.env.FREEROUTING_JAR?.trim();
  if (configured) return configured;
  const candidates = [
    path.join(process.cwd(), 'tools', 'freerouting.jar'),
    path.join(process.cwd(), 'desktop', 'tools', 'freerouting.jar'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function javaAvailable(): Promise<boolean> {
  try {
    await execFileAsync('java', ['-version']);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
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

  // Prérequis : les pads doivent porter leur net avant tout routage/export DSN,
  // sinon KiCad déclare des court-circuits (piste sur net, pad sur net 0).
  const netRows = await prisma.pcbNet.findMany({
    where: { projectId },
    select: { name: true, pins: true },
  });
  const nets = netRows.map((n) => ({
    name: n.name,
    pins: Array.isArray(n.pins) ? (n.pins as string[]) : [],
  }));
  const netsPath = path.join(
    tmpdir(),
    `partiva-nets-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
  );
  try {
    writeFileSync(netsPath, JSON.stringify(nets), 'utf8');
    const assigned = await assignBoardNets(boardPath, netsPath);
    if (!assigned.ok) {
      return NextResponse.json(
        { error: assigned.error ?? 'Assignation des nets aux pads impossible' },
        { status: 500 },
      );
    }
    console.info('[FREEROUTING] Nets assignés aux pads', {
      projectId,
      pads: assigned.assignedPads ?? 0,
      missing: assigned.missingPins ?? 0,
    });
  } finally {
    try {
      unlinkSync(netsPath);
    } catch {
      // fichier déjà absent
    }
  }

  const dsnPath = `${boardPath.replace(/\.kicad_pcb$/i, '')}.dsn`;
  const exported = await exportDsn(boardPath, dsnPath);
  if (!exported.ok) {
    return NextResponse.json({ error: exported.error ?? 'Export DSN impossible' }, { status: 500 });
  }
  console.info('[FREEROUTING] DSN exporté', { projectId, dsnPath, bytes: exported.bytes ?? 0 });

  const jar = freeroutingJar();
  const hasJava = await javaAvailable();
  if (!jar || !hasJava) {
    return NextResponse.json({
      ok: false,
      code: 'FREEROUTING_MISSING',
      error: `Freerouting non installé (java=${hasJava}, jar=${jar ? 'présent' : 'absent'}). Le DSN complet a été généré : ${dsnPath}`,
      dsn: dsnPath,
    });
  }

  const sesPath = `${boardPath.replace(/\.kicad_pcb$/i, '')}.ses`;
  try {
    await execFileAsync('java', ['-jar', jar, '-de', dsnPath, '-do', sesPath], {
      timeout: ROUTING_TIMEOUT_MS,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    console.error('[FREEROUTING] Échec', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'FREEROUTING_FAILED',
        error: error instanceof Error ? error.message : String(error),
        dsn: dsnPath,
      },
      { status: 502 },
    );
  }
  if (!existsSync(sesPath)) {
    return NextResponse.json(
      { ok: false, code: 'SES_MISSING', error: 'Fichier SES non produit', dsn: dsnPath },
      { status: 502 },
    );
  }

  const imported = await importSes(boardPath, sesPath);
  if (!imported.ok) {
    return NextResponse.json(
      { error: imported.error ?? 'Import SES impossible', dsn: dsnPath },
      { status: 500 },
    );
  }
  const drc = await runDrc(boardPath);
  console.info('[FREEROUTING] Terminé', {
    projectId,
    tracks: imported.tracks ?? 0,
    violations: drc.violations,
  });
  return NextResponse.json({
    ok: true,
    tracks: imported.tracks ?? 0,
    drc,
    dsn: dsnPath,
    ses: sesPath,
  });
}
