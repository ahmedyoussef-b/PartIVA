'use client';

import * as React from 'react';
import { CadViewer } from './cad-viewer';
import { StlViewer } from './stl-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModelViewerProps {
  /** URL du modèle 3D (STEP / IGES / STL / GLTF) */
  src: string;
  /** Texte alternatif affiché en fallback */
  alt?: string;
  /** Hauteur du visualiseur (ex: "500px" ou 500) */
  height?: string | number;
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

/**
 * ModelViewer — choisit le visualiseur 3D adapté selon l'extension du fichier :
 * - `.step` / `.stp` / `.iges` / `.igs` / `.brep` → `CadViewer` (occt-import-js)
 * - `.stl` / `.gltf` / `.glb`                   → `StlViewer` (Three.js)
 * - autre / inconnu                              → carte de fallback explicite
 */
export function ModelViewer({ src, alt, height }: ModelViewerProps) {
  const ext = extensionOf(src);
  const isCad = CAD_EXTENSIONS.includes(ext);
  const isMesh = MESH_EXTENSIONS.includes(ext);

  const style = height ? { height: typeof height === 'number' ? `${height}px` : height } : {};

  if (!isCad && !isMesh) {
    return (
      <Card className="w-full" style={style}>
        <CardHeader>
          <CardTitle className="text-sm">Visualiseur 3D</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-12">
          {alt ?? 'Format de modèle 3D non pris en charge'}
        </CardContent>
      </Card>
    );
  }

  if (isCad) {
    return <CadViewer src={src} height={heightToPx(height)} />;
  }

  return <StlViewer src={src} alt={alt} height={typeof height === 'string' ? height : undefined} />;
}
