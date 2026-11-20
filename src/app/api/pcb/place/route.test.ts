import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { pcbProject: { findUnique: vi.fn() } },
}));

vi.mock('@/lib/pcb/kicad-bridge', () => ({
  detectKicadPython: vi.fn(),
  resolveScriptPath: vi.fn(),
  placeFootprint: vi.fn(),
  dryRun: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import {
  detectKicadPython,
  dryRun,
  placeFootprint,
  resolveScriptPath,
} from '@/lib/pcb/kicad-bridge';
import { existsSync } from 'node:fs';
import { POST } from './route';

const VALID_BODY = {
  projectId: 'proj-1',
  reference: 'R1',
  libName: 'Resistor_SMD',
  footprintName: 'R_0603_1608Metric',
  xMm: 10,
  yMm: 20,
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/pcb/place', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function makeRawRequest(raw: string) {
  return new NextRequest('http://localhost/api/pcb/place', {
    method: 'POST',
    body: raw,
  });
}

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
}

function mockHappyPath() {
  mockAdmin();
  vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
    kicadFilePath: '/tmp/board.kicad_pcb',
  } as never);
  vi.mocked(existsSync).mockReturnValue(true);
  vi.mocked(detectKicadPython).mockResolvedValue('/usr/bin/python');
  vi.mocked(resolveScriptPath).mockReturnValue('/scripts/place_footprint.py');
}

describe('POST /api/pcb/place', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. retourne 401 si non authentifié', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('2. retourne 403 si non admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('3. retourne 400 si body JSON invalide', async () => {
    mockAdmin();
    const res = await POST(makeRawRequest('not-json'));
    expect(res.status).toBe(400);
  });

  it('4. retourne 400 si projectId manquant', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ ...VALID_BODY, projectId: '' }));
    expect(res.status).toBe(400);
  });

  it('5. retourne 400 si reference manquant', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ ...VALID_BODY, reference: '' }));
    expect(res.status).toBe(400);
  });

  it('6. retourne 400 si libName manquant', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ ...VALID_BODY, libName: '' }));
    expect(res.status).toBe(400);
  });

  it('7. retourne 400 si footprintName manquant', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ ...VALID_BODY, footprintName: '' }));
    expect(res.status).toBe(400);
  });

  it('8. retourne 400 si xMm non numérique', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ ...VALID_BODY, xMm: 'abc' }));
    expect(res.status).toBe(400);
  });

  it('9. retourne 400 si yMm non numérique', async () => {
    mockAdmin();
    const res = await POST(makeRequest({ ...VALID_BODY, yMm: 'abc' }));
    expect(res.status).toBe(400);
  });

  it('10. retourne 404 si projet introuvable', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('11. retourne 400 si kicadFilePath vide', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
      kicadFilePath: null,
    } as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
  });

  it('12. retourne 400 si fichier absent', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
      kicadFilePath: '/tmp/board.kicad_pcb',
    } as never);
    vi.mocked(existsSync).mockReturnValue(false);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
  });

  it('13. retourne 500 si Python introuvable', async () => {
    mockHappyPath();
    vi.mocked(detectKicadPython).mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('14. retourne 500 si script introuvable', async () => {
    mockHappyPath();
    vi.mocked(resolveScriptPath).mockReturnValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('15. retourne 200 en cas de succès', async () => {
    mockHappyPath();
    vi.mocked(placeFootprint).mockResolvedValue({
      ok: true,
      message: 'placed R1',
      footprintCount: 26,
    });

    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      message: 'placed R1',
      footprintCount: 26,
      wouldPlace: undefined,
    });
    expect(placeFootprint).toHaveBeenCalledWith({
      boardPath: '/tmp/board.kicad_pcb',
      libName: 'Resistor_SMD',
      footprintName: 'R_0603_1608Metric',
      reference: 'R1',
      value: undefined,
      xMm: 10,
      yMm: 20,
      layer: 'F.Cu',
    });
  });

  it('16. retourne 200 en dry-run avec wouldPlace', async () => {
    mockHappyPath();
    vi.mocked(dryRun).mockResolvedValue({
      ok: true,
      wouldPlace: true,
      message: 'dry-run ok',
      footprintCount: 25,
    });

    const res = await POST(makeRequest({ ...VALID_BODY, dryRun: true }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.wouldPlace).toBe(true);
    expect(dryRun).toHaveBeenCalled();
    expect(placeFootprint).not.toHaveBeenCalled();
  });

  it("17. retourne 500 en cas d'échec du placement", async () => {
    mockHappyPath();
    vi.mocked(placeFootprint).mockResolvedValue({ ok: false, error: 'Python error' });

    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Python error' });
  });
});
