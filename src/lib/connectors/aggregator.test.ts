import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregateSearch, resetCircuitBreakers } from './aggregator';
import type { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';

function makeConnector(name: string, impl: () => Promise<SearchCandidate[]>): SourceConnector {
  return {
    source: name as SourceConnector['source'],
    mode: 'real',
    weight: 1,
    isAvailable: () => true,
    search: async () => impl(),
  };
}

const cand = (source: string): SearchCandidate => ({
  id: '1',
  source: source as SearchCandidate['source'],
  reference: 'ref',
  name: 'Part',
  scores: { global: 0.5 },
  metadata: {},
});

describe('aggregateSearch resilience', () => {
  beforeEach(() => resetCircuitBreakers());

  it('success aggregates without warnings', async () => {
    const c1 = makeConnector('local_db', async () => [cand('local_db')]);
    const res = await aggregateSearch([c1], 'q');
    expect(res.candidates.length).toBe(1);
    expect(res.sourcesFailed).toEqual([]);
    expect(res.structuredWarnings).toBeUndefined();
  });

  it('timeout records SOURCE_TIMEOUT', async () => {
    const c1 = makeConnector('local_db', async () => {
      throw new Error('Timeout de 10 ms dépassé');
    });
    const res = await aggregateSearch([c1], 'q');
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
    const res = await aggregateSearch([c1], 'q');
    expect(calls).toBeGreaterThanOrEqual(2);
    expect(res.candidates.length).toBe(1);
  });

  it('circuit breaker opens after 3 failures', async () => {
    const c1 = makeConnector('local_db', async () => {
      throw new Error('boom');
    });
    await aggregateSearch([c1], 'q');
    await aggregateSearch([c1], 'q');
    await aggregateSearch([c1], 'q');
    const res4 = await aggregateSearch([c1], 'q');
    expect(res4.structuredWarnings?.some((w) => w.code === 'CIRCUIT_OPEN')).toBe(true);
  });
});
