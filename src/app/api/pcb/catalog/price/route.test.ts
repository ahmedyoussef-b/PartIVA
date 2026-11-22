import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    componentCatalog: { findUnique: vi.fn() },
    componentPrice: { create: vi.fn() },
  },
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { GET, POST } from './route';

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
}

function getReq(query: string) {
  return new NextRequest(`http://localhost/api/pcb/catalog/price${query}`);
}

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/pcb/catalog/price', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function postRaw(raw: string) {
  return new NextRequest('http://localhost/api/pcb/catalog/price', { method: 'POST', body: raw });
}

describe('GET /api/pcb/catalog/price', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 401 sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(getReq('?catalogId=c1'));
    expect(res.status).toBe(401);
  });

  it('2. 403 Forbidden', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await GET(getReq('?catalogId=c1'));
    expect(res.status).toBe(403);
  });

  it('3. 400 catalogId manquant', async () => {
    mockAdmin();
    const res = await GET(getReq(''));
    expect(res.status).toBe(400);
  });

  it('4. 404 composant introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue(null);
    const res = await GET(getReq('?catalogId=c1'));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Composant introuvable' });
  });

  it('5. 200 sans prix → price null', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue({
      id: 'c1',
      prices: [],
    } as never);
    const res = await GET(getReq('?catalogId=c1'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      catalogId: 'c1',
      price: null,
      currency: null,
      supplier: null,
      stockStatus: null,
    });
  });

  it('6. 200 avec prix → champs renvoyes', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue({
      id: 'c1',
      prices: [{ price: 1.23, currency: 'EUR', supplier: 'Mouser', stockStatus: 'in_stock' }],
    } as never);
    const res = await GET(getReq('?catalogId=c1'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      catalogId: 'c1',
      price: 1.23,
      currency: 'EUR',
      supplier: 'Mouser',
      stockStatus: 'in_stock',
    });
  });

  it('7. requete Prisma : dernier prix (updatedAt desc, take 1)', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue({
      id: 'c1',
      prices: [],
    } as never);
    await GET(getReq('?catalogId=c1'));

    expect(prisma.componentCatalog.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        select: expect.objectContaining({
          prices: expect.objectContaining({ orderBy: { updatedAt: 'desc' }, take: 1 }),
        }),
      }),
    );
  });

  it('8. 500 si Prisma throw', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockRejectedValue(new Error('db down'));
    const res = await GET(getReq('?catalogId=c1'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/pcb/catalog/price', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('9. 401 sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(postReq({ catalogId: 'c1', price: 1 }));
    expect(res.status).toBe(401);
  });

  it('10. 400 body JSON invalide', async () => {
    mockAdmin();
    const res = await POST(postRaw('not-json'));
    expect(res.status).toBe(400);
  });

  it('11. 400 catalogId manquant', async () => {
    mockAdmin();
    const res = await POST(postReq({ price: 1 }));
    expect(res.status).toBe(400);
  });

  it('12. 400 price invalide', async () => {
    mockAdmin();
    const res = await POST(postReq({ catalogId: 'c1', price: -5 }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'price doit être un nombre > 0' });
  });

  it('13. 404 composant introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue(null);
    const res = await POST(postReq({ catalogId: 'c1', price: 2 }));
    expect(res.status).toBe(404);
  });

  it('14. 200 : cree un ComponentPrice (defauts EUR / in_stock)', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue({ id: 'c1' } as never);
    vi.mocked(prisma.componentPrice.create).mockResolvedValue({
      price: 2.5,
      currency: 'EUR',
      supplier: null,
      stockStatus: 'in_stock',
    } as never);

    const res = await POST(postReq({ catalogId: 'c1', price: 2.5 }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      catalogId: 'c1',
      price: 2.5,
      currency: 'EUR',
      supplier: null,
      stockStatus: 'in_stock',
    });
    expect(prisma.componentPrice.create).toHaveBeenCalledWith({
      data: {
        catalogId: 'c1',
        price: 2.5,
        currency: 'EUR',
        supplier: undefined,
        stockStatus: 'in_stock',
      },
    });
  });

  it('15. 200 : transmet supplier / currency / stockStatus', async () => {
    mockAdmin();
    vi.mocked(prisma.componentCatalog.findUnique).mockResolvedValue({ id: 'c1' } as never);
    vi.mocked(prisma.componentPrice.create).mockResolvedValue({
      price: 3,
      currency: 'USD',
      supplier: 'DigiKey',
      stockStatus: 'low_stock',
    } as never);

    const res = await POST(
      postReq({
        catalogId: 'c1',
        price: 3,
        currency: 'USD',
        supplier: 'DigiKey',
        stockStatus: 'low_stock',
      }),
    );

    expect(res.status).toBe(200);
    expect(prisma.componentPrice.create).toHaveBeenCalledWith({
      data: {
        catalogId: 'c1',
        price: 3,
        currency: 'USD',
        supplier: 'DigiKey',
        stockStatus: 'low_stock',
      },
    });
  });
});
