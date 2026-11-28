import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const getCurrentUserMock = vi.fn();
const findProject = vi.fn();
const findValidations = vi.fn();
const upsertValidation = vi.fn();
const deleteValidations = vi.fn();

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: (...a: unknown[]) => requireAdminMock(...a),
}));
vi.mock('@/lib/auth-server', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUserMock(...a),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...a: unknown[]) => findProject(...a) },
    pcbWizardValidation: {
      findMany: (...a: unknown[]) => findValidations(...a),
      upsert: (...a: unknown[]) => upsertValidation(...a),
      deleteMany: (...a: unknown[]) => deleteValidations(...a),
    },
  },
}));

import { POST } from './route';

function request(step: string, unvalidate = false) {
  return new Request('http://localhost/api/pcb/wizard/validate', {
    method: 'POST',
    body: JSON.stringify({ projectId: 'p1', step, unvalidate }),
  });
}

describe('POST /api/pcb/wizard/validate — validation ordonnée', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ role: 'ADMIN' });
    getCurrentUserMock.mockResolvedValue({ email: 'admin@partiva.tn' });
    findValidations.mockResolvedValue([]);
    upsertValidation.mockResolvedValue({ projectId: 'p1', step: 'analyze' });
    deleteValidations.mockResolvedValue({ count: 1 });
    findProject.mockResolvedValue({ id: 'p1', status: 'draft', requirements: [] });
  });

  it('refuse nets si analyze n’est pas validée', async () => {
    const res = await POST(request('nets'));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: 'STEP_LOCKED', missing: ['analyze'] });
    expect(upsertValidation).not.toHaveBeenCalled();
  });

  it('refuse analyze si le CDC n’est pas validé', async () => {
    const res = await POST(request('analyze'));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: 'STEP_LOCKED' });
    expect(upsertValidation).not.toHaveBeenCalled();
  });

  it('autorise analyze quand le CDC est validé, puis la chaîne dans l’ordre', async () => {
    findProject.mockResolvedValue({ id: 'p1', status: 'requirements_validated', requirements: [] });
    const first = await POST(request('analyze'));
    expect(first.status).toBe(200);
    expect(upsertValidation).toHaveBeenCalledTimes(1);

    findValidations.mockResolvedValue([{ step: 'analyze' }]);
    const second = await POST(request('nets'));
    expect(second.status).toBe(200);

    findValidations.mockResolvedValue([{ step: 'analyze' }, { step: 'nets' }]);
    const third = await POST(request('routing'));
    expect(third.status).toBe(409);
    await expect(third.json()).resolves.toMatchObject({
      error: 'STEP_LOCKED',
      missing: ['placement'],
    });
  });

  it('la dévalidation reste possible', async () => {
    const res = await POST(request('analyze', true));
    expect(res.status).toBe(200);
    expect(deleteValidations).toHaveBeenCalledWith({ where: { projectId: 'p1', step: 'analyze' } });
  });
});
