// V31.2 — Normalisation des exigences issues du LLM (provenance + statut).
// Pur : aucune I/O.

export interface RawRequirement {
  category: string;
  key: string;
  value: string;
  status?: string;
  source?: string | null;
}

export interface NormalizedRequirement {
  category: string;
  key: string;
  value: string;
  status: 'proposed' | 'to_verify';
  source: string | null;
}

const MAX_SOURCE_LENGTH = 200;
const INFERRED = 'inféré';

export function normalizeRequirements(raw: RawRequirement[]): NormalizedRequirement[] {
  const out: NormalizedRequirement[] = [];

  for (const item of raw) {
    const category = (item.category ?? '').trim();
    const key = (item.key ?? '').trim();
    const value = (item.value ?? '').trim();

    if (!key || !value) continue;

    let source = typeof item.source === 'string' ? item.source.trim() : '';
    let status: 'proposed' | 'to_verify' = item.status === 'to_verify' ? 'to_verify' : 'proposed';

    if (!source) {
      status = 'to_verify';
    } else if (source.toLowerCase() === INFERRED) {
      source = INFERRED;
      status = 'to_verify';
    } else if (source.length > MAX_SOURCE_LENGTH) {
      source = source.slice(0, MAX_SOURCE_LENGTH);
    }

    out.push({ category, key, value, status, source: source.length > 0 ? source : null });
  }

  return out;
}
