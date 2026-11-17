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

function findKicadSocket(): string | null {
  const kicadDir = join(tmpdir(), 'kicad');
  if (!existsSync(kicadDir)) {
    return null;
  }
  try {
    const files = readdirSync(kicadDir);
    const socket = files.find((f) => f.startsWith('api') && f.endsWith('.sock'));
    return socket ? join(kicadDir, socket) : null;
  } catch {
    return null;
  }
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
  if (!socketPath) {
    return { available: false, socketPath: null, version: null };
  }
  const version = readKicadVersion();
  return { available: true, socketPath, version };
}

export async function getKicadProject(socketPath: string): Promise<KicadIpcProject | null> {
  // TODO V8-D-8-d : implémenter la lecture réelle via IPC (nécessite KiCad GUI ouvert)
  // Pour l'instant, retourne un projet mock si le socket existe
  if (!existsSync(socketPath)) {
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
  if (!existsSync(socketPath)) {
    return false;
  }
  void project;
  return true;
}
