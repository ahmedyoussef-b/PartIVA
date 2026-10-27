import { z } from 'zod';
import { IngestResult } from '../ingest/types';

export type { IngestResult };

export type SearchInput = {
  ingestResult: IngestResult;
  mode: 'quick' | 'deep';
  threshold?: number;
  maxResults?: number;
};

export type SearchCandidate = {
  id: string;
  source: 'local' | 'web';
  name: string;
  score: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  metadata: Record<string, unknown>;
};

export type SearchResult = {
  candidates: SearchCandidate[];
  searchStatus: 'found' | 'not_found' | 'partial';
  mode: 'quick' | 'deep';
  warnings: string[];
};

export const searchInputSchema = z.object({
  ingestResult: z.any(),
  mode: z.enum(['quick', 'deep']),
  threshold: z.number().min(0).max(1).optional(),
  maxResults: z.number().int().positive().optional(),
});
