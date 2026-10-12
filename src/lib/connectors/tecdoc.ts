import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import { searchTecDoc, mapTecDocToCandidate } from '@/lib/data/tecdoc';

/**
 * Connecteur TecDoc (E5-S05).
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
          cadFormats: mapped.cadFormats,
          productUrl: mapped.productUrl,
          description: mapped.description,
        },
      };
      return candidate;
    });
  },
};
