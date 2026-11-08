import type { ConnectorDescriptor } from '../types';
import type { SearchCandidate } from '@/schemas/search';

export const wikidataDescriptor: ConnectorDescriptor = {
  id: 'wikidata',
  label: 'Wikidata',
  description: 'Base de connaissances libre (pièces, fabricants, normes)',
  mode: 'real',
  weight: 0.8,
  timeoutMs: 10_000,

  api: {
    baseUrl: 'https://www.wikidata.org/w/api.php',
    searchPath: '',
    auth: 'none',
  },

  extractItems: () => [],
  mapper: () => null,

  customSearch: async (query, options = {}) => {
    const { limit = 10 } = options;
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.searchParams.set('action', 'wbsearchentities');
    url.searchParams.set('search', query);
    url.searchParams.set('language', 'fr');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('origin', '*');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const data = await res.json();

      const items = (data.search || []) as Array<{
        id: string;
        label?: string;
        description?: string;
        concepturi?: string;
      }>;
      return items.map((item): SearchCandidate => ({
        id: `wikidata:${item.id}`,
        source: 'wikidata',
        reference: item.id,
        name: item.label || item.id,
        manufacturer: 'Wikidata',
        cadAvailable: false,
        datasheetAvailable: false,
        scores: { global: 0.8 },
        metadata: {
          description: item.description,
          url: item.concepturi,
        },
      }));
    } catch {
      return [];
    }
  },
};
