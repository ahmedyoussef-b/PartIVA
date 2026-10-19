import { z } from 'zod';
import { MOCK_3DCARPARTS_PRODUCTS } from './3dcarparts-fixtures';

/**
 * Schéma Zod — produit 3DCarParts (E15-R1).
 *
 * 3DCarParts est une source externe de modèles 3D imprimables
 * (STL) pour pièces auto. Licence CC BY-SA 4.0 (attribution obligatoire).
 *
 * Mode mock : fixtures statiques (pas d'API publique).
 * Mode réel : à provisionner (post-E15).
 */
export const ThreeDCarPartProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  vehicle: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().positive(),
  }),
  printableModelUrl: z.string().url(),
  printMaterial: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().min(1),
  downloads: z.number().int().nonnegative(),
  safetyWarning: z.string().optional(),
});

export type ThreeDCarPartProduct = z.infer<typeof ThreeDCarPartProductSchema>;

export const ThreeDCarPartSearchResponseSchema = z.object({
  products: z.array(ThreeDCarPartProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
});

export type ThreeDCarPartSearchResponse = z.infer<typeof ThreeDCarPartSearchResponseSchema>;

export async function search3DCarParts(
  query: string,
  options: { pageSize?: number } = {},
): Promise<ThreeDCarPartSearchResponse> {
  const { pageSize = 20 } = options;
  const q = query.trim().toLowerCase();
  const filtered = MOCK_3DCARPARTS_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.vehicle.make.toLowerCase().includes(q) ||
      p.vehicle.model.toLowerCase().includes(q),
  ).slice(0, pageSize);

  return {
    products: filtered,
    total: filtered.length,
    page: 1,
    pageSize,
  };
}

export function is3DCarPartsConfigured(): boolean {
  return false; // Mode mock uniquement (pas d'API publique).
}

export function map3DCarPartsToCandidate(product: ThreeDCarPartProduct): {
  sourceId: string;
  name: string;
  printableModelUrl: string;
  printMaterial: string;
  license: string;
  attribution: string;
  downloads: number;
  safetyWarning: string | null;
  vehicle: ThreeDCarPartProduct['vehicle'];
  cadAvailable: boolean;
} {
  return {
    sourceId: product.id,
    name: product.name,
    printableModelUrl: product.printableModelUrl,
    printMaterial: product.printMaterial,
    license: product.license,
    attribution: product.attribution,
    downloads: product.downloads,
    safetyWarning: product.safetyWarning ?? null,
    vehicle: product.vehicle,
    cadAvailable: true, // STL disponible
  };
}
