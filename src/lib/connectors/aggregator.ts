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

  // Timeout global (borne supérieure) — D-E3-31
  const globalController = new AbortController();
  const globalTimeout = setTimeout(() => globalController.abort(), AGGREGATION_TIMEOUT_MS);

  const available = connectors.filter((c) => c.isAvailable());
  const sourcesFailed: string[] = [];

  const results = await Promise.allSettled(
    available.map(async (connector) => {
      // Timeout spécifique à la source (D-E3-31)
      const sourceTimeout = connector.timeoutMs ?? AGGREGATION_TIMEOUT_MS;
      const sourceController = new AbortController();
      const sourceTimer = setTimeout(() => sourceController.abort(), sourceTimeout);

      try {
        // Combiner les signaux : global + source (D-E3-31)
        const combinedSignal = combineSignals(globalController.signal, sourceController.signal);

        return {
          source: connector.source,
          candidates: await connector.search(query, {
            limit,
            signal: combinedSignal,
          }),
        };
      } catch {
        sourcesFailed.push(connector.source);
        return { source: connector.source, candidates: [] };
      } finally {
        clearTimeout(sourceTimer);
      }
    }),
  );

  clearTimeout(globalTimeout);

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

  // Score d'agrégation + tri décroissant (D-E3-32)
  const scored = deduped.map((c) => {
    const connector = available.find((conn) => c.source === conn.source);
    const score = connector ? computeAggregationScore(c, connector) : (c.scores?.global ?? 0.5);
    return {
      ...c,
      scores: { ...c.scores, global: score },
    };
  });
  scored.sort((a, b) => (b.scores?.global ?? 0) - (a.scores?.global ?? 0));

  return {
    candidates: scored.slice(0, limit),
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

/**
 * Combine deux AbortSignals : abort si l'un ou l'autre abort (D-E3-31).
 * Utilisé pour combiner le timeout global et le timeout par source.
 */
function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}

/**
 * Calcule le score d'agrégation d'un candidat (D-E3-32).
 *
 * Formule : sourceWeight × sourceScore + freshnessBonus
 * - sourceWeight : priorité de la source (local_db 1.0 > wikidata 0.8 > traceparts 0.6)
 * - sourceScore : score interne du candidat (scores.global)
 * - freshnessBonus : bonus si metadata.updatedAt est récent (optionnel)
 *
 * Le score final est stocké dans candidate.scores.global.
 */
export function computeAggregationScore(
  candidate: SearchCandidate,
  connector: SourceConnector,
): number {
  const sourceWeight = connector.weight;
  const sourceScore = candidate.scores?.global ?? 0.5; // défaut 0.5

  // freshnessBonus : +0.1 si mis à jour dans les 30 derniers jours
  let freshnessBonus = 0;
  const updatedAt = candidate.metadata?.updatedAt;
  if (typeof updatedAt === 'string') {
    const ageMs = Date.now() - new Date(updatedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (ageMs < thirtyDaysMs) {
      freshnessBonus = 0.1;
    }
  }

  return sourceWeight * sourceScore + freshnessBonus;
}
