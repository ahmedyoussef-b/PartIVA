import { z } from 'zod';
import { mergeAbortSignals } from './external-signal';
import {
  MOCK_PRODUCTS,
  MOCK_VEHICLES,
  MOCK_FITMENTS,
  TecDocVehicleSchema,
  type TecDocVehicle,
  type TecDocFitment,
} from './tecdoc-fixtures';

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
  autoCategory: z.string().optional(),
  material: z.string().optional(),
  cadAvailable: z.boolean().default(false),
  cadFormats: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
  productUrl: z.string().url().optional(),
  // E14-R1 — enrichissement mock (3D / sécurité, optionnels).
  safetyWarning: z.string().optional(),
  printableModelUrl: z.string().url().optional(),
  printMaterial: z.string().optional(),
});

export type TecDocProduct = z.infer<typeof TecDocProductSchema>;

export const TecDocSearchResponseSchema = z.object({
  products: z.array(TecDocProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
});

export type TecDocSearchResponse = z.infer<typeof TecDocSearchResponseSchema>;

/**
 * Schéma Zod — réponse enrichie TecDoc (E6-S08).
 *
 * Inclut les véhicules (KType+, VIN) et les fitments
 * (pièce ↔ véhicule) pour la recherche par véhicule
 * (VIN2OE, innovation #1 E6-S08).
 */
export const TecDocVehicleSearchResponseSchema = z.object({
  products: z.array(TecDocProductSchema),
  vehicles: z.array(TecDocVehicleSchema),
  fitments: z.array(
    z.object({
      productId: z.string().min(1),
      vehicleId: z.string().min(1),
      notes: z.string().optional(),
    }),
  ),
  total: z.number().int().nonnegative(),
  vehicle: TecDocVehicleSchema.nullable().optional(),
});

export type TecDocVehicleSearchResponse = z.infer<typeof TecDocVehicleSearchResponseSchema>;

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
 * Valeurs de template non provisionnées (E25-R1).
 *
 * Le `.env` de développement contient `TECDOC_PROVIDER_ID=ton_provider_id` :
 * `isTecDocConfigured()` les considérait comme un contrat commercial actif et
 * déclenchait 3 appels réels à `api.tecdoc.net` (~31 s au total : 10 s de
 * timeout × 3 tentatives + backoff) qui échouaient tous, alors que le mode
 * mock fournit des produits exploitables et instantanés.
 */
const TECDOC_UNPROVISIONED_VALUES = new Set([
  '',
  'ton_provider_id',
  'your_provider_id',
  'changeme',
  'todo',
]);

/**
 * Détecte si le mode réel est activé (contrat commercial provisionné).
 * Sécurité #7 : jamais NEXT_PUBLIC_.
 * D-tecdoc-credentials : les DEUX variables sont requises.
 * E25-R1 : les valeurs de template ne comptent pas comme provisionnées.
 */
export function isTecDocConfigured(): boolean {
  const apiKey = process.env.TECDOC_API_KEY;
  const providerId = process.env.TECDOC_PROVIDER_ID;

  if (!apiKey || !providerId) return false;
  if (TECDOC_UNPROVISIONED_VALUES.has(apiKey.trim())) return false;
  if (TECDOC_UNPROVISIONED_VALUES.has(providerId.trim())) return false;

  return true;
}

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
  options: { page?: number; pageSize?: number; signal?: AbortSignal } = {},
): Promise<TecDocSearchResponse> {
  const { page = 1, pageSize = 20, signal } = options;

  if (!isTecDocConfigured()) {
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
      // E25-R1 — le signal de l'agrégateur (timeout global + timeout de source)
      // est fusionné avec le timeout interne : la requête HTTP est réellement
      // annulée au lieu de tourner en fond pendant les retries.
      const requestSignal = mergeAbortSignals(controller.signal, signal);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.TECDOC_API_KEY}`,
          'X-Provider-Id': process.env.TECDOC_PROVIDER_ID ?? '',
          Accept: 'application/json',
        },
        signal: requestSignal,
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
 * Recherche par VIN (VIN2OE — innovation #1 E6-S08).
 *
 * Décodage VIN (mock) → véhicule (make, model, year, engine, ktype)
 * → fitments → pièces compatibles.
 *
 * Mode mock : recherche exacte sur le VIN des fixtures.
 * Mode réel : endpoint TecDoc VIN decode (à confirmer au provisioning).
 *
 * @param vin - Numéro VIN (17 caractères)
 * @param options - Limite
 * @returns Réponse enrichie (produits + véhicule + fitments)
 */
export async function searchByVIN(
  vin: string,
  options: { limit?: number } = {},
): Promise<TecDocVehicleSearchResponse> {
  const { limit = 20 } = options;

  if (!isTecDocConfigured()) {
    const normalizedVin = vin.trim().toUpperCase();
    const vehicle =
      MOCK_VEHICLES.find((v) => (v.vin ?? '').toUpperCase() === normalizedVin) ?? null;

    if (!vehicle) {
      return {
        products: [],
        vehicles: [],
        fitments: [],
        total: 0,
        vehicle: null,
      };
    }

    const vehicleFitments = MOCK_FITMENTS.filter((f) => f.vehicleId === vehicle.id);
    const productIds = new Set(vehicleFitments.map((f) => f.productId));
    const products = MOCK_PRODUCTS.filter((p) => productIds.has(p.id)).slice(0, limit);

    return {
      products,
      vehicles: [vehicle],
      fitments: vehicleFitments,
      total: products.length,
      vehicle,
    };
  }

  // Mode réel — endpoint TecDoc VIN decode (hypothèse, à confirmer).
  const url = new URL(`${TECDOC_BASE_URL}/vin/decode`);
  url.searchParams.set('vin', vin);
  url.searchParams.set('limit', String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TECDOC_TIMEOUT_MS);
  try {
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
      throw new Error(`TecDoc VIN HTTP ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    return TecDocVehicleSearchResponseSchema.parse(json);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Recherche par véhicule (make, model, year, engine).
 *
 * Résolution Vehicle (make/model/year/engine) → Fitment → Part.
 * Filtrage optionnel sur autoCategory / material (focus plastique).
 *
 * @param params - Critères véhicule
 * @param options - Limite, filtres
 * @returns Réponse enrichie (produits + véhicules + fitments)
 */
export async function searchByVehicle(
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
): Promise<TecDocVehicleSearchResponse> {
  const { limit = 20, autoCategory, material } = options;

  if (!isTecDocConfigured()) {
    const make = params.make.toLowerCase();
    const model = params.model.toLowerCase();
    const vehicles = MOCK_VEHICLES.filter(
      (v) =>
        v.make.toLowerCase() === make &&
        v.model.toLowerCase() === model &&
        v.year === params.year &&
        (params.engine === undefined ||
          (v.engine ?? '').toLowerCase() === params.engine.toLowerCase()),
    );

    if (vehicles.length === 0) {
      return {
        products: [],
        vehicles: [],
        fitments: [],
        total: 0,
        vehicle: null,
      };
    }

    const vehicleIds = new Set(vehicles.map((v) => v.id));
    const fitments = MOCK_FITMENTS.filter((f) => vehicleIds.has(f.vehicleId));
    const productIds = new Set(fitments.map((f) => f.productId));

    let products = MOCK_PRODUCTS.filter((p) => productIds.has(p.id));
    if (autoCategory) {
      products = products.filter(
        (p) => (p.autoCategory ?? '').toLowerCase() === autoCategory.toLowerCase(),
      );
    }
    if (material) {
      products = products.filter(
        (p) => (p.material ?? '').toLowerCase() === material.toLowerCase(),
      );
    }

    return {
      products: products.slice(0, limit),
      vehicles,
      fitments,
      total: products.length,
      vehicle: vehicles[0] ?? null,
    };
  }

  // Mode réel — endpoint TecDoc Vehicle search (hypothèse, à confirmer).
  const url = new URL(`${TECDOC_BASE_URL}/vehicle/search`);
  url.searchParams.set('make', params.make);
  url.searchParams.set('model', params.model);
  url.searchParams.set('year', String(params.year));
  if (params.engine) url.searchParams.set('engine', params.engine);
  url.searchParams.set('limit', String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TECDOC_TIMEOUT_MS);
  try {
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
      throw new Error(`TecDoc vehicle HTTP ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    return TecDocVehicleSearchResponseSchema.parse(json);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Recherche par photo + véhicule (innovation #4 E6-S08).
 *
 * Combine l'identification photo (embedding pgvector, E2-S05)
 * avec le fitment véhicule (E6-S07) : la photo identifie
 * la pièce, le véhicule confirme la compatibilité.
 *
 * Mode mock : la photo est ignorée (pas de modèle d'embedding
 * dans le mock) — le fitment véhicule est le filtre principal.
 * Mode réel : embedding photo + fitment (à implémenter E6-S09).
 *
 * @param photo - Photo base64 (JPEG/PNG, ignorée en mock)
 * @param vehicle - Critères véhicule
 * @param options - Limite
 * @returns Réponse enrichie (produits + véhicules + fitments)
 */
export async function searchByPhotoAndVehicle(
  photo: string,
  vehicle: {
    make: string;
    model: string;
    year: number;
    engine?: string;
  },
  options: { limit?: number } = {},
): Promise<TecDocVehicleSearchResponse> {
  // Mode mock : la photo n'est pas analysée (pas d'embedding mock).
  // Le fitment véhicule est le filtre principal (innovation #4).
  // En mode réel (E6-S09), la photo sera convertie en embedding
  // pgvector et comparée aux embeddings des pièces (E2-S05).
  void photo;
  return searchByVehicle(vehicle, options);
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
  autoCategory: string | null;
  material: string | null;
  cadAvailable: boolean;
  cadFormats: string[];
  thumbnailUrl: string | null;
  productUrl: string | null;
  safetyWarning: string | null;
  printableModelUrl: string | null;
  printMaterial: string | null;
} {
  return {
    source: 'tecdoc',
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
    safetyWarning: product.safetyWarning ?? null,
    printableModelUrl: product.printableModelUrl ?? null,
    printMaterial: product.printMaterial ?? null,
  };
}

/**
 * Mapping véhicule TecDoc (normalisation).
 * Utilisé par les routes API vehicle/vin (E6-S08).
 */
export function mapTecDocToVehicle(vehicle: TecDocVehicle): {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string | null;
  ktype: string | null;
  vin: string | null;
} {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    engine: vehicle.engine ?? null,
    ktype: vehicle.ktype ?? null,
    vin: vehicle.vin ?? null,
  };
}

/**
 * Mapping fitment TecDoc (normalisation).
 * Utilisé par les routes API vehicle/vin (E6-S08).
 */
export function mapTecDocToFitment(fitment: TecDocFitment): {
  productId: string;
  vehicleId: string;
  notes: string | null;
} {
  return {
    productId: fitment.productId,
    vehicleId: fitment.vehicleId,
    notes: fitment.notes ?? null,
  };
}
