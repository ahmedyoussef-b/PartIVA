'use client';

import * as React from 'react';
import { CadViewer } from './cad-viewer';
import { StlViewer } from './stl-viewer';
import type { MeasureMode } from '@/components/workspace/MeasureTool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModelViewerProps {
  /** URL du modèle 3D (STEP / IGES / STL / GLTF) */
  src: string;
  /** Texte alternatif affiché en fallback */
  alt?: string;
  /** Hauteur du visualiseur (ex: "500px" ou 500) */
  height?: string | number;
  /** Rend le viewer sans la Card (intégration dans une Card existante) */
  bare?: boolean;
  /** Active l'outil de mesure */
  measureEnabled?: boolean;
  /** Mode de mesure : distance, angle ou diamètre */
  measureMode?: MeasureMode;
  /** Mode de rendu */
  renderMode?: 'solid' | 'wireframe' | 'xray';
  /** Active le plan de coupe */
  sectionEnabled?: boolean;
  /** Position du plan de coupe (0-1) */
  sectionPosition?: number;
  /** Callback dimensions extraites */
  onDimensionsExtracted?: (dimensions: {
    length: number;
    width: number;
    height: number;
    diameter: number;
  }) => void;
}

/* Extensions CAO solides/surfaces → parsed par occt-import-js (Web Worker) */
const CAD_EXTENSIONS = ['.step', '.stp', '.iges', '.igs', '.brep'];
/* Maillages → rendu Three.js direct (STLLoader / useGLTF) */
const MESH_EXTENSIONS = ['.stl', '.gltf', '.glb'];

function extensionOf(src: string): string {
  const idx = src.lastIndexOf('.');
  return idx === -1 ? '' : src.slice(idx).toLowerCase();
}

function heightToPx(height: string | number | undefined, fallback = 400): number {
  if (height === undefined) return fallback;
  if (typeof height === 'number') return height;
  const parsed = parseInt(height.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function heightToCss(height: string | number | undefined): string | undefined {
  if (height === undefined) return undefined;
  return typeof height === 'number' ? `${height}px` : height;
}

/**
 * ModelViewer — choisit le visualiseur 3D adapté selon l'extension du fichier :
 * - `.step` / `.stp` / `.iges` / `.igs` / `.brep` → `CadViewer` (occt-import-js)
 * - `.stl` / `.gltf` / `.glb`                   → `StlViewer` (Three.js)
 * - autre / inconnu                              → carte de fallback explicite
 */
export function ModelViewer({
  src,
  alt,
  height,
  bare = false,
  measureEnabled = false,
  measureMode = 'distance',
  renderMode = 'solid',
  sectionEnabled = false,
  sectionPosition = 0.5,
  onDimensionsExtracted,
}: ModelViewerProps) {
  const ext = extensionOf(src);
  const isCad = CAD_EXTENSIONS.includes(ext);
  const isMesh = MESH_EXTENSIONS.includes(ext);

  const style = height ? { height: heightToCss(height) } : {};

  if (!isCad && !isMesh) {
    const fallback = (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        {alt ?? 'Format de modèle 3D non pris en charge'}
      </div>
    );
    if (bare) return fallback;
    return (
      <Card className="w-full" style={style}>
        <CardHeader>
          <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
        </CardHeader>
        <CardContent>{fallback}</CardContent>
      </Card>
    );
  }

  if (isCad) {
    return (
      <CadViewer
        src={src}
        height={heightToPx(height)}
        bare={bare}
        measureEnabled={measureEnabled}
        measureMode={measureMode}
        renderMode={renderMode}
        sectionEnabled={sectionEnabled}
        sectionPosition={sectionPosition}
        onDimensionsExtracted={onDimensionsExtracted}
      />
    );
  }

  return (
    <StlViewer
      src={src}
      alt={alt}
      height={heightToCss(height)}
      bare={bare}
      renderMode={renderMode}
      sectionEnabled={sectionEnabled}
      sectionPosition={sectionPosition}
    />
  );
}
