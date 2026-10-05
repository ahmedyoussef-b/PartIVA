'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Float } from '@react-three/drei';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Box, RotateCcw, Layers } from 'lucide-react';

interface CadViewerProps {
  format?: 'glb' | 'gltf' | 'stl';
  className?: string;
  partName?: string;
  materialColor?: string;
}

// Procedural 3D industrial part geometry for interactive viewer
function IndustrialPartMesh({
  wireframe,
  color = '#38bdf8',
}: {
  wireframe: boolean;
  color?: string;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Central cylinder hub */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 1.2, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>
      {/* Central bore */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.25, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Flange / Gear teeth collar */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.2, 0.4, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.15}
          wireframe={wireframe}
        />
      </mesh>
      {/* 8 Tooth teeth projections */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 12;
        const x = Math.cos(angle) * 2.3;
        const z = Math.sin(angle) * 2.3;
        return (
          <mesh key={i} position={[x, -0.3, z]} rotation={[0, -angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.38, 0.45]} />
            <meshStandardMaterial color={color} roughness={0.3} wireframe={wireframe} />
          </mesh>
        );
      })}
    </group>
  );
}

export function CadViewer({
  className,
  partName = 'Composant CAO 3D',
  materialColor = '#38bdf8',
}: CadViewerProps) {
  const [mounted, setMounted] = React.useState(false);
  const [wireframe, setWireframe] = React.useState(false);
  const [autorotate, setAutorotate] = React.useState(true);
  const [webGlAvailable, setWebGlAvailable] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGlAvailable(false);
    } catch {
      setWebGlAvailable(false);
    }
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'flex min-h-[420px] flex-col items-center justify-center rounded-xl border bg-muted/30 p-8',
          className,
        )}
      >
        <Skeleton className="mb-4 h-44 w-44 rounded-full" />
        <p className="font-mono text-xs text-muted-foreground">Chargement du moteur 3D...</p>
      </div>
    );
  }

  if (!webGlAvailable) {
    return (
      <div
        className={cn(
          'flex min-h-[420px] flex-col items-center justify-center rounded-xl border bg-muted/40 p-8 text-center',
          className,
        )}
      >
        <Box className="mb-3 h-12 w-12 text-muted-foreground" />
        <h4 className="text-sm font-semibold">Visualisation 3D (Mode simplifié)</h4>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Fichier CAO {partName} disponible au format STEP et GLB.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border bg-gradient-to-b from-card/80 to-muted/50 shadow-inner',
        className,
      )}
      style={{ minHeight: 420 }}
    >
      {/* Top Header Controls */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
        <div className="shadow-xs pointer-events-auto flex items-center gap-2 rounded-lg border bg-background/90 px-3 py-1.5 text-xs backdrop-blur">
          <Box className="h-4 w-4 text-primary" />
          <span className="font-semibold">{partName}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            STEP / GLB
          </span>
        </div>

        <div className="shadow-xs pointer-events-auto flex items-center gap-1.5 rounded-lg border bg-background/90 p-1 backdrop-blur">
          <Button
            size="icon"
            variant={wireframe ? 'default' : 'ghost'}
            className="h-7 w-7"
            onClick={() => setWireframe((v) => !v)}
            title="Afficher le maillage filaire"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant={autorotate ? 'default' : 'ghost'}
            className="h-7 w-7"
            onClick={() => setAutorotate((v) => !v)}
            title="Activer/Désactiver rotation automatique"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-full min-h-[380px] w-full flex-1">
        <Canvas shadows camera={{ position: [5, 4, 5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-10, -5, -10]} intensity={0.3} />

          <Stage environment="city" intensity={0.6} adjustCamera={false}>
            <Float speed={autorotate ? 1.5 : 0} rotationIntensity={0.2} floatIntensity={0.2}>
              <IndustrialPartMesh wireframe={wireframe} color={materialColor} />
            </Float>
          </Stage>

          <Grid
            position={[0, -1.8, 0]}
            args={[10, 10]}
            cellColor="#475569"
            sectionColor="#94a3b8"
            fadeDistance={15}
            fadeStrength={1.5}
          />

          <OrbitControls makeDefault autoRotate={autorotate} autoRotateSpeed={1.8} />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="flex items-center justify-between border-t bg-background/50 px-4 py-2 text-[11px] text-muted-foreground backdrop-blur">
        <span>Clic gauche : Rotation • Molette : Zoom • Clic droit : Pan</span>
        <span className="font-mono">R3F / Three.js</span>
      </div>
    </div>
  );
}
