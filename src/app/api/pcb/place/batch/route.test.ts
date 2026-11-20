import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { pcbProject: { findUnique: vi.fn() } },
}));

vi.mock('@/lib/pcb/kicad-bridge', () => ({
  placeFootprints: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { placeFootprints } from '@/lib/pcb/kicad-bridge';
import { existsSync } from 'node:fs';
import { POST } from './route';

const C1 = {
  reference: 'R1',
  libName: 'Resistor_SMD',
  footprintName: 'R_0603_1608Metric',
  xMm: 10,
  yMm: 10,
};
const C2 = {
  reference: 'C1',
  libName: 'Capacitor_SMD',
  footprintName: 'C_0603_1608Metric',
  xMm: 20,
  yMm: 20,
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/pcb/place/batch', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function makeRawRequest(raw: string) {
  return new NextRequest('http://localhost/api/pcb/place/batch', { method: 'POST', body: raw });
}

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
}

function mockHappyPath() {
  mockAdmin();
  vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
    id: 'p1',
    kicadFilePath: 'C:\\tmp\\board.kicad_pcb',
  } as never);
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(placeFootprints).mockResolvedValue({
    ok: true,
    message: 'placed 2',
    footprintCount: 2,
  });
}

describe('POST /api/pcb/place/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 401 sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(401);
  });

  it('2. 403 Forbidden', async () => {
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

  it('5. 400 components > 200', async () => {
    mockAdmin();
    const many = Array.from({ length: 201 }, (_, i) => ({ ...C1, reference: `R${i}` }));
    const res = await POST(makeRequest({ projectId: 'p1', components: many }));
    expect(res.status).toBe(400);
  });

  it('6. 400 libName manquant (index)', async () => {
    mockAdmin();
    const res = await POST(
      makeRequest({ projectId: 'p1', components: [C1, { ...C2, libName: '' }] }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'components[1].libName requis' });
  });

  it('7. 400 xMm non fini', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ projectId: 'p1', components: [{ ...C1, xMm: 'abc' }] }));
    expect(res.status).toBe(400);
  });

  it('8. 404 projet introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(404);
  });

  it('9. 400 kicadFilePath absent', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
      id: 'p1',
      kicadFilePath: null,
    } as never);
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Projet sans fichier KiCad' });
  });

  it('10. 500 si placeFootprints échoue', async () => {
    mockHappyPath();
    vi.mocked(placeFootprints).mockResolvedValue({ ok: false, error: 'Python error' });
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Python error' });
  });

  it('11. 200 : placeFootprints appelé avec boardPath absolu', async () => {
    mockHappyPath();
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1, C2] }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      placed: 2,
      dryRun: false,
      message: 'placed 2',
    });

    expect(placeFootprints).toHaveBeenCalledWith({
      boardPath: 'C:\\tmp\\board.kicad_pcb',
      dryRun: false,
      footprints: [
        {
          libName: 'Resistor_SMD',
          footprintName: 'R_0603_1608Metric',
          reference: 'R1',
          xMm: 10,
          yMm: 10,
          layer: undefined,
          rotation: undefined,
          value: undefined,
        },
        {
          libName: 'Capacitor_SMD',
          footprintName: 'C_0603_1608Metric',
          reference: 'C1',
          xMm: 20,
          yMm: 20,
          layer: undefined,
          rotation: undefined,
          value: undefined,
        },
      ],
    });
  });

  it('12. dryRun:true transmis', async () => {
    mockHappyPath();
    vi.mocked(placeFootprints).mockResolvedValue({
      ok: true,
      message: 'dry-run ok',
      footprintCount: 1,
      wouldPlace: true,
    });

    const res = await POST(makeRequest({ projectId: 'p1', components: [C1], dryRun: true }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, dryRun: true, placed: 1 });
    expect(placeFootprints).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true, boardPath: 'C:\\tmp\\board.kicad_pcb' }),
    );
  });
});
