// Pont Node → Python : placement d'empreinte via l'API classique `pcbnew`
// (script scripts/kicad/place_footprint.py). Aucune dépendance npm : node:* uniquement.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
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
}

export interface KicadBridgeResult {
  ok: boolean;
  message?: string;
  footprintCount?: number;
  wouldPlace?: boolean;
  error?: string;
}

const PYTHON_CANDIDATES: string[] = [
  process.env.PARTIVA_KICAD_PYTHON,
  'C:\\Program Files\\KiCad\\10.0\\bin\\python.exe',
  'C:\\Program Files\\KiCad\\9.0\\bin\\python.exe',
  'C:\\Program Files\\KiCad\\8.0\\bin\\python.exe',
].filter((candidate): candidate is string => Boolean(candidate));

const TIMEOUT_MS = 120_000;

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

export function resolveScriptPath(): string | null {
  const candidates: string[] = [
    process.env.PARTIVA_KICAD_SCRIPT,
    join(process.cwd(), 'scripts/kicad/place_footprint.py'),
    resolve(process.cwd(), '../scripts/kicad/place_footprint.py'),
    join(process.cwd(), 'kicad/place_footprint.py'),
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
      const parsed = JSON.parse(lastLine) as KicadBridgeResult;
      if (typeof parsed.ok === 'boolean') return parsed;
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

async function execute(args: PlaceFootprintArgs, isDryRun: boolean): Promise<KicadBridgeResult> {
  const pyPath = await detectKicadPython();
  if (!pyPath) {
    return { ok: false, error: 'Python KiCad introuvable (PARTIVA_KICAD_PYTHON ou installation KiCad)' };
  }

  const scriptPath = resolveScriptPath();
  if (!scriptPath) {
    return {
      ok: false,
      error: 'script place_footprint.py introuvable (PARTIVA_KICAD_SCRIPT ou scripts/kicad/)',
    };
  }

  try {
    const output = await runPython(pyPath, scriptPath, buildArgs(args, isDryRun));
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