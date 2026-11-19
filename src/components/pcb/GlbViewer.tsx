'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type GlbSource = { type: 'url'; url: string } | { type: 'buffer'; buffer: ArrayBuffer };

export interface GlbViewerProps {
  sources: GlbSource[];
  fallback?: React.ReactNode;
  onStatusChange?: (status: {
    sourceIndex: number;
    status: 'loaded' | 'error';
    error?: string;
  }) => void;
}

async function loadSource(source: GlbSource): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  if (source.type === 'url') {
    const gltf = await loader.loadAsync(source.url);
    return gltf.scene;
  }
  const gltf = await loader.parseAsync(source.buffer, '');
  return gltf.scene;
}

function Model({ scene }: { scene: THREE.Group }) {
  return <primitive object={scene} scale={0.5} />;
}

export default function GlbViewer({ sources, fallback = null, onStatusChange }: GlbViewerProps) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [failed, setFailed] = useState(false);

  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    let cancelled = false;

    const attempt = async (index: number): Promise<void> => {
      const source = sources[index];
      if (!source) {
        if (!cancelled) setFailed(true);
        return;
      }
      console.log(`[GLB:viewer] source=${index} type=${source.type} status=loading`);
      try {
        const gltfScene = await loadSource(source);
        if (cancelled) return;
        console.log(`[GLB:viewer] source=${index} type=${source.type} status=loaded`);
        setScene(gltfScene);
        setFailed(false);
        onStatusChangeRef.current?.({ sourceIndex: index, status: 'loaded' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`[GLB:viewer] source=${index} type=${source.type} status=error`);
        onStatusChangeRef.current?.({ sourceIndex: index, status: 'error', error: message });
        await attempt(index + 1);
      }
    };

    void attempt(0);

    return () => {
      cancelled = true;
    };
  }, [sources]);

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100">
      <div className="h-full w-full" data-testid="glb-viewer-canvas">
        <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {scene ? <Model scene={scene} /> : null}
          <OrbitControls />
        </Canvas>
      </div>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
          {fallback}
        </div>
      ) : null}
    </div>
  );
}
