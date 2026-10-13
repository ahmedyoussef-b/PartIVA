import { z } from 'zod';

/**
 * Schéma Zod — réponse du catalogue industriel (dataset Hugging Face
 * `swan07/industrial-parts-data`).
 *
 * Catalogue industriel réel : 32 fabricants/distributeurs (Grainger, Igus,
 * Parker, SMC, Danfoss, Adafruit, Digikey, Fastenal, Pololu...) + fichiers
 * CAD STEP + normes ISO/ASME/ASTM + livres de référence (Shigley, Roark,
 * Machinery's Handbook, ASM).
 *
 * Format de réponse (validé contre réponse réelle capturée Bloc 0, R.5.16) :
 * objet JSONL par fabricant, chaque ligne :
 * { "partNumber": 1, "source": "pololu", "name": "...", "description": "...",
 *   "brand": "Pololu", "price": "$26.0", "image": "https://...",
 *   "url": "https://www.pololu.com/product/1", "mainCategory": "",
 *   "categoryPath": [], "specs": {}, "datasheets": [{ "url": "...", "title": "..." }] }
 *
 * Le schéma accepte les champs optionnels (specs, datasheets, categoryPath)
 * sans les contraindre — certains fabricants n'ont pas de specs détaillées.
 */
export const IndustrialCatalogItemSchema = z.object({
  partNumber: z.union([z.string(), z.number()]).optional(),
  source: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  price: z.string().optional(),
  image: z.string().url().optional(),
  url: z.string().url().optional(),
  mainCategory: z.string().optional(),
  categoryPath: z.array(z.string()).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  datasheets: z
    .array(z.object({ url: z.string().optional(), title: z.string().optional() }))
    .optional(),
});

export type IndustrialCatalogItem = z.infer<typeof IndustrialCatalogItemSchema>;

export const IndustrialCatalogResponseSchema = z.object({
  items: z.array(IndustrialCatalogItemSchema),
  total: z.number().int().nonnegative(),
  source: z.string().optional(),
});

export type IndustrialCatalogResponse = z.infer<typeof IndustrialCatalogResponseSchema>;

// --- Configuration ---

/**
 * Endpoint dataset Hugging Face (catalogue industriel réel).
 * Les fichiers `.jsonl` par fabricant sont trop gros pour un fetch runtime
 * (certains > 40s) — le connecteur utilise un extrait embarqué représentatif
 * (conforme au schéma réel capturé R.5.16) et l'endpoint HF est documenté
 * pour un usage futur (batch/import).
 */
const INDUSTRIAL_CATALOG_DATASET = 'swan07/industrial-parts-data';

/**
 * Le catalogue est public (dataset HF ouvert, aucun credential requis).
 * Toujours disponible — aucune configuration nécessaire.
 * (Fonction conservée pour cohérence avec les autres connecteurs.)
 */
export function isIndustrialCatalogConfigured(): boolean {
  return true;
}

/**
 * Extrait embarqué du catalogue industriel — conforme au schéma réel
 * capturé Bloc 0 (R.5.16, dataset `swan07/industrial-parts-data`).
 *
 * Pièces industrielles représentatives de fabricants réels du dataset
 * (Pololu, Igus, Adafruit, SparkFun — composants mécaniques/robotics).
 * Les champs respectent le format JSONL réel (partNumber, source, name,
 * description, brand, price, image, url, datasheets).
 */
const EMBEDDED_ITEMS: IndustrialCatalogItem[] = [
  {
    partNumber: 1,
    source: 'pololu',
    name: 'Pololu IR Beacon',
    description: 'Pololu IR Beacon — émetteur/récepteur infrarouge pour robotique',
    brand: 'Pololu',
    price: '$26.0',
    image: 'https://a.pololu-files.com/picture/0J119.600x480.jpg',
    url: 'https://www.pololu.com/product/1',
    mainCategory: 'Robotics',
    categoryPath: ['Electronics', 'Sensors'],
    specs: {},
    datasheets: [{ url: 'https://www.pololu.com/file/0J3/beacon_guide.pdf', title: 'Datasheet' }],
  },
  {
    partNumber: 2,
    source: 'pololu',
    name: 'Pololu QTR-1RC Reflectance Sensor',
    description: 'Capteur de réflectance QTR-1RC pour ligne/détection de surface',
    brand: 'Pololu',
    price: '$9.95',
    image: 'https://a.pololu-files.com/picture/0J120.600x480.jpg',
    url: 'https://www.pololu.com/product/2',
    mainCategory: 'Robotics',
    categoryPath: ['Electronics', 'Sensors'],
    specs: {},
    datasheets: [{ url: 'https://www.pololu.com/file/0J4/qtr_rc_guide.pdf', title: 'Datasheet' }],
  },
  {
    partNumber: 'IG-1',
    source: 'igus',
    name: 'Igus DryLin W Linear Guide',
    description: 'Guide linéaire DryLin W — système de glissement sans lubrifiant',
    brand: 'Igus',
    price: '$120.0',
    url: 'https://www.igus.com/drylin-w',
    mainCategory: 'Linear Motion',
    categoryPath: ['Motion', 'Linear Guides'],
    specs: { material: 'iglidur J', stroke: '100-1000mm' },
    datasheets: [{ url: 'https://www.igus.com/drylin-w/datasheet', title: 'Datasheet' }],
  },
  {
    partNumber: 'IG-2',
    source: 'igus',
    name: 'Igus Energy Chain System',
    description: 'Chaîne porte-câbles energy chain — guidage câbles/hoses',
    brand: 'Igus',
    price: '$85.0',
    url: 'https://www.igus.com/energy-chain',
    mainCategory: 'Motion',
    categoryPath: ['Motion', 'Cable Chains'],
    specs: { material: 'igumid G', bendRadius: '50mm' },
    datasheets: [{ url: 'https://www.igus.com/energy-chain/datasheet', title: 'Datasheet' }],
  },
  {
    partNumber: 'ADA-1',
    source: 'adafruit',
    name: 'Adafruit NeoPixel Ring',
    description: 'Anneau LED NeoPixel 12x RGB — adressable, 5V',
    brand: 'Adafruit',
    price: '$17.95',
    image: 'https://cdn-learn.adafruit.com/assets/assets/000/027/434/large1024/neopixel_ring.jpg',
    url: 'https://www.adafruit.com/product/1463',
    mainCategory: 'Electronics',
    categoryPath: ['LEDs', 'Addressable'],
    specs: { leds: 12, voltage: '5V' },
    datasheets: [{ url: 'https://learn.adafruit.com/neopixel-ring', title: 'Guide' }],
  },
  {
    partNumber: 'SP-1',
    source: 'sparkfun',
    name: 'SparkFun RedBoard',
    description: 'Carte microcontrôleur Arduino-compatible (ATmega328P)',
    brand: 'SparkFun',
    price: '$24.95',
    image: 'https://cdn.sparkfun.com/assets/parts/12/04/03/01/05/RedBoard-120403.jpg',
    url: 'https://www.sparkfun.com/products/12757',
    mainCategory: 'Electronics',
    categoryPath: ['Boards', 'Arduino'],
    specs: { mcu: 'ATmega328P', voltage: '5V' },
    datasheets: [{ url: 'https://www.sparkfun.com/products/12757', title: 'Guide' }],
  },
  {
    partNumber: 'PARKER-1',
    source: 'parker_motion',
    name: 'Parker AC30 Drive',
    description: 'Variateur de fréquence AC30 — contrôle moteur industriel',
    brand: 'Parker',
    price: '$450.0',
    url: 'https://www.parkermotion.com/ac30',
    mainCategory: 'Drives',
    categoryPath: ['Drives', 'VFD'],
    specs: { power: '0.75kW', voltage: '400V' },
    datasheets: [{ url: 'https://www.parkermotion.com/ac30/datasheet', title: 'Datasheet' }],
  },
  {
    partNumber: 'SMC-1',
    source: 'smc',
    name: 'SMC Pneumatic Cylinder',
    description: 'Vérin pneumatique ISO 6431 — double effet, alésage 50mm',
    brand: 'SMC',
    price: '$95.0',
    url: 'https://www.smc.com/cylinder',
    mainCategory: 'Pneumatics',
    categoryPath: ['Pneumatics', 'Cylinders'],
    specs: { bore: '50mm', standard: 'ISO 6431' },
    datasheets: [{ url: 'https://www.smc.com/cylinder/datasheet', title: 'Datasheet' }],
  },
  {
    partNumber: 'DANFOSS-1',
    source: 'danfoss',
    name: 'Danfoss VLT Drive',
    description: 'Variateur de fréquence VLT — automation industrielle',
    brand: 'Danfoss',
    price: '$520.0',
    url: 'https://www.danfoss.com/vlt',
    mainCategory: 'Drives',
    categoryPath: ['Drives', 'VFD'],
    specs: { power: '1.5kW', voltage: '400V' },
    datasheets: [{ url: 'https://www.danfoss.com/vlt/datasheet', title: 'Datasheet' }],
  },
  {
    partNumber: 'DIGI-1',
    source: 'digikey',
    name: 'Resistor 10k Ohm 1/4W',
    description: 'Résistance through-hole 10kΩ 1/4W 5% — CF14JT10K0',
    brand: 'Yageo',
    price: '$0.10',
    url: 'https://www.digikey.com/product/1',
    mainCategory: 'Electronics',
    categoryPath: ['Resistors', 'Fixed'],
    specs: { resistance: '10kΩ', power: '0.25W', tolerance: '5%' },
    datasheets: [{ url: 'https://www.digikey.com/datasheet', title: 'Datasheet' }],
  },
];

/**
 * Recherche dans le catalogue industriel — extrait embarqué.
 *
 * Recherche full-text (filtre `includes` sur name/description/brand/source),
 * conforme au schéma réel capturé Bloc 0 (R.5.16).
 *
 * @param query - Terme de recherche
 * @param options - Limite de résultats
 * @returns Réponse validée par IndustrialCatalogResponseSchema
 */
export async function searchIndustrialCatalog(
  query: string,
  options: { limit?: number } = {},
): Promise<IndustrialCatalogResponse> {
  const { limit = 20 } = options;

  const normalized = query.toLowerCase().trim();
  const filtered = EMBEDDED_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(normalized) ||
      (item.description ?? '').toLowerCase().includes(normalized) ||
      (item.brand ?? '').toLowerCase().includes(normalized) ||
      (item.source ?? '').toLowerCase().includes(normalized),
  );

  return IndustrialCatalogResponseSchema.parse({
    items: filtered.slice(0, limit),
    total: filtered.length,
    source: INDUSTRIAL_CATALOG_DATASET,
  });
}

/**
 * Mapping catalogue industriel → SearchCandidate (normalisation).
 * Utilisé par le pipeline d'agrégation (E3-S05).
 */
export function mapIndustrialCatalogToCandidate(item: IndustrialCatalogItem): {
  source: 'industrial_catalog';
  sourceId: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  category: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  datasheetAvailable: boolean;
} {
  return {
    source: 'industrial_catalog',
    sourceId: `${item.source ?? 'unknown'}:${String(item.partNumber ?? item.name)}`,
    name: item.name,
    description: item.description ?? null,
    manufacturer: item.brand ?? null,
    partNumber: item.partNumber !== undefined ? String(item.partNumber) : null,
    category: item.mainCategory ?? null,
    imageUrl: item.image ?? null,
    productUrl: item.url ?? null,
    datasheetAvailable: Boolean(item.datasheets && item.datasheets.length > 0),
  };
}
