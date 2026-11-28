import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const findProject = vi.fn();
const updateMany = vi.fn();

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: (...a: unknown[]) => requireAdminMock(...a),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...a: unknown[]) => findProject(...a) },
    pcbRequirement: { updateMany: (...a: unknown[]) => updateMany(...a) },
  },
}));

import { POST } from './route';

function request(projectId = 'p1') {
  return new Request('http://localhost/api/pcb/requirements/confirm-all', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  });
}

describe('POST /api/pcb/requirements/confirm-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ role: 'ADMIN' });
    findProject.mockResolvedValue({ id: 'p1' });
    updateMany.mockResolvedValue({ count: 6 });
  });

  it('confirme toutes les exigences non confirmées', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, confirmed: 6 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { projectId: 'p1', status: { not: 'confirmed' } },
      data: { status: 'confirmed' },
    });
  });

  it('refuse un projet introuvable', async () => {
    findProject.mockResolvedValue(null);
    const res = await POST(request());
    expect(res.status).toBe(404);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
