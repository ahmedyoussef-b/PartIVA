// V37.1 — Réordonnancement des candidats du catalogue (pur, 0 import).
// Le LLM classe ; le module ne conserve que des id connus et complète en queue.

export interface RankCandidate {
  id: string;
  name: string;
  category?: string;
  footprint?: string | null;
  supplier?: string | null;
  description?: string | null;
}

export interface RankResult {
  ids: string[];
  ranked: RankCandidate[];
  unknownIds: string[];
  missingIds: string[];
  parsed: boolean;
}

const MAX_CDC_LENGTH = 2000;

export function buildRankPrompt(cdc: string, candidates: RankCandidate[]): string {
  const truncated = cdc.length > MAX_CDC_LENGTH ? cdc.slice(0, MAX_CDC_LENGTH) : cdc;

  const lines = candidates.map((c) => {
    const parts = [c.id, c.name, c.category, c.footprint, c.supplier]
      .map((p) => (typeof p === 'string' && p.trim() ? p.trim() : null))
      .filter((p): p is string => p !== null);
    return `- ${parts.join(' | ')}`;
  });

  return `Tu es un expert en conception de cartes électroniques PCB.
Classe les composants suivants par pertinence pour le cahier des charges ci-dessous.

Cahier des charges :
${truncated}

Candidats :
${lines.join('\n')}

Réponds UNIQUEMENT en JSON valide avec cette structure :
{ "ids": ["<id>", "<id>"] }

Règles :
- n'invente aucun identifiant : n'utilise que les id listés ci-dessus.
- classe du plus pertinent au moins pertinent.
`;
}

function extractIds(parsed: unknown): string[] | null {
  if (Array.isArray(parsed)) {
    // Tableau nu : une liste vide est ambiguë → non interprétable.
    if (parsed.length === 0) return null;

    if (typeof parsed[0] === 'string') {
      return parsed.filter((v): v is string => typeof v === 'string');
    }

    if (parsed[0] && typeof parsed[0] === 'object' && 'id' in (parsed[0] as object)) {
      const ids: string[] = [];
      for (const item of parsed) {
        if (item && typeof item === 'object' && 'id' in item) {
          const value = (item as { id?: unknown }).id;
          if (typeof value === 'string' && value.trim()) ids.push(value.trim());
        }
      }
      return ids;
    }

    return null;
  }

  if (parsed && typeof parsed === 'object' && 'ids' in parsed) {
    const raw = (parsed as { ids?: unknown }).ids;
    if (Array.isArray(raw)) {
      return raw
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }

  return null;
}

export function parseRankResponse(raw: string, candidates: RankCandidate[]): RankResult {
  const byId = new Map<string, RankCandidate>();
  for (const c of candidates) {
    if (!byId.has(c.id)) byId.set(c.id, c);
  }

  const fallback = (): RankResult => ({
    ids: candidates.map((c) => c.id),
    ranked: candidates,
    unknownIds: [],
    missingIds: [],
    parsed: false,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback();
  }

  const extracted = extractIds(parsed);
  if (extracted === null) return fallback();

  const ordered: string[] = [];
  const seen = new Set<string>();
  const unknownIds: string[] = [];

  for (const id of extracted) {
    if (!byId.has(id)) {
      if (!unknownIds.includes(id)) unknownIds.push(id);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }

  const missingIds = candidates.map((c) => c.id).filter((id) => !seen.has(id));
  const ids = [...ordered, ...missingIds];
  const ranked = ids.map((id) => byId.get(id)).filter((c): c is RankCandidate => Boolean(c));

  return { ids, ranked, unknownIds, missingIds, parsed: true };
}
