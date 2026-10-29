'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, useGLTF, useProgress } from '@react-three/drei';
import { BufferGeometry, Mesh, MeshStandardMaterial, Vector3, Plane } from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { Object3D } from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface StlViewerProps {
  /** URL du fichier STL ou GLTF à afficher */
  src?: string;
  /** Texte alternatif affiché en fallback */
  alt?: string;
  /** Hauteur du canvas en CSS (ex: "400px", "50vh") */
  height?: string;
  /** Rend le viewer sans la Card (intégration dans une Card existante) */
  bare?: boolean;
  /** Mode de rendu */
  renderMode?: 'solid' | 'wireframe' | 'xray';
  /** Active le plan de coupe */
  sectionEnabled?: boolean;
  /** Position du plan de coupe (0-1) */
  sectionPosition?: number;
}

function GltfScene({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} dispose={null} />;
}

/**
 * Normalise le maillage : centré à l'origine et redimensionné pour tenir dans
 * le viewport quelle que soit l'unité du fichier source (mm, pouces, …).
 */
function buildNormalizedMesh(
  geometry: BufferGeometry,
  renderMode: 'solid' | 'wireframe' | 'xray' = 'solid',
  sectionEnabled = false,
  sectionPosition = 0.5,
): Mesh {
  geometry.computeBoundingBox();
  const size = new Vector3();
  const center = new Vector3();
  if (geometry.boundingBox) {
    geometry.boundingBox.getSize(size);
    geometry.boundingBox.getCenter(center);
  }
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const material = new MeshStandardMaterial({
    color: MODEL_COLOR,
    metalness: 0.15,
    roughness: 0.45,
  });
  material.wireframe = renderMode === 'wireframe';
  material.transparent = renderMode === 'xray';
  material.opacity = renderMode === 'xray' ? 0.3 : 1;
  material.depthWrite = renderMode !== 'xray';
  if (sectionEnabled) {
    material.clippingPlanes = [new Plane(new Vector3(1, 0, 0), -(sectionPosition * size.x))];
  }
  const mesh = new Mesh(geometry, material);
  mesh.position.sub(center);
  mesh.scale.setScalar(MODEL_EXTENT / maxDimension);
  return mesh;
}

interface StlLoadState {
  src: string;
  mesh: Mesh | null;
  error: string | null;
}

/**
 * Chargement STL hors du `<Canvas>` : l'état est indexé par `src` pour éviter
 * un rendu transitoire avec le maillage de la source précédente.
 */
function useStlMesh(
  src: string | undefined,
  renderMode: 'solid' | 'wireframe' | 'xray' = 'solid',
  sectionEnabled = false,
  sectionPosition = 0.5,
) {
  const [state, setState] = React.useState<StlLoadState>({ src: '', mesh: null, error: null });

  React.useEffect(() => {
    if (!src) return;
    let cancelled = false;
    new STLLoader()
      .loadAsync(src)
      .then((geometry) => {
        if (cancelled) return;
        setState({
          src,
          mesh: buildNormalizedMesh(geometry, renderMode, sectionEnabled, sectionPosition),
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          src,
          mesh: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [src, renderMode, sectionEnabled, sectionPosition]);

  return {
    mesh: state.src === src ? state.mesh : null,
    error: state.src === src ? state.error : null,
    loading: Boolean(src) && state.src !== src,
  };
}

function useMeshObject(src: string | undefined) {
  const [state, setState] = React.useState<{
    src: string;
    obj: Object3D | null;
    error: string | null;
  }>({ src: '', obj: null, error: null });
  React.useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const ext = src.split('.').pop()?.toLowerCase();
    const loader = ext === 'obj' ? new OBJLoader() : new ThreeMFLoader();
    loader
      .loadAsync(src)
      .then((obj) => {
        if (cancelled) return;
        setState({ src, obj, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ src, obj: null, error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [src]);
  return {
    obj: state.src === src ? state.obj : null,
    error: state.src === src ? state.error : null,
    loading: Boolean(src) && state.src !== src,
  };
}
function StlViewerCanvas({
  mesh,
  src,
  isGltf,
  isObjOr3mf,
  obj,
  bridgeRef,
}: {
  mesh: Mesh | null;
  src: string;
  isGltf: boolean;
  isObjOr3mf: boolean;
  obj: Object3D | null;
  bridgeRef: React.RefObject<ViewerBridge>;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: CAMERA_HOME, fov: 45 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, localClippingEnabled: true }}
      className="h-full w-full"
    >
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 8, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-6, -4, -6]} intensity={0.35} />
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
      <Suspense fallback={null}>
        {isGltf ? (
          <GltfScene src={src} />
        ) : isObjOr3mf ? (
          obj ? (
            <primitive object={obj} dispose={null} />
          ) : null
        ) : mesh ? (
          <primitive object={mesh} dispose={null} />
        ) : null}
      </Suspense>
      <ViewerSceneBridge bridgeRef={bridgeRef} />
      <OrbitControls enableZoom enablePan enableRotate makeDefault target={[0, 0, 0]} />
    </Canvas>
  );
}

export function StlViewer({
  src,
  alt,
  height,
  bare = false,
  renderMode = 'solid',
  sectionEnabled = false,
  sectionPosition = 0.5,
}: StlViewerProps) {
  const isObjOr3mf = src ? /\.(obj|3mf)$/i.test(src) : false;
  const objMesh = useMeshObject(isObjOr3mf ? src : undefined);
  const {
    mesh,
    error: stlError,
    loading: stlLoading,
  } = useStlMesh(isObjOr3mf ? undefined : src, renderMode, sectionEnabled, sectionPosition);
  const error = isObjOr3mf ? objMesh.error : stlError;
  const loading = isObjOr3mf ? objMesh.loading : stlLoading;
  const isGltf = src ? /\.(gltf|glb)$/i.test(src) : false;
  const { active: assetsLoading } = useProgress();
  const bridgeRef = React.useRef<ViewerBridge>({});

  if (!src) {
    const fallback = (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        {alt ?? 'Aucun modèle 3D disponible'}
      </div>
    );
    if (bare) return fallback;
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
        </CardHeader>
        <CardContent>{fallback}</CardContent>
      </Card>
    );
  }

  const isLoading = isGltf ? assetsLoading : loading;

  const viewport = (
    <ViewerShell
      bridgeRef={bridgeRef}
      height={height}
      className={bare ? 'rounded-none border-0' : undefined}
    >
      {error ? (
        <ViewerError message={error} />
      ) : isLoading ? (
        <ViewerLoading />
      ) : (
        <StlViewerCanvas
          mesh={mesh}
          src={src}
          isGltf={isGltf}
          isObjOr3mf={isObjOr3mf}
          obj={objMesh.obj}
          bridgeRef={bridgeRef}
        />
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
