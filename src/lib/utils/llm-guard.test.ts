import { describe, it, expect } from 'vitest';
import { acquireLlmGuard, hashKey } from './llm-guard';
import { getLlmCache, setLlmCache, clearLlmCache } from './llm-cache';

describe('llm-guard', () => {
  it('hashKey est déterministe et sensible', () => {
    expect(hashKey('abc')).toBe(hashKey('abc'));
    expect(hashKey('abc')).not.toBe(hashKey('abd'));
  });

  it('acquireLlmGuard bloque les acquisitions concurrentes', () => {
    const g1 = acquireLlmGuard('k1', 10_000);
    expect(g1.ok).toBe(true);

    const g2 = acquireLlmGuard('k1', 10_000);
    expect(g2.ok).toBe(false);

    g1.release();
    const g3 = acquireLlmGuard('k1', 10_000);
    expect(g3.ok).toBe(true);
    g3.release();
  });
});

describe('llm-cache', () => {
  it('stocke et restitue les valeurs', () => {
    clearLlmCache();
    setLlmCache('key', { a: 1 });
    expect(getLlmCache<{ a: number }>('key')).toEqual({ a: 1 });
    expect(getLlmCache('missing')).toBeUndefined();
    clearLlmCache();
  });
});
