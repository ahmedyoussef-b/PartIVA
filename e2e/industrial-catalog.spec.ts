import { test, expect } from '@playwright/test';
import {
  searchIndustrialCatalog,
  isIndustrialCatalogConfigured,
  mapIndustrialCatalogToCandidate,
  IndustrialCatalogResponseSchema,
} from '../src/lib/data/industrial-catalog';
import { industrialCatalogConnector } from '../src/lib/connectors/industrial-catalog';

test.describe('Industrial catalog connector (E6-S05)', () => {
  test('isIndustrialCatalogConfigured retourne true (dataset HF public)', () => {
    expect(isIndustrialCatalogConfigured()).toBe(true);
  });

  test('recherche "igus" retourne des résultats (fabricant réel)', async () => {
    const result = await searchIndustrialCatalog('igus', { limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.source).toBe('swan07/industrial-parts-data');
  });

  test('recherche "pololu" retourne des résultats (fabricant réel)', async () => {
    const result = await searchIndustrialCatalog('pololu', { limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]!.brand).toBe('Pololu');
  });

  test('recherche "parker" retourne des résultats (fabricant industriel)', async () => {
    const result = await searchIndustrialCatalog('parker', { limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]!.brand).toBeDefined();
  });

  test('recherche "smc" retourne des résultats (pneumatique)', async () => {
    const result = await searchIndustrialCatalog('smc', { limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
  });

  test('recherche "danfoss" retourne des résultats (variateur)', async () => {
    const result = await searchIndustrialCatalog('danfoss', { limit: 10 });
    expect(result.items.length).toBeGreaterThan(0);
  });

  test('recherche "inexistant-xyz" retourne 0 résultat', async () => {
    const result = await searchIndustrialCatalog('inexistant-xyz-unique', { limit: 10 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test('limite respectée — limit=2 retourne ≤ 2 résultats', async () => {
    const result = await searchIndustrialCatalog('pololu', { limit: 2 });
    expect(result.items.length).toBeLessThanOrEqual(2);
  });

  test('schéma Zod — réponse valide', async () => {
    const result = await searchIndustrialCatalog('igus', { limit: 5 });
    const parsed = IndustrialCatalogResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  test('mapping — catalogue industriel → SearchCandidate', async () => {
    const result = await searchIndustrialCatalog('pololu', { limit: 1 });
    expect(result.items.length).toBeGreaterThan(0);
    const candidate = mapIndustrialCatalogToCandidate(result.items[0]!);
    expect(candidate.source).toBe('industrial_catalog');
    expect(candidate.name).toContain('Pololu');
    expect(candidate.manufacturer).toBe('Pololu');
    expect(candidate.partNumber).toBeDefined();
  });

  test('connecteur — search retourne des SearchCandidate valides', async () => {
    const candidates = await industrialCatalogConnector.search('igus', { limit: 5 });
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(candidate.source).toBe('industrial_catalog');
      expect(candidate.id).toContain('industrial_catalog:');
      expect(candidate.name.length).toBeGreaterThan(0);
      expect(candidate.scores.global).toBeGreaterThan(0);
    }
  });

  test('connecteur — isAvailable retourne true', () => {
    expect(industrialCatalogConnector.isAvailable()).toBe(true);
  });

  test('connecteur — weight cohérent (0.55)', () => {
    expect(industrialCatalogConnector.weight).toBe(0.55);
  });
});
