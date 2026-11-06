import { describe, it, expect, vi } from 'vitest';
import { openSerpConnector, isOpenSerpConfigured } from './openserp';

describe('openserp connector', () => {
  it('isOpenSerpConfigured retourne false sans env', () => {
    delete process.env.OPENSERP_ENABLED;
    delete process.env.OPENSERP_BASE_URL;
    expect(isOpenSerpConfigured()).toBe(false);
  });

  it('isOpenSerpConfigured retourne true avec env', () => {
    process.env.OPENSERP_ENABLED = 'true';
    process.env.OPENSERP_BASE_URL = 'http://localhost:7000';
    expect(isOpenSerpConfigured()).toBe(true);
  });

  it('mappe la réponse HTTP OpenSERP correctement', async () => {
    process.env.OPENSERP_ENABLED = 'true';
    process.env.OPENSERP_BASE_URL = 'http://localhost:7000';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: 's_1', rank: 1, title: 'Test 1', url: 'https://example.com/1', snippet: 'Snippet 1', engine: 'bing' },
          { id: 's_2', rank: 2, title: 'Test 2', url: 'https://example.com/2', snippet: 'Snippet 2', engine: 'bing' },
        ],
        meta: { engines_failed: [], took_ms: 100 },
      }),
    });

    const results = await openSerpConnector.search('w753', { limit: 5 });
    expect(results).toHaveLength(2);
    expect(results[0].source).toBe('openserp');
    expect(results[0].reference).toBe('https://example.com/1');
    expect(results[0].metadata?.engine).toBe('bing');
  });

  it('retourne [] si non configuré', async () => {
    delete process.env.OPENSERP_ENABLED;
    const results = await openSerpConnector.search('w753');
    expect(results).toEqual([]);
  });
});
