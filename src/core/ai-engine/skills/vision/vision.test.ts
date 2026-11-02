import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/ai/groq-client', () => ({
  callGroq: vi.fn(),
  getGroqApiKey: () => 'test-key',
}));

import { callGroq } from '@/lib/ai/groq-client';
import { detectPartType } from './vision';

describe('vision', () => {
  beforeEach(() => {
    vi.mocked(callGroq).mockReset();
    process.env.GROQ_API_KEY = 'test-key';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'image/jpeg']]),
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as unknown as typeof fetch;
  });

  it('succes JSON valide', async () => {
    vi.mocked(callGroq).mockResolvedValue({
      content: '{"type":"vis","confidence":0.9}',
      model: 'm',
    });
    const r = await detectPartType({ photoUrls: ['https://example.com/a.jpg'] });
    expect(r.detectedType).toBe('vis');
    expect(r.confidence).toBe(0.9);
  });

  it('JSON invalide -> VISION_PARSE_FAILED', async () => {
    vi.mocked(callGroq).mockResolvedValue({ content: 'not json', model: 'm' });
    const r = await detectPartType({ photoUrls: ['https://example.com/a.jpg'] });
    expect(r.structuredWarnings?.some((w) => w.code === 'VISION_PARSE_FAILED')).toBe(true);
  });

  it('>3 images -> VISION_TOO_MANY_IMAGES', async () => {
    const urls = [
      'https://a.com/1.jpg',
      'https://a.com/2.jpg',
      'https://a.com/3.jpg',
      'https://a.com/4.jpg',
    ];
    const r = await detectPartType({ photoUrls: urls });
    expect(r.structuredWarnings?.some((w) => w.code === 'VISION_TOO_MANY_IMAGES')).toBe(true);
  });
});
