import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aggregateSearch, resetCircuitBreakers, type AggregationResult } from './aggregator';
import type { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';

const mockCache = new Map<string, AggregationResult>();

vi.mock('@/lib/cache/search-cache', () => ({
  hashCacheKey: vi.fn((q: string, s: string) => `${s}:${q.trim().toLowerCase()}`),
  getCache: vi.fn(async (key: string) => mockCache.get(key) ?? null),
  setCache: vi.fn(async (key: string, val: AggregationResult) => {
    mockCache.set(key, val);
  }),
}));

function makeConnector(name: string, impl: () => Promise<SearchCandidate[]>): SourceConnector {
  return {
    source: name as SourceConnector['source'],
    mode: 'real',
    weight: 1,
    isAvailable: () => true,
    search: async () => impl(),
  };
}

const cand = (source: string, id = '1', name = 'Part'): SearchCandidate => ({
  id,
  source: source as SearchCandidate['source'],
  reference: 'ref',
  name,
  scores: { global: 0.5 },
  metadata: {},
});

describe('aggregateSearch resilience & cache', () => {
  beforeEach(() => {
    resetCircuitBreakers();
    mockCache.clear();
  });

  it('success aggregates without warnings and returns miss on first call, hit on second call', async () => {
    let callCount = 0;
    const c1 = makeConnector('local_db', async () => {
      callCount++;
      return [cand('local_db')];
    });

    // 1er appel: cache miss
    const res1 = await aggregateSearch([c1], 'query_test_1');
    expect(res1.candidates.length).toBe(1);
    expect(res1.sourcesFailed).toEqual([]);
    expect(res1.structuredWarnings).toBeUndefined();
    expect(res1._cache).toBe('miss');
    expect(callCount).toBe(1);

    // 2e appel: cache hit
    const res2 = await aggregateSearch([c1], 'query_test_1');
    expect(res2.candidates.length).toBe(1);
    expect(res2._cache).toBe('hit');
    expect(callCount).toBe(1); // le connecteur n'a pas été rappelé
  });

  it('supports skipCache option to bypass cache', async () => {
    let callCount = 0;
    const c1 = makeConnector('local_db', async () => {
      callCount++;
      return [cand('local_db')];
    });

    await aggregateSearch([c1], 'query_skip');
    expect(callCount).toBe(1);

    const res2 = await aggregateSearch([c1], 'query_skip', { skipCache: true });
    expect(callCount).toBe(2);
    expect(res2._cache).toBe('miss');
  });

  it('deduplicates candidates by name and by id', async () => {
    const c1 = makeConnector('local_db', async () => [
      cand('local_db', 'id-1', 'Bouchon'),
      cand('local_db', 'id-2', 'Bouchon'), // Doublon de nom
      cand('local_db', 'id-3', 'Filtre A'),
    ]);
    const c2 = makeConnector('wikidata', async () => [
      cand('wikidata', 'id-3', 'Filtre B'), // Doublon d'id (D-V2-FAPI-DUPLICATE-IDS)
      cand('wikidata', 'id-4', 'Vis'),
    ]);

    const res = await aggregateSearch([c1, c2], 'query_dedup');
    expect(res.candidates.map((c) => c.name)).toEqual(['Bouchon', 'Filtre A', 'Vis']);
  });

  it('timeout records SOURCE_TIMEOUT', async () => {
    const c1 = makeConnector('local_db', async () => {
      throw new Error('Timeout de 10 ms dépassé');
    });
    const res = await aggregateSearch([c1], 'query_timeout', { skipCache: true });
    expect(res.sourcesFailed).toContain('local_db');
    expect(res.structuredWarnings?.[0]?.code).toBe('SOURCE_TIMEOUT');
  });

  it('retry succeeds after transient failure', async () => {
    let calls = 0;
    const c1 = makeConnector('local_db', async () => {
      calls++;
      if (calls === 1) throw new Error('network error');
      return [cand('local_db')];
    });
    const res = await aggregateSearch([c1], 'query_retry', { skipCache: true });
    expect(calls).toBeGreaterThanOrEqual(2);
    expect(res.candidates.length).toBe(1);
  });

  it('circuit breaker opens after 3 failures', async () => {
    const c1 = makeConnector('local_db', async () => {
      throw new Error('boom');
    });
    await aggregateSearch([c1], 'query_cb', { skipCache: true });
    await aggregateSearch([c1], 'query_cb', { skipCache: true });
    await aggregateSearch([c1], 'query_cb', { skipCache: true });
    const res4 = await aggregateSearch([c1], 'query_cb', { skipCache: true });
    expect(res4.structuredWarnings?.some((w) => w.code === 'CIRCUIT_OPEN')).toBe(true);
  });
});
