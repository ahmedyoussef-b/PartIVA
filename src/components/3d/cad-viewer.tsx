'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2, RotateCcw, Maximize } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

function detectFormat(src: string): 'step' | 'iges' | 'brep' {
  // occt-import-js v0.0.23 expose ReadFile(format, buffer, params) qui dispatch
  // selon le format. L'extension du fichier détermine le format passé au worker.
  // Voir README : ReadStepFile, ReadIgesFile, ReadBrepFile sont l'API documentée.
  const ext = src.slice(src.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.iges':
    case '.igs':
      return 'iges';
    case '.brep':
      return 'brep';
    case '.step':
    case '.stp':
    default:
      return 'step';
  }
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

        const format = detectFormat(src);
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
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!geometry) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardHeader>
          <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <span className="text-muted-foreground text-sm">Chargement du modèle CAO…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" style={{ height }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground">Visualiseur 3D</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button size="icon" variant="outline" aria-label="Reset de la vue">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" aria-label="Plein écran">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
        <div data-testid="cad-viewer-canvas" style={{ height: '100%', width: '100%' }}>
          <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} />
            <mesh geometry={geometry}>
              <meshStandardMaterial color="#bbbbbb" side={THREE.DoubleSide} />
            </mesh>
            <OrbitControls />
          </Canvas>
        </div>
      </CardContent>
    </Card>
  );
}
