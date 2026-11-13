'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { importCadFile } from '@/lib/occt/import-step';
import { tessellateShape } from '@/lib/occt/tessellate';
import { MeasureTool, type MeasureMode } from '@/components/workspace/MeasureTool';

interface OcctViewerProps {
  /** URL du fichier STEP/IGES */
  src: string;
  /** Nom du fichier (pour détecter le format) */
  fileName: string;
  /** Hauteur du visualiseur (ex: "600px") */
  height?: string;
  /** Rend le viewer sans la Card (intégration dans une Card existante) */
  bare?: boolean;
  /** Active l'outil de mesure */
  measureEnabled?: boolean;
  /** Mode de mesure : distance, angle ou diamètre */
  measureMode?: MeasureMode;
  /** Active le plan de coupe */
  sectionEnabled?: boolean;
  /** Position du plan de coupe (0-1) */
  sectionPosition?: number;
}

const STEP_EXTENSIONS = ['.step', '.stp'];
const IGES_EXTENSIONS = ['.iges', '.igs'];

function getFormat(fileName: string): 'step' | 'iges' {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  if (STEP_EXTENSIONS.includes(ext)) return 'step';
  if (IGES_EXTENSIONS.includes(ext)) return 'iges';
  return 'step'; // défaut
}

export function OcctViewer({
  src,
  fileName,
  height = '600px',
  bare,
  measureEnabled = false,
  measureMode = 'distance',
  sectionEnabled = false,
  sectionPosition = 0.5,
}: OcctViewerProps) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Récupérer le fichier
        const res = await fetch(src);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();

        // Détecter le format
        const format = getFormat(fileName);

        // Importer
        const importResult = importCadFile(buffer, format);
        if (!importResult.success || !importResult.shape) {
          throw new Error(importResult.error || 'Import failed');
        }

        // Tesseller
        const geom = tessellateShape(importResult.shape);
        if (mounted) {
          setGeometry(geom);
          setLoading(false);
        }
      } catch (err) {
        console.error('[OCCT:viewer] Erreur', err);
        if (mounted) setError((err as Error).message);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [src, fileName]);

  if (loading) {
    const fallback = (
      <div
        style={{ height: '100%', width: '100%' }}
        className="flex items-center justify-center text-muted-foreground"
      >
        Chargement OpenCascade.js…
      </div>
    );
    if (bare) return fallback;
    return (
      <div style={{ height }} className="w-full rounded-lg border border-border bg-muted/10">
        {fallback}
      </div>
    );
  }
  if (error) {
    const fallback = (
      <div
        style={{ height: '100%', width: '100%' }}
        className="flex items-center justify-center text-sm text-red-500"
      >
        Erreur : {error}
      </div>
    );
    if (bare) return fallback;
    return (
      <div style={{ height }} className="w-full rounded-lg border border-border bg-muted/10">
        {fallback}
      </div>
    );
  }

  const viewer = (
    <div style={{ height }} className="w-full rounded-lg border border-border bg-muted/10">
      <Canvas
        camera={{ position: [15, 15, 15], fov: 50 }}
        style={{ height: '100%', width: '100%' }}
        gl={{ localClippingEnabled: sectionEnabled }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid infiniteGrid />
        {geometry && (
          <mesh geometry={geometry}>
            <meshStandardMaterial
              color="#94a3b8"
              clippingPlanes={
                sectionEnabled && geometry.boundingBox
                  ? [
                      new THREE.Plane(
                        new THREE.Vector3(1, 0, 0),
                        -(sectionPosition * geometry.boundingBox.getSize(new THREE.Vector3()).x),
                      ),
                    ]
                  : undefined
              }
            />
          </mesh>
        )}
        {measureEnabled && <MeasureTool enabled={measureEnabled} mode={measureMode} />}
        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  );

  return bare ? viewer : <div style={{ height }}>{viewer}</div>;
}
