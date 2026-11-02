/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { describe, it, expect, vi } from 'vitest';
import { searchParts } from './search';
import { searchLocal } from './local-search';
import { searchWeb } from './web-search';

vi.mock('./local-search');
vi.mock('./web-search');

describe('searchParts', () => {
  const baseInput: any = {
    ingestResult: {
      inputType: 'photo_only',
      metadata: { fileCount: 1, formats: ['jpg'], totalSize: 1024 },
      extractedFeatures: ['photos_present'],
      analysisStatus: 'partial',
      warnings: [],
    },
    mode: 'quick',
    threshold: 0.7,
    maxResults: 10,
  };

  it('mode quick - local only', async () => {
    vi.mocked(searchLocal).mockResolvedValue([
      { id: '1', source: 'local', name: 'Part A', score: 0.8, metadata: {} },
    ]);
    const result = await searchParts(baseInput);
    expect(result.mode).toBe('quick');
    expect(result.candidates.length).toBe(1);
    expect(searchWeb).not.toHaveBeenCalled();
  });

  it('quick - local vide -> fallback web appelé, résultats retournés, SEARCH_WEB_FALLBACK_USED présent', async () => {
    vi.mocked(searchLocal).mockResolvedValue([]);
    vi.mocked(searchWeb).mockResolvedValue([
      { id: 'w1', source: 'web', name: 'Part B', score: 0.75, metadata: {} },
    ]);
    const result = await searchParts({ ...baseInput, mode: 'quick' });
    expect(searchWeb).toHaveBeenCalled();
    expect(result.candidates.length).toBe(1);
    expect(result.warnings).toContain('SEARCH_WEB_FALLBACK_USED');
  });

  it('quick - local vide + web vide -> not_found avec warnings structurés', async () => {
    vi.mocked(searchLocal).mockResolvedValue([]);
    vi.mocked(searchWeb).mockResolvedValue([]);
    const result = await searchParts({ ...baseInput, mode: 'quick' });
    expect(result.searchStatus).toBe('not_found');
    expect(result.structuredWarnings?.length).toBeGreaterThan(0);
  });

  it('deep - non-régression', async () => {
    vi.mocked(searchLocal).mockResolvedValue([]);
    vi.mocked(searchWeb).mockResolvedValue([
      { id: 'w1', source: 'web', name: 'Part B', score: 0.75, metadata: {} },
    ]);
    const result = await searchParts({ ...baseInput, mode: 'deep' });
    expect(result.mode).toBe('deep');
    expect(searchWeb).toHaveBeenCalled();
  });
});
