import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const findProject = vi.fn();
const createRequirement = vi.fn();

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: (...a: unknown[]) => requireAdminMock(...a),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...a: unknown[]) => findProject(...a) },
    pcbRequirement: { create: (...a: unknown[]) => createRequirement(...a) },
  },
}));

import { POST } from './route';

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/pcb/requirements/add', {
    method: 'POST',
    body: JSON.stringify({ projectId: 'p1', ...body }),
  });
}

describe('POST /api/pcb/requirements/add', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ role: 'ADMIN' });
    findProject.mockResolvedValue({ id: 'p1' });
    createRequirement.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'req-new',
      ...data,
    }));
  });

  it('ajoute un champ saisi par l’utilisateur comme confirmé', async () => {
    const res = await POST(
      request({ category: 'manufacturing', key: 'Quantité prévue', value: '100 cartes' }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(createRequirement).toHaveBeenCalledWith({
      data: {
        projectId: 'p1',
        category: 'manufacturing',
        key: 'Quantité prévue',
        value: '100 cartes',
        status: 'confirmed',
        source: 'manual',
      },
    });
  });

  it('refuse une catégorie inconnue', async () => {
    const res = await POST(request({ category: 'inconnue', key: 'X', value: 'Y' }));
    expect(res.status).toBe(400);
    expect(createRequirement).not.toHaveBeenCalled();
  });

  it('refuse une valeur vide', async () => {
    const res = await POST(request({ category: 'quality', key: 'Tests', value: '  ' }));
    expect(res.status).toBe(400);
    expect(createRequirement).not.toHaveBeenCalled();
  });
});
