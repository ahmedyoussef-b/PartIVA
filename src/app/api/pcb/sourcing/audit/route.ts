import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { category: { contains: q, mode: 'insensitive' as const } },
          { footprint: { contains: q, mode: 'insensitive' as const } },
          { supplierRef: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const catalogs = await prisma.componentCatalog.findMany({
    where,
    select: {
      id: true,
      name: true,
      componentType: true,
      category: true,
      footprint: true,
      symbol: true,
      supplier: true,
      supplierRef: true,
      prices: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { price: true, currency: true, stockStatus: true, stock: true, updatedAt: true },
      },
    },
    orderBy: { name: 'asc' },
    take: 500,
  });

  const data = catalogs.map((c) => ({
    catalogId: c.id,
    name: c.name,
    type: c.componentType,
    category: c.category,
    footprint: c.footprint,
    symbol: c.symbol,
    supplier: c.supplier,
    supplierRef: c.supplierRef ?? c.id,
    price: c.prices[0]?.price ?? null,
    currency: c.prices[0]?.currency ?? null,
    stockStatus: c.prices[0]?.stockStatus ?? null,
    stock:
      c.prices[0]?.stock ?? (c.prices[0]?.stockStatus === 'in_stock' ? 100 : c.prices[0]?.stockStatus === 'low_stock' ? 10 : 0),
    updatedAt: c.prices[0]?.updatedAt ? new Date(c.prices[0].updatedAt).toISOString() : null,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const componentType = typeof b.type === 'string' ? b.type.trim() : null;
  const category = typeof b.category === 'string' ? b.category.trim() : '';
  if (!name || !category) {
    return NextResponse.json({ error: 'name et category requis' }, { status: 400 });
  }
  const symbol = typeof b.symbol === 'string' && b.symbol.trim() ? b.symbol.trim() : name;
  const footprint = typeof b.footprint === 'string' && b.footprint.trim() ? b.footprint.trim() : '';
  const supplier = typeof b.supplier === 'string' && b.supplier.trim() ? b.supplier.trim() : null;
  const supplierRef =
    typeof b.supplierRef === 'string' && b.supplierRef.trim() ? b.supplierRef.trim() : null;

  try {
    const created = await prisma.componentCatalog.create({
      data: { name, componentType, category, symbol, footprint, supplier, supplierRef },
    });
    console.info('[PCB:CATALOG-CREATE]', { id: created.id, name, componentType, category });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    console.error('[PCB:CATALOG-CREATE] Erreur', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const type = typeof b.type === 'string' ? b.type.trim() : '';

  if (!name && !type) {
    return NextResponse.json({ error: 'name ou type requis' }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (name) where.name = name;
  if (type) where.componentType = type;

  try {
    const res = await prisma.componentCatalog.deleteMany({ where });
    console.info('[PCB:CATALOG-DELETE]', { name, type, count: res.count });
    return NextResponse.json({ ok: true, deleted: res.count });
  } catch (e) {
    console.error('[PCB:CATALOG-DELETE] Erreur', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 });
  }
}
