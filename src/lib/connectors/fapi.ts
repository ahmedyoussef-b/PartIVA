import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';

interface FapiAnalog {
  i: number;
  pi: number;
  ns: string;
  pai: number;
  mfai: number;
  nsa: string;
}

interface FapiResponse {
  analogList?: { a: FapiAnalog[] };
  messageList?: { m: string[] };
}

export function isFapiConfigured(): boolean {
  return Boolean(process.env.FAPI_API_KEY);
}

export const fapiConnector: SourceConnector = {
  source: 'fapi',
  mode: 'real',
  weight: SOURCE_WEIGHTS.fapi?.weight ?? 0.5,
  timeoutMs: SOURCE_WEIGHTS.fapi?.timeoutMs ?? 10000,

  isAvailable(): boolean {
    return isFapiConfigured();
  },

  async search(query, options = {}) {
    const { limit = 20 } = options;
    if (!isFapiConfigured()) {
      return [];
    }
    const baseUrl = process.env.FAPI_BASE_URL || 'https://fapi.iisis.ru/fapi/v2';
    const url = new URL(`${baseUrl}/analogList`);
    url.searchParams.set('n', query.toLowerCase().replace(/\s+/g, ''));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.FAPI_API_KEY}`,
        Accept: 'application/json',
      },
    });

    const debugBody = await response.text();

    if (!response.ok) {
      throw new Error(`FAPI HTTP ${response.status}: ${response.statusText}`);
    }

    const json = JSON.parse(debugBody) as FapiResponse;
    const items = json.analogList?.a ?? [];
    if (items.length === 0) return [];

    return items.slice(0, limit).map((item) => {
      const candidate: SearchCandidate = {
        id: `fapi:${item.pai}`,
        source: 'fapi',
        reference: item.nsa.toUpperCase(),
        name: `${query.toUpperCase()} -> ${item.nsa.toUpperCase()}`,
        cadAvailable: false,
        datasheetAvailable: false,
        scores: { global: 0.5 },
        metadata: {
          fapiId: item.i,
          refId: item.pi,
          analogId: item.pai,
          brandId: item.mfai,
          normalizedQuery: item.ns,
        },
      };
      return candidate;
    });
  },
};
