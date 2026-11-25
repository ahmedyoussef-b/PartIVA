import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { parseKicadPcb } from './kicad-file-reader';
import { normalizeBoardPath } from './kicad-path';
import { analyzeRealState } from './simulation';

/**
 * État complet du parcours PCB, calculé côté serveur à partir de la BDD et du
 * fichier KiCad sur disque. Utilisé à la fois par le rendu initial de la page
 * et par l'endpoint polling, afin que le wizard et le panneau d'actions
 * voient exactement les mêmes données.
 */
export interface PcbWizardState {
  cdcValidated: boolean;
  nextActionId: string;
  kicadFilePath: string | null;
  persistedComponents: number;
  proposedComponents: number;
  requirementsCount: number;
  netsCount: number;
  heuristicNets: number;
  componentsCount: number;
  footprints: number;
  tracks: number;
  zones: number;
  compliant: boolean;
  validatedSteps: string[];
  drcViolations: number;
  boardWidthMm: number;
  boardHeightMm: number;
  inDb: boolean;
  onDisk: boolean;
  needsRepair: boolean;
  suggestedPath: string | null;
}

function standardBoardPath(projectId: string): string {
  const root =
    process.env.PARTIVA_DATA_DIR?.trim() ||
    (process.env.APPDATA
      ? path.join(process.env.APPDATA, 'PartIVA')
      : path.join(process.cwd(), 'data'));
  return path.join(root, 'pcb-work', projectId, 'carte-test.kicad_pcb');
}

export async function computeWizardState(projectId: string): Promise<PcbWizardState | null> {
  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    include: { components: true, nets: true, requirements: true },
  });
  if (!project) return null;

  const wizardValidations = await prisma.pcbWizardValidation.findMany({
    where: { projectId },
    select: { step: true },
  });
  const validatedSteps = wizardValidations.map((v) => v.step);

  let boardWidthMm = 100;
  let boardHeightMm = 80;
  let footprints = 0;
  let tracks = 0;
  let zones = 0;
  let drcViolations = 0;

  const inDb = !!project.kicadFilePath?.trim();
  let onDisk = false;
  if (inDb) {
    try {
      const normalized = normalizeBoardPath(project.kicadFilePath!);
      const abs = path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized);
      onDisk = existsSync(abs);
      if (onDisk) {
        const raw = readFileSync(abs, 'utf8');
        const parsed = parseKicadPcb(raw);
        if (parsed.dimensions.width > 0) boardWidthMm = parsed.dimensions.width;
        if (parsed.dimensions.height > 0) boardHeightMm = parsed.dimensions.height;
        footprints = parsed.components.length;
        tracks = (raw.match(/\(segment\b/g) ?? []).length;
        zones = (raw.match(/\(zone\b/g) ?? []).length;
        try {
          const drcRaw = JSON.parse(readFileSync(`${abs}.drc.json`, 'utf8')) as {
            violations?: unknown[];
          };
          drcViolations = Array.isArray(drcRaw.violations) ? drcRaw.violations.length : 0;
        } catch {
          drcViolations = 0;
        }
      }
    } catch (e) {
      console.warn('[PCB:WIZARD] Lecture du plateau indisponible', e);
    }
  }

  const suggested = standardBoardPath(projectId);
  const suggestedOnDisk = existsSync(suggested);
  const cdcValidated =
    project.status === 'requirements_validated' || project.requirements.length > 0;
  const proposedComponents =
    (project.sourcingCache as { components?: unknown[] } | null)?.components?.length ?? 0;

  // Même calcul que le wizard : pilote le surlignage du bouton correspondant.
  const nextActionId = !cdcValidated
    ? 'analyze'
    : project.components.length === 0 && proposedComponents === 0
      ? 'components'
      : project.nets.length === 0
        ? 'nets'
        : footprints === 0
          ? 'place'
          : tracks === 0
            ? 'route'
            : 'review';

  const complianceResult = analyzeRealState(
    project.components.map((c) => ({
      id: c.reference,
      footprint: c.footprint ?? undefined,
    })),
    project.nets.map((n) => ({ name: n.name, pins: [], vias: [] })),
  );

  return {
    cdcValidated,
    nextActionId,
    kicadFilePath: project.kicadFilePath ?? null,
    persistedComponents: project.components.length,
    proposedComponents,
    requirementsCount: project.requirements.length,
    netsCount: project.nets.length,
    heuristicNets: project.nets.filter((n) => n.source === 'heuristic').length,
    componentsCount: project.components.length,
    footprints,
    tracks,
    zones,
    compliant: complianceResult.isCompliant,
    validatedSteps,
    drcViolations,
    boardWidthMm,
    boardHeightMm,
    inDb,
    onDisk,
    needsRepair: !inDb && suggestedOnDisk,
    suggestedPath: suggestedOnDisk ? suggested : null,
  };
}
