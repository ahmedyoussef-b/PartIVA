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
};

export type ArchiveResult = {
  archivedPartId: string | null;
  archiveStatus: 'success' | 'partial' | 'failed';
  warnings: string[];
};

export const archiveInputSchema = z.object({
  ingestResult: z.any(),
  searchResult: z.any(),
  reconstructResult: z.any(),
  userId: z.string().optional(),
});
