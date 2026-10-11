import type { SearchCandidate } from '@/schemas/search';
import type { SourceConnector } from './types';

/**
 * Timeout global d'agrégation (D-E3-21).
 * Les sources lentes n'attendent pas : le signal
 * d'annulation est propagé à chaque connecteur.
 */
const AGGREGATION_TIMEOUT_MS = 5_000;

/**
 * Résultat d'une agrégation multi-sources (D-E3-21).
 */
export interface AggregationResult {
  candidates: SearchCandidate[];
  sourcesQueried: string[];
  sourcesFailed: string[];
  totalDurationMs: number;
}

/**
 * Agrège les résultats de plusieurs sources en parallèle (D-E3-21).
 *
 * Stratégie : Promise.allSettled + timeout global 5s (D4).
 * Les résultats partiels sont acceptés — les sources
 * en échec sont listées dans sourcesFailed.
 *
 * @param connectors - Connecteurs à interroger
 * @param query - Terme de recherche
 * @param options - Limite de résultats
 */
export async function aggregateSearch(
  connectors: SourceConnector[],
  query: string,
  options: { limit?: number } = {},
): Promise<AggregationResult> {
  const { limit = 20 } = options;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGGREGATION_TIMEOUT_MS);

  const available = connectors.filter((c) => c.isAvailable());
  const sourcesFailed: string[] = [];

  const results = await Promise.allSettled(
    available.map(async (connector) => {
      try {
        return {
          source: connector.source,
          candidates: await connector.search(query, {
            limit,
            signal: controller.signal,
          }),
        };
      } catch {
        sourcesFailed.push(connector.source);
        return { source: connector.source, candidates: [] };
      }
    }),
  );

  clearTimeout(timeout);

  const allCandidates: SearchCandidate[] = [];
  const sourcesQueried: string[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      sourcesQueried.push(result.value.source);
      allCandidates.push(...result.value.candidates);
    }
  }

  // Déduplication (D-E3-24) — priorité ordre d'apparition
  const deduped = deduplicateCandidates(allCandidates);

  return {
    candidates: deduped.slice(0, limit),
    sourcesQueried,
    sourcesFailed,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Déduplication par `name` normalisé (lowercase + trim) (D-E3-24).
 * Priorité : ordre d'apparition (les sources sont déjà
 * ordonnées par poids décroissant dans ALL_CONNECTORS).
 */
function deduplicateCandidates(candidates: SearchCandidate[]): SearchCandidate[] {
  const seen = new Set<string>();
  const result: SearchCandidate[] = [];

  for (const candidate of candidates) {
    const key = candidate.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Recherche avec fallback séquentiel (D-E3-22).
 *
 * Ordre de priorité : Wikidata → TraceParts → local_db (D6).
 * Si une source échoue OU retourne 0 résultat,
 * passe à la suivante.
 *
 * @param connectors - Connecteurs disponibles
 * @param query - Terme de recherche
 * @param options - Limite de résultats
 * @returns Candidats, source utilisée, chaîne de fallback
 */
export async function searchWithFallback(
  connectors: SourceConnector[],
  query: string,
  options: { limit?: number } = {},
): Promise<{
  candidates: SearchCandidate[];
  sourceUsed: string;
  fallbackChain: string[];
}> {
  const { limit = 20 } = options;
  const fallbackChain: string[] = [];

  // Ordre de priorité (D-E3-22 / D6)
  const priority = ['wikidata', 'traceparts', 'local_db'];
  const ordered = priority
    .map((s) => connectors.find((c) => c.source === s))
    .filter((c): c is SourceConnector => c !== undefined && c.isAvailable());

  for (const connector of ordered) {
    fallbackChain.push(connector.source);
    try {
      const candidates = await connector.search(query, { limit });
      if (candidates.length > 0) {
        return {
          candidates,
          sourceUsed: connector.source,
          fallbackChain,
        };
      }
    } catch {
      // Continue vers la source suivante
    }
  }

  return {
    candidates: [],
    sourceUsed: 'none',
    fallbackChain,
  };
}
