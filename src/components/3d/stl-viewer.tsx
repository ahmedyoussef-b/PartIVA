'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { AmbientLight, SpotLight, AxesHelper, Object3D, Mesh, MeshStandardMaterial } from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useGLTF } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StlViewerProps {
  /** URL du fichier STL ou GLTF à afficher */
  src?: string;
  /** Texte alternatif affiché en fallback */
  alt?: string;
  /** Hauteur du canvas en CSS (ex: "400px", "50vh") */
  height?: string;
}

const MODEL_BG_COLOR = '#0f172a';

function StlScene({ src }: { src: string }) {
  const isGltf = src.toLowerCase().endsWith('.gltf') || src.toLowerCase().endsWith('.glb');

  if (isGltf) {
    const { scene } = useGLTF(src);
    return <primitive object={scene} dispose={null} />;
  }

  const [scene, setScene] = React.useState<Object3D | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    new STLLoader()
      .loadAsync(src)
      .then((geometry) => {
        if (!cancelled) setScene(new Mesh(geometry, new MeshStandardMaterial({ color: 0xffffff })));
      })
      .catch((err) => {
        if (!cancelled) setError(err as Error);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (error) {
    return (
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center text-slate-300">
        <p className="text-sm font-medium">Erreur de chargement du modèle 3D</p>
        <p className="mt-1 max-w-[80%] truncate text-xs">{error.message}</p>
      </div>
    );
  }
  if (!scene) return null;
  return <primitive object={scene} dispose={null} />;
}

function StlViewerCanvas({ src }: { src: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%', backgroundColor: MODEL_BG_COLOR }}
      >
        <primitive object={new AmbientLight(0xffffff, 0.6)} />
        <primitive
          object={new SpotLight(0xffffff, 1.2, 50, Math.PI / 4, 0.5, 1)}
          position={[10, 10, 10]}
        />
        <primitive object={new AxesHelper(1)} />
        <Grid />
        <StlScene src={src} />
        <OrbitControls enableZoom enablePan enableRotate makeDefault />
      </Canvas>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button size="sm" variant="outline">
          Reset vue
        </Button>
      </div>
    </div>
  );
}

export function StlViewer({ src, alt, height }: StlViewerProps) {
  if (!src) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-12">
          {alt ?? 'Aucun modèle 3D disponible'}
        </CardContent>
      </Card>
    );
  }

  const style = height ? { height } : {};

  return (
    <Card className="w-full" style={style}>
      <CardHeader>
        <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <StlViewerCanvas src={src} />
      </CardContent>
    </Card>
  );
}
