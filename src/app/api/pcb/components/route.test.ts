import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: vi.fn() },
    pcbComponent: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { POST } from './route';

const C1 = { reference: 'R1', name: 'Résistance' };
const C2 = { reference: 'C1', name: 'Condensateur', positionX: 10, positionY: 20 };

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/pcb/components', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function makeRawRequest(raw: string) {
  return new NextRequest('http://localhost/api/pcb/components', { method: 'POST', body: raw });
}

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
}

describe('POST /api/pcb/components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 401 sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(401);
  });

  it('2. 403 si Forbidden', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(403);
  });

  it('3. 400 body JSON invalide', async () => {
    mockAdmin();
    const res = await POST(makeRawRequest('not-json'));
    expect(res.status).toBe(400);
  });

  it('4. 400 components vide', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ projectId: 'p1', components: [] }));
    expect(res.status).toBe(400);
  });

  it('5. 400 reference manquante (index fautif)', async () => {
    mockAdmin();
    const res = await POST(
      makeRequest({ projectId: 'p1', components: [C1, { name: 'Sans référence' }] }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'components[1].reference requis' });
  });

  it('6. 400 positionX non fini', async () => {
    mockAdmin();
    const res = await POST(
      makeRequest({
        projectId: 'p1',
        components: [{ reference: 'R1', name: 'R', positionX: 'abc' }],
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'components[0].positionX doit être un nombre',
    });
  });

  it('7. 404 projet introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(404);
  });

  it('8. 200 : 2 nouveaux → create x2', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(prisma.pcbComponent.findFirst).mockResolvedValue(null);

    const res = await POST(makeRequest({ projectId: 'p1', components: [C1, C2] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ created: 2, updated: 0, count: 2 });
    expect(prisma.pcbComponent.create).toHaveBeenCalledTimes(2);
    expect(prisma.pcbComponent.update).not.toHaveBeenCalled();
  });

  it('9. 200 : 1 existant + 1 nouveau', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(prisma.pcbComponent.findFirst)
      .mockResolvedValueOnce({ id: 'old-1' } as never)
      .mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ projectId: 'p1', components: [C1, C2] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ created: 1, updated: 1, count: 2 });
    expect(prisma.pcbComponent.update).toHaveBeenCalledTimes(1);
    expect(prisma.pcbComponent.create).toHaveBeenCalledTimes(1);
  });

  it('10. rotation absente → 0', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(prisma.pcbComponent.findFirst).mockResolvedValue(null);

    await POST(makeRequest({ projectId: 'p1', components: [C1] }));

    expect(prisma.pcbComponent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ projectId: 'p1', rotation: 0 }),
    });
  });

  it('11. status absent → proposed', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(prisma.pcbComponent.findFirst).mockResolvedValue(null);

    await POST(makeRequest({ projectId: 'p1', components: [C1] }));

    expect(prisma.pcbComponent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'proposed' }),
    });
  });
});
