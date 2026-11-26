import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { Prisma } from '@/generated/prisma/client';

const findUnique = vi.fn();
const transaction = vi.fn();
const deleteNets = vi.fn();
const deleteComponents = vi.fn();
const deleteValidations = vi.fn();
const updateProject = vi.fn();
const existsSync = vi.fn();
const mkdirSync = vi.fn();
const readFileSync = vi.fn();
const writeFileSync = vi.fn();
const spawnSync = vi.fn();

const tx = {
  pcbNet: { deleteMany: (...args: unknown[]) => deleteNets(...args) },
  pcbComponent: { deleteMany: (...args: unknown[]) => deleteComponents(...args) },
  pcbWizardValidation: { deleteMany: (...args: unknown[]) => deleteValidations(...args) },
  pcbProject: { update: (...args: unknown[]) => updateProject(...args) },
};

vi.mock('@/lib/auth-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pcbProject: { findUnique: (...args: unknown[]) => findUnique(...args) },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
  spawnSync: (...args: unknown[]) => spawnSync(...args),
}));
vi.mock('node:fs', () => ({
  existsSync: (...args: unknown[]) => existsSync(...args),
  mkdirSync: (...args: unknown[]) => mkdirSync(...args),
  readFileSync: (...args: unknown[]) => readFileSync(...args),
  writeFileSync: (...args: unknown[]) => writeFileSync(...args),
}));

import { requireAdmin } from '@/lib/auth-admin';
import { POST } from './route';

const PARAMS = { params: Promise.resolve({ id: 'proj-1' }) };

function request(action: string) {
  return new NextRequest('http://localhost/api/pcb/projects/proj-1/board', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

async function post(action: string) {
  return POST(request(action), PARAMS);
}

describe('POST /api/pcb/projects/[id]/board — reset', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ role: 'ADMIN' } as never);
    findUnique.mockResolvedValue({ id: 'proj-1', kicadFilePath: 'C:/data/carte.kicad_pcb' });
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('(kicad_pcb (footprint "R1"))');
    transaction.mockImplementation(async (cb: (t: typeof tx) => Promise<void>) => cb(tx));
    deleteNets.mockResolvedValue({ count: 2 });
    deleteComponents.mockResolvedValue({ count: 3 });
    deleteValidations.mockResolvedValue({ count: 1 });
    updateProject.mockResolvedValue({ id: 'proj-1' });
  });

  it('exige un administrateur', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const res = await post('reset');
    expect(res.status).toBe(401);
  });

  it('efface composants, nets et validations et remet le projet après validation CDC', async () => {
    const res = await post('reset');
    expect(res.status).toBe(200);
    expect(deleteNets).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
    expect(deleteComponents).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
    expect(deleteValidations).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
    expect(updateProject).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: {
        kicadFilePath: expect.stringContaining('carte-test.kicad_pcb'),
        sourcingCache: Prisma.JsonNull,
        status: 'requirements_validated',
      },
    });
  });

  it('ne touche pas aux données dérivées pour un simple open', async () => {
    const res = await post('open');
    expect(res.status).toBe(200);
    expect(deleteNets).not.toHaveBeenCalled();
    expect(deleteComponents).not.toHaveBeenCalled();
    expect(deleteValidations).not.toHaveBeenCalled();
    expect(updateProject).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: { kicadFilePath: expect.any(String) },
    });
  });

  it('ferme la fenêtre KiCad du plateau précédent avant de réécrire le fichier', async () => {
    vi.stubEnv('PARTIVA_DESKTOP', '1');
    existsSync.mockImplementation((p: string) => !String(p).endsWith('.lck'));
    spawnSync.mockReturnValue({ stdout: '1', stderr: '', status: 0 });
    const res = await post('reset');
    expect(res.status).toBe(200);
    expect(spawnSync).toHaveBeenCalledWith(
      'powershell',
      expect.arrayContaining([expect.stringContaining('CloseMainWindow()')]),
      expect.objectContaining({
        env: expect.objectContaining({ PARTIVA_BOARD_NAME: 'carte.kicad_pcb' }),
      }),
    );
    const body = (await res.json()) as { closedWindows: number; lockReleased: boolean };
    expect(body.closedWindows).toBe(1);
    expect(body.lockReleased).toBe(true);
  });

  it('recharge la fenêtre KiCad sur le plateau courant', async () => {
    vi.stubEnv('PARTIVA_DESKTOP', '1');
    existsSync.mockImplementation((p: string) => !String(p).endsWith('.lck'));
    spawnSync.mockReturnValue({ stdout: '1', stderr: '', status: 0 });
    const res = await post('reload');
    expect(res.status).toBe(200);
    expect(spawnSync).toHaveBeenCalledWith(
      'powershell',
      expect.arrayContaining([expect.stringContaining('CloseMainWindow()')]),
      expect.any(Object),
    );
    const body = (await res.json()) as { closedWindows: number; kicadFilePath: string };
    expect(body.closedWindows).toBe(1);
    expect(body.kicadFilePath).toBe('C:/data/carte.kicad_pcb');
  });

  it('restaure le plateau si la transaction échoue', async () => {
    transaction.mockRejectedValue(new Error('DB down'));
    const res = await post('reset');
    expect(res.status).toBe(500);
    expect(writeFileSync).toHaveBeenLastCalledWith(
      expect.stringContaining('carte-test.kicad_pcb'),
      '(kicad_pcb (footprint "R1"))',
      'utf8',
    );
  });
});
