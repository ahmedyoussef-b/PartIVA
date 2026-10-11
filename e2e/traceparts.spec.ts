import { test, expect } from '@playwright/test';
import {
  searchTraceParts,
  isTracePartsConfigured,
  mapTracePartsToCandidate,
  TracePartsSearchResponseSchema,
} from '../src/lib/data/traceparts';

function withMockMode<T>(fn: () => Promise<T> | T): Promise<T> | T {
  const originalTenant = process.env.TRACEPARTS_TENANT_UID;
  const originalKey = process.env.TRACEPARTS_API_KEY;
  delete process.env.TRACEPARTS_TENANT_UID;
  delete process.env.TRACEPARTS_API_KEY;

  const restore = () => {
    if (originalTenant) process.env.TRACEPARTS_TENANT_UID = originalTenant;
    if (originalKey) process.env.TRACEPARTS_API_KEY = originalKey;
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

test.describe('TraceParts connector (E3-S02)', () => {
  test('mode mock — isTracePartsConfigured retourne false sans credentials', () => {
    withMockMode(() => {
      expect(isTracePartsConfigured()).toBe(false);
    });
  });

  test('mode mock — recherche "vis" retourne 1 produit', async () => {
    const result = await withMockMode(() => searchTraceParts('vis'));
    expect(result.products).toHaveLength(1);
    expect(result.products[0]!.id).toBe('TP-001');
    expect(result.products[0]!.name).toContain('Vis');
  });

  test('mode mock — recherche "roulement" retourne 1 produit', async () => {
    const result = await withMockMode(() => searchTraceParts('roulement'));
    expect(result.products).toHaveLength(1);
    expect(result.products[0]!.id).toBe('TP-002');
  });

  test('mode mock — recherche "inexistant" retourne 0 produit', async () => {
    const result = await withMockMode(() => searchTraceParts('inexistant-xyz'));
    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test('schéma Zod — fixtures mock valides', async () => {
    const result = await withMockMode(() => searchTraceParts('vis'));
    const parsed = TracePartsSearchResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  test('mapping — TraceParts → SearchCandidate', async () => {
    const result = await withMockMode(() => searchTraceParts('vis'));
    const candidate = mapTracePartsToCandidate(result.products[0]!);

    expect(candidate.source).toBe('traceparts');
    expect(candidate.sourceId).toBe('TP-001');
    expect(candidate.name).toContain('Vis');
    expect(candidate.cadAvailable).toBe(true);
    expect(candidate.cadFormats).toContain('STEP');
  });

  test('mode réel — conditionnel credentials (skip si absents)', async () => {
    test.skip(
      !process.env.TRACEPARTS_TENANT_UID || !process.env.TRACEPARTS_API_KEY,
      'Credentials TraceParts non provisionnés — mode réel non testé',
    );

    const result = await searchTraceParts('bearing');
    expect(result.products.length).toBeGreaterThanOrEqual(0);
    const parsed = TracePartsSearchResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
