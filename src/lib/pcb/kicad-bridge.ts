// Pont Node → Python : placement d'empreinte via l'API classique `pcbnew`
// (script scripts/kicad/place_footprint.py). Aucune dépendance npm : node:* uniquement.

import { spawn } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export interface PlaceFootprintArgs {
  boardPath: string;
  libName: string;
  footprintName: string;
  reference: string;
  value?: string;
  xMm: number;
  yMm: number;
  layer?: string;
  force?: boolean;
  allowOutside?: boolean;
}

export interface KicadBridgeResult {
  ok: boolean;
  message?: string;
  footprintCount?: number;
  wouldPlace?: boolean;
  backup?: string;
  verified?: number;
  error?: string;
}

const PYTHON_CANDIDATES: string[] = [
  process.env.PARTIVA_KICAD_PYTHON,
  'C:\\Program Files\\KiCad\\10.0\\bin\\python.exe',
  'C:\\Program Files\\KiCad\\9.0\\bin\\python.exe',
  'C:\\Program Files\\KiCad\\8.0\\bin\\python.exe',
].filter((candidate): candidate is string => Boolean(candidate));

const TIMEOUT_MS = 120_000;

/** Mode web (Vercel) : le placement exige le desktop hybride (décision C.4). */
const WEB_HYBRID_MESSAGE =
  'Placement KiCad indisponible en mode web : le plateau est présent mais Python KiCad n est pas disponible sur le serveur. Ouvrez PartIVA en mode hybride Tauri (desktop/web) pour « Valider et placer dans KiCad ».';

export function kicadUnavailableMessage(): string {
  return process.env.VERCEL || process.env.VERCEL_ENV
    ? WEB_HYBRID_MESSAGE
    : 'Python KiCad introuvable (PARTIVA_KICAD_PYTHON ou installation KiCad)';
}

let cachedPython: string | null | undefined;

export async function detectKicadPython(): Promise<string | null> {
  if (cachedPython !== undefined) return cachedPython;

  for (const candidate of PYTHON_CANDIDATES) {
    if (existsSync(candidate)) {
      cachedPython = candidate;
      return candidate;
    }
  }

  cachedPython = null;
  return null;
}

export function resolveScriptPath(fileName = 'place_footprint.py'): string | null {
  const candidates: string[] = [
    process.env.PARTIVA_KICAD_SCRIPT,
    join(process.cwd(), 'scripts/kicad', fileName),
    resolve(process.cwd(), '../scripts/kicad', fileName),
    join(process.cwd(), 'kicad', fileName),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

interface RunOutput {
  stdout: string;
  stderr: string;
  code: number;
  timedOut: boolean;
}

function runPython(pyPath: string, scriptPath: string, args: string[]): Promise<RunOutput> {
  return new Promise<RunOutput>((resolvePromise, rejectPromise) => {
    const child = spawn(pyPath, [scriptPath, ...args], { windowsHide: true });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, TIMEOUT_MS);

    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });

    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ stdout, stderr, code: code ?? -1, timedOut });
    });
  });
}

function parseResult(output: RunOutput): KicadBridgeResult {
  if (output.timedOut) {
    return { ok: false, error: `timeout apres ${TIMEOUT_MS / 1000}s` };
  }

  const lines = output.stdout.split(/\r?\n/);
  const lastLine = [...lines].reverse().find((line) => line.trim().length > 0);

  if (lastLine) {
    try {
      const parsed = JSON.parse(lastLine) as {
        ok?: boolean;
        message?: string;
        placed?: number;
        footprintCount?: number;
        verified?: number;
        wouldPlace?: boolean;
        backup?: string;
        error?: string;
      };

      if (typeof parsed.ok === 'boolean') {
        if (parsed.ok === true) {
          const count = parsed.footprintCount ?? parsed.placed ?? 0;
          return {
            ok: true,
            message: parsed.message ?? `${count} empreinte(s) placée(s)`,
            footprintCount: count,
            wouldPlace: typeof parsed.wouldPlace === 'boolean' ? parsed.wouldPlace : undefined,
            backup: typeof parsed.backup === 'string' ? parsed.backup : undefined,
            verified: typeof parsed.verified === 'number' ? parsed.verified : undefined,
          };
        }
        return { ok: false, error: parsed.error ?? 'Échec du placement' };
      }
    } catch {
      // ligne non JSON : on bascule sur le code de sortie
    }
  }

  if (output.code !== 0) {
    return { ok: false, error: output.stderr.trim() || `exit code ${output.code}` };
  }

  return { ok: false, error: 'reponse illisible du script Python' };
}

let queue: Promise<unknown> = Promise.resolve();

function withMutex<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function buildArgs(args: PlaceFootprintArgs, isDryRun: boolean): string[] {
  const cli = [
    '--board',
    args.boardPath,
    '--lib',
    args.libName,
    '--footprint',
    args.footprintName,
    '--reference',
    args.reference,
    '--value',
    args.value ?? '',
    '--x',
    String(args.xMm),
    '--y',
    String(args.yMm),
    '--layer',
    args.layer ?? 'F.Cu',
  ];

  return isDryRun ? [...cli, '--dry-run'] : cli;
}

function buildFlags(args: { force?: boolean; allowOutside?: boolean }): string[] {
  const flags: string[] = [];
  if (args.force === true) flags.push('--force');
  if (args.allowOutside === true) flags.push('--allow-outside');
  return flags;
}

async function execute(args: PlaceFootprintArgs, isDryRun: boolean): Promise<KicadBridgeResult> {
  const pyPath = await detectKicadPython();
  if (!pyPath) {
    return {
      ok: false,
      error: kicadUnavailableMessage(),
    };
  }

  const scriptPath = resolveScriptPath();
  if (!scriptPath) {
    return {
      ok: false,
      error: 'script place_footprint.py introuvable (PARTIVA_KICAD_SCRIPT ou scripts/kicad/)',
    };
  }

  try {
    const output = await runPython(pyPath, scriptPath, [
      ...buildArgs(args, isDryRun),
      ...buildFlags(args),
    ]);
    return parseResult(output);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function placeFootprint(args: PlaceFootprintArgs): Promise<KicadBridgeResult> {
  return withMutex(() => execute(args, false));
}

export function dryRun(args: PlaceFootprintArgs): Promise<KicadBridgeResult> {
  return withMutex(() => execute(args, true));
}

export interface BatchFootprintInput {
  libName: string;
  footprintName: string;
  reference: string;
  value?: string;
  xMm: number;
  yMm: number;
  layer?: string;
  rotation?: number;
}

function parseBatchResult(output: RunOutput): KicadBridgeResult {
  if (output.timedOut) {
    return { ok: false, error: `timeout apres ${TIMEOUT_MS / 1000}s` };
  }

  const lines = output.stdout.split(/\r?\n/);
  const lastLine = [...lines].reverse().find((line) => line.trim().length > 0);

  if (lastLine) {
    try {
      const parsed = JSON.parse(lastLine) as {
        ok?: boolean;
        message?: string;
        placed?: number;
        verified?: number;
        backup?: string;
        error?: string;
      };
      if (parsed.ok === false) {
        return { ok: false, error: parsed.error ?? 'Échec du placement batch' };
      }
      if (parsed.ok === true && typeof parsed.placed === 'number') {
        return {
          ok: true,
          message: parsed.message ?? `placed ${parsed.placed}`,
          footprintCount: parsed.placed,
          verified: typeof parsed.verified === 'number' ? parsed.verified : undefined,
          backup: typeof parsed.backup === 'string' ? parsed.backup : undefined,
        };
      }
    } catch {
      // ligne non JSON : on bascule sur le code de sortie
    }
  }

  if (output.code !== 0) {
    // Un `exit code N` sans sortie est un crash brutal (interpreter/pcbnew).
    // On conserve stdout ET stderr dans le message pour distinguer :
    // chemin Python erroné, erreur d'import, segfault pcbnew, souci d'encodage...
    const stderrText = output.stderr.trim();
    const stdoutTail = output.stdout.trim().slice(-600);
    const details = [
      stderrText ? `stderr: ${stderrText}` : '',
      stdoutTail ? `stdout: ${stdoutTail}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    return {
      ok: false,
      error: `exit code ${output.code}${details ? ` — ${details}` : ' (aucune sortie : crash Python/pcbnew)'}`,
    };
  }

  return { ok: false, error: 'sortie illisible du script Python (batch)' };
}

function executeBatch(
  boardPath: string,
  footprints: BatchFootprintInput[],
  isDryRun: boolean,
  flags: { force?: boolean; allowOutside?: boolean },
): Promise<KicadBridgeResult> {
  return withMutex(async () => {
    const pyPath = await detectKicadPython();
    if (!pyPath) {
      return {
        ok: false,
        error: kicadUnavailableMessage(),
      };
    }

    const scriptPath = resolveScriptPath('place_footprints.py');
    if (!scriptPath) {
      return {
        ok: false,
        error: 'script place_footprints.py introuvable (PARTIVA_KICAD_SCRIPT ou scripts/kicad/)',
      };
    }

    const tmpInput = join(
      tmpdir(),
      `partiva-kicad-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
    );

    try {
      writeFileSync(tmpInput, JSON.stringify(footprints), 'utf8');

      const cli = ['--board', boardPath, '--input', tmpInput];
      if (isDryRun) cli.push('--dry-run');
      cli.push(...buildFlags(flags));

      const output = await runPython(pyPath, scriptPath, cli);
      if (output.code !== 0 || output.timedOut) {
        console.error('[KICAD:BATCH] Échec du script de placement', {
          python: pyPath,
          script: scriptPath,
          board: boardPath,
          args: cli,
          code: output.code,
          timedOut: output.timedOut,
          stdout: output.stdout.slice(-1000),
          stderr: output.stderr.slice(-1000),
        });
      }
      return parseBatchResult(output);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      try {
        unlinkSync(tmpInput);
      } catch {
        // fichier déjà absent : sans objet
      }
    }
  });
}

export function placeFootprints(args: {
  boardPath: string;
  footprints: BatchFootprintInput[];
  dryRun?: boolean;
  force?: boolean;
  allowOutside?: boolean;
}): Promise<KicadBridgeResult> {
  if (args.footprints.length === 0) {
    return Promise.resolve({ ok: false, error: 'footprints requis (tableau non vide)' });
  }
  return executeBatch(args.boardPath, args.footprints, args.dryRun === true, args);
}

export interface KicadLiveSyncResult {
  ok: boolean;
  live?: boolean;
  moved?: string[];
  missing?: string[];
  board?: string;
  error?: string;
  code?: string;
}

/**
 * Synchronisation live via l'API IPC de l'instance KiCad ouverte.
 * Déplace les empreintes directement dans l'éditeur puis sauvegarde le plateau :
 * la fenêtre KiCad reflète le changement immédiatement, sans `.lck` à contourner.
 *
 * Nécessite `kicad-python` (IPC API) dans l'environnement Python KiCad et le
 * serveur d'API activé dans Préférences > Plugins. En cas d'indisponibilité,
 * l'appelant doit retomber sur `placeFootprints` (écriture fichier + `--force`).
 */
export function syncBoardLive(args: {
  boardPath: string;
  footprints: BatchFootprintInput[];
  dryRun?: boolean;
}): Promise<KicadLiveSyncResult> {
  if (args.footprints.length === 0) {
    return Promise.resolve({ ok: false, error: 'footprints requis (tableau non vide)' });
  }

  return withMutex(async () => {
    const pyPath = await detectKicadPython();
    if (!pyPath) return { ok: false, code: 'PYTHON_UNAVAILABLE', error: kicadUnavailableMessage() };

    const scriptPath = resolveScriptPath('sync_board_live.py');
    if (!scriptPath) {
      return {
        ok: false,
        code: 'SCRIPT_UNAVAILABLE',
        error: 'script sync_board_live.py introuvable',
      };
    }

    const tmpInput = join(
      tmpdir(),
      `partiva-kicad-live-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
    );

    try {
      const payload = args.footprints.map((f) => ({
        reference: f.reference,
        xMm: f.xMm,
        yMm: f.yMm,
        rotation: f.rotation ?? 0,
      }));
      writeFileSync(tmpInput, JSON.stringify(payload), 'utf8');

      const cli = ['--board', args.boardPath, '--input', tmpInput];
      if (args.dryRun === true) cli.push('--dry-run');

      const output = await runPython(pyPath, scriptPath, cli);
      const line =
        output.stdout
          .split(/\r?\n/)
          .map((l) => l.trim())
          .find((l) => l.startsWith('{')) ?? '';
      if (!line) {
        return {
          ok: false,
          code: 'BAD_OUTPUT',
          error: output.stderr.trim() || 'sortie illisible du script IPC',
        };
      }
      const parsed = JSON.parse(line) as KicadLiveSyncResult & { trace?: string };
      if (parsed.ok) return parsed;
      console.warn('[PCB:LIVE-SYNC] Échec IPC', { code: parsed.code, error: parsed.error });
      return parsed;
    } catch (error) {
      return {
        ok: false,
        code: 'SYNC_ERROR',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      try {
        unlinkSync(tmpInput);
      } catch {
        // fichier déjà absent : sans objet
      }
    }
  });
}
