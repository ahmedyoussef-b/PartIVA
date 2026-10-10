export type ScoringWeights = {
  text: number;
  reference: number;
  specs: number;
  dimensions: number;
  photo: number;
};

export type ScoringBreakdown = {
  text?: number;
  reference?: number;
  specs?: number;
  dimensions?: number;
  photo?: number;
};

export type ScoringInput = {
  text?: number | null;
  reference?: number | null;
  specs?: number | null;
  dimensions?: number | null;
  photo?: number | null;
};

export const DEFAULT_WEIGHTS: ScoringWeights = {
  text: 0.2,
  reference: 0.2,
  specs: 0.2,
  dimensions: 0.2,
  photo: 0.2,
};

export const REFERENCE_EXACT_SCORE = 1.0;
export const REFERENCE_PREFIX_SCORE = 0.5;

/**
 * Normalisation min-max.
 * Retourne 0.5 si tous les scores sont identiques (évite la division par zéro).
 */
export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 0.5);
  return values.map((v) => (v - min) / range);
}

/**
 * Renormalise les poids pour que leur somme soit 1.
 * Les critères absents (valeur null/undefined) sont exclus.
 */
export function renormalizeWeights(
  weights: ScoringWeights,
  present: Partial<Record<keyof ScoringWeights, boolean>>,
): ScoringWeights {
  const filtered: Partial<ScoringWeights> = {};
  let sum = 0;
  (Object.keys(weights) as (keyof ScoringWeights)[]).forEach((key) => {
    if (present[key]) {
      filtered[key] = weights[key];
      sum += weights[key];
    }
  });
  if (sum === 0) return filtered as ScoringWeights;
  const result = {} as ScoringWeights;
  (Object.keys(filtered) as (keyof ScoringWeights)[]).forEach((key) => {
    result[key] = (filtered[key] as number) / sum;
  });
  return result;
}

/**
 * Calcule le score global pondéré à partir des signaux par critère.
 * Les signaux `null`/`undefined` sont exclus et les poids renormalisés.
 * Retourne { global, breakdown } où breakdown ne contient que les critères présents.
 */
export function computeScore(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): { global: number; breakdown: ScoringBreakdown } {
  const present: Partial<Record<keyof ScoringWeights, boolean>> = {};
  const breakdown: ScoringBreakdown = {};
  const keys: (keyof ScoringInput)[] = ['text', 'reference', 'specs', 'dimensions', 'photo'];

  keys.forEach((key) => {
    const value = input[key];
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      present[key] = true;
      breakdown[key] = value;
    }
  });

  const effective = renormalizeWeights(weights, present);
  let global = 0;
  (Object.keys(breakdown) as (keyof ScoringBreakdown)[]).forEach((key) => {
    const w = effective[key as keyof ScoringWeights] ?? 0;
    global += (breakdown[key] as number) * w;
  });

  return { global: Math.min(1, Math.max(0, global)), breakdown };
}

/**
 * Extrait les poids actifs depuis la DB, ou DEFAULT_WEIGHTS si absents.
 */
export async function loadScoringWeights(): Promise<ScoringWeights> {
  const { prisma } = await import('@/lib/prisma');
  const row = await prisma.scoringWeights.findUnique({ where: { name: 'default' } });
  if (!row) return DEFAULT_WEIGHTS;
  return {
    text: row.text,
    reference: row.reference,
    specs: row.specs,
    dimensions: row.dimensions,
    photo: row.photo,
  };
}
