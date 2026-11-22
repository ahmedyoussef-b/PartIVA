// V32.1 — Double passe : fusion et détection de divergences (pur, 0 I/O).
// S'appuie sur normalizeKey / parseQuantity de cdc-quality (pas de réimplémentation).

import { normalizeKey, parseQuantity } from '@/lib/pcb/cdc-quality';

export interface PassRequirement {
  category: string;
  key: string;
  value: string;
  status?: string;
  source?: string | null;
}

export interface Divergence {
  key: string;
  category: string;
  pass1Value: string;
  pass2Value: string;
  reason: 'value-differs' | 'unit-differs';
}

export interface ConsensusResult {
  requirements: PassRequirement[];
  divergences: Divergence[];
  onlyInPass1: string[];
  onlyInPass2: string[];
  stableCount: number;
}

const AGREEMENT_RATIO = 0.05;

function normalizeValue(raw: string): string {
  return raw.trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, ' ').trim();
}

export function valuesAgree(a: string, b: string): boolean {
  const na = normalizeValue(a);
  const nb = normalizeValue(b);

  if (na === nb) return true;

  const qa = parseQuantity(a);
  const qb = parseQuantity(b);

  if (!qa || !qb) return false;
  if (qa.family !== qb.family) return false;

  const scale = Math.max(Math.abs(qa.value), Math.abs(qb.value));
  if (scale === 0) return true;

  return Math.abs(qa.value - qb.value) / scale <= AGREEMENT_RATIO;
}

export function mergePasses(pass1: PassRequirement[], pass2: PassRequirement[]): ConsensusResult {
  const byKey = new Map<string, PassRequirement>();
  for (const item of pass2) {
    const key = normalizeKey(item.key ?? '');
    if (key && !byKey.has(key)) byKey.set(key, item);
  }

  const requirements: PassRequirement[] = [];
  const divergences: Divergence[] = [];
  const onlyInPass1: string[] = [];
  const seen = new Set<string>();

  for (const item of pass1) {
    const key = normalizeKey(item.key ?? '');
    if (!key) continue;
    seen.add(key);

    const other = byKey.get(key);
    if (!other) {
      onlyInPass1.push(key);
      continue;
    }

    if (valuesAgree(item.value ?? '', other.value ?? '')) {
      requirements.push(item);
      continue;
    }

    const qa = parseQuantity(item.value ?? '');
    const qb = parseQuantity(other.value ?? '');
    const reason: Divergence['reason'] =
      qa && qb && qa.family !== qb.family ? 'unit-differs' : 'value-differs';

    divergences.push({
      key,
      category: item.category,
      pass1Value: item.value,
      pass2Value: other.value,
      reason,
    });
  }

  const onlyInPass2 = [...byKey.keys()].filter((key) => !seen.has(key));

  return {
    requirements,
    divergences,
    onlyInPass1,
    onlyInPass2,
    stableCount: requirements.length,
  };
}
