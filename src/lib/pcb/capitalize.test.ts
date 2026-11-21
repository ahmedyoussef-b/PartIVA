import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findUniqueMock,
  requestFindUniqueMock,
  proposalFindManyMock,
  checkpointDeleteManyMock,
  checkpointCreateMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  requestFindUniqueMock: vi.fn(),
  proposalFindManyMock: vi.fn(),
  checkpointDeleteManyMock: vi.fn(),
  checkpointCreateMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...a: unknown[]) => findUniqueMock(...a) },
    request: { findUnique: (...a: unknown[]) => requestFindUniqueMock(...a) },
    pcbProposal: { findMany: (...a: unknown[]) => proposalFindManyMock(...a) },
    pcbCheckpoint: {
      deleteMany: (...a: unknown[]) => checkpointDeleteManyMock(...a),
      create: (...a: unknown[]) => checkpointCreateMock(...a),
    },
  },
}));

import {
  buildAccomplishedSnapshot,
  loadSnapshotInput,
  saveAccomplishedSnapshot,
} from './capitalize';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const MINIMAL_INPUT = {
  project: {
    id: 'p1',
    name: 'Carte test',
    status: 'manufacturing_ready',
    kicadFilePath: 'C:\\b.kicad_pcb',
  },
  cdc: null,
  requirements: [],
  acceptedProposals: [],
  components: [],
  nets: [],
  now: NOW,
};

describe('buildAccomplishedSnapshot (pur)', () => {
  it('1. build minimal → kind/version/regime internal/licence null', () => {
    const s = buildAccomplishedSnapshot(MINIMAL_INPUT);
    expect(s.kind).toBe('accomplished-project');
    expect(s.version).toBe(1);
    expect(s.regime).toBe('internal');
    expect(s.licence).toBeNull();
    expect(s.createdAt).toBe(NOW.toISOString());
  });

  it('2. options regime reference + licence', () => {
    const s = buildAccomplishedSnapshot(MINIMAL_INPUT, {
      regime: 'reference',
      licence: 'CC-BY-SA-4.0',
    });
    expect(s.regime).toBe('reference');
    expect(s.licence).toBe('CC-BY-SA-4.0');
  });

  it('3. acceptedProposals : resolvedAt Date → ISO', () => {
    const s = buildAccomplishedSnapshot({
      ...MINIMAL_INPUT,
      acceptedProposals: [
        {
          id: 'pr1',
          action: 'add_component',
          target: 'pcb_project',
          payload: { reference: 'R1' },
          reason: 'ok',
          resolvedAt: new Date('2026-02-03T04:05:06.000Z'),
        },
      ],
    });
    expect(s.acceptedProposals[0]?.resolvedAt).toBe('2026-02-03T04:05:06.000Z');
  });

  it('4. resolvedAt null → null conservé', () => {
    const s = buildAccomplishedSnapshot({
      ...MINIMAL_INPUT,
      acceptedProposals: [
        {
          id: 'pr1',
          action: 'add_net',
          target: 'pcb_project',
          payload: {},
          reason: null,
          resolvedAt: null,
        },
      ],
    });
    expect(s.acceptedProposals[0]?.resolvedAt).toBeNull();
  });

  it('5. createdAt = now injecté', () => {
    const s = buildAccomplishedSnapshot({
      ...MINIMAL_INPUT,
      now: new Date('2030-12-31T23:59:59.000Z'),
    });
    expect(s.createdAt).toBe('2030-12-31T23:59:59.000Z');
  });

  it('6. components avec positions null → conservées', () => {
    const s = buildAccomplishedSnapshot({
      ...MINIMAL_INPUT,
      components: [
        {
          reference: 'R1',
          name: 'Résistance',
          catalogId: null,
          symbol: null,
          footprint: 'Resistor_SMD:R_0603_1608Metric',
          positionX: null,
          positionY: null,
          rotation: null,
          status: 'proposed',
        },
      ],
    });
    expect(s.components[0]?.positionX).toBeNull();
    expect(s.components[0]?.rotation).toBeNull();
  });

  it('7. cdc null accepté par le schéma', () => {
    const s = buildAccomplishedSnapshot(MINIMAL_INPUT);
    expect(s.cdc).toBeNull();
  });

  it('8. snapshot invalide (champ manquant) → Zod throw', () => {
    const broken = { ...MINIMAL_INPUT } as Record<string, unknown>;
    delete broken.project;
    expect(() => buildAccomplishedSnapshot(broken as never)).toThrow();
  });
});

describe('saveAccomplishedSnapshot (I/O)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('9. deleteMany appelé AVANT create, label accomplished', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'p1',
      name: 'Carte',
      status: 'draft',
      kicadFilePath: null,
      requestId: null,
      requirements: [],
      components: [],
      nets: [],
    });
    proposalFindManyMock.mockResolvedValue([]);
    checkpointDeleteManyMock.mockResolvedValue({ count: 0 });
    checkpointCreateMock.mockResolvedValue({ id: 'cp1' });

    const result = await saveAccomplishedSnapshot('p1');

    expect(result?.checkpointId).toBe('cp1');
    expect(checkpointDeleteManyMock).toHaveBeenCalledWith({
      where: { projectId: 'p1', label: 'accomplished' },
    });
    expect(checkpointCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: 'p1', label: 'accomplished' }),
      }),
    );

    const deleteOrder = checkpointDeleteManyMock.mock.invocationCallOrder[0];
    const createOrder = checkpointCreateMock.mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(createOrder ?? Infinity);
  });

  it('10. projet inexistant → null, aucun create', async () => {
    findUniqueMock.mockResolvedValue(null);
    const result = await saveAccomplishedSnapshot('nope');
    expect(result).toBeNull();
    expect(checkpointCreateMock).not.toHaveBeenCalled();
  });

  it('requestId → requête séparée (jamais include)', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'p1',
      name: 'Carte',
      status: 'draft',
      kicadFilePath: null,
      requestId: 'req1',
      requirements: [],
      components: [],
      nets: [],
    });
    requestFindUniqueMock.mockResolvedValue({ id: 'req1', partDescription: 'CDC client brut' });
    proposalFindManyMock.mockResolvedValue([]);
    checkpointDeleteManyMock.mockResolvedValue({ count: 0 });
    checkpointCreateMock.mockResolvedValue({ id: 'cp2' });

    const result = await saveAccomplishedSnapshot('p1');

    expect(requestFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'req1' },
      select: { id: true, partDescription: true },
    });
    expect(result?.snapshot.cdc).toEqual({ requestId: 'req1', raw: 'CDC client brut' });
  });

  it('loadSnapshotInput : null si projet absent', async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(loadSnapshotInput('nope')).resolves.toBeNull();
  });
});
