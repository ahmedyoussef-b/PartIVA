import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { assignBoardNets, cleanBoardTracks, exportDsn, importSes } from '@/lib/pcb/kicad-bridge';
import { BoardLockError, BoardLockedByKicadError, withBoardLock } from '@/lib/pcb/board-lock';
import { prepareBoardForWrite } from '@/lib/pcb/kicad-desktop';
import { checkCdcGate } from '@/lib/pcb/cdc-guard';
import { runDrc } from '@/lib/pcb/drc';
import { normalizeBoardPath } from '@/lib/pcb/kicad-path';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);
const ROUTING_TIMEOUT_MS = 10 * 60 * 1000;

function optimizationPasses(): number {
  const value = Number(process.env.FREEROUTING_PASSES ?? '10');
  return Number.isFinite(value) ? Math.max(1, Math.min(50, Math.floor(value))) : 10;
}

function freeroutingJar(): string | null {
  const configured = process.env.FREEROUTING_JAR?.trim();
  if (configured) return configured;
  const candidates = [
    path.join(process.cwd(), 'tools', 'freerouting.jar'),
    path.join(process.cwd(), 'desktop', 'tools', 'freerouting.jar'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function javaBinary(): string {
  const configured = process.env.FREEROUTING_JAVA?.trim();
  if (configured) return configured;
  // Freerouting v2.6.0 est compilé en Java 25 : privilégier un JDK 25 présent.
  const candidates = [
    'C:/Program Files/Eclipse Adoptium/jdk-25.0.5.10002-hotspot/bin/java.exe',
    'C:/Program Files/Eclipse Adoptium/jdk-21.0.13.10002-hotspot/bin/java.exe',
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? 'java';
}

/**
 * Freerouting 2.x exige un DSN ANSI. KiCad exporte les valeurs de composants
 * avec des caractères UTC-8 (Ω, µ, espaces fins) dans les champs `(PN "...")` :
 * on les translittère pour éviter les avertissements de parsing et les nets
 * perdus. Seuls les caractères non-ANSI sont touchés.
 */
const NON_ASCII: Record<string, string> = {
  Ω: 'Ohm',
  µ: 'u',
  μ: 'u',
  '°': ' deg',
  '\u00a0': ' ',
  '\u202f': ' ',
  '–': '-',
  '—': '-',
  '’': "'",
};

function sanitizeDsn(dsnPath: string): number {
  const raw = readFileSync(dsnPath, 'utf8');
  let replaced = 0;
  const clean = raw.replace(/[^\x00-\x7F]/g, (ch) => {
    replaced++;
    return NON_ASCII[ch] ?? '?';
  });
  if (replaced > 0) writeFileSync(dsnPath, clean, 'utf8');
  return replaced;
}

/** Lève le dégagement DSN à 0,5 mm pour absorber l'ouverture de masque. */
function applyPowerClearance(dsnPath: string): void {
  const raw = readFileSync(dsnPath, 'utf8');
  const updated = raw.replace(/\(clearance 200\)/g, '(clearance 500)');
  if (updated !== raw) writeFileSync(dsnPath, updated, 'utf8');
}

function countSesWires(sesPath: string): number {
  const text = readFileSync(sesPath, 'utf8');
  return (text.match(/\(wire\b/g) ?? []).length;
}

/** Extrait le score 0-1000 du log Freerouting v2.6 (best-effort). */
function parseRoutingScore(logs: string): number | null {
  const match = logs.match(/(?:routing\s+)?score\s*[:=]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const value = Number.parseFloat(match[1] ?? '');
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1000, Math.round(value)));
}

async function javaAvailable(): Promise<boolean> {
  try {
    await execFileAsync(javaBinary(), ['-version']);
    return true;
  } catch {
    return false;
  }
}

async function runPost(req: Request, body: Record<string, unknown>): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ message }, { status: message === 'Forbidden' ? 403 : 401 });
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const minScore = typeof body.minScore === 'number' ? body.minScore : null;
  const restoreIfWorse = body.restoreIfWorse === true;
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
  if (nets.length === 0) {
    return NextResponse.json(
      { error: 'Aucun net exploitable — générez d’abord la netlist (étape 2)' },
      { status: 400 },
    );
  }
  const netsPath = path.join(
    tmpdir(),
    `partiva-nets-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
  );
  let assignedPads = 0;
  let missingPins = 0;
  try {
    writeFileSync(netsPath, JSON.stringify(nets), 'utf8');
    const assigned = await assignBoardNets(boardPath, netsPath);
    assignedPads = assigned.assignedPads ?? 0;
    missingPins = assigned.missingPins ?? 0;
    if (!assigned.ok) {
      return NextResponse.json(
        { error: assigned.error ?? 'Assignation des nets aux pads impossible' },
        { status: 500 },
      );
    }
    console.info('[FREEROUTING] Nets assignés aux pads', {
      projectId,
      pads: assignedPads,
      missing: missingPins,
    });
    if (assignedPads === 0) {
      return NextResponse.json(
        {
          error: `Aucun pad assigné : Freerouting ne peut pas router. Vérifiez les REF.PIN de la netlist (pads introuvables : ${missingPins}).`,
          assignedPads: 0,
          missingPins,
        },
        { status: 422 },
      );
    }
  } finally {
    try {
      unlinkSync(netsPath);
    } catch {
      // fichier déjà absent
    }
  }

  // Sauvegarde du routage courant AVANT nettoyage, pour restauration si le score régresse.
  const backupPath = `${boardPath}.routing-bak`;
  copyFileSync(boardPath, backupPath);

  const cleaned = await cleanBoardTracks(boardPath);
  if (!cleaned.ok) {
    return NextResponse.json(
      { error: cleaned.error ?? 'Nettoyage des pistes impossible' },
      { status: 500 },
    );
  }
  console.info('[FREEROUTING] Pistes existantes retirées', {
    projectId,
    removed: cleaned.tracks ?? 0,
  });

  const dsnPath = `${boardPath.replace(/\.kicad_pcb$/i, '')}.dsn`;
  const exported = await exportDsn(boardPath, dsnPath);
  if (!exported.ok) {
    return NextResponse.json({ error: exported.error ?? 'Export DSN impossible' }, { status: 500 });
  }
  const sanitizedChars = sanitizeDsn(dsnPath);
  applyPowerClearance(dsnPath);
  console.info('[FREEROUTING] DSN exporté', {
    projectId,
    dsnPath,
    bytes: exported.bytes ?? 0,
    sanitizedChars,
  });

  const jar = freeroutingJar();
  const hasJava = await javaAvailable();
  if (!jar || !hasJava) {
    return NextResponse.json({
      ok: false,
      code: 'FREEROUTING_MISSING',
      error: `Freerouting non installé (java=${hasJava ? 'présent' : 'absent'}, jar=${jar ? 'présent' : 'absent'}). Installez Java 17/21 (adoptium.net), téléchargez freerouting.jar depuis github.com/freerouting/freerouting/releases et placez-le dans tools/ (ou définissez FREEROUTING_JAR). Le DSN complet a été généré : ${dsnPath}`,
      dsn: dsnPath,
    });
  }

  const sesPath = `${boardPath.replace(/\.kicad_pcb$/i, '')}.ses`;
  const passes = optimizationPasses();
  let stdout = '';
  let stderr = '';
  try {
    const result = await execFileAsync(
      javaBinary(),
      [
        '-jar',
        jar,
        '-de',
        dsnPath,
        '-do',
        sesPath,
        '--router.autorouter.max_passes',
        String(passes),
        '--router.autorouter.ignore_net_classes',
        'GND,VCC',
        '--router.copperToEdgeClearanceUm=500',
        '--gui.enabled=false',
      ],
      { timeout: ROUTING_TIMEOUT_MS, maxBuffer: 50 * 1024 * 1024 },
    );
    stdout = result.stdout ?? '';
    stderr = result.stderr ?? '';
  } catch (error) {
    const failed = error as { message?: string; stdout?: string; stderr?: string };
    if (!stdout) stdout = failed.stdout ?? '';
    if (!stderr) stderr = failed.stderr ?? '';
    console.error('[FREEROUTING] Échec', error);
    const logs = [failed.stdout, failed.stderr].filter(Boolean).join('\n').slice(-4000);
    return NextResponse.json(
      {
        ok: false,
        code: 'FREEROUTING_FAILED',
        error: failed.message ?? String(error),
        logs,
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
  const wires = countSesWires(sesPath);
  if (wires === 0) {
    return NextResponse.json(
      {
        ok: false,
        code: 'SES_EMPTY',
        error:
          'Freerouting n’a produit aucune piste (SES vide) — vérifiez la netlist et les règles DSN.',
        dsn: dsnPath,
        ses: sesPath,
      },
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
  const drc = await runDrc(boardPath, undefined, `${stdout}\n${stderr}`);
  const score = parseRoutingScore(`${stdout}\n${stderr}`);
  console.info('[FREEROUTING] Terminé', {
    projectId,
    tracks: imported.tracks ?? 0,
    violations: drc.violations,
    score,
  });

  // Historique des tentatives (best-effort : la table peut ne pas encore être migrée).
  try {
    await prisma.pcbRoutingAttempt.create({
      data: {
        projectId,
        score,
        tracks: imported.tracks ?? 0,
        violations: drc.violations,
        placement: drc.categories?.placement ?? 0,
        routing: drc.categories?.routage ?? 0,
      },
    });
  } catch (e) {
    console.warn('[FREEROUTING] Historique indisponible', e);
  }

  // Re-router avec seuil : on restaure l'ancien plateau si le score régresse.
  if (minScore !== null && score !== null && score < minScore && restoreIfWorse) {
    copyFileSync(backupPath, boardPath);
    console.warn('[FREEROUTING] Score en baisse, ancien routage restauré', { score, minScore });
    return NextResponse.json({
      ok: false,
      code: 'ROUTE_NOT_IMPROVED',
      error: 'Le nouveau routage est moins bon. L’ancien a été conservé.',
      score,
      previousScore: minScore,
      restored: true,
    });
  }

  return NextResponse.json({
    ok: true,
    tracks: imported.tracks ?? 0,
    assignedPads,
    missingPins,
    wires,
    sanitizedChars,
    score,
    drc,
    dsn: dsnPath,
    ses: sesPath,
  });
}

/**
 * Point d'entrée : toute la chaîne DSN → SES → DRC s'exécute sous un verrou
 * exclusif sur le plateau, et renonce si KiCad garde le fichier ouvert.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  const gate = await checkCdcGate(projectId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error, message: gate.message }, { status: gate.status });
  }

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: { id: true, kicadFilePath: true },
  });
  if (!project?.kicadFilePath?.trim()) {
    return NextResponse.json({ error: 'Projet sans fichier KiCad' }, { status: 400 });
  }
  const normalized = normalizeBoardPath(project.kicadFilePath);
  const boardPath = path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized);

  try {
    return await withBoardLock(
      boardPath,
      async () => {
        const prepared = await prepareBoardForWrite(boardPath);
        if (!prepared.released) throw new BoardLockedByKicadError(boardPath);
        return runPost(req, body);
      },
      { operation: 'freerouting' },
    );
  } catch (e) {
    if (e instanceof BoardLockedByKicadError) {
      return NextResponse.json(
        { error: 'BOARD_LOCKED_BY_KICAD', message: e.message, boardPath },
        { status: 423 },
      );
    }
    if (e instanceof BoardLockError) {
      return NextResponse.json(
        { error: 'BOARD_LOCKED_BY_WRITER', message: e.message, boardPath },
        { status: 423 },
      );
    }
    throw e;
  }
}
