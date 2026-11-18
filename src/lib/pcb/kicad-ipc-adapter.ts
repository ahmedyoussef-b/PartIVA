// IPC Adapter — connexion à l'instance KiCad GUI
// KiCad 9/10 expose une API IPC via un socket (named pipe sur Windows, Unix socket sur Linux/macOS).
// Nécessite que KiCad GUI soit ouvert.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface KicadIpcInfo {
  available: boolean;
  socketPath: string | null;
  version: string | null;
}

export interface KicadIpcProject {
  name: string;
  path: string;
  components: number;
  nets: number;
}

const PIPE_PREFIX = '\\\\.\\pipe\\';

/**
 * T5.1 (V8-D-14) — le socket IPC KiCad est :
 * - Windows : un NAMED PIPE dont le nom est le chemin complet (`\\.\pipe\<path>`),
 *   **PAS un fichier** (`fs.existsSync` échoue). Seul `readdirSync('\\.\pipe\\')` le voit.
 * - Linux/macOS : un socket de fichier `<path>`.
 */
function socketExists(socketPath: string): boolean {
  if (existsSync(socketPath)) {
    return true;
  }
  try {
    const pipes = readdirSync(PIPE_PREFIX);
    return pipes.some(
      (p) => p === socketPath || p.toLowerCase() === socketPath.toLowerCase(),
    );
  } catch {
    return false;
  }
}

function findKicadSocket(): string | null {
  const sockPath = join(tmpdir(), 'kicad', 'api.sock');
  if (socketExists(sockPath)) {
    return sockPath;
  }
  // Windows : le nom du pipe peut différer du chemin exact → recherche large.
  try {
    const found = readdirSync(PIPE_PREFIX).find(
      (p) => p.toLowerCase().includes('kicad') && p.toLowerCase().endsWith('.sock'),
    );
    if (found) {
      return found;
    }
  } catch {
    /* pas de namespace pipe (Linux/macOS) */
  }
  return null;
}

function readKicadVersion(): string | null {
  const versionFile = join(tmpdir(), 'kicad', 'version.txt');
  if (!existsSync(versionFile)) {
    return null;
  }
  try {
    return readFileSync(versionFile, 'utf-8').trim();
  } catch {
    return null;
  }
}

export async function detectKicadIpc(): Promise<KicadIpcInfo> {
  const socketPath = findKicadSocket();
  console.log(
    '[KICAD:ipc] socket path =',
    socketPath,
    'exists =',
    socketPath ? socketExists(socketPath) : false,
  );
  if (!socketPath) {
    return { available: false, socketPath: null, version: null };
  }
  const version = readKicadVersion();
  return { available: true, socketPath, version };
}

export async function getKicadProject(socketPath: string): Promise<KicadIpcProject | null> {
  // TODO V8-D-8-d : implémenter la lecture réelle via IPC (nécessite KiCad GUI ouvert)
  // Pour l'instant, retourne un projet mock si le socket existe
  if (!socketExists(socketPath)) {
    return null;
  }
  return {
    name: 'mock-project',
    path: socketPath,
    components: 0,
    nets: 0,
  };
}

export async function updateKicadProject(
  socketPath: string,
  project: KicadIpcProject,
): Promise<boolean> {
  // TODO V8-D-8-d : implémenter l'écriture réelle via IPC
  if (!socketExists(socketPath)) {
    return false;
  }
  void project;
  return true;
}
