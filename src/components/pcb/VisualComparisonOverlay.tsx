'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { importCadFile } from '@/lib/occt/import-step';
import { tessellateShape } from '@/lib/occt/tessellate';

type ComparisonMode = 'original' | 'reviewed' | 'sourced' | 'exported';

export interface GeometrySource {
  url: string;
  name?: string;
  color?: string;
  mode?: ComparisonMode;
}

interface VisualComparisonOverlayProps {
  projectId: string;
  layers?: GeometrySource[];
  autoRotate?: boolean;
}

const MODE_CONFIG: Record<
  ComparisonMode,
  { label: string; color: string; borderColor: string; bgHover: string }
> = {
  original: {
    label: 'Original',
    color: '#3B82F6',
    borderColor: 'border-blue-500',
    bgHover: 'hover:bg-blue-50',
  },
  reviewed: {
    label: 'Après Revue',
    color: '#10B981',
    borderColor: 'border-green-500',
    bgHover: 'hover:bg-green-50',
  },
  sourced: {
    label: 'Après Sourcing',
    color: '#F59E0B',
    borderColor: 'border-amber-500',
    bgHover: 'hover:bg-amber-50',
  },
  exported: {
    label: 'Prêt Export',
    color: '#8B5CF6',
    borderColor: 'border-violet-500',
    bgHover: 'hover:bg-violet-50',
  },
};

const MODE_ORDER: ComparisonMode[] = ['original', 'reviewed', 'sourced', 'exported'];

const PLATE = {
  cx: 100,
  halfWidth: 70,
  halfHeight: 24,
  thickness: 9,
  baseY: 150,
  step: 30,
};

function detectFormat(nameOrUrl: string): 'step' | 'iges' {
  const lower = nameOrUrl.toLowerCase();
  if (lower.endsWith('.iges') || lower.endsWith('.igs')) return 'iges';
  return 'step';
}

function LayerMesh({
  source,
  color,
  opacity,
}: {
  source: GeometrySource;
  color: string;
  opacity: number;
}) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        console.log('[OCCT:compare] LayerMesh chargement', {
          url: source.url,
          mode: source.mode ?? 'original',
        });
        const res = await fetch(source.url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const buffer = await res.arrayBuffer();
        const result = importCadFile(buffer, detectFormat(source.name ?? source.url));
        if (!result.success || !result.shape) {
          throw new Error(result.error ?? 'Import CAO échoué');
        }
        const geom = tessellateShape(result.shape);
        console.log('[OCCT:compare] LayerMesh prêt', {
          url: source.url,
          vertices: geom.getAttribute('position')?.count ?? 0,
        });
        if (mounted) {
          setGeometry(geom);
        } else {
          geom.dispose();
        }
      } catch (err) {
        console.error('[OCCT:compare] LayerMesh erreur', err);
        if (mounted) setError((err as Error).message);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [source.url, source.name, source.mode]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (error || !geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} opacity={opacity} transparent />
    </mesh>
  );
}

function LayerGroup({ autoRotate, children }: { autoRotate: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.2;
    }
  });
  return <group ref={ref}>{children}</group>;
}

export default function VisualComparisonOverlay({
  projectId,
  layers,
  autoRotate = false,
}: VisualComparisonOverlayProps) {
  const [activeModes, setActiveModes] = useState<Set<ComparisonMode>>(new Set(['original']));
  const [opacity, setOpacity] = useState(0.7);

  const hasRealGeometry = Boolean(layers && layers.length > 0);

  useEffect(() => {
    console.log('[OCCT:compare] VisualComparisonOverlay état', {
      projectId,
      activeModes: [...activeModes],
      opacity,
      hasRealGeometry,
    });
  }, [projectId, activeModes, opacity, hasRealGeometry]);

  const activeList = MODE_ORDER.filter((mode) => activeModes.has(mode));

  const activeLayers = useMemo(
    () => (layers ?? []).filter((layer) => !layer.mode || activeModes.has(layer.mode)),
    [layers, activeModes],
  );

  const toggleMode = (mode: ComparisonMode) => {
    setActiveModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">Comparaison Visuelle</h3>

      {/* Contrôles */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(MODE_CONFIG) as [ComparisonMode, typeof MODE_CONFIG.original][]).map(
          ([mode, config]) => {
            const isActive = activeModes.has(mode);
            return (
              <button
                key={mode}
                onClick={() => toggleMode(mode)}
                className={`rounded border-2 px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? `${config.borderColor} ${config.bgHover} text-gray-900`
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
                style={{
                  borderLeftWidth: isActive ? '4px' : '2px',
                  borderLeftColor: isActive ? config.color : undefined,
                }}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </button>
            );
          },
        )}
      </div>

      {/* Curseur opacité */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Opacité:</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-indigo-600"
        />
        <span className="w-8 text-[10px] text-gray-500">{Math.round(opacity * 100)}%</span>
      </div>

      {/* Rendu géométrique : maillages OCCT réels ou SVG schématique de repli */}
      <div
        data-testid="visual-comparison-canvas"
        className="relative flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-gray-50 p-4"
      >
        {hasRealGeometry ? (
          <div className="h-[200px] w-full">
            <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <LayerGroup autoRotate={autoRotate}>
                {activeLayers.map((layer, index) => (
                  <LayerMesh
                    key={`${layer.url}-${layer.mode ?? index}`}
                    source={layer}
                    color={layer.color ?? MODE_CONFIG[layer.mode ?? 'original'].color}
                    opacity={opacity}
                  />
                ))}
              </LayerGroup>
              <OrbitControls enableZoom enablePan enableRotate />
            </Canvas>
          </div>
        ) : activeList.length > 0 ? (
          <svg
            viewBox="0 0 200 180"
            className="h-[180px] w-full max-w-[280px]"
            role="img"
            aria-label="Superposition géométrique des couches actives"
          >
            {activeList.map((mode, index) => {
              const config = MODE_CONFIG[mode];
              const cy = PLATE.baseY - index * PLATE.step;
              const top = `${PLATE.cx},${cy - PLATE.halfHeight}`;
              const right = `${PLATE.cx + PLATE.halfWidth},${cy}`;
              const bottom = `${PLATE.cx},${cy + PLATE.halfHeight}`;
              const left = `${PLATE.cx - PLATE.halfWidth},${cy}`;
              const bottomLow = `${PLATE.cx},${cy + PLATE.halfHeight + PLATE.thickness}`;
              const rightLow = `${PLATE.cx + PLATE.halfWidth},${cy + PLATE.thickness}`;
              const leftLow = `${PLATE.cx - PLATE.halfWidth},${cy + PLATE.thickness}`;
              return (
                <g key={mode}>
                  <polygon
                    points={`${left} ${bottom} ${bottomLow} ${leftLow}`}
                    fill={config.color}
                    fillOpacity={opacity * 0.75}
                    stroke={config.color}
                    strokeWidth={1}
                  />
                  <polygon
                    points={`${bottom} ${right} ${rightLow} ${bottomLow}`}
                    fill={config.color}
                    fillOpacity={opacity * 0.6}
                    stroke={config.color}
                    strokeWidth={1}
                  />
                  <polygon
                    points={`${top} ${right} ${bottom} ${left}`}
                    fill={config.color}
                    fillOpacity={opacity}
                    stroke={config.color}
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </svg>
        ) : null}
        <p className="text-[10px] text-gray-400">
          {activeModes.size === 0
            ? 'Sélectionnez au moins un mode'
            : `${activeModes.size} couche(s) active(s)`}
        </p>
      </div>

      <p className="text-[10px] text-gray-400 italic">
        Bleu = Original • Vert = Après revue • Ambre = Après sourcing • Violet = Prêt export
      </p>
    </div>
  );
}
