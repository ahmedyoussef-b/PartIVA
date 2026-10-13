import { SourceConnector } from './types';
import type { SearchCandidate } from '@/schemas/search';
import { SOURCE_WEIGHTS } from '@/lib/scoring/weights';
import {
  searchIndustrialCatalog,
  mapIndustrialCatalogToCandidate,
} from '@/lib/data/industrial-catalog';

/**
 * Connecteur catalogue industriel (E6-S05).
 *
 * Source : dataset Hugging Face `swan07/industrial-parts-data` — catalogue
 * industriel réel (32 fabricants : Grainger, Igus, Parker, SMC, Danfoss,
 * Adafruit, Digikey, Fastenal, Pololu...) + fichiers CAD STEP + normes
 * ISO/ASME/ASTM. Nature vérifiée Bloc 0 (R.5.16) — réponse réelle capturée.
 *
 * Sémantique déléguée (D5) : recherche full-text (filtre `includes` sur
 * name/description/brand/source). L'agrégateur ne connaît pas cette
 * contrainte ; le connecteur l'encapsule.
 *
 * Données embarquées (extrait représentatif conforme au schéma réel capturé) —
 * les fichiers `.jsonl` HF sont trop gros pour un fetch runtime (> 40s).
 * Endpoint HF documenté pour usage futur (batch/import).
 *
 * Adapte le mapping catalogue industriel vers SearchCandidate :
 * id = `industrial_catalog:<sourceId>`, reference = partNumber,
 * scores.global = weight (0.55) — D-E3-23.
 */
export const industrialCatalogConnector: SourceConnector = {
  source: 'industrial_catalog',
  weight: SOURCE_WEIGHTS.industrial_catalog.weight,
  timeoutMs: SOURCE_WEIGHTS.industrial_catalog.timeoutMs,

  isAvailable(): boolean {
    return true;
  },

  async search(query, options = {}) {
    const { limit = 20 } = options;
    const response = await searchIndustrialCatalog(query, { limit });
    return response.items.map((item) => {
      const mapped = mapIndustrialCatalogToCandidate(item);
      const candidate: SearchCandidate = {
        id: `industrial_catalog:${mapped.sourceId}`,
        source: 'industrial_catalog',
        reference: mapped.partNumber ?? mapped.sourceId,
        name: mapped.name,
        manufacturer: mapped.manufacturer ?? undefined,
        imageUrl: mapped.imageUrl ?? undefined,
        cadAvailable: false,
        datasheetAvailable: mapped.datasheetAvailable,
        scores: { global: 0.55 },
        metadata: {
          catalogSource: mapped.sourceId.split(':')[0],
          partNumber: mapped.partNumber,
          category: mapped.category,
          productUrl: mapped.productUrl,
          description: mapped.description,
          dataset: 'swan07/industrial-parts-data',
        },
      };
      return candidate;
    });
  },
};
