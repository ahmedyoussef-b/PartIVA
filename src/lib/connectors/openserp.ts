import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';

const execAsync = promisify(exec);

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
  meta: { engines_failed: string[]; took_ms: number };
}

export function isOpenSerpConfigured(): boolean {
  return Boolean(process.env.OPENSERP_BASE_URL) && process.env.OPENSERP_ENABLED === 'true';
}

export const openSerpConnector: SourceConnector = {
  source: 'openserp',
  mode: 'real',
  weight: SOURCE_WEIGHTS.openserp?.weight ?? 0.4,
  timeoutMs: SOURCE_WEIGHTS.openserp?.timeoutMs ?? 30_000,

  isAvailable(): boolean {
    return isOpenSerpConfigured();
  },

  async search(query, options = {}) {
    const { limit = 10 } = options;
    if (!isOpenSerpConfigured()) return [];

    const safeQuery = query.replace(/"/g, '\\"');
    try {
      const { stdout } = await execAsync(
        `docker exec openserp openserp search bing "${safeQuery}" --limit ${limit}`,
        { timeout: 30_000, maxBuffer: 1024 * 1024 },
      );

      const json = JSON.parse(stdout) as OpenSerpResponse;
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
          },
        };
        return candidate;
      });
    } catch (err) {
      console.error('[openserp] CLI error:', err);
      throw err;
    }
  },
};
