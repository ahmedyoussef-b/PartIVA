import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseKicadPcb } from './kicad-file-reader';

const fixturePath = fileURLToPath(new URL('./__fixtures__/minimal.kicad_pcb', import.meta.url));

const DEMO_BOARD =
  'C:\\Program Files\\KiCad\\10.0\\share\\kicad\\demos\\interf_u\\interf_u.kicad_pcb';

const EMPTY_BOARD = `(kicad_pcb
	(version 20241229)
	(generator "pcbnew")
	(general
		(thickness 1.6)
	)
	(paper "A4")
)
`;

describe('parseKicadPcb', () => {
  const board = parseKicadPcb(readFileSync(fixturePath, 'utf-8'));

  it('lit la version et le generateur', () => {
    expect(board.version).toBe(20241229);
    expect(board.generator).toBe('pcbnew');
  });

  it('calcule origine et dimensions depuis Edge.Cuts', () => {
    expect(board.origin).toEqual({ x: 0, y: 0 });
    expect(board.dimensions).toEqual({ width: 100, height: 80 });
  });

  it('extrait le composant avec reference, valeur et position', () => {
    expect(board.components).toHaveLength(1);

    const component = board.components[0];
    expect(component).toBeDefined();
    if (!component) throw new Error('composant absent');

    expect(component.reference).toBe('R1');
    expect(component.library).toBe('Resistor_SMD');
    expect(component.name).toBe('R_0603_1608Metric');
    expect(component.value).toBe('10k');
    expect(component.x).toBe(50);
    expect(component.y).toBe(40);
    expect(component.rotation).toBe(0);
    expect(component.layer).toBe('F.Cu');
  });

  it('accepte une entree Buffer', () => {
    const fromBuffer = parseKicadPcb(readFileSync(fixturePath));
    expect(fromBuffer.components).toHaveLength(1);
    expect(fromBuffer.dimensions).toEqual({ width: 100, height: 80 });
  });

  it('ne leve pas sur un plateau vide (sans Edge.Cuts ni footprint)', () => {
    const empty = parseKicadPcb(EMPTY_BOARD);
    expect(empty.origin).toEqual({ x: 0, y: 0 });
    expect(empty.dimensions).toEqual({ width: 0, height: 0 });
    expect(empty.components).toEqual([]);
  });

  it.skipIf(!existsSync(DEMO_BOARD))('parse un plateau demo reel de KiCad 10', () => {
    const demo = parseKicadPcb(readFileSync(DEMO_BOARD, 'utf-8'));
    expect(demo.version).toBe(20241229);
    expect(demo.generator).toBe('pcbnew');
    expect(demo.components.length).toBeGreaterThan(0);
    expect(demo.dimensions.width).toBeGreaterThan(0);
    expect(demo.dimensions.height).toBeGreaterThan(0);
  });
});
