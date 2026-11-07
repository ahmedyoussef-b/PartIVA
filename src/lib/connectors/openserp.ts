import type { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';

interface OpenSerpResult {
  id: string;
  rank: number;
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

interface OpenSerpResponse {
  results: OpenSerpResult[];
  meta: { engines_failed: string[]; engines_responded?: string[]; took_ms: number };
}

export function isOpenSerpConfigured(): boolean {
  return Boolean(process.env.OPENSERP_BASE_URL) && process.env.OPENSERP_ENABLED === 'true';
}

export const openSerpConnector: SourceConnector = {
  source: 'openserp',
  mode: 'real',
  weight: SOURCE_WEIGHTS.openserp?.weight ?? 0.4,
  timeoutMs: SOURCE_WEIGHTS.openserp?.timeoutMs ?? 15_000,

  isAvailable(): boolean {
    return isOpenSerpConfigured();
  },

  async search(query, options = {}) {
    const { limit = 10 } = options;
    if (!isOpenSerpConfigured()) return [];

    const baseUrl = process.env.OPENSERP_BASE_URL || 'http://localhost:7000';
    const url = new URL(`${baseUrl}/mega/search`);
    url.searchParams.set('text', query);
    url.searchParams.set('engines', 'bing');
    url.searchParams.set('mode', 'any');
    url.searchParams.set('limit', String(limit));

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs ?? 15_000),
      });

      if (!response.ok) {
        throw new Error(`OpenSERP HTTP ${response.status}`);
      }

      const json = (await response.json()) as OpenSerpResponse;
      if (!json.results || json.results.length === 0) return [];

      return json.results.slice(0, limit).map((item, idx) => {
        const candidate: SearchCandidate = {
          id: `openserp:${item.id}:${idx}`,
          source: 'openserp',
          reference: item.url,
          name: item.title,
          cadAvailable: false,
          datasheetAvailable: false,
          scores: { global: 0.4 },
          metadata: {
            url: item.url,
            snippet: item.snippet,
            engine: item.engine,
            domain: item.url.replace(/^https?:\/\/([^/]+).*$/, '$1'),
          },
        };
        return candidate;
      });
    } catch (err) {
      console.error('[openserp] HTTP error:', err);
      throw err;
    }
  },
};
