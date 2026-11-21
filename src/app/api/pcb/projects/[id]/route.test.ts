import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { pcbProject: { update: vi.fn() } },
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'node:fs';
import { PATCH } from './route';

const PROJECT_ID = 'proj-1';
const PARAMS = { params: Promise.resolve({ id: PROJECT_ID }) };
const VALID_PATH = 'C:\\tmp\\board.kicad_pcb';

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/pcb/projects/${PROJECT_ID}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function makeRawRequest(raw: string) {
  return new NextRequest(`http://localhost/api/pcb/projects/${PROJECT_ID}`, {
    method: 'PATCH',
    body: raw,
  });
}

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
}

function mockUpdateResolved(kicadFilePath: string) {
  vi.mocked(prisma.pcbProject.update).mockResolvedValue({
    id: PROJECT_ID,
    kicadFilePath,
  } as never);
}

describe('PATCH /api/pcb/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. retourne 401 si non authentifié', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await PATCH(makeRequest({ kicadFilePath: VALID_PATH }), PARAMS);
    expect(res.status).toBe(401);
  });

  it('2. retourne 403 si non admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await PATCH(makeRequest({ kicadFilePath: VALID_PATH }), PARAMS);
    expect(res.status).toBe(403);
  });

  it('3. retourne 400 si body JSON invalide', async () => {
    mockAdmin();
    const res = await PATCH(makeRawRequest('not-json'), PARAMS);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Body JSON invalide' });
  });

  it('4. retourne 400 si kicadFilePath vide', async () => {
    mockAdmin();
    const res = await PATCH(makeRequest({ kicadFilePath: '   ' }), PARAMS);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'kicadFilePath requis' });
  });

  it('5. retourne 400 si extension non .kicad_pcb', async () => {
    mockAdmin();
    const res = await PATCH(makeRequest({ kicadFilePath: 'C:\\tmp\\board.txt' }), PARAMS);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'kicadFilePath doit pointer vers un fichier .kicad_pcb',
    });
  });

  it('6. retourne 404 si le projet est introuvable (P2025)', async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.update).mockRejectedValue(
      Object.assign(new Error('Record not found'), { code: 'P2025' }),
    );
    const res = await PATCH(makeRequest({ kicadFilePath: VALID_PATH }), PARAMS);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Projet introuvable' });
  });

  it('7. retourne 200 avec exists=true', async () => {
    mockAdmin();
    mockUpdateResolved(VALID_PATH);
    vi.mocked(existsSync).mockReturnValue(true);

    const res = await PATCH(makeRequest({ kicadFilePath: VALID_PATH }), PARAMS);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      id: PROJECT_ID,
      kicadFilePath: VALID_PATH,
      exists: true,
    });
    expect(prisma.pcbProject.update).toHaveBeenCalledWith({
      where: { id: PROJECT_ID },
      data: { kicadFilePath: VALID_PATH },
      select: { id: true, kicadFilePath: true },
    });
  });

  it('8. retourne 200 avec exists=false (fichier pas encore créé)', async () => {
    mockAdmin();
    mockUpdateResolved(VALID_PATH);
    vi.mocked(existsSync).mockReturnValue(false);

    const res = await PATCH(makeRequest({ kicadFilePath: VALID_PATH }), PARAMS);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      id: PROJECT_ID,
      kicadFilePath: VALID_PATH,
      exists: false,
    });
  });
});
