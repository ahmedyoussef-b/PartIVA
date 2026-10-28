import { describe, it, expect } from 'vitest';
import { generateCompositeFromParams } from './generate-composite';

describe('generate-composite', () => {
  it('produces a non-empty stl data url', async () => {
    const result = await generateCompositeFromParams({
      base: { type: 'block', width: 50, height: 20, length: 20 },
      tool: { type: 'cylinder', diameter: 10, height: 30 },
      operation: 'subtract',
    });
    expect(result.fileUrl).toContain('data:application/stl;base64,');
    expect(result.fileUrl.length).toBeGreaterThan(100);
  });
});
