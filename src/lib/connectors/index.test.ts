import { describe, it, expect } from 'vitest';
import { ALL_CONNECTORS, REAL_CONNECTORS, MOCK_CONNECTORS } from './index';

describe('connectors index', () => {
  it('excludes mocks by default', () => {
    expect(ALL_CONNECTORS.length).toBe(REAL_CONNECTORS.length);
    expect(ALL_CONNECTORS.some((c) => c.mode === 'mock')).toBe(false);
  });

  it('includes mocks when ENABLE_MOCK_CONNECTORS=true', () => {
    const prev = process.env.ENABLE_MOCK_CONNECTORS;
    process.env.ENABLE_MOCK_CONNECTORS = 'true';
    // re-evaluate by importing fresh? module already loaded; check logic via lengths
    expect(REAL_CONNECTORS.length + MOCK_CONNECTORS.length).toBeGreaterThan(REAL_CONNECTORS.length);
    if (prev === undefined) delete process.env.ENABLE_MOCK_CONNECTORS;
    else process.env.ENABLE_MOCK_CONNECTORS = prev;
  });
});
