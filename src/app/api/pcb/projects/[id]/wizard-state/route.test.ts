import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const findManyValidations = vi.fn();
const existsSync = vi.fn();
const readFileSync = vi.fn();

vi.mock('@/lib/auth-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...args: unknown[]) => findUnique(...args) },
    pcbWizardValidation: { findMany: (...args: unknown[]) => findManyValidations(...args) },
  },
}));
vi.mock('node:fs', () => ({
  existsSync: (...args: unknown[]) => existsSync(...args),
  readFileSync: (...args: unknown[]) => readFileSync(...args),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { GET } from './route';

const PARAMS = { params: Promise.resolve({ id: 'proj-1' }) };
const BOARD = 'C:/data/pcb-work/proj-1/carte-test.kicad_pcb';

function mockProject() {
  findUnique.mockResolvedValue({
    id: 'proj-1',
    name: 'Test',
    status: 'draft',
    kicadFilePath: BOARD,
    sourcingCache: null,
    components: [{ reference: 'R1', footprint: '0805' }],
    nets: [{ name: 'GND', source: 'llm' }],
    requirements: [{ id: 'req-1' }],
  });
  findManyValidations.mockResolvedValue([]);
  existsSync.mockReturnValue(true);
}

async function state() {
  const res = await GET(
    new Request('http://localhost/api/pcb/projects/proj-1/wizard-state'),
    PARAMS,
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    ok: boolean;
    state: { nextActionId: string; tracks: number };
  };
  return body.state;
}

describe('GET /api/pcb/projects/[id]/wizard-state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
  });

  it('exige un administrateur', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(
      new Request('http://localhost/api/pcb/projects/proj-1/wizard-state'),
      PARAMS,
    );
    expect(res.status).toBe(401);
  });

  it('demande le routage quand le plateau a des composants mais aucune piste', async () => {
    mockProject();
    readFileSync.mockImplementation((p: string) => {
      if (String(p).endsWith('.drc.json')) return '{"violations":[]}';
      return '(kicad_pcb (footprint "R1"))';
    });
    const s = await state();
    expect(s.tracks).toBe(0);
    expect(s.nextActionId).toBe('route');
  });

  it('avance à la revue dès qu’une piste est écrite sur le plateau', async () => {
    mockProject();
    readFileSync.mockImplementation((p: string) => {
      if (String(p).endsWith('.drc.json')) return '{"violations":[]}';
      return '(kicad_pcb (footprint "R1") (segment (start 0 0) (end 1 1)))';
    });
    const s = await state();
    expect(s.tracks).toBe(1);
    expect(s.nextActionId).toBe('review');
  });

  it('signale un projet introuvable', async () => {
    findUnique.mockResolvedValue(null);
    const res = await GET(
      new Request('http://localhost/api/pcb/projects/proj-1/wizard-state'),
      PARAMS,
    );
    expect(res.status).toBe(404);
  });
});
