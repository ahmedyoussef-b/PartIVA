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

const ROUTED_BOARD = `(kicad_pcb
	(version 20241229)
	(generator "pcbnew")
	(paper "A4")
	(gr_line (start 0 0) (end 100 0) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000001"))
	(gr_line (start 100 0) (end 100 80) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000002"))
	(gr_line (start 100 80) (end 0 80) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000003"))
	(gr_line (start 0 80) (end 0 0) (stroke (width 0.05) (type solid)) (layer "Edge.Cuts") (uuid "00000000-0000-0000-0000-000000000004"))
	(segment
		(start 10 10) (end 20 10)
		(width 0.25) (layer "F.Cu") (net "VCC") (uuid "11111111-0000-0000-0000-000000000001")
	)
	(via
		(at 15 15) (size 0.6) (drill 0.3)
		(layers "F.Cu" "B.Cu") (net "GND") (uuid "22222222-0000-0000-0000-000000000002")
	)
	(zone
		(net "GND") (layer "B.Cu")
		(polygon (pts (xy 0 0) (xy 100 0) (xy 100 80) (xy 0 80)))
	)
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

  it("parse les pistes, vias et zones d'un plateau routé", () => {
    const board = parseKicadPcb(ROUTED_BOARD);
    expect(board.tracks).toHaveLength(1);
    expect(board.tracks?.[0]?.start).toEqual({ x: 10, y: 10 });
    expect(board.tracks?.[0]?.end).toEqual({ x: 20, y: 10 });
    expect(board.tracks?.[0]?.layer).toBe('F.Cu');
    expect(board.tracks?.[0]?.net).toBe('VCC');
    expect(board.vias).toHaveLength(1);
    expect(board.vias?.[0]?.x).toBe(15);
    expect(board.vias?.[0]?.size).toBe(0.6);
    expect(board.vias?.[0]?.net).toBe('GND');
    expect(board.zones).toHaveLength(1);
    expect(board.zones?.[0]?.layer).toBe('B.Cu');
    expect(board.zones?.[0]?.net).toBe('GND');
    expect(board.zones?.[0]?.points).toHaveLength(4);
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
