// DRC natif KiCad via kicad-cli --format json.
// kicad-cli renvoie un code non nul dès qu'il y a des violations : on se base
// donc sur le rapport JSON produit, pas sur le code de sortie.

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface DrcReport {
  ok: boolean;
  violations: number;
  unconnected: number;
  reportPath?: string;
  error?: string;
}

function kicadCliPath(): string {
  return process.env.PARTIVA_KICAD_CLI?.trim() || 'C:/Program Files/KiCad/10.0/bin/kicad-cli.exe';
}

export async function runDrc(boardPath: string, reportPath?: string): Promise<DrcReport> {
  const cli = kicadCliPath();
  const output = reportPath ?? `${boardPath}.drc.json`;
  const args = ['pcb', 'drc', '--format', 'json', '--output', output, boardPath];
  try {
    await execFileAsync(cli, args, { maxBuffer: 20 * 1024 * 1024 });
  } catch (error) {
    // violations = code non nul, mais le rapport peut exister -> on continue.
    const message = error instanceof Error ? error.message : String(error);
    try {
      await readFile(output, 'utf8');
    } catch {
      return { ok: false, violations: 0, unconnected: 0, error: message };
    }
  }
  try {
    const parsed = JSON.parse(await readFile(output, 'utf8')) as {
      violations?: unknown[];
      unconnected_items?: unknown[];
    };
    return {
      ok: true,
      violations: Array.isArray(parsed.violations) ? parsed.violations.length : 0,
      unconnected: Array.isArray(parsed.unconnected_items) ? parsed.unconnected_items.length : 0,
      reportPath: output,
    };
  } catch (error) {
    return {
      ok: false,
      violations: 0,
      unconnected: 0,
      error: error instanceof Error ? error.message : 'Rapport DRC illisible',
    };
  }
}
