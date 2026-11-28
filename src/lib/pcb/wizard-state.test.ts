import { beforeEach, describe, expect, it, vi } from 'vitest';

const findProject = vi.fn();
const findValidations = vi.fn();
const existsSync = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...a: unknown[]) => findProject(...a) },
    pcbWizardValidation: { findMany: (...a: unknown[]) => findValidations(...a) },
  },
}));
vi.mock('node:fs', () => ({
  existsSync: (...a: unknown[]) => existsSync(...a),
  readFileSync: vi.fn(),
}));
vi.mock('./simulation', () => ({
  analyzeRealState: () => ({ isCompliant: true, violations: [] }),
}));

import { computeWizardState } from './wizard-state';

const baseProject = {
  id: 'p1',
  status: 'draft',
  kicadFilePath: null,
  components: [],
  nets: [],
  sourcingCache: null,
};

describe('computeWizardState — gating CDC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findValidations.mockResolvedValue([]);
    existsSync.mockReturnValue(false);
  });

  it('un seul bloc rempli ne vaut pas CDC validé', async () => {
    findProject.mockResolvedValue({
      ...baseProject,
      requirements: [
        { category: 'usage', key: 'usage_type', value: 'prototype', status: 'confirmed' },
      ],
    });
    const state = await computeWizardState('p1');
    expect(state?.cdcValidated).toBe(false);
    expect(state?.nextActionId).toBe('analyze');
  });

  it('le statut requirements_validated avec exigences confirmées ouvre le layout', async () => {
    const categories = [
      'usage',
      'function',
      'processing',
      'mechanical',
      'manufacturing',
      'quality',
    ];
    findProject.mockResolvedValue({
      ...baseProject,
      status: 'requirements_validated',
      requirements: categories.map((category) => ({
        category,
        key: `${category}_key`,
        value: 'valeur',
        status: 'confirmed',
      })),
    });
    const state = await computeWizardState('p1');
    expect(state?.cdcValidated).toBe(true);
    expect(state?.nextActionId).toBe('components');
  });
});
