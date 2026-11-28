// Verrou de plateau inter-processus + fencing par snapshot.
// Le mutex du bridge ne couvre qu'un processus Node : ce verrou fichier
// sérialise aussi les sidecars Tauri et les instances parallèles.

import { closeSync, openSync, readFileSync, statSync, unlinkSync, writeSync } from 'node:fs';

const LOCK_SUFFIX = '.partiva.lock';
const STALE_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_MS = 150;

export interface BoardStamp {
  mtimeMs: number;
  size: number;
}

export class BoardLockError extends Error {
  constructor(
    message: string,
    readonly code: 'BOARD_LOCK_TIMEOUT' | 'BOARD_LOCK_LOST',
  ) {
    super(message);
    this.name = 'BoardLockError';
  }
}

export class BoardChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardChangedError';
  }
}

export class BoardLockedByKicadError extends Error {
  constructor(boardPath: string) {
    super('Enregistrez ou annulez vos modifications dans KiCad puis réessayez.');
    this.name = 'BoardLockedByKicadError';
    this.boardPath = boardPath;
  }
  readonly boardPath: string;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function lockPathFor(boardPath: string): string {
  return `${boardPath}${LOCK_SUFFIX}`;
}

export function readBoardStamp(boardPath: string): BoardStamp | null {
  try {
    const stat = statSync(boardPath);
    return { mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return null;
  }
}

/** Détecte une modification externe (GUI KiCad, autre instance) depuis le snapshot. */
export function assertBoardStamp(boardPath: string, expected: BoardStamp | null): void {
  const current = readBoardStamp(boardPath);
  if (!expected || !current) {
    if (expected?.mtimeMs !== current?.mtimeMs) {
      throw new BoardChangedError('Le plateau a disparu ou a été remplacé pendant l’opération.');
    }
    return;
  }
  if (current.mtimeMs !== expected.mtimeMs || current.size !== expected.size) {
    throw new BoardChangedError('Le plateau a été modifié pendant l’opération.');
  }
}

function isPidAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

interface LockHandle {
  path: string;
  token: string;
}

async function acquire(
  boardPath: string,
  operation: string,
  timeoutMs: number,
): Promise<LockHandle> {
  const path = lockPathFor(boardPath);
  const token = JSON.stringify({ pid: process.pid, at: Date.now(), operation });
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      const fd = openSync(path, 'wx');
      try {
        writeSync(fd, token);
      } finally {
        closeSync(fd);
      }
      return { path, token };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') throw error;

      try {
        const stat = statSync(path);
        let stale = Date.now() - stat.mtimeMs > STALE_MS;
        if (!stale) {
          try {
            const owner = JSON.parse(readFileSync(path, 'utf8')) as { pid?: number };
            stale = owner.pid !== undefined && !isPidAlive(owner.pid);
          } catch {
            stale = true; // lock illisible : on le libère
          }
        }
        if (stale) unlinkSync(path);
      } catch {
        // Le verrou a disparu entre-temps : on retente immédiatement.
      }

      if (Date.now() >= deadline) {
        throw new BoardLockError(
          'Le plateau est occupé par une autre écriture. Réessayez dans quelques instants.',
          'BOARD_LOCK_TIMEOUT',
        );
      }
      await sleep(RETRY_MS);
    }
  }
}

function release(handle: LockHandle): void {
  try {
    if (readFileSync(handle.path, 'utf8') === handle.token) unlinkSync(handle.path);
  } catch {
    // Verrou déjà supprimé ou illisible : rien à faire.
  }
}

export interface BoardLockOptions {
  timeoutMs?: number;
  /** Opération tracée dans le fichier de verrou (logs/debug). */
  operation?: string;
}

/**
 * Exécute `task` sous verrou exclusif sur le plateau. Le verrou est relâché
 * même si la tâche échoue.
 */
export async function withBoardLock<T>(
  boardPath: string,
  task: () => Promise<T>,
  options: BoardLockOptions = {},
): Promise<T> {
  const handle = await acquire(
    boardPath,
    options.operation ?? 'write',
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    return await task();
  } finally {
    release(handle);
  }
}
