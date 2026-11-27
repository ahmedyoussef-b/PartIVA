'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line, OrbitControls, Text, useGLTF } from '@react-three/drei';
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
  footprint?: string;
}

interface NetInfo {
  name: string;
  pins: string[];
}

const NET_COLORS = [
  '#ff5555',
  '#55ff55',
  '#5555ff',
  '#ffff55',
  '#ff55ff',
  '#55ffff',
  '#ffaa55',
  '#aa55ff',
];

function toScene(x: number, y: number, board: BoardInfo): [number, number, number] {
  return [(x - board.widthMm / 2) / 5, 0, (y - board.heightMm / 2) / 5];
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

function SceneModel({ url, y }: { url: string; y: number }) {
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
    clone.position.set(-center.x * scale, -box.min.y * scale + y, -center.z * scale);
    return clone;
  }, [scene, y]);
  return <primitive object={object} />;
}

function FallbackBoard({
  board,
  components,
  exploded,
}: {
  board: BoardInfo;
  components: ComponentInfo[];
  exploded: boolean;
}) {
  const width = Math.max(1, board.widthMm) / 5;
  const depth = Math.max(1, board.heightMm) / 5;
  return (
    <group>
      <mesh receiveShadow position={[0, exploded ? -3 : -0.4, 0]}>
        <boxGeometry args={[width, 0.8, depth]} />
        <meshStandardMaterial color="#1d6b3a" metalness={0.1} roughness={0.7} />
      </mesh>
      <mesh position={[0, exploded ? -1.5 : -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#7a2b2b" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, exploded ? -2.5 : -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#2b4a7a" transparent opacity={0.35} />
      </mesh>
      {components.map((c) => {
        const [x, , z] = toScene(c.x, c.y, board);
        return (
          <group key={c.reference} position={[x, exploded ? 3 : 0.25, z]}>
            <mesh castShadow>
              <boxGeometry args={[1.2, 0.5, 0.8]} />
              <meshStandardMaterial color="#20242b" />
            </mesh>
          </group>
        );
      })}
      <Text position={[0, exploded ? 4.5 : 1.5, 0]} fontSize={0.6} color="#f59e0b">
        3D non disponible
      </Text>
    </group>
  );
}

// Les marqueurs sont toujours rendus (au-dessus du GLB) pour permettre la sélection.
function ComponentMarkers({
  board,
  components,
  selected,
  onSelect,
  exploded,
}: {
  board: BoardInfo;
  components: ComponentInfo[];
  selected: string | null;
  onSelect: (reference: string) => void;
  exploded: boolean;
}) {
  return (
    <group>
      {components.map((c) => {
        const [x, , z] = toScene(c.x, c.y, board);
        const y = exploded ? 3.2 : 0.9;
        const active = selected === c.reference;
        return (
          <group key={c.reference} position={[x, y, z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(c.reference);
              }}
            >
              <boxGeometry args={[1.1, 0.12, 0.75]} />
              <meshStandardMaterial
                color={active ? '#f59e0b' : '#38bdf8'}
                transparent
                opacity={active ? 0.85 : 0.45}
              />
            </mesh>
            <Text
              position={[0, 0.25, 0]}
              fontSize={0.35}
              color={active ? '#f59e0b' : '#e2e8f0'}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {c.reference}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function NetRatsnest({
  board,
  nets,
  components,
  exploded,
}: {
  board: BoardInfo;
  nets: NetInfo[];
  components: ComponentInfo[];
  exploded: boolean;
}) {
  const byRef = new Map(components.map((c) => [c.reference, c]));
  const y = exploded ? 3.8 : 1.6;
  const lines: Array<{ key: string; points: [number, number, number][]; color: string }> = [];
  nets.forEach((net, index) => {
    const refs = [...new Set(net.pins.map((p) => p.split('.')[0] ?? p))];
    const positions = refs
      .map((ref) => byRef.get(ref))
      .filter((c): c is ComponentInfo => !!c)
      .map((c) => toScene(c.x, c.y, board));
    if (positions.length < 2) return;
    for (let i = 1; i < positions.length; i += 1) {
      lines.push({
        key: `${net.name}-${i}`,
        points: [
          [positions[0]![0], y, positions[0]![2]],
          [positions[i]![0], y, positions[i]![2]],
        ],
        color: NET_COLORS[index % NET_COLORS.length]!,
      });
    }
  });
  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color={line.color}
          dashed
          dashSize={0.4}
          gapSize={0.25}
          lineWidth={1.5}
        />
      ))}
    </group>
  );
}

export function Pcb3DViewer({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardInfo>({ widthMm: 100, heightMm: 80 });
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [nets, setNets] = useState<NetInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showNets, setShowNets] = useState(false);
  const [exploded, setExploded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
              footprint: c.footprint,
            })),
          );
          setNets(data.nets ?? []);
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

  const selectedComponent = components.find((c) => c.reference === selected);
  const connectedNets = selected
    ? nets.filter((n) => n.pins.some((p) => p.split('.')[0] === selected)).map((n) => n.name)
    : [];

  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${projectId}-3d.png`;
    link.click();
  };

  return (
    <div className="relative h-full w-full" style={{ minHeight: 420 }}>
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setShowNets((v) => !v)}
          className={`rounded border px-2 py-1 text-[11px] ${
            showNets
              ? 'border-blue-400 bg-blue-600 text-white'
              : 'border-gray-600 bg-gray-800 text-gray-200'
          }`}
        >
          Afficher les nets
        </button>
        <button
          type="button"
          onClick={() => setExploded((v) => !v)}
          className={`rounded border px-2 py-1 text-[11px] ${
            exploded
              ? 'border-amber-400 bg-amber-600 text-white'
              : 'border-gray-600 bg-gray-800 text-gray-200'
          }`}
        >
          Vue éclatée
        </button>
        <button
          type="button"
          onClick={capture}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-[11px] text-gray-200"
        >
          Capturer
        </button>
      </div>
      {selectedComponent && (
        <div className="absolute top-2 right-2 z-10 w-56 rounded border border-blue-400 bg-gray-900/90 p-2 text-[11px] text-gray-100">
          <div className="font-semibold text-amber-300">{selectedComponent.reference}</div>
          <div>Valeur : {selectedComponent.value ?? '—'}</div>
          <div>Empreinte : {selectedComponent.footprint ?? '—'}</div>
          <div>
            Position : ({selectedComponent.x.toFixed(2)}, {selectedComponent.y.toFixed(2)}) ·{' '}
            {selectedComponent.rotation}°
          </div>
          <div>Nets : {connectedNets.length > 0 ? connectedNets.join(', ') : '—'}</div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-1 rounded border border-gray-600 px-2 py-0.5"
          >
            Fermer
          </button>
        </div>
      )}
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [90, 70, 110], fov: 45 }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        <color attach="background" args={['#0f1418']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[50, 100, 50]} intensity={1.2} castShadow />
        <Suspense
          fallback={<FallbackBoard board={board} components={components} exploded={exploded} />}
        >
          {url ? (
            <ModelErrorBoundary
              fallback={<FallbackBoard board={board} components={components} exploded={exploded} />}
            >
              <SceneModel url={url} y={exploded ? -3 : 0} />
            </ModelErrorBoundary>
          ) : (
            <FallbackBoard board={board} components={components} exploded={exploded} />
          )}
        </Suspense>
        <ComponentMarkers
          board={board}
          components={components}
          selected={selected}
          onSelect={setSelected}
          exploded={exploded}
        />
        {showNets && (
          <NetRatsnest board={board} nets={nets} components={components} exploded={exploded} />
        )}
        <gridHelper args={[200, 40, '#334155', '#1e293b']} position={[0, exploded ? -4 : -1, 0]} />
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
