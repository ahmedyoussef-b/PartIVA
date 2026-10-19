'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

interface CadViewerProps {
  src: string;
  height?: number;
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

function useStepGeometry(src: string) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;

    async function load() {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();

        worker = new Worker(WORKER_URL);

        worker.onmessage = (e: MessageEvent<OcctResult>) => {
          if (cancelled) return;
          const result = e.data;
          const mesh = result.meshes?.[0];
          if (!result.success || !mesh) {
            setError('Échec du parsing STEP (voir console pour le détail OCCT)');
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
          if (!cancelled) setError(`Erreur worker : ${e.message}`);
        };

        // occt-import-js attend un Uint8Array (un ArrayBuffer brut échoue au parsing).
        // Le buffer sous-jacent est transféré (pas de copie) via la transfer list.
        worker.postMessage({ format: 'step', buffer: new Uint8Array(buffer), params: null }, [
          buffer,
        ]);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }

    load();

    return () => {
      cancelled = true;
      worker?.terminate();
    };
  }, [src]);

  return { geometry, error };
}

export function CadViewer({ src, height = 400 }: CadViewerProps) {
  const { geometry, error } = useStepGeometry(src);

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
