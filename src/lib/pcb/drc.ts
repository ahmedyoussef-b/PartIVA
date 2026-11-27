// DRC natif KiCat via kicad-cli --format json.
// kicad-cli renvoie un code non nul dès qu'il y a des violations : on se base
// donc sur le rapport JSON produit, pas sur le code de sortie.

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type DrcCategory = 'placement' | 'routage' | 'fabrication' | 'autre';

export interface DrcViolationDetail {
  type: string;
  severity: string;
  description: string;
  x?: number;
  y?: number;
  category: DrcCategory;
  suggestion: string;
}

export interface DrcReport {
  ok: boolean;
  violations: number;
  unconnected: number;
  categories: Record<DrcCategory, number>;
  details: DrcViolationDetail[];
  /** Violations déjà présentes dans le PCB non routé (Freerouting 2.6+). */
  preExisting: number;
  reportPath?: string;
  error?: string;
}

const PLACEMENT_TYPES = new Set([
  'courtyards_overlap',
  'solder_mask_bridge',
  'footprint_type_mismatch',
  'padstack',
]);
const ROUTAGE_TYPES = new Set([
  'clearance',
  'unconnected_items',
  'shorting_items',
  'via_dangling',
  'track_dangling',
  'starved_thermal',
  'track_width',
]);
const FABRICATION_TYPES = new Set([
  'silk_overlap',
  'silk_over_copper',
  'silk_edge_clearance',
  'copper_edge_clearance',
  'edge_clearance',
  'hole_clearance',
  'hole_to_hole',
  'drill_to_drill',
]);

export function categorizeDrcType(type: string, items: unknown[] = []): DrcCategory {
  // solder_mask_bridge : routage si une piste/via est impliqué, placement sinon.
  if (type === 'solder_mask_bridge') {
    const hasTrack = items.some((raw) => {
      const item = raw as Record<string, unknown>;
      const description = typeof item.description === 'string' ? item.description : '';
      return /^(piste|track|via|segment|zone)/i.test(description.trim());
    });
    return hasTrack ? 'routage' : 'placement';
  }
  if (PLACEMENT_TYPES.has(type)) return 'placement';
  if (ROUTAGE_TYPES.has(type)) return 'routage';
  if (FABRICATION_TYPES.has(type)) return 'fabrication';
  return 'autre';
}

function suggestionFor(type: string): string {
  if (type === 'courtyards_overlap') return 'Écarter les deux composants (placement).';
  if (type === 'solder_mask_bridge') return 'Augmenter l’espacement entre les pads.';
  if (type === 'clearance') return 'Re-router ou élargir le dégagement.';
  if (type === 'unconnected_items') return 'Compléter la netlist puis re-router.';
  if (type === 'shorting_items') return 'Supprimer la piste en court-circuit.';
  if (type === 'via_dangling') return 'Retirer le via orphelin ou le connecter.';
  if (type.startsWith('silk')) return 'Déplacer la sérigraphie.';
  if (type.includes('edge')) return 'Rapprocher le cuivre du bord.';
  return 'Vérifier la règle DRC correspondante.';
}

function parseViolations(raw: unknown[]): DrcViolationDetail[] {
  const details: DrcViolationDetail[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const v = item as Record<string, unknown>;
    const type = typeof v.type === 'string' ? v.type : 'unknown';
    const items = Array.isArray(v.items) ? v.items : [];
    const firstItem = items[0] as Record<string, unknown> | undefined;
    const pos = firstItem?.pos as Record<string, unknown> | undefined;
    const category = categorizeDrcType(type, items);
    details.push({
      type,
      severity: typeof v.severity === 'string' ? v.severity : 'error',
      description: typeof v.description === 'string' ? v.description : type,
      x: typeof pos?.x === 'number' ? pos.x : undefined,
      y: typeof pos?.y === 'number' ? pos.y : undefined,
      category,
      suggestion:
        type === 'solder_mask_bridge' && category === 'routage'
          ? 'Éloigner la piste du pad (masque de soudure).'
          : suggestionFor(type),
    });
  }
  return details;
}

function emptyReport(error?: string): DrcReport {
  return {
    ok: false,
    violations: 0,
    unconnected: 0,
    categories: { placement: 0, routage: 0, fabrication: 0, autre: 0 },
    details: [],
    preExisting: 0,
    error,
  };
}

/** Extrait le nombre de violations pré-existantes du log Freerouting 2.6+. */
export function parsePreExistingViolations(logs: string): number {
  const match = logs.match(/(\d+)\s+pre-existing (?:clearance )?violation/i);
  return match ? Number.parseInt(match[1] ?? '0', 10) : 0;
}

function kicadCliPath(): string {
  return process.env.PARTIVA_KICAD_CLI?.trim() || 'C:/Program Files/KiCad/10.0/bin/kicad-cli.exe';
}

export async function runDrc(
  boardPath: string,
  reportPath?: string,
  routingLogs = '',
): Promise<DrcReport> {
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
      return emptyReport(message);
    }
  }
  try {
    const parsed = JSON.parse(await readFile(output, 'utf8')) as {
      violations?: unknown[];
      unconnected_items?: unknown[];
    };
    const violations = parseViolations(Array.isArray(parsed.violations) ? parsed.violations : []);
    const unconnected = parseViolations(
      Array.isArray(parsed.unconnected_items) ? parsed.unconnected_items : [],
    );
    const details = [...violations, ...unconnected];
    const categories: Record<DrcCategory, number> = {
      placement: 0,
      routage: 0,
      fabrication: 0,
      autre: 0,
    };
    for (const detail of details) categories[detail.category] += 1;

    return {
      ok: true,
      violations: details.length,
      unconnected: unconnected.length,
      categories,
      details: details.slice(0, 200),
      preExisting: parsePreExistingViolations(routingLogs),
      reportPath: output,
    };
  } catch (error) {
    return emptyReport(error instanceof Error ? error.message : 'Rapport DRC illisible');
  }
}
