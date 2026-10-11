import { z } from 'zod';

/**
 * Schéma Zod — réponse TraceParts REST v3
 * API : api-gateway.traceparts.com/v3/Product/*
 * Doc : OpenAPI 3.0.1 (Bearer JWT via RequestToken)
 *
 * Mode mock : les fixtures respectent ce schéma.
 * Mode réel : conditionné au provisioning
 * TRACEPARTS_TENANT_UID + TRACEPARTS_API_KEY.
 */
export const TracePartsProductSchema = z.object({
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

export type TracePartsProduct = z.infer<typeof TracePartsProductSchema>;

export const TracePartsSearchResponseSchema = z.object({
  products: z.array(TracePartsProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
});

export type TracePartsSearchResponse = z.infer<typeof TracePartsSearchResponseSchema>;

// --- Configuration ---

const TRACEPARTS_BASE_URL = 'https://api-gateway.traceparts.com/v3';
const TRACEPARTS_TIMEOUT_MS = 10_000;
const TRACEPARTS_MAX_RETRIES = 2;

/**
 * Détecte si le mode réel est activé (credentials provisionnés).
 * Sécurité #7 : jamais NEXT_PUBLIC_.
 * D-E3-11 : les DEUX variables sont requises.
 */
export function isTracePartsConfigured(): boolean {
  return Boolean(process.env.TRACEPARTS_TENANT_UID && process.env.TRACEPARTS_API_KEY);
}

/**
 * Fixtures mock — utilisées quand les credentials sont absents.
 * Conformes au schéma TracePartsProductSchema.
 */
const MOCK_PRODUCTS: TracePartsProduct[] = [
  {
    id: 'TP-001',
    name: 'Vis à tête hexagonale M8x30',
    description: 'Vis ISO 4017, acier 8.8, zinguée',
    manufacturer: 'TraceParts',
    partNumber: 'ISO4017-M8x30-8.8',
    category: 'Fixation',
    cadAvailable: true,
    cadFormats: ['STEP', 'IGES', 'DXF'],
    thumbnailUrl: 'https://example.com/tp-001.png',
    productUrl: 'https://example.com/tp/001',
  },
  {
    id: 'TP-002',
    name: 'Roulement à billes 6205-2RS',
    description: 'Roulement rigide à billes, étanche',
    manufacturer: 'SKF',
    partNumber: '6205-2RS',
    category: 'Roulement',
    cadAvailable: true,
    cadFormats: ['STEP', 'IGES'],
    thumbnailUrl: 'https://example.com/tp-002.png',
    productUrl: 'https://example.com/tp/002',
  },
];

/**
 * Cache du token JWT en mémoire (D-E3-11).
 * Valide 24h — rafraîchi automatiquement.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_SAFETY_MARGIN_MS = 5 * 60 * 1000;

/**
 * Obtient un Bearer JWT via l'endpoint RequestToken (D-E3-11).
 * Le token est généré à la volée (valide 24h), jamais persisté.
 *
 * Note : le endpoint exact `RequestToken` est une hypothèse basée
 * sur la doc OpenAPI — à confirmer au provisioning des credentials.
 */
async function getTracePartsToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_SAFETY_MARGIN_MS > Date.now()) {
    return cachedToken.value;
  }

  const response = await fetch(`${TRACEPARTS_BASE_URL}/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantUid: process.env.TRACEPARTS_TENANT_UID,
      apiKey: process.env.TRACEPARTS_API_KEY,
    }),
  });

  if (!response.ok) {
    throw new Error(`TraceParts RequestToken HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as { token: string };
  cachedToken = {
    value: json.token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return json.token;
}

/**
 * Recherche TraceParts — mode mock par défaut.
 *
 * @param query - Terme de recherche
 * @param options - Pagination
 * @returns Réponse validée par TracePartsSearchResponseSchema
 *
 * @throws Error si la réponse réelle ne respecte pas le schéma
 */
export async function searchTraceParts(
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<TracePartsSearchResponse> {
  const { page = 1, pageSize = 20 } = options;

  if (!isTracePartsConfigured()) {
    const filtered = MOCK_PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()),
    );
    return {
      products: filtered,
      total: filtered.length,
      page,
      pageSize,
    };
  }

  // Mode réel — RequestToken → Bearer JWT → Product/Search
  const token = await getTracePartsToken();
  const url = new URL(`${TRACEPARTS_BASE_URL}/Product/Search`);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));

  let lastError: unknown;
  for (let attempt = 0; attempt <= TRACEPARTS_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TRACEPARTS_TIMEOUT_MS);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`TraceParts HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return TracePartsSearchResponseSchema.parse(json);
    } catch (error) {
      lastError = error;
      if (attempt < TRACEPARTS_MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `TraceParts search failed after ${TRACEPARTS_MAX_RETRIES + 1} attempts: ${String(lastError)}`,
  );
}

/**
 * Mapping TraceParts → SearchCandidate (normalisation).
 * Utilisé par le pipeline d'agrégation (E3-S05).
 */
export function mapTracePartsToCandidate(product: TracePartsProduct): {
  source: 'traceparts';
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
    source: 'traceparts',
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
