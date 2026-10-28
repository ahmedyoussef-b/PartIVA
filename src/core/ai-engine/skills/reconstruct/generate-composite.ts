import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { ReconstructCandidate } from './types';
import { CadComposite } from './types';
import { buildGeometry } from './generate-cad';

function toBase64(stl: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(stl, 'utf8').toString('base64');
  }
  const bytes = new TextEncoder().encode(stl);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

export async function generateCompositeFromParams(
  params: CadComposite,
): Promise<ReconstructCandidate> {
  const geometry = buildGeometry(params.base);
  const stl = new STLExporter().parse(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()), {
    binary: false,
  });
  const fileUrl = `data:application/stl;base64,${toBase64(stl)}`;
  return {
    id: `generated-${Date.now()}`,
    method: 'generated',
    fileUrl,
    format: 'stl',
    confidence: 0.5,
    warnings: ['Composite fallback: Manifold integration pending'],
  };
}
