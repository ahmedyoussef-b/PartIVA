import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';

const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_STOCK_STATUS = 'in_stock';

function unauthorized(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  return NextResponse.json({ error: message }, { status: message === 'Forbidden' ? 403 : 401 });
}

// Lecture : dernier prix connu d'un composant du catalogue.
export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return unauthorized(e);
  }

  const url = new URL(req.url);
  const catalogId = (url.searchParams.get('catalogId') ?? '').trim();
  if (!catalogId) {
    return NextResponse.json({ error: 'catalogId requis' }, { status: 400 });
  }

  try {
    const catalog = await prisma.componentCatalog.findUnique({
      where: { id: catalogId },
      select: {
        id: true,
        prices: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { price: true, currency: true, supplier: true, stockStatus: true },
        },
      },
    });

    if (!catalog) {
      return NextResponse.json({ error: 'Composant introuvable' }, { status: 404 });
    }

    const price = catalog.prices[0];
    console.info('[PCB:CATALOG-PRICE]', { catalogId, found: Boolean(price) });

    return NextResponse.json({
      catalogId,
      price: price?.price ?? null,
      currency: price?.currency ?? null,
      supplier: price?.supplier ?? null,
      stockStatus: price?.stockStatus ?? null,
    });
  } catch (e) {
    console.error('[PCB:CATALOG-PRICE] Erreur', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}

// Écriture : enregistre un nouveau prix (le plus récent fait foi).
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return unauthorized(e);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const catalogId = typeof b.catalogId === 'string' ? b.catalogId.trim() : '';
  const price = typeof b.price === 'number' ? b.price : Number.NaN;

  if (!catalogId) {
    return NextResponse.json({ error: 'catalogId requis' }, { status: 400 });
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'price doit être un nombre > 0' }, { status: 400 });
  }

  try {
    const catalog = await prisma.componentCatalog.findUnique({
      where: { id: catalogId },
      select: { id: true },
    });
    if (!catalog) {
      return NextResponse.json({ error: 'Composant introuvable' }, { status: 404 });
    }

    const currency =
      typeof b.currency === 'string' && b.currency.trim() ? b.currency.trim() : DEFAULT_CURRENCY;
    const supplier =
      typeof b.supplier === 'string' && b.supplier.trim() ? b.supplier.trim() : undefined;
    const stockStatus =
      typeof b.stockStatus === 'string' && b.stockStatus.trim()
        ? b.stockStatus.trim()
        : DEFAULT_STOCK_STATUS;
    const stock =
      typeof b.stock === 'number' && Number.isFinite(b.stock)
        ? Math.max(0, Math.round(b.stock))
        : undefined;

    const created = await prisma.componentPrice.create({
      data: {
        catalogId,
        price,
        currency,
        supplier,
        stockStatus,
        ...(stock !== undefined ? { stock } : {}),
      },
    });

    console.info('[PCB:CATALOG-PRICE] Prix enregistre', { catalogId, price, currency });

    return NextResponse.json({
      ok: true,
      catalogId,
      price: created.price,
      currency: created.currency,
      supplier: created.supplier,
      stockStatus: created.stockStatus,
      stock: created.stock,
    });
  } catch (e) {
    console.error('[PCB:CATALOG-PRICE] Erreur', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
