import { describe, it, expect } from 'vitest';
import { generateCadFromParams, createGeometry } from './generate-cad';
import { CadParams } from './types';

function makeParams(overrides: Partial<CadParams> = {}): CadParams {
  return {
    type: 'cylinder',
    unit: 'mm',
    diameter: 10,
    height: 20,
    ...overrides,
  };
}

describe('generate-cad', () => {
  describe('createGeometry', () => {
    it('crée une géométrie de cylindre valide', () => {
      const geometry = createGeometry(makeParams({ type: 'cylinder', diameter: 10, height: 20 }));
      expect(geometry.attributes.position.count).toBeGreaterThan(10);
      const positions = geometry.attributes.position.array as Float32Array;
      expect(positions.length).toBeGreaterThan(0);
    });

    it('crée une géométrie de plaque valide', () => {
      const geometry = createGeometry(makeParams({ type: 'plate', width: 50, height: 20, length: 10 }));
      expect(geometry.attributes.position.count).toBeGreaterThan(10);
    });

    it('crée une géométrie de torus valide', () => {
      const geometry = createGeometry(makeParams({ type: 'torus', radius: 20, tubeRadius: 5 }));
      expect(geometry.attributes.position.count).toBeGreaterThan(10);
    });

    it('crée une géométrie de cone valide', () => {
      const geometry = createGeometry(makeParams({ type: 'cone', radius: 10, height: 20 }));
      expect(geometry.attributes.position.count).toBeGreaterThan(10);
    });
  });

it('crée une géométrie de prism valide', () => {
      const geometry = createGeometry(makeParams({ type: 'prism', width: 50, depth: 30, height: 20 }));
      expect(geometry.attributes.position.count).toBeGreaterThan(10);
      const positions = geometry.attributes.position.array as Float32Array;
      expect(positions.length).toBeGreaterThan(0);
    });

    it('crée une géométrie de prism avec defaults', () => {
      const geometry = createGeometry(makeParams({ type: 'prism' }));
      expect(geometry.attributes.position.count).toBeGreaterThan(10);
      const positions = geometry.attributes.position.array as Float32Array;
      expect(positions.length).toBeGreaterThan(0);
    });
  });
  
  describe('generateCadFromParams', () => {
  describe('generateCadFromParams', () => {
    it('génère un STL valide pour un cylindre', async () => {
      const candidate = await generateCadFromParams(makeParams({ type: 'cylinder', diameter: 10, height: 20 }));
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      expect(candidate.fileUrl.startsWith('data:application/stl;base64,')).toBe(true);
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });

    it('génère un STL valide pour une plaque', async () => {
      const candidate = await generateCadFromParams(makeParams({ type: 'plate', width: 50, height: 20, length: 10 }));
      expect(candidate.fileUrl.startsWith('data:application/stl;base64,')).toBe(true);
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });

    it('génère un STL valide pour un torus', async () => {
      const candidate = await generateCadFromParams({
        type: 'torus',
        radius: 20,
        tubeRadius: 5,
        unit: 'mm',
      });
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      expect(candidate.fileUrl.startsWith('data:application/stl;base64,')).toBe(true);
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });

    it('génère un STL valide pour un cone', async () => {
      const candidate = await generateCadFromParams({
        type: 'cone',
        radius: 10,
        height: 20,
        unit: 'mm',
      });
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      expect(candidate.fileUrl.startsWith('data:application/stl;base64,')).toBe(true);
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });

    it('utilise des paramètres par défaut pour torus', async () => {
      const candidate = await generateCadFromParams({
        type: 'torus',
        unit: 'mm',
      });
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });

    it('utilise des paramètres par défaut pour cone', async () => {
      const candidate = await generateCadFromParams({
        type: 'cone',
        unit: 'mm',
      });
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });
  });
it('génère un STL valide pour un prism', async () => {
      const candidate = await generateCadFromParams({
        type: 'prism',
        width: 50,
        depth: 30,
        height: 20,
        unit: 'mm',
      });
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      expect(candidate.fileUrl.startsWith('data:application/stl;base64,')).toBe(true);
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });

    it('utilise des paramètres par défaut pour prism', async () => {
      const candidate = await generateCadFromParams({
        type: 'prism',
        unit: 'mm',
      });
      expect(candidate.method).toBe('generated');
      expect(candidate.format).toBe('stl');
      expect(candidate.fileUrl.startsWith('data:application/stl;base64,')).toBe(true);
      const stl = Buffer.from(candidate.fileUrl.split(',')[1], 'base64').toString('utf8');
      expect(stl).toContain('solid');
      expect(stl).toContain('facet');
      expect(stl).toContain('endsolid');
      expect(stl.length).toBeGreaterThan(100);
    });
  });
