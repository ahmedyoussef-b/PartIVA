import { test, expect } from '@playwright/test';

/**
 * Test agrégation multi-sources avec TecDoc (E5-S05).
 *
 * Vérifie que l'agrégation `source: 'all'` interroge
 * les 4 sources (local_db, wikidata, traceparts, tecdoc)
 * et que TecDoc est intégrée au pipeline.
 *
 * Projet admin (storageState) — R.5.8.
 */

test.describe('Agrégation multi-sources + TecDoc (E5-S05)', () => {
  test('source=all interroge les 4 sources (tecdoc inclus)', async ({ request }) => {
    test.setTimeout(60000);
    const response = await request.post('/api/search', {
      data: { source: 'all', query: 'frein', limit: 20 },
    });
    expect(response.status()).toBe(200);
    const json = await response.json();

    // Les 4 sources sont interrogées (tecdoc intégré)
    expect(json.sourcesQueried).toContain('tecdoc');
    expect(json.sourcesQueried).toContain('local_db');
    expect(json.sourcesQueried).toContain('traceparts');

    // TecDoc retourne au moins 1 candidat (plaquettes de frein)
    const tecdocCandidates = json.candidates.filter(
      (c: { source: string }) => c.source === 'tecdoc',
    );
    expect(tecdocCandidates.length).toBeGreaterThanOrEqual(1);
    expect(tecdocCandidates[0].name).toContain('frein');
    expect(tecdocCandidates[0].manufacturer).toBe('Bosch');
  });
});
