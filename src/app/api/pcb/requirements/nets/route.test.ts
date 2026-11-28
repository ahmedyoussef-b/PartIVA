import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminMock = vi.fn();
const transaction = vi.fn();
const projectFindUnique = vi.fn();
const projectUpdate = vi.fn();
const netFindMany = vi.fn();
const netFindFirst = vi.fn();
const netCreate = vi.fn();
const netCreateMany = vi.fn();
const netUpdate = vi.fn();
const netDelete = vi.fn();
const netDeleteMany = vi.fn();
const clearCache = vi.fn();

vi.mock('@/lib/auth-admin', () => ({
  requireAdmin: (...a: unknown[]) => requireAdminMock(...a),
}));
vi.mock('@/lib/utils/llm-cache', () => ({
  clearLlmCacheAsync: (...a: unknown[]) => clearCache(...a),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (...a: unknown[]) => transaction(...a),
    pcbProject: {
      findUnique: (...a: unknown[]) => projectFindUnique(...a),
      update: (...a: unknown[]) => projectUpdate(...a),
    },
    pcbNet: {
      findMany: (...a: unknown[]) => netFindMany(...a),
      findFirst: (...a: unknown[]) => netFindFirst(...a),
      create: (...a: unknown[]) => netCreate(...a),
      createMany: (...a: unknown[]) => netCreateMany(...a),
      update: (...a: unknown[]) => netUpdate(...a),
      delete: (...a: unknown[]) => netDelete(...a),
      deleteMany: (...a: unknown[]) => netDeleteMany(...a),
    },
  },
}));

import { GET, PATCH, PUT } from './route';

// Le client de transaction expose les mêmes delegates que le client racine.
const txMock = {
  pcbNet: {
    findMany: (...a: unknown[]) => netFindMany(...a),
    findFirst: (...a: unknown[]) => netFindFirst(...a),
    create: (...a: unknown[]) => netCreate(...a),
    createMany: (...a: unknown[]) => netCreateMany(...a),
    update: (...a: unknown[]) => netUpdate(...a),
    delete: (...a: unknown[]) => netDelete(...a),
    deleteMany: (...a: unknown[]) => netDeleteMany(...a),
  },
  pcbProject: {
    findUnique: (...a: unknown[]) => projectFindUnique(...a),
    update: (...a: unknown[]) => projectUpdate(...a),
  },
};

interface StoredNet {
  id: string;
  projectId: string;
  name: string;
  pins: string[];
  source: string;
  status: string;
}

const report = {
  repaired: true,
  stale: false,
  invalidPins: [],
  droppedPins: [],
  droppedNets: [],
  unreadableFootprints: [],
  toVerify: ['U1'],
};

let store: StoredNet[] = [];

function seed(nets: Array<{ id: string; name: string; pins: string[] }>) {
  store = nets.map((n) => ({
    ...n,
    projectId: 'proj-1',
    source: 'llm',
    status: 'proposed',
  }));
}

function putRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/pcb/requirements/nets', {
    method: 'PUT',
    body: JSON.stringify({ projectId: 'proj-1', ...body }),
  });
}

function patchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/pcb/requirements/nets', {
    method: 'PATCH',
    body: JSON.stringify({ projectId: 'proj-1', ...body }),
  });
}

function getRequest() {
  return new Request('http://localhost/api/pcb/requirements/nets?projectId=proj-1');
}

describe('/api/pcb/requirements/nets — édition atomique F4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seed([
      { id: 'n1', name: 'VCC', pins: ['U1.8', 'C1.1'] },
      { id: 'n2', name: 'GND', pins: ['U1.1', 'C1.2'] },
    ]);
    requireAdminMock.mockResolvedValue({ role: 'ADMIN' });
    transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(txMock));
    projectFindUnique.mockResolvedValue({
      id: 'proj-1',
      sourcingCache: { cacheVersion: 3, netlistReport: { ...report } },
    });
    projectUpdate.mockResolvedValue({ id: 'proj-1' });
    netFindMany.mockImplementation(async () =>
      store.map(({ id, name, pins, source }) => ({ id, name, pins, source })),
    );
    netFindFirst.mockImplementation(
      async ({ where }: { where: { name: string } }) =>
        store.find((n) => n.name === where.name) ?? null,
    );
    netCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      const created = {
        id: `new-${store.length + 1}`,
        ...data,
        pins: data.pins as string[],
      } as StoredNet;
      store.push(created);
      return created;
    });
    netCreateMany.mockImplementation(async ({ data }: { data: Array<Record<string, unknown>> }) => {
      for (const item of data) {
        store.push({
          id: `new-${store.length + 1}`,
          ...item,
          pins: item.pins as string[],
        } as StoredNet);
      }
      return { count: data.length };
    });
    netUpdate.mockImplementation(
      async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const target = store.find((n) => n.id === where.id);
        if (!target) throw new Error('introuvable');
        Object.assign(target, data, { pins: data.pins as string[] });
        return target;
      },
    );
    netDelete.mockImplementation(async ({ where }: { where: { id: string } }) => {
      store = store.filter((n) => n.id !== where.id);
      return { count: 1 };
    });
    netDeleteMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) => {
      const ids = new Set(where.id.in);
      store = store.filter((n) => !ids.has(n.id));
      return { count: ids.size };
    });
    clearCache.mockResolvedValue(undefined);
  });

  it('GET renvoie la netlist et le rapport F2', async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      nets: Array<{ name: string }>;
      netlistReport: { stale: boolean };
    };
    expect(body.ok).toBe(true);
    expect(body.nets.map((n) => n.name)).toEqual(['VCC', 'GND']);
    expect(body.netlistReport.stale).toBe(false);
  });

  it('applique un échange de noms en une seule transaction sans conflit', async () => {
    const res = await PUT(
      putRequest({
        nets: [
          { id: 'n1', name: 'GND', pins: ['U1.1', 'C1.2'] },
          { id: 'n2', name: 'VCC', pins: ['U1.8', 'C1.1'] },
        ],
        expectedIds: ['n1', 'n2'],
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      applied: { deleted: number; updated: number; created: number };
      netlistReport: { stale: boolean };
    };
    expect(body.applied).toEqual({ deleted: 0, updated: 2, created: 0 });
    expect(store.find((n) => n.id === 'n1')?.name).toBe('GND');
    expect(store.find((n) => n.id === 'n2')?.name).toBe('VCC');
    expect(netUpdate).toHaveBeenCalledTimes(2);
    expect(netDeleteMany).not.toHaveBeenCalled();
    expect(netCreateMany).not.toHaveBeenCalled();
    expect(body.netlistReport.stale).toBe(true);
    expect(projectUpdate).toHaveBeenCalledTimes(1);
    expect(clearCache).toHaveBeenCalledTimes(1);
  });

  it('supprime puis recrée un même nom sans 409', async () => {
    const res = await PUT(
      putRequest({
        nets: [{ name: 'VCC', pins: ['U1.8', 'C1.2'] }],
        expectedIds: ['n1', 'n2'],
      }),
    );
    expect(res.status).toBe(200);
    expect(netDeleteMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1', id: { in: ['n1', 'n2'] } },
    });
    expect(netCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            name: 'VCC',
            pins: ['U1.8', 'C1.2'],
            source: 'manual',
            status: 'manual',
          }),
        ],
      }),
    );
    expect(store).toHaveLength(1);
  });

  it('renvoie 409 avec la vérité serveur si un id client a disparu', async () => {
    const res = await PUT(
      putRequest({
        nets: [{ id: 'ghost', name: 'SIG', pins: ['U1.2', 'C1.2'] }],
        expectedIds: ['n1', 'n2'],
      }),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      nets: Array<{ name: string }>;
      netlistReport: { stale: boolean };
    };
    expect(body.error).toBe('NETLIST_CONFLICT');
    expect(body.nets.map((n) => n.name)).toEqual(['VCC', 'GND']);
    expect(body.netlistReport.stale).toBe(false);
    expect(netUpdate).not.toHaveBeenCalled();
    expect(netCreateMany).not.toHaveBeenCalled();
    expect(netDeleteMany).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
    expect(clearCache).not.toHaveBeenCalled();
  });

  it('renvoie 409 si expectedIds ne correspond plus à la BDD', async () => {
    const res = await PUT(
      putRequest({
        nets: [{ id: 'n1', name: 'VCC', pins: ['U1.8', 'C1.1'] }],
        expectedIds: ['n1'],
      }),
    );
    expect(res.status).toBe(409);
    expect(projectUpdate).not.toHaveBeenCalled();
  });

  it('renvoie 422 INVALID_NETLIST sans écrire si un net est trop court', async () => {
    const res = await PUT(
      putRequest({
        nets: [{ name: 'SIG', pins: ['U1.1'] }],
        expectedIds: ['n1', 'n2'],
      }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      error: string;
      issues: Array<{ code: string }>;
    };
    expect(body.error).toBe('INVALID_NETLIST');
    expect(body.issues[0]?.code).toBe('TOO_FEW_PINS');
    expect(netCreateMany).not.toHaveBeenCalled();
    expect(netDeleteMany).not.toHaveBeenCalled();
  });

  it('conserve le PATCH historique compatible', async () => {
    const res = await PATCH(
      patchRequest({
        action: 'add',
        net: { name: 'SIG', pins: ['U1.2', 'C1.2'] },
      }),
    );
    expect(res.status).toBe(200);
    expect(store.some((n) => n.name === 'SIG')).toBe(true);
    const body = (await res.json()) as { ok: boolean; netlistReport: { stale: boolean } };
    expect(body.ok).toBe(true);
    expect(body.netlistReport.stale).toBe(true);
  });
});
