/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { ingestInput } from './skills/ingest';
import { searchParts } from './skills/search';
import { reconstructPart } from './skills/reconstruct';
import { archivePart } from './skills/archive';
import { IngestInput } from './skills/ingest/types';
import { SearchResult } from './skills/search/types';
import { ReconstructResult } from './skills/reconstruct/types';
import { ArchiveResult } from './skills/archive/types';
import { IngestResult } from './skills/ingest/types';

export type EngineResult = {
  ingest: IngestResult;
  search: SearchResult;
  reconstruct: ReconstructResult;
  archive: ArchiveResult;
};

export async function runEngine(
  input: IngestInput,
  options?: { mode?: 'quick' | 'deep' },
): Promise<EngineResult> {
  try {
    const ingest = await ingestInput(input);

    const search = await searchParts({
      ingestResult: ingest,
      mode: options?.mode || 'deep',
      threshold: 0.7,
      maxResults: 10,
    });

    const reconstruct = await reconstructPart({
      ingestResult: ingest,
      searchResult: search,
    });

    const archive = await archivePart({
      ingestResult: ingest,
      searchResult: search,
      reconstructResult: reconstruct,
    });

    return {
      ingest,
      search,
      reconstruct,
      archive,
    };
  } catch (error) {
    const emptyIngest: IngestResult = {
      inputType: 'photo_only',
      metadata: { fileCount: 0, formats: [], totalSize: 0 },
      extractedFeatures: [],
      analysisStatus: 'failed',
      warnings: ['engine_failed'],
    };

    return {
      ingest: emptyIngest,
      search: {
        candidates: [],
        searchStatus: 'not_found',
        mode: options?.mode || 'deep',
        warnings: ['engine_failed'],
      },
      reconstruct: {
        candidates: [],
        reconstructStatus: 'failed',
        warnings: ['engine_failed'],
      },
      archive: {
        archivedPartId: null,
        archiveStatus: 'failed',
        warnings: ['engine_failed'],
      },
    };
  }
}
