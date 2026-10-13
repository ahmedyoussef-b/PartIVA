import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import {
  searchTecDoc,
  searchByVIN,
  searchByVehicle,
  searchByPhotoAndVehicle,
  mapTecDocToCandidate,
} from '@/lib/data/tecdoc';

/**
 * Connecteur TecDoc (E5-S05, enrichi E6-S08).
 *
 * Sémantique déléguée (D5) : recherche full-text
 * (filtre `includes` en mode mock, API TecDoc en mode réel).
 *
 * Mode mock actif (D-tecdoc-credentials) :
 * isAvailable() retourne true — le mode mock est
 * fonctionnel et retourne des produits valides.
 * Le mode réel est conditionné au contrat commercial
 * TecDoc (clé API + provider ID).
 *
 * E6-S08 (enrichi) : ajoute les recherches
 * VIN2OE (searchByVIN), par véhicule (searchByVehicle)
 * et photo+fitment (searchByPhotoAndVehicle) —
 * innovations #1 et #4 du plan auto-parts.
 *
 * Adapte le mapping TecDoc vers SearchCandidate :
 * id = `tecdoc:<sourceId>`, reference = partNumber,
 * scores.global = weight (0.5) — D-E3-23.
 */
export const tecDocConnector: SourceConnector = {
  source: 'tecdoc',
  weight: SOURCE_WEIGHTS.tecdoc.weight,
  timeoutMs: SOURCE_WEIGHTS.tecdoc.timeoutMs, // mock rapide, réel à ajuster

  isAvailable(): boolean {
    return true;
  },

  async search(query, options = {}) {
    const { limit = 20 } = options;
    const response = await searchTecDoc(query, {
      pageSize: limit,
    });
    return response.products.map((product) => {
      const mapped = mapTecDocToCandidate(product);
      const candidate: SearchCandidate = {
        id: `tecdoc:${mapped.sourceId}`,
        source: 'tecdoc',
        reference: mapped.partNumber ?? mapped.sourceId,
        name: mapped.name,
        manufacturer: mapped.manufacturer ?? undefined,
        imageUrl: mapped.thumbnailUrl ?? undefined,
        cadAvailable: mapped.cadAvailable,
        datasheetAvailable: false,
        scores: { global: 0.5 },
        metadata: {
          tecdocId: mapped.sourceId,
          partNumber: mapped.partNumber,
          category: mapped.category,
          autoCategory: mapped.autoCategory,
          material: mapped.material,
          cadFormats: mapped.cadFormats,
          productUrl: mapped.productUrl,
          description: mapped.description,
        },
      };
      return candidate;
    });
  },
};

/**
 * Recherche TecDoc enrichie par VIN (VIN2OE — innovation #1).
 *
 * Décodage VIN → véhicule → fitments → candidats.
 * Retourne les candidats + le véhicule décodé.
 */
export async function searchTecDocByVIN(
  vin: string,
  options: { limit?: number } = {},
): Promise<{
  candidates: SearchCandidate[];
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    engine: string | null;
    ktype: string | null;
    vin: string | null;
  } | null;
}> {
  const { limit = 20 } = options;
  const response = await searchByVIN(vin, { limit });
  const candidates = response.products.map((product) => {
    const mapped = mapTecDocToCandidate(product);
    return {
      id: `tecdoc:${mapped.sourceId}`,
      source: 'tecdoc' as const,
      reference: mapped.partNumber ?? mapped.sourceId,
      name: mapped.name,
      manufacturer: mapped.manufacturer ?? undefined,
      imageUrl: mapped.thumbnailUrl ?? undefined,
      cadAvailable: mapped.cadAvailable,
      datasheetAvailable: false,
      scores: { global: 0.5 },
      metadata: {
        tecdocId: mapped.sourceId,
        partNumber: mapped.partNumber,
        category: mapped.category,
        autoCategory: mapped.autoCategory,
        material: mapped.material,
        cadFormats: mapped.cadFormats,
        productUrl: mapped.productUrl,
        description: mapped.description,
        vehicleFitment: response.vehicle
          ? {
              make: response.vehicle.make,
              model: response.vehicle.model,
              year: response.vehicle.year,
              engine: response.vehicle.engine ?? undefined,
              ktype: response.vehicle.ktype ?? undefined,
            }
          : undefined,
      },
    } satisfies SearchCandidate;
  });

  return {
    candidates,
    vehicle: response.vehicle
      ? {
          id: response.vehicle.id,
          make: response.vehicle.make,
          model: response.vehicle.model,
          year: response.vehicle.year,
          engine: response.vehicle.engine ?? null,
          ktype: response.vehicle.ktype ?? null,
          vin: response.vehicle.vin ?? null,
        }
      : null,
  };
}

/**
 * Recherche TecDoc enrichie par véhicule (innovation #4).
 *
 * make/model/year/engine → fitments → candidats.
 * Filtrage optionnel sur autoCategory / material (focus plastique).
 */
export async function searchTecDocByVehicle(
  params: {
    make: string;
    model: string;
    year: number;
    engine?: string;
  },
  options: {
    limit?: number;
    autoCategory?: string;
    material?: string;
  } = {},
): Promise<SearchCandidate[]> {
  const { limit = 20 } = options;
  const response = await searchByVehicle(params, {
    limit,
    autoCategory: options.autoCategory,
    material: options.material,
  });
  return response.products.map((product) => {
    const mapped = mapTecDocToCandidate(product);
    return {
      id: `tecdoc:${mapped.sourceId}`,
      source: 'tecdoc' as const,
      reference: mapped.partNumber ?? mapped.sourceId,
      name: mapped.name,
      manufacturer: mapped.manufacturer ?? undefined,
      imageUrl: mapped.thumbnailUrl ?? undefined,
      cadAvailable: mapped.cadAvailable,
      datasheetAvailable: false,
      scores: { global: 0.5 },
      metadata: {
        tecdocId: mapped.sourceId,
        partNumber: mapped.partNumber,
        category: mapped.category,
        autoCategory: mapped.autoCategory,
        material: mapped.material,
        cadFormats: mapped.cadFormats,
        productUrl: mapped.productUrl,
        description: mapped.description,
        vehicleFitment: response.vehicle
          ? {
              make: response.vehicle.make,
              model: response.vehicle.model,
              year: response.vehicle.year,
              engine: response.vehicle.engine ?? undefined,
              ktype: response.vehicle.ktype ?? undefined,
            }
          : undefined,
      },
    } satisfies SearchCandidate;
  });
}

/**
 * Recherche TecDoc par photo + véhicule (innovation #4).
 *
 * Photo (base64) + véhicule → fitment → candidats.
 * En mode mock, la photo est ignorée (pas d'embedding mock) —
 * le fitment véhicule est le filtre principal.
 */
export async function searchTecDocByPhotoAndVehicle(
  photo: string,
  vehicle: {
    make: string;
    model: string;
    year: number;
    engine?: string;
  },
  options: { limit?: number } = {},
): Promise<SearchCandidate[]> {
  const { limit = 20 } = options;
  const response = await searchByPhotoAndVehicle(photo, vehicle, {
    limit,
  });
  return response.products.map((product) => {
    const mapped = mapTecDocToCandidate(product);
    return {
      id: `tecdoc:${mapped.sourceId}`,
      source: 'tecdoc' as const,
      reference: mapped.partNumber ?? mapped.sourceId,
      name: mapped.name,
      manufacturer: mapped.manufacturer ?? undefined,
      imageUrl: mapped.thumbnailUrl ?? undefined,
      cadAvailable: mapped.cadAvailable,
      datasheetAvailable: false,
      scores: { global: 0.5 },
      metadata: {
        tecdocId: mapped.sourceId,
        partNumber: mapped.partNumber,
        category: mapped.category,
        autoCategory: mapped.autoCategory,
        material: mapped.material,
        cadFormats: mapped.cadFormats,
        productUrl: mapped.productUrl,
        description: mapped.description,
        vehicleFitment: response.vehicle
          ? {
              make: response.vehicle.make,
              model: response.vehicle.model,
              year: response.vehicle.year,
              engine: response.vehicle.engine ?? undefined,
              ktype: response.vehicle.ktype ?? undefined,
            }
          : undefined,
      },
    } satisfies SearchCandidate;
  });
}
