import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fapiConnector, isFapiConfigured } from './fapi';

describe('fapiConnector', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, FAPI_API_KEY: 'test-key', FAPI_BASE_URL: 'https://fapi.test/v2' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('isFapiConfigured returns true when key present', () => {
    expect(isFapiConfigured()).toBe(true);
  });

  it('maps FAPI analog response to SearchCandidate', async () => {
    const mockResponse = {
      analogList: {
        a: [
          { i: 1, pi: 10, ns: 'w753', pai: 100, mfai: 25, nsa: 'f026407353' },
          { i: 2, pi: 10, ns: 'w753', pai: 101, mfai: 26, nsa: 'abc123' },
        ],
      },
      messageList: { m: [] },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    }));

    const results = await fapiConnector.search('w753', { limit: 20 });
    expect(results).toHaveLength(2);
    expect(results[0].source).toBe('fapi');
    expect(results[0].reference).toBe('F026407353');
  });
});
