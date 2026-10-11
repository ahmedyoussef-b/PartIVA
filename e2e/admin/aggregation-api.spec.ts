import { test, expect } from '@playwright/test';

/**
 * Tests E2E — Route API d'agrégation (E3-S05).
 *
 * Projet admin (storageState .auth/admin.json) —
 * POST /api/search exige une session authentifiée.
 *
 * Wikidata est lent (SPARQL) → timeout 120s (R.5.4).
 */
test.describe('Aggregation API (E3-S05)', () => {
  test.setTimeout(120_000);

  test('route API POST source=all', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: { source: 'all', query: 'bearing', limit: 10 },
    });
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.candidates).toBeDefined();
    expect(json.sourcesQueried).toBeDefined();
  });

  test('route API POST source=wikidata (mode isolé)', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: { source: 'wikidata', query: 'bearing', limit: 5 },
    });
    expect(response.status()).toBe(200);
  });
});
