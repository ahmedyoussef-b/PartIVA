import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { pcbProject: { findUnique: vi.fn() } },
}));

vi.mock('@/lib/pcb/kicad-file-reader', () => ({
  parseKicadPcb: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { parseKicadPcb } from '@/lib/pcb/kicad-file-reader';
import { existsSync, readFileSync } from 'node:fs';
import { POST } from './route';

const REQ1 = { reference: 'R1', xMm: 10, yMm: 20, rotation: 0 };
const REQ2 = { reference: 'C1', xMm: 30, yMm: 40, rotation: 0 };

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/pcb/place/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function makeRawRequest(raw: string) {
  return new NextRequest('http://localhost/api/pcb/place/verify', { method: 'POST', body: raw });
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
  vi.mocked(readFileSync).mockReturnValue('(kicad_pcb)');
  vi.mocked(parseKicadPcb).mockReturnValue({
    version: 20241229,
    generator: 'pcbnew',
    origin: { x: 0, y: 0 },
    dimensions: { width: 100, height: 80 },
    components: [
      {
        library: 'Resistor_SMD',
        name: 'R_0603_1608Metric',
        reference: 'R1',
        x: 10,
        y: 20,
        rotation: 0,
        layer: 'F.Cu',
      },
      {
        library: 'Capacitor_SMD',
        name: 'C_0603_1608Metric',
        reference: 'C1',
        x: 30,
        y: 40,
        rotation: 0,
        layer: 'F.Cu',
      },
    ],
  });
}

describe('POST /api/pcb/place/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 401 sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1] }));
    expect(res.status).toBe(401);
  });

  it('2. 403 Forbidden', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1] }));
    expect(res.status).toBe(403);
  });

  it('3. 400 body JSON invalide', async () => {
    mockAdmin();
    const res = await POST(makeRawRequest('not-json'));
    expect(res.status).toBe(400);
  });

  it('4. 400 requested vide', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ projectId: 'p1', requested: [] }));
    expect(res.status).toBe(400);
  });

  it('5. 400 reference manquante (index)', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1, { xMm: 1, yMm: 2 }] }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'requested[1].reference requis' });
  });

  it('6. 400 xMm non fini', async () => {
    mockAdmin();
    const res = await POST(
      makeRequest({ projectId: 'p1', requested: [{ reference: 'R1', xMm: 'abc', yMm: 2 }] }),
    );
    expect(res.status).toBe(400);
  });

  it('7. 404 projet introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1] }));
    expect(res.status).toBe(404);
  });

  it('8. 400 kicadFilePath absent', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
      id: 'p1',
      kicadFilePath: null,
    } as never);
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1] }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Projet sans fichier KiCad' });
  });

  it('9. 400 fichier introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
      id: 'p1',
      kicadFilePath: 'C:\\tmp\\board.kicad_pcb',
    } as never);
    vi.mocked(existsSync).mockReturnValue(false);
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1] }));
    expect(res.status).toBe(400);
  });

  it('10. 200 : 2 footprints conformes', async () => {
    mockHappyPath();
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1, REQ2] }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verification.ok).toBe(true);
    expect(body.verification.matched).toBe(2);
    expect(body.verification.checked).toBe(2);
    expect(parseKicadPcb).toHaveBeenCalled();
  });

  it('11. 200 : écart de 5 mm', async () => {
    mockHappyPath();
    const res = await POST(
      makeRequest({ projectId: 'p1', requested: [{ ...REQ1, xMm: 15 }, REQ2] }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verification.ok).toBe(false);
    expect(body.verification.misplaced[0].reason).toBe('position');
    expect(body.verification.misplaced[0].deltaMm).toBeCloseTo(5, 5);
  });

  it('12. 500 : parseKicadPcb throw', async () => {
    mockHappyPath();
    vi.mocked(parseKicadPcb).mockImplementation(() => {
      throw new Error('parse error');
    });
    const res = await POST(makeRequest({ projectId: 'p1', requested: [REQ1] }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'parse error' });
  });
});
