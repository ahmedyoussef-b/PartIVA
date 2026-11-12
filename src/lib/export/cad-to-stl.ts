import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

interface OcctMesh {
  attributes: {
    position: { array: number[] };
    normal?: { array: number[] };
  };
  index: { array: number[] };
}

interface OcctResult {
  success: boolean;
  meshes?: OcctMesh[];
}

const WORKER_URL = '/wasm/occt-import-js-worker.js';

const MESH_EXTENSIONS = ['.stl', '.obj', '.3mf'];

function extensionOf(src: string): string {
  const idx = src.lastIndexOf('.');
  return idx === -1 ? '' : src.slice(idx).toLowerCase();
}

function detectFormat(src: string): 'step' | 'iges' | 'brep' | null {
  const ext = extensionOf(src);
  switch (ext) {
    case '.iges':
    case '.igs':
      return 'iges';
    case '.brep':
      return 'brep';
    case '.step':
    case '.stp':
      return 'step';
    default:
      return null;
  }
}

function buildThreeGeometryFromOcct(mesh: OcctMesh): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3),
  );
  if (mesh.attributes.normal) {
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3));
  }
  geom.setIndex(mesh.index.array);
  geom.computeBoundingBox();
  return geom;
}

function isWatertight(geometry: THREE.BufferGeometry): boolean {
  const positions = geometry.attributes.position;
  const index = geometry.index;
  if (!positions || !index) return false;

  const edgeMap = new Map<string, number>();
  const count = index.count;

  for (let i = 0; i < count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);

    const edges = [
      [a, b],
      [b, c],
      [c, a],
    ];

    for (const edge of edges) {
      const v1 = edge[0];
      const v2 = edge[1];
      if (v1 === undefined || v2 === undefined) continue;
      const key = v1 < v2 ? `${v1},${v2}` : `${v2},${v1}`;
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
    }
  }

  for (const [, occurrences] of edgeMap) {
    if (occurrences !== 2) return false;
  }

  return true;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function loadFileAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

function parseOcctResult(buffer: ArrayBuffer, format: string): Promise<OcctResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL);

    let cancelled = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      worker.terminate();
    };

    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        cleanup();
        reject(new Error("Délai d'attente dépassé (parsing trop long)"));
      }
    }, 120_000);

    worker.onmessage = (e: MessageEvent<OcctResult>) => {
      if (cancelled) return;
      if (timeoutId) clearTimeout(timeoutId);
      resolve(e.data);
      cleanup();
    };

    worker.onerror = (e) => {
      if (cancelled) return;
      cleanup();
      reject(new Error(`Erreur worker OCCT: ${e.message}`));
    };

    worker.postMessage({ format, buffer: new Uint8Array(buffer), params: null }, [buffer]);
  });
}

export async function exportCadToStl(
  fileUrl: string,
  fileName: string,
): Promise<{ success: boolean; stlUrl?: string; error?: string; watertight?: boolean }> {
  try {
    const ext = extensionOf(fileName);

    if (MESH_EXTENSIONS.includes(ext) || fileUrl.startsWith('data:application/stl')) {
      return { success: true, stlUrl: fileUrl, watertight: undefined };
    }

    const format = detectFormat(fileName);
    if (!format) {
      return { success: false, error: "Format CAO non supporté pour l'export STL" };
    }

    const buffer = await loadFileAsArrayBuffer(fileUrl);
    const result = await parseOcctResult(buffer, format);

    if (!result.success || !result.meshes?.[0]) {
      return { success: false, error: 'Échec du parsing du fichier CAO' };
    }

    const mesh = result.meshes[0];
    const geometry = buildThreeGeometryFromOcct(mesh);
    const watertight = isWatertight(geometry);

    const exporter = new STLExporter();
    const stlResult = exporter.parse(new THREE.Mesh(geometry), { binary: true });

    let stlArrayBuffer: ArrayBuffer;
    if (stlResult instanceof ArrayBuffer) {
      stlArrayBuffer = stlResult;
    } else {
      const str = stlResult as unknown as string;
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      stlArrayBuffer = bytes.buffer;
    }

    const stlBase64 = arrayBufferToBase64(stlArrayBuffer);
    const stlUrl = `data:model/stl;base64,${stlBase64}`;

    return { success: true, stlUrl, watertight };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue lors de l'export STL",
    };
  }
}

export function downloadStlFromUrl(stlUrl: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = stlUrl;
  a.download = fileName.endsWith('.stl') ? fileName : `${fileName}.stl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (stlUrl.startsWith('blob:') || stlUrl.startsWith('data:')) {
    try {
      URL.revokeObjectURL(stlUrl);
    } catch {}
  }
}
