import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const findComponents = vi.fn();
const deleteNets = vi.fn();
const createNets = vi.fn();
const updateProject = vi.fn();
const callGroq = vi.fn();
const hasLlmProvider = vi.fn();
const getCache = vi.fn();
const setCache = vi.fn();
const acquireGuard = vi.fn();
const hashKey = vi.fn();
const getPads = vi.fn();
const inferRole = vi.fn();
const assignBoardNets = vi.fn();
const existsSync = vi.fn();
const writeFileSync = vi.fn();
const unlinkSync = vi.fn();

vi.mock('@/lib/auth-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => updateProject(...a),
    },
    pcbComponent: { findMany: (...a: unknown[]) => findComponents(...a) },
    pcbNet: {
      deleteMany: (...a: unknown[]) => deleteNets(...a),
      createMany: (...a: unknown[]) => createNets(...a),
    },
  },
}));
vi.mock('@/lib/ai/groq-client', () => ({
  callGroq: (...a: unknown[]) => callGroq(...a),
  hasLlmProvider: (...a: unknown[]) => hasLlmProvider(...a),
}));
vi.mock('@/lib/utils/llm-guard', () => ({
  acquireLlmGuard: (...a: unknown[]) => acquireGuard(...a),
  hashKey: (...a: unknown[]) => hashKey(...a),
}));
vi.mock('@/lib/utils/llm-cache', () => ({
  getLlmCacheAsync: (...a: unknown[]) => getCache(...a),
  setLlmCacheAsync: (...a: unknown[]) => setCache(...a),
}));
vi.mock('@/lib/pcb/kicad-footprints', () => ({
  getFootprintPadNumbers: (...a: unknown[]) => getPads(...a),
}));
vi.mock('@/lib/pcb/placement', () => ({
  inferPlacementRole: (...a: unknown[]) => inferRole(...a),
}));
vi.mock('@/lib/pcb/kicad-bridge', () => ({
  assignBoardNets: (...a: unknown[]) => assignBoardNets(...a),
}));
vi.mock('node:fs', () => ({
  existsSync: (...a: unknown[]) => existsSync(...a),
  writeFileSync: (...a: unknown[]) => writeFileSync(...a),
  unlinkSync: (...a: unknown[]) => unlinkSync(...a),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { POST } from './route';

const nets = [{ name: 'GND', pins: ['U1.1', 'C1.1'], source: 'llm' }];

function request() {
  return new Request('http://localhost/api/pcb/requirements/nets-only', {
    method: 'POST',
    body: JSON.stringify({ projectId: 'proj-1' }),
  });
}

describe('POST /api/pcb/requirements/nets-only — affectation au layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
    findUnique.mockResolvedValue({
      id: 'proj-1',
      sourcingCache: null,
      description: '',
      kicadFilePath: 'C:/data/carte.kicad_pcb',
    });
    findComponents.mockResolvedValue([
      { reference: 'U1', name: 'Régulateur', footprint: 'Package_TO_SOT_SMD:SOT-23' },
      { reference: 'C1', name: '100n', footprint: 'Capacitor_SMD:C_0805' },
    ]);
    hasLlmProvider.mockReturnValue(true);
    hashKey.mockReturnValue('k');
    acquireGuard.mockReturnValue({ ok: true, release: vi.fn() });
    getPads.mockReturnValue(['1', '2']);
    inferRole.mockReturnValue('ic');
    existsSync.mockReturnValue(true);
    writeFileSync.mockImplementation(() => {});
    unlinkSync.mockImplementation(() => {});
    assignBoardNets.mockResolvedValue({ ok: true, assignedPads: 2, missingPins: 0 });
    deleteNets.mockResolvedValue({ count: 0 });
    createNets.mockResolvedValue({ count: 1 });
    updateProject.mockResolvedValue({ id: 'proj-1' });
    setCache.mockResolvedValue(undefined);
    callGroq.mockResolvedValue({
      content: JSON.stringify({ nets: [{ name: 'GND', pins: ['U1.1', 'C1.1'] }] }),
    });
  });

  it('assigne les nets mis en cache aux pads du plateau', async () => {
    getCache.mockResolvedValue({ nets });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(assignBoardNets).toHaveBeenCalledWith(
      'C:/data/carte.kicad_pcb',
      expect.stringContaining('partiva-nets-only-'),
    );
    const body = (await res.json()) as { boardAssigned: boolean; cached: boolean };
    expect(body.cached).toBe(true);
    expect(body.boardAssigned).toBe(true);
  });

  it('assigne les nets fraîchement générés et les persiste en BDD', async () => {
    getCache.mockResolvedValue(null);
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(createNets).toHaveBeenCalled();
    expect(assignBoardNets).toHaveBeenCalled();
    const body = (await res.json()) as { boardAssigned: boolean; boardPads: number };
    expect(body.boardAssigned).toBe(true);
    expect(body.boardPads).toBe(2);
  });

  it('reste valide en BDD si KiCad Python est indisponible', async () => {
    getCache.mockResolvedValue(null);
    assignBoardNets.mockResolvedValue({ ok: false, error: 'Python KiCad introuvable' });
    const res = await POST(request());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; boardAssigned: boolean; boardError: string };
    expect(body.ok).toBe(true);
    expect(body.boardAssigned).toBe(false);
    expect(body.boardError).toContain('Python');
  });
});
