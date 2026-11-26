// CLI Adapter — wrapper TypeScript pour kicad-cli
// Détecte kicad-cli via PATH ou chemin absolu. Ne dépend PAS de Tauri.

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const KICAD_CLI_CANDIDATES = [
  'kicad-cli',
  'C:\\Program Files\\KiCad\\10.0\\bin\\kicad-cli.exe',
  'C:\\Program Files\\KiCad\\9.0\\bin\\kicad-cli.exe',
  'D:\\KiCad9\\bin\\kicad-cli.exe',
];

let cachedCliPath: string | null = null;

export async function detectKicadCli(): Promise<string | null> {
  if (cachedCliPath) return cachedCliPath;
  for (const candidate of KICAD_CLI_CANDIDATES) {
    try {
      await execAsync(`"${candidate}" --version`, { timeout: 5000 });
      cachedCliPath = candidate;
      return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

export interface KicadCliResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runKicadCli(args: string[]): Promise<KicadCliResult> {
  const cli = await detectKicadCli();
  if (!cli) {
    return { success: false, stdout: '', stderr: 'kicad-cli introuvable', exitCode: -1 };
  }
  try {
    const { stdout, stderr } = await execAsync(`"${cli}" ${args.join(' ')}`, {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { success: true, stdout, stderr, exitCode: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; code?: number };
    // kicad-cli ERC/DRC retourne exit code 5 si violations détectées — pas un échec d'exécution
    if (err.code === 5) {
      return { success: true, stdout: err.stdout ?? '', stderr: err.stderr ?? '', exitCode: 5 };
    }
    return {
      success: false,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.code ?? -1,
    };
  }
}

export async function runErc(schPath: string, outputPath: string): Promise<KicadCliResult> {
  return runKicadCli([
    'sch',
    'erc',
    '--format',
    'json',
    '--units',
    'mm',
    '--severity-all',
    '--exit-code-violations',
    '--output',
    `"${outputPath}"`,
    `"${schPath}"`,
  ]);
}

export async function runDrc(pcbPath: string, outputPath: string): Promise<KicadCliResult> {
  return runKicadCli([
    'pcb',
    'drc',
    '--format',
    'json',
    '--severity-all',
    '--exit-code-violations',
    '--output',
    `"${outputPath}"`,
    `"${pcbPath}"`,
  ]);
}

export async function exportGerbers(pcbPath: string, outputDir: string): Promise<KicadCliResult> {
  return runKicadCli(['pcb', 'export', 'gerbers', '--output', `"${outputDir}"`, `"${pcbPath}"`]);
}

export async function exportBom(schPath: string, outputPath: string): Promise<KicadCliResult> {
  return runKicadCli(['sch', 'export', 'bom', '--output', `"${outputPath}"`, `"${schPath}"`]);
}

export async function exportGlb(pcbPath: string, outputPath: string): Promise<KicadCliResult> {
  return runKicadCli([
    'pcb',
    'export',
    'glb',
    '--force',
    '--output',
    `"${outputPath}"`,
    `"${pcbPath}"`,
  ]);
}
