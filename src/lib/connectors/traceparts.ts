import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { searchTraceParts, mapTracePartsToCandidate } from '@/lib/data/traceparts';

/**
 * Connecteur TraceParts (D-E3-26).
 *
 * Sémantique déléguée (D5) : recherche full-text
 * (filtre `includes` en mode mock, API REST v3 en mode réel).
 *
 * Mode mock actif (D-traceparts-credentials) :
 * isAvailable() retourne true — le mode mock est
 * fonctionnel et retourne des produits valides.
 *
 * Adapte le mapping TraceParts vers SearchCandidate :
 * id = `traceparts:<sourceId>`, reference = partNumber,
 * scores.global = weight (0.6) — D-E3-23.
 */
export const tracePartsConnector: SourceConnector = {
  source: 'traceparts',
  weight: 0.6,
  timeoutMs: 3_000, // mock rapide, réel à ajuster (D-E3-31)

  isAvailable(): boolean {
    return true;
  },

  async search(query, options = {}) {
    const { limit = 20 } = options;
    const response = await searchTraceParts(query, {
      pageSize: limit,
    });
    return response.products.map((product) => {
      const mapped = mapTracePartsToCandidate(product);
      const candidate: SearchCandidate = {
        id: `traceparts:${mapped.sourceId}`,
        source: 'traceparts',
        reference: mapped.partNumber ?? mapped.sourceId,
        name: mapped.name,
        manufacturer: mapped.manufacturer ?? undefined,
        imageUrl: mapped.thumbnailUrl ?? undefined,
        cadAvailable: mapped.cadAvailable,
        datasheetAvailable: false,
        scores: { global: 0.6 },
        metadata: {
          tracepartsId: mapped.sourceId,
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
