import { test, expect } from '@playwright/test';
import {
  MOCK_3DCARPARTS_PRODUCTS,
  type ThreeDCarPartMockProduct,
} from '../src/lib/data/3dcarparts-fixtures';
import {
  ThreeDCarPartProductSchema,
  map3DCarPartsToCandidate,
  type ThreeDCarPartProduct,
} from '../src/lib/data/3dcarparts';
import { threeDCarPartsConnector } from '../src/lib/connectors/3dcarparts';

test.describe('3DCarParts connector (E15-R1)', () => {
  test('fixtures — produits valides (Zod)', async () => {
    for (const product of MOCK_3DCARPARTS_PRODUCTS) {
      const parsed = ThreeDCarPartProductSchema.safeParse(product);
      expect(parsed.success).toBe(true);
    }
  });

  test('mapping — 3DCarParts → SearchCandidate', async () => {
    const firstProduct = MOCK_3DCARPARTS_PRODUCTS[0]!;
    const mapped = map3DCarPartsToCandidate(firstProduct);
    expect(mapped.sourceId).toBe('3dcp-001');
    expect(mapped.name).toBe('Dash Cubby');
    expect(mapped.printableModelUrl).toContain('.stl');
    expect(mapped.license).toBe('CC BY-SA 4.0');
    expect(mapped.attribution).toContain('HotRodNerd');
    expect(mapped.cadAvailable).toBe(true);
  });

  test('connecteur — search retourne des candidats', async () => {
    expect(threeDCarPartsConnector.source).toBe('3dcarparts');
    expect(threeDCarPartsConnector.isAvailable()).toBe(true);
    const results = await threeDCarPartsConnector.search('Dash');
    expect(results.length).toBeGreaterThan(0);
    const first = results[0]!;
    expect(first.source).toBe('3dcarparts');
    expect(first.metadata?.printableModelUrl).toContain('.stl');
    expect(first.metadata?.license).toBe('CC BY-SA 4.0');
  });
});
