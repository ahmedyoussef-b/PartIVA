import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import { searchWikidata, searchWikidataPartial, mapWikidataToCandidate } from '@/lib/data/wikidata';

/**
 * Connecteur Wikidata (D-E3-26).
 *
 * Sémantique déléguée (D5) : recherche par LABEL EXACT
 * (Wikidata n'indexe pas les regex/prefixes sur labels —
 * full scan → 504) OU recherche PARTIELLE via
 * wbsearchentities (D-E3-33) si la query est courte
 * ou contient un espace. L'agrégateur ne connaît pas
 * cette contrainte ; le connecteur l'encapsule.
 *
 * Adapte le mapping Wikidata vers SearchCandidate :
 * id = `wikidata:<sourceId>`, reference = URL item,
 * scores.global = weight (0.8) — D-E3-23.
 */
export const wikidataConnector: SourceConnector = {
  source: 'wikidata',
  weight: SOURCE_WEIGHTS.wikidata.weight,
  timeoutMs: SOURCE_WEIGHTS.wikidata.timeoutMs, // SPARQL peut être lent (D-E3-31)

  isAvailable(): boolean {
    return true;
  },

  async search(query, options = {}) {
    const { limit = 10 } = options;
    // Mode partiel si query courte (< 8 chars) ou contient un espace (D-E3-33)
    const usePartial = query.length < 8 || query.includes(' ');
    const result = usePartial
      ? await searchWikidataPartial(query, { limit })
      : await searchWikidata(query, { limit });
    return result.results.bindings.map((binding) => {
      const mapped = mapWikidataToCandidate(binding);
      const candidate: SearchCandidate = {
        id: `wikidata:${mapped.sourceId}`,
        source: 'wikidata',
        reference: mapped.url,
        name: mapped.name,
        imageUrl: undefined,
        cadAvailable: false,
        datasheetAvailable: false,
        scores: { global: 0.8 },
        metadata: {
          wikidataId: mapped.sourceId,
          url: mapped.url,
          description: mapped.description,
        },
      };
      return candidate;
    });
  },
};
