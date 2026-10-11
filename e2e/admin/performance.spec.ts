import { test, expect } from '@playwright/test';

/**
 * Tests performance pipeline (E4-S05, D-E4-4).
 *
 * Vérifie que l'agrégateur mesure les temps par source
 * (`sourceDurationsMs`) et que la recherche multi-critères
 * retourne un score global.
 */

test.describe('Performance pipeline (E4-S05)', () => {
  test('agrégation source=all retourne sourceDurationsMs par source', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: { source: 'all', query: 'roulement', limit: 5 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.candidates)).toBe(true);
    expect(typeof body.totalDurationMs).toBe('number');
    expect(typeof body.sourceDurationsMs).toBe('object');
    expect(body.sourceDurationsMs).not.toBeNull();
    for (const source of ['local_db', 'wikidata', 'traceparts']) {
      expect(typeof body.sourceDurationsMs[source]).toBe('number');
      expect(body.sourceDurationsMs[source]).toBeGreaterThanOrEqual(0);
    }
  });

  test('recherche multi-critères GET retourne un score global', async ({ request }) => {
    const response = await request.get('/api/search?mode=multi&q=roulement&limit=5');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('multi');
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.results)).toBe(true);
    if (body.results.length > 0) {
      expect(typeof body.results[0].score).toBe('number');
    }
  });
});
