import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { ReconstructCandidate } from './types';

/** Valeurs par défaut d'une pièce générée. */
const DEFAULT_DIAMETER = 10;
const DEFAULT_HEIGHT = 20;

export type CadPartType = 'cylinder' | 'plate' | 'disc' | 'block' | 'sphere' | 'torus' | 'cone';

export type CadParams = {
  type: CadPartType;
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  radius?: number;
  tubeRadius?: number;
  material?: string;
  unit?: 'mm' | 'cm';
};

function toMillimeters(value: number, unit: 'mm' | 'cm'): number {
  return unit === 'cm' ? value * 10 : value;
}

function buildGeometry(params: CadParams): THREE.BufferGeometry {
  const unit = params.unit ?? 'mm';
  const toMm = (value: number) => toMillimeters(value, unit);

  switch (params.type) {
    case 'plate': {
      const width = toMm(params.width ?? 50);
      const height = toMm(params.height ?? 20);
      const length = toMm(params.length ?? 10);
      const geometry = new THREE.BoxGeometry(width, height, length);
      geometry.translate(width / 2, height / 2, length / 2);
      return geometry;
    }
    case 'block': {
      const width = toMm(params.width ?? 50);
      const height = toMm(params.height ?? 20);
      const length = toMm(params.length ?? 20);
      const geometry = new THREE.BoxGeometry(width, height, length);
      geometry.translate(width / 2, height / 2, length / 2);
      return geometry;
    }
    case 'disc': {
      const diameter = params.diameter ?? DEFAULT_DIAMETER;
      const height = toMm(Math.max(0.1, diameter / 100));
      const radius = toMm(diameter / 2);
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      geometry.translate(0, height / 2, 0);
      return geometry;
    }
    case 'sphere': {
      const radius = toMm(params.diameter ?? DEFAULT_DIAMETER) / 2;
      return new THREE.SphereGeometry(radius, 32, 32);
    }
    case 'cylinder': {
      const diameter = params.diameter ?? DEFAULT_DIAMETER;
      const height = toMm(params.height ?? DEFAULT_HEIGHT);
      const radius = toMm(diameter / 2);
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      geometry.translate(0, height / 2, 0);
      return geometry;
    }
    case 'torus': {
      const radius = toMm(params.radius ?? 20);
      const tubeRadius = toMm(params.tubeRadius ?? radius / 4);
      return new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    }
    case 'cone': {
      const radius = toMm(params.radius ?? DEFAULT_DIAMETER);
      const height = toMm(params.height ?? DEFAULT_HEIGHT);
      return new THREE.ConeGeometry(radius, height, 32);
    }
    default: {
      const diameter = params.diameter ?? DEFAULT_DIAMETER;
      const height = toMm(params.height ?? DEFAULT_HEIGHT);
      const radius = toMm(diameter / 2);
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      geometry.translate(0, height / 2, 0);
      return geometry;
    }
  }
}

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

function buildStlString(geometry: THREE.BufferGeometry): string {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.3 }),
  );
  const exporter = new STLExporter();
  return exporter.parse(mesh, { binary: false });
}

function computeConfidence(params: CadParams): number {
  let confidence = 0.4;
  if (params.type) {
    confidence += 0.2;
  }
  const dimensions = [params.length, params.width, params.height, params.diameter].filter(
    (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
  ).length;
  if (dimensions >= 3) {
    confidence += 0.3;
  } else if (dimensions > 0) {
    confidence += 0.1;
  }
  return Math.min(1, Math.round(confidence * 10) / 10);
}

/** Construit la géométrie d'une pièce CAO paramétrée (unité : mm). */
export function createGeometry(params: CadParams): THREE.BufferGeometry {
  return buildGeometry(params);
}

/**
 * Génère un candidat `ReconstructCandidate` avec un STL procédural (data URL).
 *
 * Ne dépend que de `three` et des paramètres fournis. Aucun appel réseau.
 */
export async function generateCadFromParams(params: CadParams): Promise<ReconstructCandidate> {
  const geometry = buildGeometry(params);
  const stl = buildStlString(geometry);
  const fileUrl = `data:application/stl;base64,${toBase64(stl)}`;

  return {
    id: `generated-${Date.now()}`,
    method: 'generated',
    fileUrl,
    format: 'stl',
    confidence: computeConfidence(params),
    warnings: [],
  };
}
