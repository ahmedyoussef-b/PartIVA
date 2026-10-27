import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IngestResult } from '../ingest/types';
import { extractCadParams } from './extract-params';

vi.mock('../../../../lib/ai/groq-client', () => ({
  callGroq: vi.fn(),
  getGroqApiKey: vi.fn(),
}));

import { callGroq } from '../../../../lib/ai/groq-client';

const mockCallGroq = vi.mocked(callGroq);

const mockGroqResponse = {
  content: '{"type":"plate","width":50,"height":20,"length":10,"unit":"mm"}',
  model: 'test-model',
};

const baseIngest: IngestResult = {
  inputType: 'photo_dimensions',
  metadata: {
    fileCount: 0,
    formats: [],
    totalSize: 0,
    dimensions: { length: 50, width: 20, height: 5, unit: 'mm' },
  },
  extractedFeatures: ['plaque', 'boite'],
  analysisStatus: 'complete',
  warnings: [],
};

describe('extractCadParams', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('extrait les paramètres CAO depuis Groq en cas de succès', async () => {
    mockCallGroq.mockResolvedValue(mockGroqResponse);
    const params = await extractCadParams(baseIngest);
    expect(params).toMatchObject({ type: 'plate', width: 50, height: 20, length: 10, unit: 'mm' });
  });

  it('retourne des paramètres par défaut si Groq échoue', async () => {
    mockCallGroq.mockRejectedValue(new Error('Network error'));
    const params = await extractCadParams(baseIngest);
    expect(params).toEqual({
      type: 'cylinder',
      unit: 'mm',
      diameter: 10,
      height: 20,
    });
  });

  it('retourne des paramètres par défaut si la réponse est invalide', async () => {
    mockCallGroq.mockResolvedValue({ content: 'pas un json', model: 'test-model' });
    const params = await extractCadParams(baseIngest);
    expect(params).toEqual({
      type: 'cylinder',
      unit: 'mm',
      diameter: 10,
      height: 20,
    });
  });
});
