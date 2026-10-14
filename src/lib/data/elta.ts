import { z } from 'zod';

/**
 * Schéma Zod — réponse ELTA e-Catalogue (ELTA Automotive).
 *
 * ELTA (elta-automotive.com) propose un e-Catalogue de pièces
 * automobiles gratuit (inscription gratuite, API de recherche
 * par marque / modèle / véhicule). Alternative gratuite à
 * TecDoc (D-tecdoc-credentials).
 *
 * Format de réponse (hypothèse basée sur la documentation
 * publique ELTA — à confirmer au provisioning de l'accès
 * gratuit). Mode mock : les fixtures respectent ce schéma.
 * Mode réel : conditionné à l'inscription ELTA gratuite
 * (clé API à documenter).
 */
export const EltaProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  category: z.string().optional(),
  autoCategory: z.string().optional(),
  material: z.string().optional(),
  cadAvailable: z.boolean().default(false),
  cadFormats: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
  productUrl: z.string().url().optional(),
});

export type EltaProduct = z.infer<typeof EltaProductSchema>;

export const EltaSearchResponseSchema = z.object({
  products: z.array(EltaProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
});

export type EltaSearchResponse = z.infer<typeof EltaSearchResponseSchema>;

// --- Configuration ---

/**
 * Base URL ELTA e-Catalogue. L'endpoint exact dépend de
 * l'accès gratuit ELTA (inscription sur elta-automotive.com).
 * Mode réel conditionné au provisioning de la clé API.
 */
const ELTA_BASE_URL = 'https://api.elta-automotive.com';
const ELTA_TIMEOUT_MS = 10_000;
const ELTA_MAX_RETRIES = 2;

/**
 * Détecte si le mode réel est activé (accès ELTA provisionné).
 * Sécurité #7 : jamais NEXT_PUBLIC_.
 * D-tecdoc-credentials (alternative ELTA) : clé API requise.
 */
export function isEltaConfigured(): boolean {
  return Boolean(process.env.ELTA_API_KEY);
}

/**
 * Fixtures mock — utilisées quand l'accès ELTA est absent.
 * Conformes au schéma EltaProductSchema.
 *
 * Note R.5.16 : ELTA e-Catalogue est un catalogue réel
 * (inscription gratuite). Le mock est un connecteur initial
 * documentaire — les endpoints réels seront implémentés
 * après inscription et capture de réponse réelle.
 */
const MOCK_PRODUCTS: EltaProduct[] = [
  {
    id: 'ELTA-001',
    name: 'Plaquettes de frein avant',
    description: 'Plaquettes de frein avant, céramique, jeu complet',
    manufacturer: 'ELTA',
    partNumber: 'ELTA-BP-FRONT-001',
    category: 'Freinage',
    autoCategory: 'brakes',
    material: 'Céramique',
    cadAvailable: false,
    cadFormats: [],
    thumbnailUrl: 'https://example.com/elta-001.png',
    productUrl: 'https://example.com/elta/001',
  },
  {
    id: 'ELTA-002',
    name: 'Filtre à huile',
    description: 'Filtre à huile spin-on, moteur essence',
    manufacturer: 'ELTA',
    partNumber: 'ELTA-OF-002',
    category: 'Filtration',
    autoCategory: 'filters',
    material: 'Métal/papier',
    cadAvailable: false,
    cadFormats: [],
    thumbnailUrl: 'https://example.com/elta-002.png',
    productUrl: 'https://example.com/elta/002',
  },
  {
    id: 'ELTA-003',
    name: 'Amortisseur arrière',
    description: 'Amortisseur arrière gaz, montage direct',
    manufacturer: 'ELTA',
    partNumber: 'ELTA-SH-REAR-003',
    category: 'Suspension',
    autoCategory: 'suspension',
    material: 'Acier/huile',
    cadAvailable: false,
    cadFormats: [],
    thumbnailUrl: 'https://example.com/elta-003.png',
    productUrl: 'https://example.com/elta/003',
  },
];

/**
 * Recherche ELTA — mode mock par défaut.
 *
 * @param query - Terme de recherche
 * @param options - Pagination
 * @returns Réponse validée par EltaSearchResponseSchema
 *
 * @throws Error si la réponse réelle ne respecte pas le schéma
 */
export async function searchElta(
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<EltaSearchResponse> {
  const { page = 1, pageSize = 20 } = options;

  if (!isEltaConfigured()) {
    const q = query.toLowerCase();
    const filtered = MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.partNumber ?? '').toLowerCase().includes(q) ||
        (p.manufacturer ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.autoCategory ?? '').toLowerCase().includes(q) ||
        (p.material ?? '').toLowerCase().includes(q),
    );
    return {
      products: filtered.slice(0, pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  // Mode réel — ELTA e-Catalogue (accès gratuit à documenter).
  // Endpoint exact à confirmer au provisioning (clé API ELTA).
  const url = new URL(`${ELTA_BASE_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));

  let lastError: unknown;
  for (let attempt = 0; attempt <= ELTA_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ELTA_TIMEOUT_MS);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.ELTA_API_KEY}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`ELTA HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return EltaSearchResponseSchema.parse(json);
    } catch (error) {
      lastError = error;
      if (attempt < ELTA_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `ELTA search failed after ${ELTA_MAX_RETRIES + 1} attempts: ${String(lastError)}`,
  );
}

/**
 * Mapping ELTA → SearchCandidate (normalisation).
 * Cohérent avec mapTecDocToCandidate / mapTracePartsToCandidate.
 */
export function mapEltaToCandidate(product: EltaProduct): {
  source: 'elta';
  sourceId: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  category: string | null;
  autoCategory: string | null;
  material: string | null;
  cadAvailable: boolean;
  cadFormats: string[];
  thumbnailUrl: string | null;
  productUrl: string | null;
} {
  return {
    source: 'elta',
    sourceId: product.id,
    name: product.name,
    description: product.description ?? null,
    manufacturer: product.manufacturer ?? null,
    partNumber: product.partNumber ?? null,
    category: product.category ?? null,
    autoCategory: product.autoCategory ?? null,
    material: product.material ?? null,
    cadAvailable: product.cadAvailable,
    cadFormats: product.cadFormats,
    thumbnailUrl: product.thumbnailUrl ?? null,
    productUrl: product.productUrl ?? null,
  };
}
