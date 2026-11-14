'use client';

import { useState, useMemo, useEffect, Suspense, Component, ReactNode } from 'react';
import {
  Ruler,
  Scissors,
  Columns,
  Download,
  Box,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ModelViewer } from '@/components/3d/model-viewer';
import { OcctViewer } from '@/components/3d/occt-viewer';
import { OcctProvider } from '@/components/3d/occt-context';
import { downloadStl } from '@/lib/export/stl-export';
import type { ReconstructCandidate } from '@/core/ai-engine/skills/reconstruct/types';
import { MeasureTool, type MeasureMode } from '@/components/workspace/MeasureTool';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFullscreen } from './WorkspaceLayout';

interface ViewerZoneProps {
  fileUrl?: string | null;
  uploadedFileUrl?: string | null;
  candidates?: ReconstructCandidate[];
  onDimensionsExtracted?: (dimensions: {
    length: number;
    width: number;
    height: number;
    diameter: number;
  }) => void;
  photos?: string[];
  selectedPhotoIndex?: number;
}

function isCad(url: string) {
  const ext = url.slice(url.lastIndexOf('.')).toLowerCase();
  return ['.step', '.stp', '.iges', '.igs'].includes(ext);
}

function detectCadFormat(url: string): 'STEP' | 'IGES' | 'STL' | 'OBJ' | '3MF' | null {
  const ext = url.slice(url.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.step':
    case '.stp':
      return 'STEP';
    case '.iges':
    case '.igs':
      return 'IGES';
    case '.stl':
      return 'STL';
    case '.obj':
      return 'OBJ';
    case '.3mf':
      return '3MF';
    default:
      return null;
  }
}

function getFileNameFromUrl(url: string, fallback: string = 'model'): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop();
    if (fileName && fileName.includes('.')) return fileName;
  } catch {
    // Not a valid URL (could be data: URL)
  }
  // Fallback: construct a filename based on format
  const fmt = detectCadFormat(url);
  const ext = fmt === 'STEP' ? '.step' : fmt === 'IGES' ? '.iges' : '.step';
  return `${fallback}${ext}`;
}

// FitCamera component to auto-fit camera to geometry
function FitCamera({ geometry }: { geometry: THREE.BufferGeometry | null }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingSphere();
    const sphere = geometry.boundingSphere;
    if (!sphere) return;
    const center = sphere.center;
    const radius = sphere.radius;
    const distance = radius * 3;
    camera.position.set(center.x + distance, center.y + distance, center.z + distance);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    if (controls && 'target' in controls) {
      const c = controls as unknown as { target: THREE.Vector3; update: () => void };
      c.target.copy(center);
      c.update();
    }
  }, [geometry, camera, controls]);
  return null;
}

// Error Boundary for 3D viewers
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Viewer:ErrorBoundary] Erreur', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// STL Viewer Component with error handling
function StlViewerContent({
  src,
  sectionEnabled = false,
  sectionPosition = 0.5,
}: {
  src: string;
  sectionEnabled?: boolean;
  sectionPosition?: number;
}) {
  const geometry = useLoader(STLLoader, src);
  const mesh = useMemo(
    () =>
      new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.3,
          roughness: 0.7,
          clippingPlanes:
            sectionEnabled && geometry.boundingBox
              ? [
                  new THREE.Plane(
                    new THREE.Vector3(1, 0, 0),
                    -(sectionPosition * geometry.boundingBox.getSize(new THREE.Vector3()).x),
                  ),
                ]
              : undefined,
        }),
      ),
    [geometry, sectionEnabled, sectionPosition],
  );
  return (
    <>
      <FitCamera geometry={geometry} />
      <primitive object={mesh} />
    </>
  );
}

function StlViewer({
  src,
  measureEnabled = false,
  measureMode = 'distance',
  sectionEnabled = false,
  sectionPosition = 0.5,
  ...props
}: {
  src: string;
  measureEnabled?: boolean;
  measureMode?: MeasureMode;
  sectionEnabled?: boolean;
  sectionPosition?: number;
} & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <ViewerErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-red-500">
          Erreur chargement STL
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chargement STL…
          </div>
        }
      >
        <Canvas
          {...props}
          camera={{ position: [5, 5, 5], fov: 50 }}
          gl={{ localClippingEnabled: sectionEnabled }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <StlViewerContent
            src={src}
            sectionEnabled={sectionEnabled}
            sectionPosition={sectionPosition}
          />
          {measureEnabled && <MeasureTool enabled={measureEnabled} mode={measureMode} />}
          <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        </Canvas>
      </Suspense>
    </ViewerErrorBoundary>
  );
}

// OBJ Viewer Component with error handling
function ObjViewerContent({
  src,
  sectionEnabled = false,
  sectionPosition = 0.5,
}: {
  src: string;
  sectionEnabled?: boolean;
  sectionPosition?: number;
}) {
  const object = useLoader(OBJLoader, src);
  const geometry = useMemo<THREE.BufferGeometry | null>(() => {
    if (!object) return null;
    // OBJLoader returns a Group, we need to extract the first BufferGeometry
    let geom: THREE.BufferGeometry | null = null;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
        geom = child.geometry;
      }
    });
    return geom;
  }, [object]);
  return (
    <>
      <FitCamera geometry={geometry} />
      <primitive
        object={object}
        material={
          sectionEnabled && geometry?.boundingBox
            ? new THREE.MeshStandardMaterial({
                clippingPlanes: [
                  new THREE.Plane(
                    new THREE.Vector3(1, 0, 0),
                    -(sectionPosition * geometry.boundingBox.getSize(new THREE.Vector3()).x),
                  ),
                ],
              })
            : undefined
        }
      />
    </>
  );
}

function ObjViewer({
  src,
  measureEnabled = false,
  measureMode = 'distance',
  sectionEnabled = false,
  sectionPosition = 0.5,
  ...props
}: {
  src: string;
  measureEnabled?: boolean;
  measureMode?: MeasureMode;
  sectionEnabled?: boolean;
  sectionPosition?: number;
} & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <ViewerErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-red-500">
          Erreur chargement OBJ
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chargement OBJ…
          </div>
        }
      >
        <Canvas
          {...props}
          camera={{ position: [5, 5, 5], fov: 50 }}
          gl={{ localClippingEnabled: sectionEnabled }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <ObjViewerContent
            src={src}
            sectionEnabled={sectionEnabled}
            sectionPosition={sectionPosition}
          />
          {measureEnabled && <MeasureTool enabled={measureEnabled} mode={measureMode} />}
          <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        </Canvas>
      </Suspense>
    </ViewerErrorBoundary>
  );
}

// 3MF Fallback Component
function ThreeMFFallback() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
      <p className="text-muted-foreground">Preview 3MF non disponible</p>
    </div>
  );
}

const MODE_LABELS: Record<MeasureMode, string> = {
  distance: 'Distance',
  angle: 'Angle',
  diameter: 'Diamètre',
};

type RenderMode = 'solid' | 'wireframe' | 'xray';

const RENDER_MODE_LABELS: Record<RenderMode, string> = {
  solid: 'Solide',
  wireframe: 'Filaire',
  xray: 'X-Ray',
};

export function ViewerZone({
  fileUrl,
  uploadedFileUrl,
  candidates = [],
  onDimensionsExtracted,
  photos = [],
  selectedPhotoIndex = 0,
}: ViewerZoneProps) {
  const displayUrl = fileUrl || uploadedFileUrl || photos[selectedPhotoIndex] || null;
  const isStlDataUrl = displayUrl ? displayUrl.startsWith('data:application/stl') : false;
  const [measuring, setMeasuring] = useState(false);
  const [measureMode, setMeasureMode] = useState<MeasureMode>('distance');
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [sectionEnabled, setSectionEnabled] = useState(false);
  const [sectionPosition, setSectionPosition] = useState(0.5);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const { fullscreen, setFullscreen } = useFullscreen();

  if (
    displayUrl &&
    !isCad(displayUrl) &&
    !isStlDataUrl &&
    !/\.(stl|gltf|glb|step|stp|iges|igs|obj|3mf)$/i.test(displayUrl)
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="preview" className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  if (!displayUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
        <svg
          className="h-10 w-10 text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <p>Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer.</p>
      </div>
    );
  }

  const validCandidates = candidates.filter((c) => !!c.fileUrl);
  const selectedCandidate =
    validCandidates.find((c) => c.id === selectedCandidateId) ?? validCandidates[0] ?? null;

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute top-2 right-2 z-50 flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setMeasuring((v) => !v)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
                measuring ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Ruler className="h-4 w-4" />
              Mesurer
            </button>
          </TooltipTrigger>
          <TooltipContent>Mesure une distance, un angle ou un diamètre.</TooltipContent>
        </Tooltip>
        {measuring && (
          <select
            value={measureMode}
            onChange={(e) => setMeasureMode(e.target.value as MeasureMode)}
            className="rounded border bg-white px-2 py-1 text-xs shadow"
          >
            {Object.entries(MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <select
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value as RenderMode)}
          className="rounded border bg-white px-2 py-1 text-xs shadow"
          aria-label="Mode de rendu"
        >
          {Object.entries(RENDER_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setSectionEnabled((v) => !v)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
                sectionEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Scissors className="h-4 w-4" />
              Section
            </button>
          </TooltipTrigger>
          <TooltipContent>Active un plan de coupe pour voir l&apos;intérieur.</TooltipContent>
        </Tooltip>
        {sectionEnabled && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sectionPosition}
            onChange={(e) => setSectionPosition(Number(e.target.value))}
            className="w-24"
            aria-label="Position du plan de coupe"
          />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
                fullscreen ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              Plein écran
            </button>
          </TooltipTrigger>
          <TooltipContent>Basculer en mode plein écran.</TooltipContent>
        </Tooltip>
        {displayUrl &&
          (displayUrl.endsWith('.stl') || displayUrl.startsWith('data:application/stl')) && (
            <button
              type="button"
              onClick={() => downloadStl(displayUrl, 'piece-uploaded-printable.stl')}
              className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow"
            >
              <Download className="h-4 w-4" />
              Exporter STL
            </button>
          )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setCompareEnabled((v) => !v)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
                compareEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Columns className="h-4 w-4" />
              Comparer
            </button>
          </TooltipTrigger>
          <TooltipContent>Compare le fichier uploadé avec un candidat.</TooltipContent>
        </Tooltip>
      </div>
      {compareEnabled ? (
        <div className="grid h-full grid-cols-2 gap-2 p-2">
          <div className="min-h-0">
            {uploadedFileUrl ? (
              (() => {
                const fmt = detectCadFormat(uploadedFileUrl);
                if (fmt === 'STEP' || fmt === 'IGES') {
                  return (
                    <OcctProvider key="uploaded">
                      <OcctViewer
                        src={uploadedFileUrl}
                        fileName={getFileNameFromUrl(uploadedFileUrl, 'uploaded')}
                        height="100%"
                        bare
                        measureEnabled={measuring}
                        measureMode={measureMode}
                        sectionEnabled={sectionEnabled}
                        sectionPosition={sectionPosition}
                      />
                    </OcctProvider>
                  );
                }
                if (fmt === 'STL') {
                  return (
                    <StlViewer
                      src={uploadedFileUrl}
                      style={{ height: '100%' }}
                      measureEnabled={measuring}
                      measureMode={measureMode}
                      sectionEnabled={sectionEnabled}
                      sectionPosition={sectionPosition}
                    />
                  );
                }
                if (fmt === 'OBJ') {
                  return (
                    <ObjViewer
                      src={uploadedFileUrl}
                      style={{ height: '100%' }}
                      measureEnabled={measuring}
                      measureMode={measureMode}
                      sectionEnabled={sectionEnabled}
                      sectionPosition={sectionPosition}
                    />
                  );
                }
                if (fmt === '3MF') {
                  return <ThreeMFFallback />;
                }
                return (
                  <ModelViewer
                    src={uploadedFileUrl}
                    bare
                    height="100%"
                    renderMode={renderMode}
                    sectionEnabled={sectionEnabled}
                    sectionPosition={sectionPosition}
                    measureEnabled={measuring}
                    measureMode={measureMode}
                  />
                );
              })()
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aucun fichier uploadé
              </div>
            )}
          </div>
          <div className="min-h-0">
            <select
              value={selectedCandidate?.id ?? ''}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="mb-1 w-full rounded border bg-white px-2 py-1 text-xs shadow"
            >
              {validCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
            {selectedCandidate?.fileUrl ? (
              (() => {
                const fmt = detectCadFormat(selectedCandidate.fileUrl);
                if (fmt === 'STEP' || fmt === 'IGES') {
                  return (
                    <OcctProvider key={selectedCandidate.id}>
                      <OcctViewer
                        src={selectedCandidate.fileUrl}
                        fileName={getFileNameFromUrl(selectedCandidate.fileUrl, 'candidate')}
                        height="100%"
                        bare
                        measureEnabled={measuring}
                        measureMode={measureMode}
                        sectionEnabled={sectionEnabled}
                        sectionPosition={sectionPosition}
                      />
                    </OcctProvider>
                  );
                }
                if (fmt === 'STL') {
                  return (
                    <StlViewer
                      src={selectedCandidate.fileUrl}
                      style={{ height: '100%' }}
                      measureEnabled={measuring}
                      measureMode={measureMode}
                      sectionEnabled={sectionEnabled}
                      sectionPosition={sectionPosition}
                    />
                  );
                }
                if (fmt === 'OBJ') {
                  return (
                    <ObjViewer
                      src={selectedCandidate.fileUrl}
                      style={{ height: '100%' }}
                      measureEnabled={measuring}
                      measureMode={measureMode}
                      sectionEnabled={sectionEnabled}
                      sectionPosition={sectionPosition}
                    />
                  );
                }
                if (fmt === '3MF') {
                  return <ThreeMFFallback />;
                }
                return (
                  <ModelViewer
                    src={selectedCandidate.fileUrl}
                    bare
                    height="100%"
                    renderMode={renderMode}
                    sectionEnabled={sectionEnabled}
                    sectionPosition={sectionPosition}
                    measureEnabled={measuring}
                    measureMode={measureMode}
                  />
                );
              })()
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aucun candidat
              </div>
            )}
          </div>
        </div>
      ) : !displayUrl ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
          <Box className="h-10 w-10 text-gray-300" />
          <p>
            Déposez un fichier CAO (STEP, STL) ou sélectionnez un candidat pour visualiser le modèle
            3D.
          </p>
        </div>
      ) : (
        <div className="w-full flex-1">
          {(() => {
            const fmt = detectCadFormat(displayUrl);
            if (fmt === 'STEP' || fmt === 'IGES') {
              return (
                <OcctProvider key="main">
                  <OcctViewer
                    src={displayUrl}
                    fileName={getFileNameFromUrl(displayUrl, 'model')}
                    height="100%"
                    bare
                    measureEnabled={measuring}
                    measureMode={measureMode}
                    sectionEnabled={sectionEnabled}
                    sectionPosition={sectionPosition}
                  />
                </OcctProvider>
              );
            }
            if (fmt === 'STL') {
              return (
                <StlViewer
                  src={displayUrl}
                  style={{ height: '100%' }}
                  measureEnabled={measuring}
                  measureMode={measureMode}
                  sectionEnabled={sectionEnabled}
                  sectionPosition={sectionPosition}
                />
              );
            }
            if (fmt === 'OBJ') {
              return (
                <ObjViewer
                  src={displayUrl}
                  style={{ height: '100%' }}
                  measureEnabled={measuring}
                  measureMode={measureMode}
                  sectionEnabled={sectionEnabled}
                  sectionPosition={sectionPosition}
                />
              );
            }
            if (fmt === '3MF') {
              return <ThreeMFFallback />;
            }
            return (
              <ModelViewer
                src={displayUrl}
                bare
                height="100%"
                measureEnabled={measuring}
                measureMode={measureMode}
                renderMode={renderMode}
                sectionEnabled={sectionEnabled}
                sectionPosition={sectionPosition}
                onDimensionsExtracted={onDimensionsExtracted}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
