import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IngestResult } from '../ingest/types';
import type { SearchResult } from '../search/types';
import type { ReconstructCandidate } from './types';
import { selectCandidates } from './select-candidates';

vi.mock('./extract-params', () => ({
  extractCadParams: vi.fn(),
}));

vi.mock('./generate-cad', () => ({
  generateCadFromParams: vi.fn(),
}));

import { extractCadParams } from './extract-params';
import { generateCadFromParams } from './generate-cad';

const mockExtractCadParams = vi.mocked(extractCadParams);
const mockGenerateCadFromParams = vi.mocked(generateCadFromParams);

const mockGeneratedCandidate: ReconstructCandidate = {
  id: 'generated-1',
  method: 'generated',
  fileUrl: 'data:application/stl;base64,AAAA',
  format: 'stl',
  confidence: 0.8,
  warnings: [],
};

const baseIngest: IngestResult = {
  inputType: 'photo_dimensions',
  metadata: {
    fileCount: 0,
    formats: [],
    totalSize: 0,
    dimensions: { length: 50, width: 20, height: 5, unit: 'mm' },
  },
  extractedFeatures: ['plaque'],
  analysisStatus: 'complete',
  warnings: [],
};

function makeSearchCandidate(fileUrl: string, score = 0.9): import('./search/types').SearchCandidate {
  return {
    id: 'cand-1',
    source: 'web',
    name: 'test',
    score,
    fileUrl,
    metadata: {},
  };
}

function makeSearchResult(candidates: import('./search/types').SearchCandidate[], searchStatus: 'found' | 'not_found' | 'partial' = 'found'): SearchResult {
  return {
    candidates,
    searchStatus,
    mode: 'deep',
    warnings: [],
  };
}

describe('selectCandidates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('génère un candidat generated avec fileUrl réel quand searchStatus est partial', async () => {
    mockExtractCadParams.mockResolvedValue({
      type: 'plate',
      width: 50,
      height: 20,
      length: 10,
      unit: 'mm',
    });
    mockGenerateCadFromParams.mockResolvedValue(mockGeneratedCandidate);

    const searchResult = {
      candidates: [],
      searchStatus: 'partial',
      mode: 'deep',
      warnings: [],
    };

    const result = await selectCandidates(searchResult, undefined, baseIngest);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockGeneratedCandidate);
    expect(result[0].fileUrl).toBe('data:application/stl;base64,AAAA');
  });

  it('garde le fallback sans fileUrl si la génération échoue', async () => {
    mockExtractCadParams.mockRejectedValue(new Error('Groq down'));
    mockGenerateCadFromParams.mockRejectedValue(new Error('STL generation failed'));

    const searchResult = {
      candidates: [],
      searchStatus: 'not_found',
      mode: 'quick',
      warnings: [],
    };

    const result = await selectCandidates(searchResult, undefined, baseIngest);

    expect(result).toHaveLength(1);
    expect(result[0].fileUrl).toBe('');
    expect(result[0].method).toBe('generated');
    expect(result[0].confidence).toBe(0.3);
  });

  it('retourne un candidat SKILL_RECONSTRUCT pour un fichier CAO valide', async () => {
    const searchResult = makeSearchResult([makeSearchCandidate('https://x.com/part.stl')]);

    const result = await selectCandidates(searchResult);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('web_found');
    expect(result[0].fileUrl).toBe('https://x.com/part.stl');
    expect(result[0].format).toBe('stl');
  });

  it('ne retourne pas de candidat CAO pour une extension invalide, fallback généré', async () => {
    const searchResult = makeSearchResult([makeSearchCandidate('https://x.com/fake.txt')]);

    const result = await selectCandidates(searchResult);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('generated');
    expect(result[0].fileUrl).toBe('');
    expect(result[0].warnings[0]).toContain('Aucun fichier 3D trouvé');
  });

  it('retourne le candidat valide et un fileWarning pour le fichier invalide dans un mélange', async () => {
    const searchResult = makeSearchResult([
      makeSearchCandidate('https://x.com/part.step', 0.9),
      makeSearchCandidate('https://x.com/fake.txt', 0.8),
    ]);

    const result = await selectCandidates(searchResult);

    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('web_found');
    expect(result[0].fileUrl).toBe('https://x.com/part.step');
    expect(result[0].format).toBe('step');
    expect(result[0].fileWarnings).toEqual([
      { code: 'INVALID_CAD_FORMAT', files: ['https://x.com/fake.txt'] },
    ]);
  });
});
