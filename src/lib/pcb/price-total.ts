// V39.1 — Calcul du coût total d'un projet PCB (pur, 0 import).
// Les prix proviennent de ComponentCatalog.prices (ComponentPrice).
// PcbComponent n'a pas de champ `quantity` : quantité = 1 par défaut.

export interface PriceLine {
  reference: string;
  catalogId: string | null;
  quantity?: number;
}

export interface CatalogPrice {
  catalogId: string;
  unitPrice: number | null;
  currency?: string;
}

export interface PriceTotal {
  total: number;
  currency: string;
  lineCount: number;
  pricedCount: number;
  unpriced: string[];
}

const DEFAULT_CURRENCY = 'EUR';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function effectiveQuantity(quantity: number | undefined): number {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) return 1;
  return quantity;
}

export function computePriceTotal(
  lines: PriceLine[],
  prices: CatalogPrice[],
  options?: { currency?: string },
): PriceTotal {
  const priceByCatalog = new Map<string, CatalogPrice>();
  for (const price of prices) {
    if (!priceByCatalog.has(price.catalogId)) priceByCatalog.set(price.catalogId, price);
  }

  const firstCurrency = prices.find(
    (p) => typeof p.currency === 'string' && p.currency.length > 0,
  )?.currency;

  const currency = options?.currency ?? firstCurrency ?? DEFAULT_CURRENCY;

  let total = 0;
  let pricedCount = 0;
  const unpriced: string[] = [];

  for (const line of lines) {
    const catalogId = line.catalogId;
    const price = catalogId ? priceByCatalog.get(catalogId) : undefined;
    const unitPrice = price?.unitPrice;

    if (
      !catalogId ||
      typeof unitPrice !== 'number' ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0
    ) {
      unpriced.push(line.reference);
      continue;
    }

    total += unitPrice * effectiveQuantity(line.quantity);
    pricedCount += 1;
  }

  return {
    total: round2(total),
    currency,
    lineCount: lines.length,
    pricedCount,
    unpriced,
  };
}
