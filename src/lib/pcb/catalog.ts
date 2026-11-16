import { prisma } from '@/lib/prisma';

export interface CatalogComponent {
  id: string;
  name: string;
  category: string;
  symbol: string;
  footprint: string;
  model3d?: string;
  supplier?: string;
  supplierRef?: string;
  price?: number;
  currency?: string;
  stockStatus?: string;
}

export async function listCatalog(): Promise<CatalogComponent[]> {
  const rows = await prisma.componentCatalog.findMany({
    include: { prices: { orderBy: { updatedAt: 'desc' }, take: 1 } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    symbol: r.symbol,
    footprint: r.footprint,
    model3d: r.model3d ?? undefined,
    supplier: r.prices[0]?.supplier ?? undefined,
    supplierRef: r.supplierRef ?? undefined,
    price: r.prices[0]?.price,
    currency: r.prices[0]?.currency,
    stockStatus: r.prices[0]?.stockStatus ?? undefined,
  }));
}

export async function updatePrice(catalogId: string, price: number, supplier?: string) {
  return prisma.componentPrice.create({
    data: { catalogId, price, supplier, currency: 'EUR', stockStatus: 'in_stock' },
  });
}

export async function createCatalogComponent(data: {
  name: string;
  category: string;
  symbol: string;
  footprint: string;
  model3d?: string;
  supplierRef?: string;
}) {
  return prisma.componentCatalog.create({ data });
}
