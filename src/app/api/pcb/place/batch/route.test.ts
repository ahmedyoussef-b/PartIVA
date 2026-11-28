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
  syncBoardLive: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  copyFileSync: vi.fn(),
}));

const {
  BoardLockedByKicadError,
  BoardChangedError,
  BoardLockError,
  prepareBoardForWrite,
  assertBoardStamp,
} = vi.hoisted(() => ({
  BoardLockedByKicadError: class BoardLockedByKicadError extends Error {
    readonly boardPath: string;
    constructor(boardPath: string) {
      super('Enregistrez ou annulez vos modifications dans KiCad puis réessayez.');
      this.boardPath = boardPath;
    }
  },
  BoardChangedError: class BoardChangedError extends Error {},
  BoardLockError: class BoardLockError extends Error {},
  prepareBoardForWrite: vi.fn(),
  assertBoardStamp: vi.fn(),
}));

vi.mock('@/lib/pcb/board-lock', () => ({
  withBoardLock: (_path: string, fn: () => Promise<unknown>) => fn(),
  readBoardStamp: () => ({ mtimeMs: 1, size: 1 }),
  assertBoardStamp,
  BoardLockedByKicadError,
  BoardChangedError,
  BoardLockError,
}));

vi.mock('@/lib/pcb/kicad-desktop', () => ({
  prepareBoardForWrite: (...a: unknown[]) => prepareBoardForWrite(...a),
  isBoardOpenInKicad: vi.fn(() => false),
  closeBoardInDesktop: vi.fn(),
  openBoardInDesktop: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/prisma';
import { placeFootprints, syncBoardLive } from '@/lib/pcb/kicad-bridge';
import { existsSync } from 'node:fs';
import { assertBoardStamp } from '@/lib/pcb/board-lock';
import { POST } from './route';

// Chemin de plateau normalise attendu : /c/... en forme absolue POSIX,
// ou chemin drive conservé tel quel en environnement win32.
const EXPECTED_BOARD_PATH =
  process.platform === 'win32' ? 'C:/tmp/board.kicad_pcb' : '/c/tmp/board.kicad_pcb';

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
    prepareBoardForWrite.mockResolvedValue({ closed: 0, released: true });
    vi.mocked(assertBoardStamp).mockImplementation(() => {});
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
      liveSynced: false,
    });

    expect(placeFootprints).toHaveBeenCalledWith({
      boardPath: EXPECTED_BOARD_PATH,
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
      force: false,
      allowOutside: false,
    });
  });

  it("11-bis. fichier persistant puis sync live pour l'affichage KiCad", async () => {
    mockAdmin();
    vi.mocked(prisma.pcbProject.findUnique).mockResolvedValue({
      id: 'p1',
      kicadFilePath: 'C:\\tmp\\board.kicad_pcb',
    } as never);
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(placeFootprints).mockResolvedValue({
      ok: true,
      message: 'placed 1',
      footprintCount: 1,
    });
    vi.mocked(syncBoardLive).mockResolvedValue({
      ok: true,
      live: true,
      moved: ['R1'],
      missing: [],
      board: 'board.kicad_pcb',
    });

    const previous = process.env.PARTIVA_DESKTOP;
    process.env.PARTIVA_DESKTOP = '1';
    try {
      const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        ok: true,
        placed: 1,
        liveSynced: true,
        message: 'placed 1',
      });
      expect(syncBoardLive).toHaveBeenCalledWith(
        expect.objectContaining({ boardPath: EXPECTED_BOARD_PATH }),
      );
      // Le fichier reste la source de vérité : il est écrit AVANT le refresh IPC.
      expect(placeFootprints).toHaveBeenCalledWith(
        expect.objectContaining({ boardPath: EXPECTED_BOARD_PATH, force: false }),
      );
    } finally {
      if (previous === undefined) delete process.env.PARTIVA_DESKTOP;
      else process.env.PARTIVA_DESKTOP = previous;
      vi.mocked(syncBoardLive).mockReset();
    }
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
      expect.objectContaining({ dryRun: true, boardPath: EXPECTED_BOARD_PATH }),
    );
  });

  it('le force du client est ignoré : placeFootprints reçoit toujours force:false', async () => {
    mockHappyPath();
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1], force: true }));
    expect(res.status).toBe(200);
    expect(placeFootprints).toHaveBeenCalledWith(expect.objectContaining({ force: false }));
  });

  it('423 si KiCad garde le plateau ouvert après fermeture gracieuse', async () => {
    mockHappyPath();
    prepareBoardForWrite.mockResolvedValue({ closed: 0, released: false });
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(423);
    await expect(res.json()).resolves.toMatchObject({
      error: 'BOARD_LOCKED_BY_KICAD',
      message: 'Enregistrez ou annulez vos modifications dans KiCad puis réessayez.',
    });
    expect(placeFootprints).not.toHaveBeenCalled();
  });

  it('409 avec rollback si le plateau change pendant l’opération', async () => {
    mockHappyPath();
    vi.mocked(assertBoardStamp)
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {
        throw new BoardChangedError('Le plateau a été modifié pendant l’opération.');
      });
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: 'BOARD_CHANGED' });
  });

  it('allowOutside:true transmis a placeFootprints', async () => {
    mockHappyPath();
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1], allowOutside: true }));
    expect(res.status).toBe(200);
    expect(placeFootprints).toHaveBeenCalledWith(expect.objectContaining({ allowOutside: true }));
  });

  it('400 si allowOutside est une chaine', async () => {
    mockHappyPath();
    const res = await POST(makeRequest({ projectId: 'p1', components: [C1], allowOutside: 'oui' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'allowOutside doit être un booléen' });
  });

  it('200 : verified et backup remontes', async () => {
    mockHappyPath();
    vi.mocked(placeFootprints).mockResolvedValue({
      ok: true,
      message: 'placed 2',
      footprintCount: 2,
      verified: 2,
      backup: 'y.bak',
    });

    const res = await POST(makeRequest({ projectId: 'p1', components: [C1] }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.verified).toBe(2);
    expect(data.backup).toBe('y.bak');
  });
});
