import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-server', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    part: { create: vi.fn() },
    reconstructionAttempt: { create: vi.fn() },
  },
}));

import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/engine/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/engine/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si paramètres manquants', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ role: 'ADMIN' } as never);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('valide : crée Part + ReconstructionAttempt (SUCCESS)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ role: 'ADMIN' } as never);
    vi.mocked(prisma.part.create).mockResolvedValue({ id: 'part-1' } as never);
    vi.mocked(prisma.reconstructionAttempt.create).mockResolvedValue({} as never);

    const res = await POST(
      makeRequest({
        requestId: 'req-1',
        result: {
          ingest: { description: 'Test' },
          reconstruct: { candidates: [{ fileUrl: 'stl-url' }] },
        },
        action: 'validate',
      }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.partId).toBe('part-1');
    expect(prisma.part.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', printableModelUrl: 'stl-url' }),
      }),
    );
    expect(prisma.reconstructionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ decision: 'VALIDATED', status: 'SUCCESS' }),
      }),
    );
  });

  it('invalide : crée ReconstructionAttempt (FAILED)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ role: 'ADMIN' } as never);
    vi.mocked(prisma.reconstructionAttempt.create).mockResolvedValue({} as never);

    const res = await POST(
      makeRequest({
        requestId: 'req-1',
        result: { ingest: { description: 'Test' } },
        action: 'invalidate',
      }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.reconstructionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ decision: 'REJECTED', status: 'FAILED' }),
      }),
    );
  });
});
