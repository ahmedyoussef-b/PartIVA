import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const updateProject = vi.fn();
const catalogFindMany = vi.fn();
const deleteNets = vi.fn();
const createNets = vi.fn();
const countNets = vi.fn();
const callGroq = vi.fn();
const hasLlmProvider = vi.fn();
const acquireGuard = vi.fn();
const hashKey = vi.fn();
const getPads = vi.fn();
const getSize = vi.fn();
const resolveFootprint = vi.fn();

vi.mock('@/lib/auth-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => updateProject(...a),
    },
    pcbNet: {
      deleteMany: (...a: unknown[]) => deleteNets(...a),
      createMany: (...a: unknown[]) => createNets(...a),
      count: (...a: unknown[]) => countNets(...a),
    },
    componentCatalog: { findMany: (...a: unknown[]) => catalogFindMany(...a) },
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
vi.mock('@/lib/pcb/kicad-footprints', () => ({
  getFootprintPadNumbers: (...a: unknown[]) => getPads(...a),
  getFootprintSize: (...a: unknown[]) => getSize(...a),
  resolveKicadFootprint: (...a: unknown[]) => resolveFootprint(...a),
}));
vi.mock('@/lib/pcb/placement', () => ({
  optimizePlacement: (items: Array<Record<string, unknown>>) =>
    items.map((item) => ({ ...item, xMm: 10, yMm: 10, rotation: 0 })),
  inferPlacementRole: () => 'ic',
  buildHints: () => ({}),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { POST } from './route';

const componentU2 = {
  type: 'Régulateur',
  reference: 'U2',
  value: '5V',
  libName: 'Package_TO_SOT_THT',
  footprintName: 'TO-220-3_Vertical',
  quantity: 1,
  xMm: 10,
  yMm: 10,
  rotation: 0,
  rationale: 'alimentation',
  searchKeyword: 'regulator',
};

const componentC1 = {
  type: 'Condensateur',
  reference: 'C1',
  value: '100nF',
  libName: 'Capacitor_SMD',
  footprintName: 'C_0603_1608Metric',
  quantity: 1,
  xMm: 20,
  yMm: 10,
  rotation: 0,
  rationale: 'découplage',
  searchKeyword: 'capacitor',
};

function request(body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/pcb/requirements/source-components', {
    method: 'POST',
    body: JSON.stringify({ projectId: 'proj-1', ...body }),
  });
}

function llmResponse(payload: unknown) {
  return { content: JSON.stringify(payload) };
}

describe('POST /api/pcb/requirements/source-components — validation des pads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PARTIVA_KICAD_BOARD;
    vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
    findUnique.mockResolvedValue({
      id: 'proj-1',
      description: 'Station de surveillance',
      sourcingCache: null,
      kicadFilePath: null,
    });
    updateProject.mockResolvedValue({ id: 'proj-1' });
    catalogFindMany.mockResolvedValue([]);
    deleteNets.mockResolvedValue({ count: 0 });
    createNets.mockResolvedValue({ count: 1 });
    countNets.mockResolvedValue(0);
    hasLlmProvider.mockReturnValue(true);
    acquireGuard.mockReturnValue({ ok: true, release: vi.fn() });
    hashKey.mockReturnValue('hash');
    getSize.mockReturnValue({ widthMm: 5, heightMm: 5 });
    getPads.mockImplementation((_lib: string, fp: string) => {
      if (fp.includes('TO-220')) return ['1', '2', '3'];
      if (fp.includes('0603')) return ['1', '2'];
      return [];
    });
    resolveFootprint.mockImplementation((lib: string, fp: string) => ({
      libName: lib,
      footprintName: fp,
      corrected: false,
      strategy: 'exact',
      proposed: `${lib}:${fp}`,
    }));
  });

  it('retire U2.4 sur un TO-220 lisible sans marquer le composant toVerify', async () => {
    callGroq
      .mockResolvedValueOnce(
        llmResponse({
          components: [componentU2, componentC1],
          nets: [
            { name: 'VCC', pins: ['U2.1', 'C1.1'] },
            { name: 'GND', pins: ['U2.2', 'C1.2'] },
          ],
        }),
      )
      .mockResolvedValueOnce(
        llmResponse({
          nets: [
            { name: 'VCC', pins: ['U2.4', 'C1.1'] },
            { name: 'GND', pins: ['U2.2', 'C1.2'] },
          ],
        }),
      );

    const res = await POST(request());
    const body = (await res.json()) as {
      nets: Array<{ name: string; pins: string[] }>;
      droppedPins: number;
      netlistReport: {
        code?: string;
        invalidPins: Array<Record<string, unknown>>;
        droppedNets: Array<Record<string, unknown>>;
        toVerify: string[];
      };
    };

    expect(res.status).toBe(200);
    expect(body.nets).toEqual([{ name: 'GND', pins: ['U2.2', 'C1.2'] }]);
    expect(body.droppedPins).toBe(1);
    expect(body.netlistReport.code).toBe('INVALID_PINS');
    expect(body.netlistReport.invalidPins).toEqual([
      {
        net: 'VCC',
        ref: 'U2',
        pin: 'U2.4',
        reason: 'PAD_NOT_FOUND',
        available: ['1', '2', '3'],
      },
    ]);
    expect(body.netlistReport.droppedNets).toEqual([
      { name: 'VCC', pins: ['U2.4', 'C1.1'], reason: 'NET_TOO_SHORT' },
    ]);
    expect(body.netlistReport.toVerify).toEqual([]);
    expect(callGroq).toHaveBeenCalledTimes(2);
  });

  it('conserve les pins d’une empreinte illisible et marque le composant toVerify', async () => {
    getPads.mockImplementation((_lib: string, fp: string) => {
      if (fp.includes('TO-220')) return [];
      if (fp.includes('0603')) return ['1', '2'];
      return [];
    });
    callGroq
      .mockResolvedValueOnce(
        llmResponse({
          components: [componentU2, componentC1],
          nets: [
            { name: 'VCC', pins: ['U2.1', 'C1.1'] },
            { name: 'GND', pins: ['U2.2', 'C1.2'] },
          ],
        }),
      )
      .mockResolvedValueOnce(
        llmResponse({
          nets: [
            { name: 'VCC', pins: ['U2.4', 'C1.1'] },
            { name: 'GND', pins: ['U2.2', 'C1.2'] },
          ],
        }),
      );

    const res = await POST(request());
    const body = (await res.json()) as {
      nets: Array<{ name: string; pins: string[] }>;
      droppedPins: number;
      netlistReport: {
        invalidPins: unknown[];
        unreadableFootprints: Array<{ ref: string; footprint: string }>;
        toVerify: string[];
      };
    };

    expect(res.status).toBe(200);
    expect(body.nets).toHaveLength(2);
    expect(body.droppedPins).toBe(0);
    expect(body.netlistReport.invalidPins).toEqual([]);
    expect(body.netlistReport.unreadableFootprints).toEqual([
      { ref: 'U2', footprint: 'Package_TO_SOT_THT:TO-220-3_Vertical' },
    ]);
    expect(body.netlistReport.toVerify).toContain('U2');
  });

  it('marque toVerify quand l’empreinte vient d’un fallback', async () => {
    resolveFootprint.mockImplementation((lib: string, fp: string, ref: string) => {
      if (ref === 'U2') {
        return {
          libName: 'Package_TO_SOT_THT',
          footprintName: 'TO-220-3_Vertical',
          corrected: true,
          strategy: 'fallback',
          proposed: `${lib}:${fp}`,
        };
      }
      return {
        libName: lib,
        footprintName: fp,
        corrected: false,
        strategy: 'exact',
        proposed: `${lib}:${fp}`,
      };
    });
    callGroq
      .mockResolvedValueOnce(
        llmResponse({
          components: [componentU2, componentC1],
          nets: [
            { name: 'VCC', pins: ['U2.1', 'C1.1'] },
            { name: 'GND', pins: ['U2.2', 'C1.2'] },
          ],
        }),
      )
      .mockResolvedValueOnce(
        llmResponse({
          nets: [
            { name: 'VCC', pins: ['U2.1', 'C1.1'] },
            { name: 'GND', pins: ['U2.2', 'C1.2'] },
          ],
        }),
      );

    const res = await POST(request());
    const body = (await res.json()) as {
      components: Array<{ reference: string; toVerify?: boolean }>;
      netlistReport: { toVerify: string[]; invalidPins: unknown[] };
    };

    expect(res.status).toBe(200);
    expect(body.netlistReport.toVerify).toContain('U2');
    expect(body.netlistReport.invalidPins).toEqual([]);
    expect(body.components.find((c) => c.reference === 'U2')?.toVerify).toBe(true);
  });

  it('renvoie 422 avec le rapport et la proposition brute quand aucun net ne survit', async () => {
    callGroq
      .mockResolvedValueOnce(
        llmResponse({
          components: [componentU2, componentC1],
          nets: [{ name: 'VCC', pins: ['U2.4', 'C1.9'] }],
        }),
      )
      .mockResolvedValueOnce(llmResponse({ nets: [{ name: 'VCC', pins: ['U2.4', 'C1.9'] }] }))
      .mockResolvedValueOnce(llmResponse({ nets: [{ name: 'VCC', pins: ['U2.4', 'C1.9'] }] }));

    const res = await POST(request());
    const body = (await res.json()) as {
      error: string;
      components: unknown[];
      nets: unknown[];
      netsMissing: boolean;
      netlistReport: { code?: string; invalidPins: unknown[] };
      rawProposal: Array<{ name: string; pins: string[] }>;
    };

    expect(res.status).toBe(422);
    expect(body.error).toBe('LLM_NETLIST_EMPTY');
    expect(body.components).toHaveLength(2);
    expect(body.nets).toEqual([]);
    expect(body.netsMissing).toBe(true);
    expect(body.netlistReport.code).toBe('INVALID_PINS');
    expect(body.netlistReport.invalidPins.length).toBeGreaterThan(0);
    expect(body.rawProposal).toEqual([{ name: 'VCC', pins: ['U2.4', 'C1.9'] }]);
    expect(callGroq).toHaveBeenCalledTimes(3);
  });

  it('rejoue la validation sur cache hit sans rappeler le LLM', async () => {
    findUnique.mockResolvedValue({
      id: 'proj-1',
      description: 'Station de surveillance',
      kicadFilePath: null,
      sourcingCache: {
        cacheVersion: 3,
        cdcHash: 'hash',
        components: [componentU2, componentC1],
        nets: [
          { name: 'VCC', pins: ['U2.4', 'C1.1'] },
          { name: 'GND', pins: ['U2.2', 'C1.2'] },
        ],
        netlistReport: null,
        rawProposal: [{ name: 'VCC', pins: ['U2.4', 'C1.1'] }],
      },
    });

    const res = await POST(request());
    const body = (await res.json()) as {
      cached: boolean;
      nets: Array<{ name: string; pins: string[] }>;
      netlistReport: { invalidPins: unknown[] };
    };

    expect(res.status).toBe(200);
    expect(body.cached).toBe(true);
    expect(body.nets).toEqual([{ name: 'GND', pins: ['U2.2', 'C1.2'] }]);
    expect(body.netlistReport.invalidPins.length).toBe(1);
    expect(callGroq).not.toHaveBeenCalled();
    expect(updateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourcingCache: expect.objectContaining({ cacheVersion: 3 }),
        }),
      }),
    );
  });
});
