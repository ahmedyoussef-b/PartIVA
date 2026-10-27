import { describe, it, expect } from 'vitest';
import { validateArchive } from './validate';

describe('validateArchive', () => {
  it('valide si success avec fichier', () => {
    const input: any = {
      ingestResult: { metadata: {}, extractedFeatures: [] },
      searchResult: {},
      reconstructResult: {
        reconstructStatus: 'success',
        candidates: [{ fileUrl: 'http://x/part.step' }],
      },
    };
    const res = validateArchive(input);
    expect(res.isValid).toBe(true);
  });

  it('refuse si fichier manquant', () => {
    const input: any = {
      ingestResult: { metadata: {}, extractedFeatures: [] },
      searchResult: {},
      reconstructResult: {
        reconstructStatus: 'success',
        candidates: [{ fileUrl: '' }],
      },
    };
    const res = validateArchive(input);
    expect(res.isValid).toBe(false);
  });
});
