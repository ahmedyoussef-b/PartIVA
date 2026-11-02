import type { SearchCandidate } from '@/schemas/search';

export interface SourceConnector {
  readonly source:
    'local_db' | 'wikidata' | 'traceparts' | 'tecdoc' | 'industrial_catalog' | '3dcarparts';

  readonly mode: 'real' | 'mock';

  readonly weight: number;

  readonly timeoutMs?: number;

  isAvailable(): boolean;

  search(
    query: string,
    options?: { limit?: number; signal?: AbortSignal },
  ): Promise<SearchCandidate[]>;
}
