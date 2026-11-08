import type { ConnectorDescriptor } from '../types';
import type { SearchCandidate } from '@/schemas/search';

export const openserpDescriptor: ConnectorDescriptor = {
  id: 'openserp',
  label: 'OpenSERP (Web)',
  description: 'Recherche web via Bing (Docker local)',
  mode: 'real',
  weight: 0.5,
  timeoutMs: 15_000,

  api: {
    baseUrl: process.env.OPENSERP_BASE_URL || 'http://localhost:7000',
    searchPath: '/mega/search',
    auth: 'none',
  },

  extractItems: (raw: unknown) => {
    const r = raw as { results?: unknown[]; items?: unknown[] } | null;
    return r?.results || r?.items || [];
  },

  mapper: (item: unknown): SearchCandidate | null => {
    const it = item as { url?: string; title?: string; snippet?: string } | null;
    if (!it || !it.url || !it.title) return null;
    return {
      id: `openserp:${it.url}`,
      source: 'openserp',
      reference: it.url,
      name: it.title,
      manufacturer: 'Web',
      cadAvailable: false,
      datasheetAvailable: false,
      scores: { global: 0.5 },
      metadata: {
        url: it.url,
        snippet: it.snippet,
      },
    };
  },
};
