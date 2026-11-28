import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const findProject = vi.fn();
const updateProject = vi.fn();

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: (...a: unknown[]) => requireAdminMock(...a),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: {
      findUnique: (...a: unknown[]) => findProject(...a),
      update: (...a: unknown[]) => updateProject(...a),
    },
  },
}));

import { POST } from './route';

const complete = ['usage', 'function', 'processing', 'mechanical', 'manufacturing', 'quality'].map(
  (category) => ({ category, key: `${category}_key`, value: 'valeur', status: 'confirmed' }),
);

function request() {
  return new Request('http://localhost/api/pcb/requirements/validate', {
    method: 'POST',
    body: JSON.stringify({ projectId: 'p1' }),
  });
}

describe('POST /api/pcb/requirements/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ role: 'ADMIN' });
    updateProject.mockResolvedValue({ id: 'p1' });
    findProject.mockResolvedValue({ id: 'p1', status: 'draft', requirements: complete });
  });

  it('refuse un CDC incomplet avec la liste des manquants', async () => {
    findProject.mockResolvedValue({
      id: 'p1',
      status: 'draft',
      requirements: complete.slice(0, 4),
    });
    const res = await POST(request());
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string; missing: string[] };
    expect(body.error).toBe('CDC_INCOMPLETE');
    expect(body.missing.length).toBeGreaterThan(0);
    expect(updateProject).not.toHaveBeenCalled();
  });

  it('pose le statut requirements_validated quand tout est confirmé', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: 'requirements_validated',
    });
    expect(updateProject).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: 'requirements_validated' },
    });
  });

  it('est idempotent si le statut est déjà validé', async () => {
    findProject.mockResolvedValue({ id: 'p1', status: 'requirements_validated', requirements: [] });
    const res = await POST(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, alreadyValidated: true });
    expect(updateProject).not.toHaveBeenCalled();
  });
});
