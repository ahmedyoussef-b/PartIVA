import { test, expect } from '@playwright/test';
import {
  aggregateSearch,
  searchWithFallback,
} from '../src/lib/connectors/aggregator';
import { wikidataConnector } from '../src/lib/connectors/wikidata';
import { tracePartsConnector } from '../src/lib/connectors/traceparts';

/**
 * Tests E2E — Agrégation multi-sources (E3-S05).
 *
 * Mix réel : Wikidata (réel) + TraceParts (mock).
 * local_db est testé via la route API (POST /api/search
 * source=all) — l'import direct de Prisma dans les specs
 * Playwright échoue (import.meta / ESM).
 *
 * Wikidata est lent (SPARQL) → timeout 120s (R.5.4).
 */
test.describe('Aggregation (E3-S05)', () => {
  test.setTimeout(120_000);

  const EXTERNAL_CONNECTORS = [wikidataConnector, tracePartsConnector];

  test('aggregateSearch fusionne les sources externes', async () => {
    const result = await aggregateSearch(EXTERNAL_CONNECTORS, 'bearing', {
      limit: 10,
    });
    expect(result.sourcesQueried.length).toBeGreaterThanOrEqual(1);
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  test('déduplication par name normalisé', async () => {
    const result = await aggregateSearch(EXTERNAL_CONNECTORS, 'bearing', {
      limit: 20,
    });
    const names = result.candidates.map((c) => c.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('fallback Wikidata → TraceParts', async () => {
    const result = await searchWithFallback(
      [wikidataConnector, tracePartsConnector],
      'bearing'
    );
    expect(result.sourceUsed).not.toBe('none');
    expect(result.fallbackChain.length).toBeGreaterThanOrEqual(1);
  });

  test('timeout global respecté', async () => {
    const start = Date.now();
    await aggregateSearch(EXTERNAL_CONNECTORS, 'bearing');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(15_000); // 5s timeout + marge
  });
});
