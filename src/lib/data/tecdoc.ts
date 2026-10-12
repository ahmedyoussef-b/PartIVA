import { z } from 'zod';

/**
 * Schéma Zod — réponse TecDoc (TecDoc / TecAlliance API).
 *
 * TecDoc est un référentiel européen de pièces automobiles
 * (TecAlliance). API payante — contrat commercial requis
 * (D-tecdoc-credentials). Auth : clé API + provider ID.
 *
 * Format de réponse (reconnaissance R.5.1 — doc TecDoc
 * partiellement publique) : objet `articles` contenant
 * la liste des pièces, avec `articleId`, `articleName`,
 * `brandName`, `articleNumber` (référence constructeur),
 * `genericArticleName` (catégorie générique).
 *
 * Mode mock : les fixtures respectent ce schéma.
 * Mode réel : conditionné au provisioning du contrat
 * commercial TecDoc (clé API + provider ID).
 */
export const TecDocProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  category: z.string().optional(),
  cadAvailable: z.boolean().default(false),
  cadFormats: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
  productUrl: z.string().url().optional(),
});

export type TecDocProduct = z.infer<typeof TecDocProductSchema>;

export const TecDocSearchResponseSchema = z.object({
  products: z.array(TecDocProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
});

export type TecDocSearchResponse = z.infer<typeof TecDocSearchResponseSchema>;

// --- Configuration ---

/**
 * Base URL TecDoc (TecAlliance). L'endpoint exact dépend
 * du contrat commercial (TecDoc / TecAlliance propose
 * plusieurs APIs : Search, Vehicle, VIN). Mode réel
 * conditionné au provisioning.
 */
const TECDOC_BASE_URL = 'https://api.tecdoc.net';
const TECDOC_TIMEOUT_MS = 10_000;
const TECDOC_MAX_RETRIES = 2;

/**
 * Détecte si le mode réel est activé (contrat commercial provisionné).
 * Sécurité #7 : jamais NEXT_PUBLIC_.
 * D-tecdoc-credentials : les DEUX variables sont requises.
 */
export function isTecDocConfigured(): boolean {
  return Boolean(process.env.TECDOC_API_KEY && process.env.TECDOC_PROVIDER_ID);
}

/**
 * Fixtures mock — utilisées quand le contrat commercial est absent.
 * Conformes au schéma TecDocProductSchema.
 *
 * Pièces automobiles réalistes (référentiel TecDoc) :
 * plaquettes de frein, filtre à huile, amortisseur.
 */
const MOCK_PRODUCTS: TecDocProduct[] = [
  {
    id: 'TD-001',
    name: 'Plaquettes de frein avant',
    description: 'Plaquettes de frein à disque, céramique, set complet',
    manufacturer: 'Bosch',
    partNumber: '0 986 494 028',
    category: 'Freinage',
    cadAvailable: false,
    cadFormats: [],
    thumbnailUrl: 'https://example.com/td-001.png',
    productUrl: 'https://example.com/td/001',
  },
  {
    id: 'TD-002',
    name: 'Filtre à huile',
    description: 'Filtre à huile à cartouche, M10x1.5',
    manufacturer: 'MANN-FILTER',
    partNumber: 'HU 712/6x',
    category: 'Filtration',
    cadAvailable: false,
    cadFormats: [],
    thumbnailUrl: 'https://example.com/td-002.png',
    productUrl: 'https://example.com/td/002',
  },
  {
    id: 'TD-003',
    name: 'Amortisseur arrière',
    description: 'Amortisseur télescopique, gaz, réversible',
    manufacturer: 'SACHS',
    partNumber: '313 260',
    category: 'Suspension',
    cadAvailable: true,
    cadFormats: ['STEP'],
    thumbnailUrl: 'https://example.com/td-003.png',
    productUrl: 'https://example.com/td/003',
  },
];

/**
 * Recherche TecDoc — mode mock par défaut.
 *
 * @param query - Terme de recherche
 * @param options - Pagination
 * @returns Réponse validée par TecDocSearchResponseSchema
 *
 * @throws Error si la réponse réelle ne respecte pas le schéma
 */
export async function searchTecDoc(
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<TecDocSearchResponse> {
  const { page = 1, pageSize = 20 } = options;

  if (!isTecDocConfigured()) {
    const filtered = MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.partNumber ?? '').toLowerCase().includes(query.toLowerCase()),
    );
    return {
      products: filtered,
      total: filtered.length,
      page,
      pageSize,
    };
  }

  // Mode réel — contrat commercial TecDoc (TecAlliance).
  // Endpoint exact à confirmer au provisioning (clé API + provider ID).
  // Hypothèse : GET /search?q=... avec Bearer API key + provider ID header.
  const url = new URL(`${TECDOC_BASE_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));

  let lastError: unknown;
  for (let attempt = 0; attempt <= TECDOC_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TECDOC_TIMEOUT_MS);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.TECDOC_API_KEY}`,
          'X-Provider-Id': process.env.TECDOC_PROVIDER_ID ?? '',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`TecDoc HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return TecDocSearchResponseSchema.parse(json);
    } catch (error) {
      lastError = error;
      if (attempt < TECDOC_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `TecDoc search failed after ${TECDOC_MAX_RETRIES + 1} attempts: ${String(lastError)}`,
  );
}

/**
 * Mapping TecDoc → SearchCandidate (normalisation).
 * Utilisé par le pipeline d'agrégation (E3-S05).
 */
export function mapTecDocToCandidate(product: TecDocProduct): {
  source: 'tecdoc';
  sourceId: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  category: string | null;
  cadAvailable: boolean;
  cadFormats: string[];
  thumbnailUrl: string | null;
  productUrl: string | null;
} {
  return {
    source: 'tecdoc',
    sourceId: product.id,
    name: product.name,
    description: product.description ?? null,
    manufacturer: product.manufacturer ?? null,
    partNumber: product.partNumber ?? null,
    category: product.category ?? null,
    cadAvailable: product.cadAvailable,
    cadFormats: product.cadFormats,
    thumbnailUrl: product.thumbnailUrl ?? null,
    productUrl: product.productUrl ?? null,
  };
}
