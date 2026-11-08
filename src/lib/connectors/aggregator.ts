import type { SearchCandidate } from '@/schemas/search';
import type { SourceConnector } from './types';
import { searchTecDocByVIN, searchTecDocByVehicle, searchTecDocByPhotoAndVehicle } from './tecdoc';
import { mergeAbortSignals } from '@/lib/data/external-signal';
import { getCache, setCache, hashCacheKey } from '@/lib/cache/search-cache';

const AGGREGATION_TIMEOUT_MS =
  process.env.CI || process.env.PLAYWRIGHT_TEST === '1' ? 60_000 : 10_000;

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 250;
const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 30000;

export interface EngineWarning {
  code: string;
  message: string;
  stage?: string;
}

export interface AggregationResult {
  candidates: SearchCandidate[];
  sourcesQueried: string[];
  sourcesFailed: string[];
  sourceDurationsMs: Record<string, number>;
  totalDurationMs: number;
  structuredWarnings?: EngineWarning[];
  _cache?: 'hit' | 'miss';
}

export type AggregateSearchResult = AggregationResult;

export interface AggregateSearchOptions {
  limit?: number;
  skipCache?: boolean;
  source?: string;
}

type CBState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
interface CircuitBreaker {
  state: CBState;
  failures: number;
  openedAt: number;
  halfOpenInFlight: boolean;
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function resetCircuitBreakers(): void {
  circuitBreakers.clear();
}

function getCircuitBreaker(name: string): CircuitBreaker {
  let cb = circuitBreakers.get(name);
  if (!cb) {
    cb = { state: 'CLOSED', failures: 0, openedAt: 0, halfOpenInFlight: false };
    circuitBreakers.set(name, cb);
  }
  return cb;
}

function isTransient(err: unknown): boolean {
  const status =
    (err as { status?: number; response?: { status?: number } })?.status ??
    (err as { response?: { status?: number } })?.response?.status;
  if (typeof status === 'number' && status >= 500) return true;
  const msg = String((err as { message?: string })?.message ?? err).toLowerCase();
  if (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('aborted')
  )
    return true;
  const name = (err as { name?: string })?.name;
  if (name === 'AbortError') return true;
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function aggregateSearch(
  connectors: SourceConnector[],
  query: string,
  options: AggregateSearchOptions = {},
): Promise<AggregationResult> {
  const limit = options.limit ?? 20;
  const source = options.source ?? 'all';
  const cacheKey = hashCacheKey(query, source, limit);

  // 1. Cache hit ?
  if (!options.skipCache) {
    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        return {
          ...cached,
          _cache: 'hit',
        };
      }
    } catch (err) {
      console.warn('[aggregator] cache get error:', err);
    }
  }

  // 2. Cache miss -> exécuter l'agrégation
  const result = await _aggregateSearchInternal(connectors, query, options);

  // 3. Écrire dans le cache
  if (!options.skipCache) {
    try {
      await setCache(cacheKey, result, source, limit);
    } catch (err) {
      console.warn('[aggregator] cache set error:', err);
    }
  }

  return {
    ...result,
    _cache: 'miss',
  };
}

async function _aggregateSearchInternal(
  connectors: SourceConnector[],
  query: string,
  options: { limit?: number } = {},
): Promise<AggregationResult> {
  const { limit = 20 } = options;
  const startTime = Date.now();

  const globalController = new AbortController();
  const globalTimeout = setTimeout(() => globalController.abort(), AGGREGATION_TIMEOUT_MS);

  const available = connectors.filter((c) => c.isAvailable());
  const sourcesFailed: string[] = [];
  const sourceDurationsMs: Record<string, number> = {};
  const structuredWarnings: EngineWarning[] = [];

  const results = await Promise.allSettled(
    available.map(async (connector) => {
      if (connector.mode === 'mock') {
        console.warn(`Connecteur ${connector.source} en mode démo (données factices).`);
        structuredWarnings.push({
          code: 'SOURCE_MOCK',
          message: `Le connecteur ${connector.source} est en mode démo (données factices).`,
          stage: connector.source,
        });
      }
      const sourceTimeout = Math.min(
        connector.timeoutMs ?? AGGREGATION_TIMEOUT_MS,
        AGGREGATION_TIMEOUT_MS,
      );
      const sourceStart = Date.now();
      const cb = getCircuitBreaker(connector.source);

      // Circuit breaker check
      if (cb.state === 'OPEN') {
        if (Date.now() - cb.openedAt >= OPEN_DURATION_MS) {
          cb.state = 'HALF_OPEN';
          cb.halfOpenInFlight = false;
        } else {
          sourceDurationsMs[connector.source] = 0;
          sourcesFailed.push(connector.source);
          structuredWarnings.push({
            code: 'CIRCUIT_OPEN',
            message: 'Une source externe est temporairement indisponible (circuit ouvert).',
            stage: connector.source,
          });
          return { source: connector.source, candidates: [] };
        }
      }

      if (cb.state === 'HALF_OPEN' && cb.halfOpenInFlight) {
        sourceDurationsMs[connector.source] = 0;
        sourcesFailed.push(connector.source);
        structuredWarnings.push({
          code: 'CIRCUIT_OPEN',
          message: 'Une source externe est temporairement indisponible (circuit ouvert).',
          stage: connector.source,
        });
        return { source: connector.source, candidates: [] };
      }

      if (cb.state === 'HALF_OPEN') cb.halfOpenInFlight = true;

      let lastErr: unknown = null;
      let candidates: SearchCandidate[] | null = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const backoff = Math.pow(2, attempt) * BASE_DELAY_MS;
          await delay(backoff + Math.floor(Math.random() * 50));
        }
        const sourceController = new AbortController();
        const sourceTimer = setTimeout(() => sourceController.abort(), sourceTimeout);
        try {
          const combinedSignal = mergeAbortSignals(
            globalController.signal,
            sourceController.signal,
          );
          const res = await withTimeout(
            connector.search(query, { limit, signal: combinedSignal }),
            sourceTimeout,
          );
          clearTimeout(sourceTimer);
          candidates = res;
          lastErr = null;
          break;
        } catch (e) {
          clearTimeout(sourceTimer);
          lastErr = e;
          if (!isTransient(e) || attempt === MAX_RETRIES) break;
        }
      }

      sourceDurationsMs[connector.source] = Date.now() - sourceStart;

      if (candidates !== null) {
        // success
        cb.failures = 0;
        cb.state = 'CLOSED';
        cb.halfOpenInFlight = false;
        return { source: connector.source, candidates };
      }

      // failure
      cb.failures += 1;
      if (cb.failures >= FAILURE_THRESHOLD) {
        cb.state = 'OPEN';
        cb.openedAt = Date.now();
      }
      if (cb.state === 'HALF_OPEN') {
        cb.state = 'OPEN';
        cb.openedAt = Date.now();
      }
      cb.halfOpenInFlight = false;

      sourcesFailed.push(connector.source);
      const timeout =
        isTransient(lastErr) &&
        String((lastErr as { message?: string })?.message ?? lastErr)
          .toLowerCase()
          .includes('timeout');
      const code = timeout ? 'SOURCE_TIMEOUT' : 'SOURCE_FAILED';
      const msg =
        code === 'SOURCE_TIMEOUT'
          ? 'Une source externe a mis trop de temps à répondre.'
          : 'Une source externe a échoué.';
      structuredWarnings.push({ code, message: msg, stage: connector.source });
      return { source: connector.source, candidates: [] };
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

  const deduped = deduplicateCandidates(allCandidates);

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
    structuredWarnings: structuredWarnings.length ? structuredWarnings : undefined,
  };
}

function deduplicateCandidates(candidates: SearchCandidate[]): SearchCandidate[] {
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();
  const result: SearchCandidate[] = [];

  for (const candidate of candidates) {
    const nameKey = candidate.name.toLowerCase().trim();
    const idKey = candidate.id ? candidate.id.trim() : '';

    const isDuplicate = seenNames.has(nameKey) || (idKey && seenIds.has(idKey));
    if (!isDuplicate) {
      seenNames.add(nameKey);
      if (idKey) seenIds.add(idKey);
      result.push(candidate);
    }
  }

  return result;
}

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

export async function aggregateMultiQuery(
  connectors: SourceConnector[],
  queries: string[],
  options: AggregateSearchOptions = {},
): Promise<AggregationResult> {
  const results = await Promise.all(
    queries.map((q) => aggregateSearch(connectors, q, options)),
  );

  const allCandidates = results.flatMap((r) => r.candidates);
  const deduped = deduplicateCandidates(allCandidates);

  const sourcesQueried = Array.from(new Set(results.flatMap((r) => r.sourcesQueried)));
  const sourcesFailed = Array.from(new Set(results.flatMap((r) => r.sourcesFailed)));

  return {
    candidates: deduped,
    sourcesQueried,
    sourcesFailed,
    sourceDurationsMs: {},
    totalDurationMs: Math.max(...results.map((r) => r.totalDurationMs)),
    structuredWarnings: results.flatMap((r) => r.structuredWarnings ?? []),
  };
}

export function computeAggregationScore(
  candidate: SearchCandidate,
  connector: SourceConnector,
): number {
  const sourceWeight = connector.weight;
  const sourceScore = candidate.scores?.global ?? 0.5;

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
