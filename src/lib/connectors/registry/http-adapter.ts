import type { SourceConnector } from '../types';
import type { ConnectorDescriptor } from './types';
import type { SearchCandidate } from '@/schemas/search';

export function createHttpConnector(descriptor: ConnectorDescriptor): SourceConnector {
  return {
    source: descriptor.id as SourceConnector['source'],
    mode: descriptor.mode,
    weight: descriptor.weight,
    timeoutMs: descriptor.timeoutMs,

    isAvailable(): boolean {
      if (descriptor.api.auth === 'bearer' || descriptor.api.auth === 'api-key') {
        return Boolean(process.env[descriptor.api.apiKeyEnv!]);
      }
      return true; // Pas d'auth requise
    },

    async search(query, options = {}) {
      const { limit = 20, signal } = options;

      const url = new URL(descriptor.api.searchPath, descriptor.api.baseUrl);
      url.searchParams.set('q', query);
      url.searchParams.set('pageSize', String(limit));

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (descriptor.api.auth === 'bearer') {
        headers['Authorization'] = `Bearer ${process.env[descriptor.api.apiKeyEnv!]}`;
      }

      const res = await fetch(url.toString(), { headers, signal });
      if (!res.ok) {
        console.warn(`[${descriptor.id}] HTTP ${res.status}`);
        return [];
      }

      const raw = await res.json();
      const items = descriptor.extractItems(raw);

      return items
        .map((item) => descriptor.mapper(item, { query }))
        .filter((c): c is SearchCandidate => c !== null)
        .slice(0, limit);
    },
  };
}
