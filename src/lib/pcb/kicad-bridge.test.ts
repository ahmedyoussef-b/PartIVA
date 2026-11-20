import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { spawnMock, existsSyncMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
  existsSyncMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));
vi.mock('node:fs', () => ({
  existsSync: existsSyncMock,
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

class FakeChild extends EventEmitter {
  stdout = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
  stderr = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
  kill = vi.fn();
}

type BridgeModule = typeof import('./kicad-bridge');

const ARGS = {
  boardPath: 'C:\\tmp\\board.kicad_pcb',
  libName: 'Resistor_SMD',
  footprintName: 'R_0603_1608Metric',
  reference: 'R1',
  value: '10k',
  xMm: 10,
  yMm: 20,
};

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
}

let bridge: BridgeModule;
let children: FakeChild[];

function mockPathsExist(): void {
  existsSyncMock.mockImplementation(
    (target: string) => target.includes('python.exe') || target.includes('place_footprint'),
  );
}

beforeEach(async () => {
  vi.resetModules();
  existsSyncMock.mockReset();
  spawnMock.mockReset();
  children = [];

  spawnMock.mockImplementation(() => {
    const child = new FakeChild();
    children.push(child);
    return child;
  });

  mockPathsExist();
  bridge = await import('./kicad-bridge');
});

describe('detectKicadPython', () => {
  it('retourne le premier candidat existant', async () => {
    await expect(bridge.detectKicadPython()).resolves.toBe(
      'C:\\Program Files\\KiCad\\10.0\\bin\\python.exe',
    );
  });

  it('retourne null si aucun candidat', async () => {
    existsSyncMock.mockReturnValue(false);
    await expect(bridge.detectKicadPython()).resolves.toBeNull();
  });
});

describe('placeFootprint', () => {
  it('parse un JSON stdout valide', async () => {
    const promise = bridge.placeFootprint(ARGS);
    await flushMicrotasks();
    children[0].stdout.emit(
      'data',
      JSON.stringify({ ok: true, message: 'placed R1', footprintCount: 26 }),
    );
    children[0].emit('close', 0);

    await expect(promise).resolves.toEqual({
      ok: true,
      message: 'placed R1',
      footprintCount: 26,
    });
  });

  it("gère un JSON d'erreur", async () => {
    const promise = bridge.placeFootprint(ARGS);
    await flushMicrotasks();
    children[0].stdout.emit('data', JSON.stringify({ ok: false, error: 'librairie introuvable' }));
    children[0].emit('close', 1);

    await expect(promise).resolves.toEqual({ ok: false, error: 'librairie introuvable' });
  });

  it('gère un timeout', async () => {
    vi.useFakeTimers();
    try {
      const promise = bridge.placeFootprint(ARGS);
      await flushMicrotasks();
      expect(children).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(120_000);
      expect(children[0].kill).toHaveBeenCalled();

      children[0].emit('close', null);
      await expect(promise).resolves.toMatchObject({
        ok: false,
        error: expect.stringMatching(/timeout/i),
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignore les warnings stderr et parse stdout', async () => {
    const promise = bridge.placeFootprint(ARGS);
    await flushMicrotasks();
    children[0].stderr.emit('data', 'Adding duplicate image handler for PNG file\n');
    children[0].stderr.emit('data', 'Adding duplicate image handler for JPEG file\n');
    children[0].stdout.emit(
      'data',
      JSON.stringify({ ok: true, message: 'placed R1', footprintCount: 26 }),
    );
    children[0].emit('close', 0);

    await expect(promise).resolves.toMatchObject({ ok: true, footprintCount: 26 });
  });

  it('sérialise deux appels via le mutex', async () => {
    const first = bridge.placeFootprint(ARGS);
    await flushMicrotasks();
    expect(children).toHaveLength(1);

    const second = bridge.placeFootprint(ARGS);
    await flushMicrotasks();
    expect(children).toHaveLength(1);

    children[0].stdout.emit(
      'data',
      JSON.stringify({ ok: true, message: 'placed R1', footprintCount: 26 }),
    );
    children[0].emit('close', 0);
    await flushMicrotasks();
    expect(children).toHaveLength(2);

    children[1].stdout.emit(
      'data',
      JSON.stringify({ ok: true, message: 'placed R1', footprintCount: 26 }),
    );
    children[1].emit('close', 0);

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: true, message: 'placed R1', footprintCount: 26 },
      { ok: true, message: 'placed R1', footprintCount: 26 },
    ]);
  });
});

describe('dryRun', () => {
  it('passe --dry-run et retourne wouldPlace', async () => {
    const promise = bridge.dryRun(ARGS);
    await flushMicrotasks();

    const spawnArgs = spawnMock.mock.calls[0] as unknown[];
    const cliArgs = spawnArgs[1] as string[];
    expect(cliArgs).toContain('--dry-run');
    expect(cliArgs).toContain('--board');

    children[0].stdout.emit(
      'data',
      JSON.stringify({ ok: true, wouldPlace: true, message: 'dry-run ok: R1', footprintCount: 26 }),
    );
    children[0].emit('close', 0);

    await expect(promise).resolves.toEqual({
      ok: true,
      wouldPlace: true,
      message: 'dry-run ok: R1',
      footprintCount: 26,
    });
  });
});

describe('placeFootprints', () => {
  const BATCH = {
    boardPath: 'C:\\tmp\\board.kicad_pcb',
    footprints: [
      {
        libName: 'Resistor_SMD',
        footprintName: 'R_0603_1608Metric',
        reference: 'R1',
        xMm: 10,
        yMm: 10,
      },
      {
        libName: 'Capacitor_SMD',
        footprintName: 'C_0603_1608Metric',
        reference: 'C1',
        xMm: 20,
        yMm: 20,
      },
      {
        libName: 'Package_SO',
        footprintName: 'SOIC-8_3.9x4.9mm',
        reference: 'U1',
        xMm: 30,
        yMm: 30,
      },
    ],
  };

  it('happy path : place 3 empreintes', async () => {
    const promise = bridge.placeFootprints(BATCH);
    await flushMicrotasks();

    children[0].stdout.emit('data', JSON.stringify({ ok: true, placed: 3, board: 'x' }));
    children[0].emit('close', 0);

    await expect(promise).resolves.toMatchObject({ ok: true, footprintCount: 3 });
  });

  it('script batch absent → erreur', async () => {
    existsSyncMock.mockImplementation((target: string) => target.includes('python.exe'));
    await expect(bridge.placeFootprints(BATCH)).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/script/i),
    });
  });

  it('python absent → erreur', async () => {
    existsSyncMock.mockReturnValue(false);
    await expect(bridge.placeFootprints(BATCH)).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/Python/i),
    });
  });

  it('dryRun → --dry-run présent dans le spawn', async () => {
    const promise = bridge.placeFootprints({ ...BATCH, dryRun: true });
    await flushMicrotasks();

    const spawnArgs = spawnMock.mock.calls[0] as unknown[];
    const cliArgs = spawnArgs[1] as string[];
    expect(cliArgs).toContain('--dry-run');
    expect(cliArgs).toContain('--input');

    children[0].stdout.emit(
      'data',
      JSON.stringify({ ok: true, wouldPlace: true, placed: 3, board: 'x' }),
    );
    children[0].emit('close', 0);

    await expect(promise).resolves.toMatchObject({ ok: true, footprintCount: 3 });
  });

  it('stdout non JSON → erreur', async () => {
    const promise = bridge.placeFootprints(BATCH);
    await flushMicrotasks();

    children[0].stdout.emit('data', 'pas du json');
    children[0].emit('close', 0);

    await expect(promise).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/sortie/i),
    });
  });
});

describe('resolveScriptPath', () => {
  it('retourne le premier script existant', () => {
    expect(bridge.resolveScriptPath()).toContain('place_footprint.py');
  });

  it('retourne null si aucun script', () => {
    existsSyncMock.mockReturnValue(false);
    expect(bridge.resolveScriptPath()).toBeNull();
  });
});
