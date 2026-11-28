import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  assertBoardStamp,
  BoardChangedError,
  BoardLockedByKicadError,
  lockPathFor,
  readBoardStamp,
  withBoardLock,
} from './board-lock';

let dir: string;
let board: string;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'partiva-board-lock-'));
  board = path.join(dir, 'carte.kicad_pcb');
  writeFileSync(board, '(kicad_pcb)\n', 'utf8');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('withBoardLock', () => {
  it('exécute la tâche et relâche le verrou', async () => {
    let ran = false;
    await withBoardLock(board, async () => {
      ran = true;
      expect(existsLock()).toBe(true);
    });
    expect(ran).toBe(true);
    expect(existsLock()).toBe(false);
  });

  it('sérialise deux écritures concurrentes', async () => {
    const order: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withBoardLock(board, async () => {
      order.push('first-start');
      await firstGate;
      order.push('first-end');
    });
    await sleep(60);
    const second = withBoardLock(board, async () => {
      order.push('second');
    });

    expect(order).toEqual(['first-start']);
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['first-start', 'first-end', 'second']);
  });

  it('relâche le verrou même si la tâche échoue', async () => {
    await expect(
      withBoardLock(board, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(existsLock()).toBe(false);
  });

  it('expire après le timeout', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const holding = withBoardLock(board, async () => {
      await gate;
    });
    await sleep(50);
    await expect(
      withBoardLock(board, async () => undefined, { timeoutMs: 100 }),
    ).rejects.toMatchObject({ code: 'BOARD_LOCK_TIMEOUT' });
    release();
    await holding;
    expect(existsLock()).toBe(false);
  });

  it('récupère un verrou périmé', async () => {
    writeFileSync(lockPathFor(board), JSON.stringify({ pid: process.pid, at: Date.now() }), 'utf8');
    const old = new Date(Date.now() - 10 * 60 * 1000);
    utimesSync(lockPathFor(board), old, old);
    await withBoardLock(board, async () => undefined);
    expect(existsLock()).toBe(false);
  });

  it('récupère un verrou dont le processus n’existe plus', async () => {
    writeFileSync(lockPathFor(board), JSON.stringify({ pid: 99999999, at: Date.now() }), 'utf8');
    await withBoardLock(board, async () => undefined);
    expect(existsLock()).toBe(false);
  });
});

describe('fencing', () => {
  it('détecte une modification externe du plateau', () => {
    const stamp = readBoardStamp(board);
    expect(stamp).not.toBeNull();
    expect(() => assertBoardStamp(board, stamp)).not.toThrow();
    writeFileSync(board, '(kicad_pcb) modifie\n', 'utf8');
    expect(() => assertBoardStamp(board, stamp)).toThrow(BoardChangedError);
  });

  it('détecte la disparition du plateau', () => {
    const stamp = readBoardStamp(board);
    rmSync(board);
    expect(() => assertBoardStamp(board, stamp)).toThrow(BoardChangedError);
  });
});

describe('BoardLockedByKicadError', () => {
  it('porte le message d’arbitrage utilisateur', () => {
    const error = new BoardLockedByKicadError(board);
    expect(error.message).toContain('Enregistrez ou annulez vos modifications dans KiCad');
    expect(error.boardPath).toBe(board);
  });
});

function existsLock(): boolean {
  return existsSync(lockPathFor(board));
}
