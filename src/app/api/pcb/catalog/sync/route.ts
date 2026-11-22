import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ message }, { status });
  }
  try {
    const { components } = (await req.json()) as {
      components?: Array<{
        mpn?: string;
        name?: string;
        footprint?: string;
        price?: number;
        stock?: number;
        category?: string;
        symbol?: string;
      }>;
    };

    if (!Array.isArray(components)) {
      return NextResponse.json({ error: 'Components must be an array' }, { status: 400 });
    }

    let synced = 0;
    for (const comp of components) {
      if (!comp.mpn) continue;

      // Upsert ComponentCatalog sur supplierRef (= MPN)
      const catalog = await prisma.componentCatalog.upsert({
        where: { id: comp.mpn },
        update: {
          name: comp.name ?? 'Unknown',
          footprint: comp.footprint ?? '',
          symbol: comp.symbol ?? '',
          category: comp.category ?? 'other',
          supplierRef: comp.mpn,
        },
        create: {
          id: comp.mpn,
          name: comp.name ?? 'Unknown',
          category: comp.category ?? 'other',
          symbol: comp.symbol ?? '',
          footprint: comp.footprint ?? '',
          supplierRef: comp.mpn,
        },
      });

      // Upsert ComponentPrice (dernier prix)
      if (comp.price !== undefined || comp.stock !== undefined) {
        await prisma.componentPrice.create({
          data: {
            catalogId: catalog.id,
            price: comp.price ?? 0,
            currency: 'EUR',
            supplier: 'LCSC',
            stockStatus: (comp.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock',
          },
        });
      }

      synced++;
    }

    return NextResponse.json({
      synced,
      message: 'Catalogue synchronisé avec succès',
    });
  } catch (error) {
    console.error('[CATALOG-SYNC] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
