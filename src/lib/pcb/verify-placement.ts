// V33.1 — Vérification déterministe du placement (module pur, 0 import).
// Compare les positions demandées (mm) aux footprints réellement relus depuis
// le fichier .kicad_pcb (parseKicadPcb renvoie x/y/rotation en mm/degrés).

export interface RequestedPlacement {
  reference: string;
  xMm: number;
  yMm: number;
  rotation?: number;
}

export interface ActualFootprint {
  reference: string;
  xMm: number;
  yMm: number;
  rotation: number;
}

export type MismatchReason = 'missing' | 'position' | 'rotation';

export interface PlacementMismatch {
  reference: string;
  reason: MismatchReason;
  expected: { xMm: number; yMm: number; rotation: number };
  actual: { xMm: number; yMm: number; rotation: number } | null;
  deltaMm?: number;
}

export interface PlacementVerification {
  ok: boolean;
  checked: number;
  matched: number;
  missing: string[];
  misplaced: PlacementMismatch[];
  extra: string[];
  toleranceMm: number;
  rotationToleranceDeg: number;
}

const DEFAULT_TOLERANCE_MM = 0.01;
const DEFAULT_ROTATION_TOLERANCE_DEG = 0.5;

function normalizeRef(reference: string): string {
  return reference.trim().toUpperCase();
}

export function normalizeRotation(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return ((deg % 360) + 360) % 360;
}

export function rotationDelta(a: number, b: number): number {
  const diff = Math.abs(normalizeRotation(a) - normalizeRotation(b));
  return diff > 180 ? 360 - diff : diff;
}

export function verifyPlacement(
  requested: RequestedPlacement[],
  actual: ActualFootprint[],
  options?: { toleranceMm?: number; rotationToleranceDeg?: number },
): PlacementVerification {
  const toleranceMm = options?.toleranceMm ?? DEFAULT_TOLERANCE_MM;
  const rotationToleranceDeg = options?.rotationToleranceDeg ?? DEFAULT_ROTATION_TOLERANCE_DEG;

  const actualByRef = new Map<string, ActualFootprint>();
  for (const footprint of actual) {
    const key = normalizeRef(footprint.reference);
    if (!actualByRef.has(key)) actualByRef.set(key, footprint);
  }

  const missing: string[] = [];
  const misplaced: PlacementMismatch[] = [];
  let matched = 0;

  for (const item of requested) {
    const ref = normalizeRef(item.reference);
    const expected = {
      xMm: item.xMm,
      yMm: item.yMm,
      rotation: normalizeRotation(item.rotation ?? 0),
    };

    const found = actualByRef.get(ref);
    if (!found) {
      missing.push(item.reference);
      misplaced.push({ reference: item.reference, reason: 'missing', expected, actual: null });
      continue;
    }

    const actualShape = {
      xMm: found.xMm,
      yMm: found.yMm,
      rotation: normalizeRotation(found.rotation),
    };

    const dx = found.xMm - item.xMm;
    const dy = found.yMm - item.yMm;
    const distance = Math.hypot(dx, dy);

    if (distance > toleranceMm) {
      misplaced.push({
        reference: item.reference,
        reason: 'position',
        expected,
        actual: actualShape,
        deltaMm: distance,
      });
      continue;
    }

    if (rotationDelta(found.rotation, item.rotation ?? 0) > rotationToleranceDeg) {
      misplaced.push({
        reference: item.reference,
        reason: 'rotation',
        expected,
        actual: actualShape,
      });
      continue;
    }

    matched += 1;
  }

  const requestedRefs = new Set(requested.map((item) => normalizeRef(item.reference)));
  const extra = actual
    .map((footprint) => footprint.reference)
    .filter((ref) => !requestedRefs.has(normalizeRef(ref)));

  return {
    ok: missing.length === 0 && misplaced.length === 0,
    checked: requested.length,
    matched,
    missing,
    misplaced,
    extra,
    toleranceMm,
    rotationToleranceDeg,
  };
}
