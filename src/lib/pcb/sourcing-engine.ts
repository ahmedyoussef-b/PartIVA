// Sourcing Engine — matching BOM ↔ Catalogue + alternatives
// V8-D-10-a

import { prisma } from '@/lib/prisma';

export interface BomItem {
  reference: string;
  mpn?: string;
  description?: string;
  quantity: number;
}

export interface SourcingResult {
  reference: string;
  matchedMpns: Array<{
    mpn: string;
    name: string;
    price: number;
    stock: number;
    supplierRef: string;
    catalogId: string;
  }>;
  alternatives: Array<{
    mpn: string;
    name: string;
    price: number;
    stock: number;
    similarityScore: number;
  }>;
  totalCost: number;
  isAvailable: boolean;
}

function calculateSimilarity(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1.0;
  if (al.includes(bl) || bl.includes(al)) return 0.8;

  const tokensA = new Set(al.split(/[\s\-_]+/));
  const tokensB = new Set(bl.split(/[\s\-_]+/));
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  return Math.min(1, overlap / Math.max(tokensA.size, tokensB.size, 1));
}

function stockToNumber(stockStatus: string | null | undefined): number {
  if (!stockStatus) return 0;
  if (stockStatus === 'in_stock') return 100;
  if (stockStatus === 'low_stock') return 10;
  return 0;
}

export async function sourceBom(bomItems: BomItem[]): Promise<SourcingResult[]> {
  const results: SourcingResult[] = [];

  for (const item of bomItems) {
    // 1. Recherche exacte MPN
    const exactMatches = await prisma.componentCatalog.findMany({
      where: { supplierRef: item.mpn },
      include: { prices: { orderBy: { updatedAt: 'desc' }, take: 1 } },
    });

    // 2. Recherche alternatives (fuzzy sur description/name si pas de match exact)
    let alternatives: SourcingResult['alternatives'] = [];
    if (exactMatches.length === 0 && item.description) {
      const allComponents = await prisma.componentCatalog.findMany({
        take: 200,
        include: { prices: { orderBy: { updatedAt: 'desc' }, take: 1 } },
      });

      alternatives = allComponents
        .map((comp) => ({
          mpn: comp.supplierRef ?? comp.id,
          name: comp.name,
          price: comp.prices[0]?.price ?? 0,
          stock: comp.prices[0]?.stock ?? stockToNumber(comp.prices[0]?.stockStatus),
          catalogId: comp.id,
          similarityScore: calculateSimilarity(item.description!, comp.name),
        }))
        .filter((a) => a.similarityScore > 0.4)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 5);
    }

    const matchedMpns = exactMatches.map((m) => ({
      mpn: m.supplierRef ?? m.id,
      name: m.name,
      price: m.prices[0]?.price ?? 0,
      stock: m.prices[0]?.stock ?? stockToNumber(m.prices[0]?.stockStatus),
      supplierRef: m.supplierRef ?? m.id,
      catalogId: m.id,
    }));

    const bestPrice =
      matchedMpns.length > 0
        ? Math.min(...matchedMpns.map((m) => m.price))
        : (alternatives[0]?.price ?? 0);

    results.push({
      reference: item.reference,
      matchedMpns,
      alternatives,
      totalCost: bestPrice * item.quantity,
      isAvailable: matchedMpns.some((m) => m.stock > 0) || alternatives.some((a) => a.stock > 0),
    });
  }

  return results;
}
