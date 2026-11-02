import { z } from 'zod';
import { IngestResult } from '../ingest/types';
import { SearchResult } from '../search/types';
import { ReconstructResult } from '../reconstruct/types';

export type { IngestResult, SearchResult, ReconstructResult };

export type ArchiveInput = {
  ingestResult: IngestResult;
  searchResult: SearchResult;
  reconstructResult: ReconstructResult;
  userId?: string;
  analysisData?: unknown;
};

export type ArchiveResult = {
  archivedPartId: string | null;
  archiveStatus: 'success' | 'partial' | 'failed';
  warnings: string[];
  structuredWarnings?: EngineWarning[];
};

export interface EngineError { code: string; message: string; stage: 'ingest'|'search'|'reconstruct'|'archive'|'vision'|'groq'; }
export interface EngineWarning { code: string; message: string; stage?: string; }

export const archiveInputSchema = z.object({
  ingestResult: z.any(),
  searchResult: z.any(),
  reconstructResult: z.any(),
  userId: z.string().optional(),
  analysisData: z.any().optional(),
});
