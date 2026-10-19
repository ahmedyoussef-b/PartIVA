import { test, expect } from '@playwright/test';
import {
  searchTecDoc,
  isTecDocConfigured,
  mapTecDocToCandidate,
  TecDocSearchResponseSchema,
} from '../src/lib/data/tecdoc';

function withMockMode<T>(fn: () => Promise<T> | T): Promise<T> | T {
  const originalKey = process.env.TECDOC_API_KEY;
  const originalProvider = process.env.TECDOC_PROVIDER_ID;
  delete process.env.TECDOC_API_KEY;
  delete process.env.TECDOC_PROVIDER_ID;

  const restore = () => {
    if (originalKey) process.env.TECDOC_API_KEY = originalKey;
    if (originalProvider) process.env.TECDOC_PROVIDER_ID = originalProvider;
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

test.describe('TecDoc connector (E5-S05)', () => {
  test('mode mock — isTecDocConfigured retourne false sans contrat', () => {
    withMockMode(() => {
      expect(isTecDocConfigured()).toBe(false);
    });
  });

  test('mode mock — recherche "frein" retourne des produits', async () => {
    const result = await withMockMode(() => searchTecDoc('frein'));
    expect(result.products.length).toBeGreaterThanOrEqual(1);
    expect(result.products[0]!.id).toBe('TD-001');
    expect(result.products[0]!.name).toContain('frein');
  });

  test('mode mock — recherche "filtre" retourne des produits', async () => {
    const result = await withMockMode(() => searchTecDoc('filtre'));
    expect(result.products.length).toBeGreaterThanOrEqual(1);
    expect(result.products[0]!.id).toBe('TD-002');
  });

  test('mode mock — recherche par référence "0 986 494 028" retourne 1 produit', async () => {
    const result = await withMockMode(() => searchTecDoc('0 986 494 028'));
    expect(result.products).toHaveLength(1);
    expect(result.products[0]!.partNumber).toBe('0 986 494 028');
  });
  test('mode mock — recherche "inexistant" retourne 0 produit', async () => {
    const result = await withMockMode(() => searchTecDoc('inexistant-xyz'));
    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test('schéma Zod — fixtures mock valides', async () => {
    const result = await withMockMode(() => searchTecDoc('frein'));
    const parsed = TecDocSearchResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  test('mapping — TecDoc → SearchCandidate', async () => {
    const result = await withMockMode(() => searchTecDoc('frein'));
    const candidate = mapTecDocToCandidate(result.products[0]!);

    expect(candidate.source).toBe('tecdoc');
    expect(candidate.sourceId).toBe('TD-001');
    expect(candidate.name).toContain('frein');
    expect(candidate.manufacturer).toBe('Bosch');
    expect(candidate.partNumber).toBe('0 986 494 028');
    expect(candidate.category).toBe('Freinage');
  });

  test.describe('E14-R1 — enrichissement mock (safetyWarning, printableModelUrl, printMaterial)', () => {
    test('fixture avec printableModelUrl → champ présent', async () => {
      const result = await withMockMode(() => searchTecDoc('pare-chocs'));
      expect(result.products.length).toBeGreaterThanOrEqual(1);
      const product = result.products.find((p) => p.id === 'TD-004')!;
      expect(product.printableModelUrl).toBe('https://example.com/models/td-004.stl');
      expect(product.printMaterial).toBe('ABS');
      const mapped = mapTecDocToCandidate(product);
      expect(mapped.printableModelUrl).toBe('https://example.com/models/td-004.stl');
      expect(mapped.printMaterial).toBe('ABS');
    });

    test('fixture avec safetyWarning → champ présent', async () => {
      const result = await withMockMode(() => searchTecDoc('frein'));
      const product = result.products.find((p) => p.id === 'TD-001')!;
      expect(product.safetyWarning).toContain('freinage');
      const mapped = mapTecDocToCandidate(product);
      expect(mapped.safetyWarning).toContain('freinage');
    });

    test('fixture sans printableModelUrl → champ undefined (optionnel)', async () => {
      const result = await withMockMode(() => searchTecDoc('filtre'));
      const product = result.products.find((p) => p.id === 'TD-002')!;
      expect(product.printableModelUrl).toBeUndefined();
      const mapped = mapTecDocToCandidate(product);
      expect(mapped.printableModelUrl).toBeNull();
      expect(mapped.safetyWarning).toBeNull();
    });
  });

  test('mode réel — conditionnel contrat commercial (skip si absent)', async () => {
    test.skip(
      !process.env.TECDOC_API_KEY || !process.env.TECDOC_PROVIDER_ID,
      'Contrat commercial TecDoc non provisionné — mode réel non testé',
    );

    const result = await searchTecDoc('brake');
    expect(result.products.length).toBeGreaterThanOrEqual(0);
    const parsed = TecDocSearchResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
