// V35.1 — Scorer du golden set (pur, déterministe, aucun I/O).
// `actual` est la sortie brute de l'analyse (objet { requirements: [...] }),
// validée en amont par PcbRequirementSchema côté route.

import { PcbRequirementSchema } from '@/lib/pcb/requirement-schema';

export interface GoldenScore {
  caseId: string;
  dimensionScore: number;
  recallScore: number;
  validityScore: number;
  overall: number;
  details: {
    dimension?: { expected: string; actual: string; ok: boolean };
    missingKinds: string[];
    extraKinds: string[];
    missingMentions: string[];
    invalidCount: number;
  };
}

const WEIGHTS = { dimension: 0.3, recall: 0.4, validity: 0.3 };
const DEFAULT_TOLERANCE_PCT = 10;

function extractRequirements(actual: unknown): Array<Record<string, unknown>> {
  if (!actual || typeof actual !== 'object') return [];
  const raw = (actual as { requirements?: unknown }).requirements;
  if (!Array.isArray(raw)) return [];

  const out: Array<Record<string, unknown>> = [];
  for (const item of raw) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      out.push(item as Record<string, unknown>);
    }
  }
  return out;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseNumber(value: string): number | null {
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
}

const WIDTH_KEY = /(largeur|width)/i;
const HEIGHT_KEY = /(hauteur|height|longueur|length|profondeur)/i;

function extractDimension(
  requirements: Array<Record<string, unknown>>,
  pattern: RegExp,
): { value: number; label: string } | null {
  for (const req of requirements) {
    const key = text(req.key);
    const value = text(req.value);
    if (!pattern.test(key) && !pattern.test(value)) continue;
    const parsed = parseNumber(value);
    if (parsed !== null) return { value: parsed, label: `${key} : ${value}` };
  }
  return null;
}

function isIncluded(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  if (!n) return true;
  return haystack.includes(n);
}

function isValidRequirement(req: Record<string, unknown>): boolean {
  const result = PcbRequirementSchema.safeParse({ requirements: [req] });
  return result.success;
}

export function scoreGoldenCase(
  golden: {
    id: string;
    cdc: string;
    expected: {
      boardWidthMm?: number;
      boardHeightMm?: number;
      dimensionTolerancePct?: number;
      componentKinds: string[];
      mustMention?: string[];
    };
  },
  actual: unknown,
): GoldenScore {
  const requirements = extractRequirements(actual);
  const tolerancePct = golden.expected.dimensionTolerancePct ?? DEFAULT_TOLERANCE_PCT;

  // --- dimension ---
  let dimensionScore = 1;
  let dimensionDetail: GoldenScore['details']['dimension'] = undefined;

  const expectsWidth = typeof golden.expected.boardWidthMm === 'number';
  const expectsHeight = typeof golden.expected.boardHeightMm === 'number';

  if (expectsWidth || expectsHeight) {
    const width = extractDimension(requirements, WIDTH_KEY);
    const height = extractDimension(requirements, HEIGHT_KEY);
    const actualW = width?.value ?? null;
    const actualH = height?.value ?? null;

    const expectedParts: string[] = [];
    if (expectsWidth) expectedParts.push(`${golden.expected.boardWidthMm} mm`);
    if (expectsHeight) expectedParts.push(`${golden.expected.boardHeightMm} mm`);

    const actualParts: string[] = [];
    if (actualW !== null) actualParts.push(`${actualW} mm`);
    if (actualH !== null) actualParts.push(`${actualH} mm`);

    const withinTolerance = (expected?: number, actualValue?: number | null): boolean => {
      if (expected === undefined) return true;
      if (actualValue === null || actualValue === undefined) return false;
      return Math.abs(actualValue - expected) / expected <= tolerancePct / 100;
    };

    const ok =
      withinTolerance(golden.expected.boardWidthMm, actualW) &&
      withinTolerance(golden.expected.boardHeightMm, actualH);

    dimensionScore = ok ? 1 : 0;
    dimensionDetail = {
      expected: expectedParts.join(' × '),
      actual: actualParts.length > 0 ? actualParts.join(' × ') : 'non détecté',
      ok,
    };
  }

  // --- recall (kinds) ---
  const haystack = normalize(
    requirements
      .map((req) => `${text(req.category)} ${text(req.key)} ${text(req.value)}`)
      .join(' '),
  );

  const expectedKinds = golden.expected.componentKinds.map(normalize);
  const matchedKinds = expectedKinds.filter((kind) => isIncluded(haystack, kind));
  const recallScore = expectedKinds.length === 0 ? 1 : matchedKinds.length / expectedKinds.length;

  const actualCategories = Array.from(
    new Set(requirements.map((req) => normalize(text(req.category))).filter(Boolean)),
  );
  const missingKinds = golden.expected.componentKinds.filter(
    (kind) => !matchedKinds.includes(normalize(kind)),
  );
  const extraKinds = actualCategories.filter((cat) => !expectedKinds.includes(cat));

  // --- validity ---
  const invalidCount = requirements.filter((req) => !isValidRequirement(req)).length;
  const validityScore = requirements.length === 0 ? 0 : 1 - invalidCount / requirements.length;

  // --- mustMention ---
  const missingMentions = (golden.expected.mustMention ?? []).filter(
    (needle) => !isIncluded(haystack, needle),
  );

  const overall =
    WEIGHTS.dimension * dimensionScore +
    WEIGHTS.recall * recallScore +
    WEIGHTS.validity * validityScore;

  return {
    caseId: golden.id,
    dimensionScore,
    recallScore,
    validityScore,
    overall,
    details: {
      dimension: dimensionDetail,
      missingKinds,
      extraKinds,
      missingMentions,
      invalidCount,
    },
  };
}

export function scoreGoldenSet(
  results: Array<{ golden: Parameters<typeof scoreGoldenCase>[0]; actual: unknown }>,
): { scores: GoldenScore[]; average: number } {
  const scores = results.map((entry) => scoreGoldenCase(entry.golden, entry.actual));
  const average =
    scores.length === 0 ? 0 : scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
  return { scores, average };
}
