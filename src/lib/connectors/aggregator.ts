import type { SearchCandidate } from '@/schemas/search';
import type { SourceConnector } from './types';
import { searchTecDocByVIN, searchTecDocByVehicle, searchTecDocByPhotoAndVehicle } from './tecdoc';
import { mergeAbortSignals } from '@/lib/data/external-signal';

/**
 * Timeout global d'agrégation (D-E3-21).
 * Les sources lentes n'attendent pas : le signal
 * d'annulation est propagé à chaque connecteur.
 */
const AGGREGATION_TIMEOUT_MS =
  process.env.CI || process.env.PLAYWRIGHT_TEST === '1' ? 60_000 : 10_000;

/**
 * Résultat d'une agrégation multi-sources (D-E3-21).
 *
 * `sourceDurationsMs` (D-E4-4) : temps réel par source
 * (mesure performance E4-S05) — permet d'identifier
 * les sources lentes sans instrumenter chaque connecteur.
 */
export interface AggregationResult {
  candidates: SearchCandidate[];
  sourcesQueried: string[];
  sourcesFailed: string[];
  sourceDurationsMs: Record<string, number>;
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
  const sourceDurationsMs: Record<string, number> = {};

  const results = await Promise.allSettled(
    available.map(async (connector) => {
      // Timeout spécifique à la source (D-E3-31), plafonné par le timeout
      // global : une source ne peut pas dépasser la borne globale de 5 s.
      const sourceTimeout = Math.min(
        connector.timeoutMs ?? AGGREGATION_TIMEOUT_MS,
        AGGREGATION_TIMEOUT_MS,
      );
      const sourceController = new AbortController();
      const sourceTimer = setTimeout(() => sourceController.abort(), sourceTimeout);
      const sourceStart = Date.now();

      try {
        // Combiner les signaux : global + source (D-E3-31)
        const combinedSignal = mergeAbortSignals(globalController.signal, sourceController.signal);

        // E25-R1 — le timeout est appliqué *ici* et pas seulement via le signal :
        // les connecteurs qui ignoraient `options.signal` bloquaient la réponse
        // le temps total de leurs retries (~31 s sur TecDoc en mode réel).
        const candidates = await withTimeout(
          connector.search(query, {
            limit,
            signal: combinedSignal,
          }),
          sourceTimeout,
        );
        sourceDurationsMs[connector.source] = Date.now() - sourceStart;
        return {
          source: connector.source,
          candidates,
        };
      } catch {
        sourceDurationsMs[connector.source] = Date.now() - sourceStart;
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
    sourceDurationsMs,
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
 * Recherche enrichie par VIN (VIN2OE — innovation #1 E6-S08).
 *
 * Décodage VIN (TecDoc) → véhicule → fitments → candidats.
 * Retourne les candidats + le véhicule décodé.
 *
 * @param vin - Numéro VIN (11-17 caractères)
 * @param options - Limite
 */
export async function aggregateSearchByVIN(
  vin: string,
  options: { limit?: number } = {},
): Promise<{
  candidates: SearchCandidate[];
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    engine: string | null;
    ktype: string | null;
    vin: string | null;
  } | null;
}> {
  return searchTecDocByVIN(vin, options);
}

/**
 * Recherche enrichie par véhicule (innovation #4 E6-S08).
 *
 * make/model/year/engine → fitments → candidats.
 * Filtrage optionnel sur autoCategory / material (focus plastique).
 *
 * @param params - Critères véhicule
 * @param options - Limite, filtres
 */
export async function aggregateSearchByVehicle(
  params: {
    make: string;
    model: string;
    year: number;
    engine?: string;
  },
  options: {
    limit?: number;
    autoCategory?: string;
    material?: string;
  } = {},
): Promise<SearchCandidate[]> {
  return searchTecDocByVehicle(params, options);
}

/**
 * Recherche enrichie par photo + véhicule (innovation #4 E6-S08).
 *
 * Photo (base64) + véhicule → fitment → candidats.
 * En mode mock, la photo est ignorée (pas d'embedding mock) —
 * le fitment véhicule est le filtre principal.
 *
 * @param photo - Photo base64 (JPEG/PNG)
 * @param vehicle - Critères véhicule
 * @param options - Limite
 */
export async function aggregateSearchByPhotoAndVehicle(
  photo: string,
  vehicle: {
    make: string;
    model: string;
    year: number;
    engine?: string;
  },
  options: { limit?: number } = {},
): Promise<SearchCandidate[]> {
  return searchTecDocByPhotoAndVehicle(photo, vehicle, options);
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
  const priority = [
    'wikidata',
    'traceparts',
    'industrial_catalog',
    'tecdoc',
    'local_db',
    '3dcarparts',
  ];
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
 * Impose une borne temporelle sur une promesse, même si la promesse sous
 * jacente ignore le signal d'annulation (E25-R1).
 *
 * La promesse d'origine reste gérée (handlers attachés) : une rejection
 * tardive ne produit donc pas d'unhandled rejection.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout de ${timeoutMs} ms dépassé`)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
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
