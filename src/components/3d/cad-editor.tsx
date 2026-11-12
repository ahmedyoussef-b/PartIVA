'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

interface CadEditorProps {
  src: string;
  height?: string;
  onDimensionsChange?: (dimensions: { width: number; height: number; depth: number }) => void;
}

function Model({
  src,
  onDimensionsChange,
}: {
  src: string;
  onDimensionsChange?: (d: { width: number; height: number; depth: number }) => void;
}) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(null);

  React.useEffect(() => {
    const loader = src.endsWith('.obj') ? new OBJLoader() : new STLLoader();
    loader.load(
      src,
      (result) => {
        if (result instanceof THREE.BufferGeometry) {
          setGeometry(result);
        } else if (result instanceof THREE.Group) {
          result.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              setGeometry(child.geometry);
            }
          });
        }
      },
      undefined,
      (err) => console.error('[RE:editor] Erreur chargement modèle:', err),
    );
  }, [src]);

  React.useEffect(() => {
    if (geometry && onDimensionsChange) {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (box) {
        onDimensionsChange({
          width: box.max.x - box.min.x,
          height: box.max.y - box.min.y,
          depth: box.max.z - box.min.z,
        });
      }
    }
  }, [geometry, onDimensionsChange]);

  if (!geometry) return null;

  return (
    <TransformControls mode="scale" size={1}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </TransformControls>
  );
}

export function CadEditor({ src, height = '600px', onDimensionsChange }: CadEditorProps) {
  return (
    <div style={{ height }} className="w-full rounded-lg border border-border bg-muted/10">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid infiniteGrid />
        <Model src={src} onDimensionsChange={onDimensionsChange} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
