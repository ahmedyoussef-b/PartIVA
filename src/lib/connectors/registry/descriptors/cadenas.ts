import type { ConnectorDescriptor } from '../types';
import type { SearchCandidate } from '@/schemas/search';
import {
  searchIndustrialCatalog,
  mapIndustrialCatalogToCandidate,
  type IndustrialCatalogItem,
} from '@/lib/data/industrial-catalog';

export const cadenasDescriptor: ConnectorDescriptor = {
  id: 'industrial_catalog',
  label: 'CADENAS PARTsolutions',
  description: 'Catalogue normalisé fournisseurs industriels',
  mode: 'real',
  weight: 0.55,
  timeoutMs: 10_000,

  api: {
    baseUrl: 'local://industrial-catalog',
    searchPath: '/search',
    auth: 'none',
  },

  mapper: (item: unknown): SearchCandidate | null => {
    if (typeof item !== 'object' || item === null) return null;
    const it = item as IndustrialCatalogItem;
    if (!it.name) return null;

    const mapped = mapIndustrialCatalogToCandidate(it);

    return {
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
  },

  extractItems: (raw: unknown): unknown[] => {
    if (typeof raw === 'object' && raw !== null && 'items' in raw) {
      return (raw as { items: unknown[] }).items;
    }
    return [];
  },

  customSearch: async (query: string, options?: { limit?: number }) => {
    const response = await searchIndustrialCatalog(query, { limit: options?.limit });
    return response.items
      .map((item) => {
        const it = item as IndustrialCatalogItem;
        if (!it.name) return null;
        const mapped = mapIndustrialCatalogToCandidate(it);
        return {
          id: `industrial_catalog:${mapped.sourceId}`,
          source: 'industrial_catalog' as const,
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
        } as SearchCandidate;
      })
      .filter((c): c is SearchCandidate => c !== null);
  },
};
