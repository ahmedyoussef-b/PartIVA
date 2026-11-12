import { test, expect } from '@playwright/test';

/**
 * Tests performance pipeline (E4-S05, D-E4-4).
 *
 * Vérifie que la recherche multi-critères
 * retourne un score global.
 */

test.describe('Performance pipeline (E4-S05)', () => {
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
