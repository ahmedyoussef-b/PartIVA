// V30.1 — Qualité du cahier des charges (pur, 0 import).
// Complétude par catégorie + détection d'incohérences d'unités (heuristiques texte).

export const CATEGORIES = [
  'usage',
  'function',
  'processing',
  'mechanical',
  'manufacturing',
  'quality',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface QualityRequirement {
  category: string;
  key: string;
  value: string;
  source?: string | null;
  status?: string;
}

export type UnitFamily = 'voltage' | 'current' | 'power' | 'resistance' | 'length';

export interface ParsedQuantity {
  value: number;
  unit: string;
  family: UnitFamily;
}

export interface Completeness {
  covered: Category[];
  missing: Category[];
  score: number;
}

export interface UnitConflict {
  key: string;
  reason: 'values-diverge' | 'incompatible-units';
  entries: Array<{ value: string; parsed: ParsedQuantity }>;
}

export interface CdcQuality {
  completeness: Completeness;
  conflicts: UnitConflict[];
  unsourced: number;
  toVerify: number;
  ok: boolean;
}

const INFERRED = 'inféré';
const DIVERGENCE_RATIO = 1.05;

export function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:!?]+$/g, '')
    .trim();
}

function unitInfo(rawUnit: string): { family: UnitFamily; factor: number } | null {
  const raw = rawUnit.trim();
  if (!raw) return null;

  if (raw === 'MΩ' || raw === 'mohm' || raw === 'Mohm') {
    return { family: 'resistance', factor: 1_000_000 };
  }

  switch (raw.toLowerCase()) {
    case 'v':
      return { family: 'voltage', factor: 1 };
    case 'mv':
      return { family: 'voltage', factor: 0.001 };
    case 'kv':
      return { family: 'voltage', factor: 1000 };
    case 'a':
      return { family: 'current', factor: 1 };
    case 'ma':
      return { family: 'current', factor: 0.001 };
    case 'ua':
    case 'µa':
      return { family: 'current', factor: 0.000001 };
    case 'w':
      return { family: 'power', factor: 1 };
    case 'mw':
      return { family: 'power', factor: 0.001 };
    case 'ohm':
    case 'ω':
      return { family: 'resistance', factor: 1 };
    case 'kohm':
    case 'kω':
      return { family: 'resistance', factor: 1000 };
    case 'mm':
      return { family: 'length', factor: 1 };
    case 'cm':
      return { family: 'length', factor: 10 };
    case 'm':
      return { family: 'length', factor: 1000 };
    default:
      return null;
  }
}

export function parseQuantity(raw: string): ParsedQuantity | null {
  if (typeof raw !== 'string') return null;

  const match = raw.trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return null;

  const numeric = Number.parseFloat((match[1] ?? '').replace(',', '.'));
  if (Number.isNaN(numeric)) return null;

  const unitRaw = (match[2] ?? '').trim();
  if (!unitRaw) return null;

  const info = unitInfo(unitRaw);
  if (!info) return null;

  return { value: numeric * info.factor, unit: unitRaw, family: info.family };
}

export function computeCompleteness(reqs: QualityRequirement[]): Completeness {
  const present = new Set<Category>();
  for (const req of reqs) {
    const category = (req.category ?? '').trim() as Category;
    if ((CATEGORIES as readonly string[]).includes(category)) present.add(category);
  }

  const covered = CATEGORIES.filter((c) => present.has(c));
  const missing = CATEGORIES.filter((c) => !present.has(c));
  const score = Math.round((covered.length / CATEGORIES.length) * 100) / 100;

  return { covered: [...covered], missing: [...missing], score };
}

export function detectConflicts(reqs: QualityRequirement[]): UnitConflict[] {
  const groups = new Map<string, Array<{ value: string; parsed: ParsedQuantity }>>();

  for (const req of reqs) {
    const key = normalizeKey(req.key ?? '');
    if (!key) continue;

    const parsed = parseQuantity(req.value ?? '');
    if (!parsed) continue;

    const bucket = groups.get(key) ?? [];
    bucket.push({ value: req.value, parsed });
    groups.set(key, bucket);
  }

  const conflicts: UnitConflict[] = [];

  for (const [key, entries] of groups) {
    if (entries.length < 2) continue;

    const families = new Set(entries.map((e) => e.parsed.family));

    if (families.size > 1) {
      conflicts.push({ key, reason: 'incompatible-units', entries });
      continue;
    }

    const values = entries.map((e) => e.parsed.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min > 0 && max / min > DIVERGENCE_RATIO) {
      conflicts.push({ key, reason: 'values-diverge', entries });
    }
  }

  return conflicts;
}

export function assessCdcQuality(reqs: QualityRequirement[]): CdcQuality {
  const completeness = computeCompleteness(reqs);
  const conflicts = detectConflicts(reqs);

  let unsourced = 0;
  let toVerify = 0;

  for (const req of reqs) {
    const source = typeof req.source === 'string' ? req.source.trim() : '';
    if (!source || source.toLowerCase() === INFERRED) unsourced += 1;
    if (req.status === 'to_verify') toVerify += 1;
  }

  return { completeness, conflicts, unsourced, toVerify, ok: conflicts.length === 0 };
}
