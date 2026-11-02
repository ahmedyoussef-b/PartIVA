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
  const mode = options?.mode || 'deep';

  // Ingest
  let ingest: IngestResult;
  try {
    ingest = await ingestInput(input);
  } catch (e) {
    console.error('INGEST_FAILED', 'ingest', e);
    ingest = {
      inputType: 'photo_only',
      metadata: { fileCount: 0, formats: [], totalSize: 0 },
      extractedFeatures: [],
      analysisStatus: 'failed',
      warnings: ['engine_failed'],
      structuredWarnings: [{ code: 'INGEST_FAILED', message: 'Impossible de lire les fichiers fournis. Vérifiez le format et réessayez.', stage: 'ingest' }],
    };
  }

  // Search
  let search: SearchResult;
  try {
    search = await searchParts({
      ingestResult: ingest,
      mode,
      threshold: 0.7,
      maxResults: 10,
    });
  } catch (e) {
    console.error('SEARCH_FAILED', 'search', e);
    search = {
      candidates: [],
      searchStatus: 'not_found',
      mode,
      warnings: ['engine_failed'],
      structuredWarnings: [{ code: 'SEARCH_FAILED', message: 'La recherche a échoué. Vous pouvez réessayer ou choisir un autre mode.', stage: 'search' }],
    };
  }

  // Reconstruct
  let reconstruct: ReconstructResult;
  try {
    reconstruct = await reconstructPart({
      ingestResult: ingest,
      searchResult: search,
    });
  } catch (e) {
    console.error('RECONSTRUCT_FAILED', 'reconstruct', e);
    reconstruct = {
      candidates: [],
      reconstructStatus: 'failed',
      warnings: ['engine_failed'],
      structuredWarnings: [{ code: 'RECONSTRUCT_FAILED', message: 'La reconstruction a échoué. Un candidat généré est proposé en fallback.', stage: 'reconstruct' }],
    };
  }

  // Archive
  let archive: ArchiveResult;
  try {
    archive = await archivePart({
      ingestResult: ingest,
      searchResult: search,
      reconstructResult: reconstruct,
      analysisData: JSON.parse(JSON.stringify({ ingest, search, reconstruct })),
    });
  } catch (e) {
    console.error('ARCHIVE_FAILED', 'archive', e);
    archive = {
      archivedPartId: null,
      archiveStatus: 'failed',
      warnings: ['engine_failed'],
      structuredWarnings: [{ code: 'ARCHIVE_FAILED', message: "L'archivage a échoué, mais votre résultat est disponible.", stage: 'archive' }],
    };
  }

  return { ingest, search, reconstruct, archive };
}