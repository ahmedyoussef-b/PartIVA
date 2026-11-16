// IPC Adapter — détection et connexion à l'instance KiCad GUI
// KiCad 9/10 expose une API IPC via un socket (named pipe sur Windows, Unix socket sur Linux/macOS).
// Nécessite que KiCad GUI soit ouvert.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface KicadIpcInfo {
  available: boolean;
  socketPath: string | null;
  version: string | null;
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

export async function detectKicadIpc(): Promise<KicadIpcInfo> {
  const socketPath = findKicadSocket();
  if (!socketPath) {
    return { available: false, socketPath: null, version: null };
  }
  // TODO V8-D-8-c : connexion effective au socket et récupération de la version
  return { available: true, socketPath, version: null };
}

export interface KicadIpcProject {
  name: string;
  path: string;
  components: number;
  nets: number;
}

export async function getKicadProject(socketPath: string): Promise<KicadIpcProject | null> {
  // TODO V8-D-8-c : implémenter la lecture réelle via IPC
  // Pour l'instant, retourne null (mock en attendant l'implémentation complète)
  void socketPath;
  return null;
}

export async function updateKicadProject(
  socketPath: string,
  project: KicadIpcProject,
): Promise<boolean> {
  // TODO V8-D-8-c : implémenter l'écriture réelle via IPC
  void socketPath;
  void project;
  return false;
}
