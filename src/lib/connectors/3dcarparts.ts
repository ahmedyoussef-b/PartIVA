import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import { search3DCarParts, map3DCarPartsToCandidate } from '@/lib/data/3dcarparts';

/**
 * Connecteur 3DCarParts (E15-R1).
 *
 * Source externe de modèles 3D imprimables (STL) pour pièces auto.
 * Licence CC BY-SA 4.0 (attribution obligatoire).
 * Mode mock (pas d'API publique) — mode réel post-E15.
 */
export const threeDCarPartsConnector: SourceConnector = {
  source: '3dcarparts',
  weight: SOURCE_WEIGHTS['3dcarparts']?.weight ?? 0.45,
  timeoutMs: SOURCE_WEIGHTS['3dcarparts']?.timeoutMs ?? 5000,

  isAvailable(): boolean {
    return true;
  },

  async search(query, options = {}) {
    const { limit = 20 } = options;
    const response = await search3DCarParts(query, { pageSize: limit });
    return response.products.map((product) => {
      const mapped = map3DCarPartsToCandidate(product);
      const candidate: SearchCandidate = {
        id: `3dcarparts:${mapped.sourceId}`,
        source: '3dcarparts',
        reference: mapped.sourceId,
        name: mapped.name,
        manufacturer: mapped.vehicle.make,
        imageUrl: undefined,
        cadAvailable: mapped.cadAvailable,
        datasheetAvailable: false,
        scores: { global: 0.45 },
        metadata: {
          printableModelUrl: mapped.printableModelUrl,
          printMaterial: mapped.printMaterial,
          license: mapped.license,
          attribution: mapped.attribution,
          downloads: mapped.downloads,
          safetyWarning: mapped.safetyWarning,
          vehicle: mapped.vehicle,
        },
      };
      return candidate;
    });
  },
};
