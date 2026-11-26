'use client';

import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface BoardInfo {
  widthMm: number;
  heightMm: number;
}

interface ComponentInfo {
  reference: string;
  x: number;
  y: number;
  rotation: number;
  value?: string;
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.warn('[PCB:3D] Modèle GLB illisible, fallback paramétrique', error);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 80 / Math.max(size.x, size.z, 1);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    return clone;
  }, [scene]);
  return <primitive object={object} />;
}

function FallbackBoard({ board, components }: { board: BoardInfo; components: ComponentInfo[] }) {
  const width = Math.max(1, board.widthMm) / 5;
  const depth = Math.max(1, board.heightMm) / 5;
  return (
    <group>
      <mesh receiveShadow position={[0, -0.4, 0]}>
        <boxGeometry args={[width, 0.8, depth]} />
        <meshStandardMaterial color="#1d6b3a" metalness={0.1} roughness={0.7} />
      </mesh>
      {components.map((c) => (
        <group
          key={c.reference}
          position={[(c.x - board.widthMm / 2) / 5, 0.25, (c.y - board.heightMm / 2) / 5]}
          rotation={[0, (-c.rotation * Math.PI) / 180, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.5, 0.8]} />
            <meshStandardMaterial color="#20242b" />
          </mesh>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.35}
            color="white"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {c.reference}
          </Text>
        </group>
      ))}
      <Text position={[0, 1.5, 0]} fontSize={0.6} color="#f59e0b">
        3D non disponible
      </Text>
    </group>
  );
}

export function Pcb3DViewer({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardInfo>({ widthMm: 100, heightMm: 80 });
  const [components, setComponents] = useState<ComponentInfo[]>([]);

  useEffect(() => {
    let objectUrl: string | null = null;
    const load = async () => {
      try {
        const [renderRes, glbRes] = await Promise.all([
          fetch(`/api/pcb/board/render?projectId=${encodeURIComponent(projectId)}`),
          fetch(`/api/pcb/projects/${encodeURIComponent(projectId)}/glb`),
        ]);
        if (renderRes.ok) {
          const data = await renderRes.json();
          setBoard({
            widthMm: data.board?.dimensions?.width || 100,
            heightMm: data.board?.dimensions?.height || 80,
          });
          setComponents(
            (data.components ?? []).map((c: ComponentInfo) => ({
              reference: c.reference,
              x: c.x,
              y: c.y,
              rotation: c.rotation,
              value: c.value,
            })),
          );
        }
        if (glbRes.ok) {
          const data = await glbRes.json();
          if (data.ok && typeof data.base64 === 'string') {
            const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
            objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
            setUrl(objectUrl);
          }
        }
      } catch {
        // fallback paramétrique
      }
    };
    void load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId]);

  return (
    <div className="h-full w-full" style={{ minHeight: 420 }}>
      <Canvas camera={{ position: [90, 70, 110], fov: 45 }} shadows>
        <color attach="background" args={['#0f1418']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[50, 100, 50]} intensity={1.2} castShadow />
        <Suspense fallback={<FallbackBoard board={board} components={components} />}>
          {url ? (
            <ModelErrorBoundary fallback={<FallbackBoard board={board} components={components} />}>
              <SceneModel url={url} />
            </ModelErrorBoundary>
          ) : (
            <FallbackBoard board={board} components={components} />
          )}
        </Suspense>
        <gridHelper args={[200, 40, '#334155', '#1e293b']} position={[0, -1, 0]} />
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={20}
          maxDistance={400}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
