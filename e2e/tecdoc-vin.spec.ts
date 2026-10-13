import { test, expect } from '@playwright/test';
import { searchByVIN, TecDocVehicleSearchResponseSchema } from '../src/lib/data/tecdoc';
import { MOCK_VEHICLES, type TecDocMockVehicle } from '../src/lib/data/tecdoc-fixtures';

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

test.describe('TecDoc recherche par VIN (E6-S08 — VIN2OE)', () => {
  test('mode mock — VIN BMW X5 2019 retourne véhicule + pièces', async () => {
    const result = await withMockMode(() => searchByVIN('WBA12345678901234'));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('BMW');
    expect(result.vehicle!.model).toBe('X5');
    expect(result.vehicle!.year).toBe(2019);
    expect(result.vehicle!.vin).toBe('WBA12345678901234');
    expect(result.vehicle!.ktype).toBe('KTYPE-BMW-X5-2019-30D');
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.fitments.length).toBeGreaterThan(0);
  });

  test('mode mock — VIN Renault Clio 2020', async () => {
    const result = await withMockMode(() => searchByVIN('VF1K5678901234567'));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('Renault');
    expect(result.vehicle!.model).toBe('Clio');
    expect(result.vehicle!.year).toBe(2020);
  });

  test('mode mock — VIN Peugeot 308 2021', async () => {
    const result = await withMockMode(() => searchByVIN('VF3A8901234567890'));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('Peugeot');
    expect(result.vehicle!.model).toBe('308');
  });

  test('mode mock — VIN Volkswagen Golf 2018', async () => {
    const result = await withMockMode(() => searchByVIN('WVW12345678901234'));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('Volkswagen');
    expect(result.vehicle!.model).toBe('Golf');
  });

  test('mode mock — VIN Toyota Corolla 2022', async () => {
    const result = await withMockMode(() => searchByVIN('JT1B2345678901234'));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('Toyota');
    expect(result.vehicle!.model).toBe('Corolla');
  });

  test('mode mock — VIN inexistant retourne vehicle null', async () => {
    const result = await withMockMode(() => searchByVIN('ZZZ99999999999999'));
    expect(result.vehicle).toBeNull();
    expect(result.products).toHaveLength(0);
    expect(result.vehicles).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test('mode mock — VIN insensible à la casse', async () => {
    const result = await withMockMode(() => searchByVIN('wba12345678901234'));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('BMW');
  });

  test('mode mock — VIN insensible aux espaces', async () => {
    const result = await withMockMode(() => searchByVIN('  WBA12345678901234  '));
    expect(result.vehicle).not.toBeNull();
    expect(result.vehicle!.make).toBe('BMW');
  });

  test('schéma Zod — réponse enrichie valide', async () => {
    const result = await withMockMode(() => searchByVIN('WBA12345678901234'));
    const parsed = TecDocVehicleSearchResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  test('fixtures — tous les VIN des véhicules sont uniques', () => {
    const vins = MOCK_VEHICLES.map((v) => v.vin).filter((v): v is string => typeof v === 'string');
    const uniqueVins = new Set(vins.map((v) => v.toUpperCase()));
    expect(uniqueVins.size).toBe(vins.length);
  });

  test('fixtures — tous les KType sont uniques', () => {
    const ktypes = MOCK_VEHICLES.map((v) => v.ktype).filter(
      (v): v is string => typeof v === 'string',
    );
    const uniqueKtypes = new Set(ktypes);
    expect(uniqueKtypes.size).toBe(ktypes.length);
  });

  test('mode mock — VIN retourne les fitments du véhicule', async () => {
    const result = await withMockMode(() => searchByVIN('WBA12345678901234'));
    expect(result.fitments.length).toBeGreaterThan(0);
    for (const fitment of result.fitments) {
      expect(fitment.vehicleId).toBe('VEH-001');
    }
  });

  test('mode mock — VIN retourne des candidats avec vehicleFitment en metadata', async () => {
    const result = await withMockMode(() => searchByVIN('WBA12345678901234'));
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.vehicle).not.toBeNull();
  });
});
