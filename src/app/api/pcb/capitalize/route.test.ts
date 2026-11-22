import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: vi.fn(),
}));

const { saveMock } = vi.hoisted(() => ({ saveMock: vi.fn() }));

vi.mock('@/lib/pcb/capitalize', () => ({
  saveAccomplishedSnapshot: (...a: unknown[]) => saveMock(...a),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { POST } from './route';

function mockAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
}

function req(body: unknown) {
  return new NextRequest('http://localhost/api/pcb/capitalize', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function rawReq(raw: string) {
  return new NextRequest('http://localhost/api/pcb/capitalize', { method: 'POST', body: raw });
}

function mockSaved() {
  saveMock.mockResolvedValue({
    checkpointId: 'cp1',
    snapshot: {
      kind: 'accomplished-project',
      regime: 'internal',
      components: [{}, {}],
      acceptedProposals: [{}],
    },
  });
}

describe('POST /api/pcb/capitalize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 401 sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await POST(req({ projectId: 'p1' }));
    expect(res.status).toBe(401);
  });

  it('2. 403 Forbidden', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await POST(req({ projectId: 'p1' }));
    expect(res.status).toBe(403);
  });

  it('3. 400 body JSON invalide', async () => {
    mockAdmin();
    const res = await POST(rawReq('not-json'));
    expect(res.status).toBe(400);
  });

  it('4. 400 projectId manquant', async () => {
    mockAdmin();
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'projectId requis' });
  });

  it('5. 400 regime invalide', async () => {
    mockAdmin();
    const res = await POST(req({ projectId: 'p1', regime: 'autre' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "regime doit valoir 'internal' ou 'reference'",
    });
  });

  it('6. 400 regime reference sans licence', async () => {
    mockAdmin();
    const res = await POST(req({ projectId: 'p1', regime: 'reference' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'licence requise pour un modèle de référence',
    });
  });

  it('7. 404 si saveAccomplishedSnapshot renvoie null', async () => {
    mockAdmin();
    saveMock.mockResolvedValue(null);
    const res = await POST(req({ projectId: 'p1' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Projet introuvable' });
  });

  it('8. 200 regime internal par défaut', async () => {
    mockAdmin();
    mockSaved();

    const res = await POST(req({ projectId: 'p1' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      checkpointId: 'cp1',
      kind: 'accomplished-project',
      regime: 'internal',
      components: 2,
      acceptedProposals: 1,
    });
    expect(saveMock).toHaveBeenCalledWith('p1', { regime: 'internal', licence: null });
  });

  it('9. 200 regime reference + licence transmis', async () => {
    mockAdmin();
    saveMock.mockResolvedValue({
      checkpointId: 'cp2',
      snapshot: {
        kind: 'accomplished-project',
        regime: 'reference',
        components: [],
        acceptedProposals: [],
      },
    });

    const res = await POST(req({ projectId: 'p1', regime: 'reference', licence: 'CC-BY-SA-4.0' }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.regime).toBe('reference');
    expect(saveMock).toHaveBeenCalledWith('p1', { regime: 'reference', licence: 'CC-BY-SA-4.0' });
  });

  it('licence vide (chaîne blanche) → 400 pour regime reference', async () => {
    mockAdmin();
    const res = await POST(req({ projectId: 'p1', regime: 'reference', licence: '   ' }));
    expect(res.status).toBe(400);
  });

  it('500 si saveAccomplishedSnapshot throw', async () => {
    mockAdmin();
    saveMock.mockRejectedValue(new Error('db down'));
    const res = await POST(req({ projectId: 'p1' }));
    expect(res.status).toBe(500);
  });
});
