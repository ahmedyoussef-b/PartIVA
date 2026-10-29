'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MeasureTool, type MeasureMode } from '@/components/workspace/MeasureTool';
import {
  CAMERA_HOME,
  ViewerBridge,
  ViewerError,
  ViewerLoading,
  ViewerSceneBridge,
  ViewerShell,
} from './viewer-shell';

const MODEL_COLOR = '#94a3b8';
const MODEL_EXTENT = 2.8;

interface CadViewerProps {
  src: string;
  /** Hauteur du viewport 3D en pixels (défaut 400) */
  height?: number;
  /** Timeout de parsing en ms (défaut 120 000 = 2 min) */
  timeoutMs?: number;
  /** Taille max du fichier en Mo (défaut 50) */
  maxSizeMb?: number;
  /** Rend le viewer sans la Card (intégration dans une Card existante) */
  bare?: boolean;
  /** Active l'outil de mesure */
  measureEnabled?: boolean;
  /** Mode de mesure : distance, angle ou diamètre */
  measureMode?: MeasureMode;
  /** Mode de rendu */
  renderMode?: 'solid' | 'wireframe' | 'xray';
  /** Active le plan de coupe */
  sectionEnabled?: boolean;
  /** Position du plan de coupe (0-1) */
  sectionPosition?: number;
  /** Callback dimensions extraites */
  onDimensionsExtracted?: (dimensions: {
    length: number;
    width: number;
    height: number;
    diameter: number;
  }) => void;
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

/**
 * Centre et met à l'échelle la géométrie OCCT pour que le modèle tienne dans
 * le viewport, quelle que soit l'unité du fichier CAO source (mm, pouces, …).
 */
function normalizeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  if (geometry.boundingBox) {
    geometry.boundingBox.getSize(size);
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
  }
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = MODEL_EXTENT / maxDimension;
  geometry.scale(scale, scale, scale);
}

interface CadLoadState {
  src: string;
  geometry: THREE.BufferGeometry | null;
  error: string | null;
  dimensions: { length: number; width: number; height: number; diameter: number } | null;
}

function useStepGeometry(src: string, timeoutMs: number, maxSizeMb: number) {
  const [state, setState] = React.useState<CadLoadState>({
    src: '',
    geometry: null,
    error: null,
    dimensions: null,
  });

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
            setState({
              src,
              geometry: null,
              error: "Délai d'attente dépassé (parsing trop long)",
              dimensions: null,
            });
          }
        }, timeoutMs);

        worker.onmessage = (e: MessageEvent<OcctResult>) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (cancelled) return;
          const result = e.data;
          const mesh = result.meshes?.[0];
          if (!result.success || !mesh) {
            setState({
              src,
              geometry: null,
              error: 'Échec du parsing (voir console pour le détail OCCT)',
              dimensions: null,
            });
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

          const positions = mesh.attributes.position.array;
          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity,
            minZ = Infinity,
            maxZ = -Infinity;
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i] ?? 0;
            const y = positions[i + 1] ?? 0;
            const z = positions[i + 2] ?? 0;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
          }
          const dims = {
            length: maxX - minX,
            width: maxY - minY,
            height: maxZ - minZ,
            diameter: Math.max(maxX - minX, maxY - minY, maxZ - minZ),
          };

          geom.computeBoundingSphere();
          normalizeGeometry(geom);
          setState({ src, geometry: geom, error: null, dimensions: dims });
        };

        worker.onerror = (e) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (!cancelled) {
            setState({
              src,
              geometry: null,
              error: `Erreur worker : ${e.message}`,
              dimensions: null,
            });
          }
        };

        const format = detectFormat(src);
        // occt-import-js attend un Uint8Array (un ArrayBuffer brut échoue au parsing).
        // Le buffer sous-jacent est transféré (pas de copie) via la transfer list.
        worker.postMessage({ format, buffer: new Uint8Array(buffer), params: null }, [buffer]);
      } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!cancelled) setState({ src, geometry: null, error: String(e), dimensions: null });
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      worker?.terminate();
    };
  }, [src, timeoutMs, maxSizeMb]);

  return {
    geometry: state.src === src ? state.geometry : null,
    error: state.src === src ? state.error : null,
    loading: state.src !== src,
    dimensions: state.src === src ? state.dimensions : null,
  };
}

export function CadViewer({
  src,
  height = 400,
  timeoutMs = 120_000,
  maxSizeMb = 50,
  bare = false,
  measureEnabled = false,
  measureMode = 'distance',
  renderMode = 'solid',
  sectionEnabled = false,
  sectionPosition = 0.5,
  onDimensionsExtracted,
}: CadViewerProps) {
  const bridgeRef = React.useRef<ViewerBridge>({});
  const { geometry, error, loading, dimensions } = useStepGeometry(src, timeoutMs, maxSizeMb);
  const cbRef = React.useRef(onDimensionsExtracted);
  React.useEffect(() => {
    cbRef.current = onDimensionsExtracted;
  }, [onDimensionsExtracted]);
  React.useEffect(() => {
    if (dimensions && cbRef.current) cbRef.current(dimensions);
  }, [dimensions]);

  const viewport = (
    <ViewerShell
      bridgeRef={bridgeRef}
      height={`${height}px`}
      className={bare ? 'rounded-none border-0' : undefined}
    >
      {error ? (
        <ViewerError message={error} testId="cad-viewer-error" />
      ) : loading || !geometry ? (
        <ViewerLoading message="Chargement du modèle CAO…" />
      ) : (
        <div data-testid="cad-viewer-canvas" className="h-full w-full">
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: CAMERA_HOME, fov: 50 }}
            gl={{ preserveDrawingBuffer: true, antialias: true, localClippingEnabled: true }}
            className="h-full w-full"
          >
            <color attach="background" args={['#f8fafc']} />
            <ambientLight intensity={0.85} />
            <directionalLight position={[6, 8, 6]} intensity={1.15} castShadow />
            <directionalLight position={[-6, -4, -6]} intensity={0.4} />
            <Grid
              position={[0, -1.4, 0]}
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.6}
              cellColor="#cbd5e1"
              sectionSize={2.5}
              sectionThickness={1}
              sectionColor="#94a3b8"
              fadeDistance={20}
              fadeStrength={1.5}
              infiniteGrid
            />
            <mesh geometry={geometry}>
              <meshStandardMaterial
                color={MODEL_COLOR}
                side={THREE.DoubleSide}
                metalness={0.15}
                roughness={0.45}
                wireframe={renderMode === 'wireframe'}
                transparent={renderMode === 'xray'}
                opacity={renderMode === 'xray' ? 0.3 : 1}
                depthWrite={renderMode !== 'xray'}
                clippingPlanes={
                  sectionEnabled
                    ? [
                        new THREE.Plane(
                          new THREE.Vector3(1, 0, 0),
                          -(
                            sectionPosition *
                            (geometry.boundingBox?.getSize(new THREE.Vector3()).x ?? MODEL_EXTENT)
                          ),
                        ),
                      ]
                    : undefined
                }
              />
            </mesh>
            <ViewerSceneBridge bridgeRef={bridgeRef} />
            {measureEnabled && <MeasureTool enabled={measureEnabled} mode={measureMode} />}
            <OrbitControls enableZoom enablePan enableRotate makeDefault target={[0, 0, 0]} />
          </Canvas>
        </div>
      )}
    </ViewerShell>
  );

  if (bare) return viewport;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="border-b bg-muted/50">
        <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
      </CardHeader>
      <CardContent className="p-0">{viewport}</CardContent>
    </Card>
  );
}
