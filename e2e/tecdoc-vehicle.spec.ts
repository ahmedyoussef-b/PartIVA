import { test, expect } from '@playwright/test';
import {
  searchByVehicle,
  searchByPhotoAndVehicle,
  TecDocVehicleSearchResponseSchema,
} from '../src/lib/data/tecdoc';
import { MOCK_VEHICLES, MOCK_FITMENTS, MOCK_PRODUCTS } from '../src/lib/data/tecdoc-fixtures';

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

test.describe('TecDoc recherche par véhicule (E6-S08)', () => {
  test('mode mock — recherche BMW X5 2019 retourne des pièces', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'BMW', model: 'X5', year: 2019, engine: '3.0d' }),
    );
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]!.make).toBe('BMW');
    expect(result.vehicles[0]!.model).toBe('X5');
    expect(result.vehicles[0]!.year).toBe(2019);
    expect(result.vehicles[0]!.ktype).toBe('KTYPE-BMW-X5-2019-30D');
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.fitments.length).toBeGreaterThan(0);
  });

  test('mode mock — recherche véhicule inexistant retourne 0', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'Ferrari', model: 'Testarossa', year: 1990 }),
    );
    expect(result.vehicles).toHaveLength(0);
    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.vehicle).toBeNull();
  });

  test('mode mock — filtrage autoCategory=body (focus plastique)', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'BMW', model: 'X5', year: 2019 }, { autoCategory: 'body' }),
    );
    expect(result.products.length).toBeGreaterThan(0);
    for (const product of result.products) {
      expect(product.autoCategory).toBe('body');
    }
  });

  test('mode mock — filtrage material=ABS (focus plastique)', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'BMW', model: 'X5', year: 2019 }, { material: 'ABS' }),
    );
    expect(result.products.length).toBeGreaterThan(0);
    for (const product of result.products) {
      expect(product.material).toBe('ABS');
    }
  });

  test('mode mock — recherche Renault Clio 2020', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'Renault', model: 'Clio', year: 2020, engine: '1.5 dCi' }),
    );
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]!.make).toBe('Renault');
    expect(result.vehicles[0]!.ktype).toBe('KTYPE-RENAULT-CLIO-2020-15DCI');
  });

  test('mode mock — recherche Peugeot 308 2021', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'Peugeot', model: '308', year: 2021, engine: '1.2 PureTech' }),
    );
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]!.make).toBe('Peugeot');
  });

  test('mode mock — recherche sans engine (engine optionnel)', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'BMW', model: 'X5', year: 2019 }),
    );
    expect(result.vehicles).toHaveLength(1);
  });

  test('mode mock — recherche avec engine différent retourne 0', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'BMW', model: 'X5', year: 2019, engine: '9.9 Z' }),
    );
    expect(result.vehicles).toHaveLength(0);
  });

  test('schéma Zod — réponse enrichie valide', async () => {
    const result = await withMockMode(() =>
      searchByVehicle({ make: 'BMW', model: 'X5', year: 2019 }),
    );
    const parsed = TecDocVehicleSearchResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  test('fixtures — cohérence référentielle (fitments → produits + véhicules)', () => {
    const productIds = new Set(MOCK_PRODUCTS.map((p) => p.id));
    const vehicleIds = new Set(MOCK_VEHICLES.map((v) => v.id));
    for (const fitment of MOCK_FITMENTS) {
      expect(productIds.has(fitment.productId)).toBe(true);
      expect(vehicleIds.has(fitment.vehicleId)).toBe(true);
    }
  });

  test('fixtures — 50+ pièces, 20+ véhicules', () => {
    expect(MOCK_PRODUCTS.length).toBeGreaterThanOrEqual(50);
    expect(MOCK_VEHICLES.length).toBeGreaterThanOrEqual(20);
  });

  test('mode mock — recherche photo + véhicule (innovation #4)', async () => {
    const result = await withMockMode(() =>
      searchByPhotoAndVehicle('data:image/jpeg;base64,/9j/4AAQSkZJRg==', {
        make: 'BMW',
        model: 'X5',
        year: 2019,
      }),
    );
    expect(result.vehicles).toHaveLength(1);
    expect(result.products.length).toBeGreaterThan(0);
  });

  test('mode mock — recherche photo + véhicule inexistant', async () => {
    const result = await withMockMode(() =>
      searchByPhotoAndVehicle('data:image/jpeg;base64,/9j/4AAQSkZJRg==', {
        make: 'Ferrari',
        model: 'Testarossa',
        year: 1990,
      }),
    );
    expect(result.vehicles).toHaveLength(0);
    expect(result.products).toHaveLength(0);
  });
});
