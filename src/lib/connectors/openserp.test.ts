import { describe, it, expect } from 'vitest';
import { isOpenSerpConfigured } from './openserp';

describe('openserp connector', () => {
  it('isOpenSerpConfigured retourne false sans env', () => {
    delete process.env.OPENSERP_ENABLED;
    delete process.env.OPENSERP_BASE_URL;
    expect(isOpenSerpConfigured()).toBe(false);
  });

  it('isOpenSerpConfigured retourne true avec env', () => {
    process.env.OPENSERP_ENABLED = 'true';
    process.env.OPENSERP_BASE_URL = 'http://localhost:7000';
    expect(isOpenSerpConfigured()).toBe(true);
  });
});
