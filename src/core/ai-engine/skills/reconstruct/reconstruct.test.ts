import { describe, it, expect } from 'vitest';
import { SearchResult, IngestResult } from './types';
import { reconstructPart } from './reconstruct';

function makeSearchResult(overrides: Partial<SearchResult>): SearchResult {
  return {
    candidates: [],
    searchStatus: 'found',
    mode: 'quick',
    warnings: [],
    ...overrides,
  };
}

function makeIngestResult(): IngestResult {
  return {
    inputType: 'photo_only',
    metadata: {
      fileCount: 0,
      formats: [],
      totalSize: 0,
    },
    extractedFeatures: [],
    analysisStatus: 'complete',
    warnings: [],
  };
}

describe('reconstruct', () => {
  it('trouvé avec fichier -> success', async () => {
    const searchResult = makeSearchResult({
      candidates: [{ id: '1', source: 'local', name: 'Part', score: 0.9, fileUrl: 'http://x/part.step' }],
      searchStatus: 'found',
    });
    const result = await reconstructPart({ ingestResult: makeIngestResult(), searchResult });
    expect(result.reconstructStatus).toBe('success');
    expect(result.candidates[0].method).toBe('local_found');
  });

  it('partiel sans fichier -> partial', async () => {
    const searchResult = makeSearchResult({
      candidates: [{ id: '1', source: 'web', name: 'Part', score: 0.5 }],
      searchStatus: 'partial',
      mode: 'deep',
    });
    const result = await reconstructPart({ ingestResult: makeIngestResult(), searchResult });
    expect(result.reconstructStatus).toBe('partial');
    expect(result.candidates[0].method).toBe('generated');
  });

  it('non trouvé -> failed/partial', async () => {
    const searchResult = makeSearchResult({
      candidates: [],
      searchStatus: 'not_found',
      mode: 'quick',
    });
    const result = await reconstructPart({ ingestResult: makeIngestResult(), searchResult });
    expect(['failed', 'partial']).toContain(result.reconstructStatus);
  });
});

