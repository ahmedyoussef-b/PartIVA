'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

interface CadViewerProps {
  src: string;
  height?: number;
  /** Timeout de parsing en ms (défaut 120 000 = 2 min) */
  timeoutMs?: number;
  /** Taille max du fichier en Mo (défaut 50) */
  maxSizeMb?: number;
}

interface OcctMesh {
  name?: string;
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

function detectFormat(): 'step' {
  // occt-import-js v0.0.23 supporte uniquement STEP (pas d'IGES ni de BREP).
  // Voir package.json keywords: ["step", "stp"].
  return 'step';
}

function useStepGeometry(src: string, timeoutMs: number, maxSizeMb: number) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    async function load() {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = response.headers.get('content-length');
        if (contentLength && Number(contentLength) > maxSizeMb * 1024 * 1024) {
          throw new Error(`Fichier trop volumineux (max ${maxSizeMb} Mo)`);
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > maxSizeMb * 1024 * 1024) {
          throw new Error(`Fichier trop volumineux (max ${maxSizeMb} Mo)`);
        }

        worker = new Worker(WORKER_URL);

        // Timeout de parsing : si le worker ne répond pas avant timeoutMs, on termine le worker.
        // cancelled = true empêche le bloc catch et onmessage d'écraser l'erreur timeout.
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            cancelled = true;
            worker?.terminate();
            setError("Délai d'attente dépassé (parsing trop long)");
          }
        }, timeoutMs);

        worker.onmessage = (e: MessageEvent<OcctResult>) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (cancelled) return;
          const result = e.data;
          const mesh = result.meshes?.[0];
          if (!result.success || !mesh) {
            setError('Échec du parsing (voir console pour le détail OCCT)');
            return;
          }

          const geom = new THREE.BufferGeometry();
          geom.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3),
          );
          if (mesh.attributes.normal) {
            geom.setAttribute(
              'normal',
              new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3),
            );
          }
          geom.setIndex(mesh.index.array);
          geom.computeBoundingSphere();
          setGeometry(geom);
        };

        worker.onerror = (e) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (!cancelled) setError(`Erreur worker : ${e.message}`);
        };

        const format = detectFormat();
        // occt-import-js attend un Uint8Array (un ArrayBuffer brut échoue au parsing).
        // Le buffer sous-jacent est transféré (pas de copie) via la transfer list.
        worker.postMessage({ format, buffer: new Uint8Array(buffer), params: null }, [buffer]);
      } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!cancelled) setError(String(e));
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      worker?.terminate();
    };
  }, [src, timeoutMs, maxSizeMb]);

  return { geometry, error };
}

export function CadViewer({
  src,
  height = 400,
  timeoutMs = 120_000,
  maxSizeMb = 50,
}: CadViewerProps) {
  const { geometry, error } = useStepGeometry(src, timeoutMs, maxSizeMb);

  if (error) {
    return (
      <div
        data-testid="cad-viewer-error"
        className="flex h-full items-center justify-center text-sm text-red-500"
      >
        {error}
      </div>
    );
  }

  if (!geometry) {
    return (
      <div
        data-testid="cad-viewer-loading"
        className="flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="cad-viewer-canvas" style={{ height }}>
      <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} />
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#888" side={THREE.DoubleSide} />
        </mesh>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
