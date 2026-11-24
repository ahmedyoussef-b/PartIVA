import { describe, expect, it } from 'vitest';
import {
  buildPinNetMap,
  calculateCost,
  clampToBoard,
  computePlacement,
  generateReference,
  isGndNet,
  isPowerNet,
  optimizePlacement,
  pxToMm,
  snapToGrid,
  type PlacementContext,
} from './placement';

const CTX: PlacementContext = {
  boardWidthMm: 100,
  boardHeightMm: 80,
  canvasWidthPx: 500,
  canvasHeightPx: 400,
  gridMm: 2.54,
};

describe('pxToMm', () => {
  it('convertit avec calibration largeur', () => {
    expect(pxToMm(100, CTX)).toBe(20);
  });

  it('retourne 0 pour x = 0', () => {
    expect(pxToMm(0, CTX)).toBe(0);
  });

  it('ne divise pas par zéro si canvasWidthPx = 0', () => {
    expect(pxToMm(250, { ...CTX, canvasWidthPx: 0 })).toBe(0);
  });
});

describe('snapToGrid', () => {
  it('snappe 1.3 sur 2.54', () => {
    expect(snapToGrid(1.3, 2.54)).toBe(2.54);
  });

  it('conserve 2.54', () => {
    expect(snapToGrid(2.54, 2.54)).toBe(2.54);
  });

  it('conserve 5.08', () => {
    expect(snapToGrid(5.08, 2.54)).toBe(5.08);
  });
});

describe('generateReference', () => {
  it('retourne R1 sur liste vide', () => {
    expect(generateReference('resistor', [])).toBe('R1');
  });

  it('incrémente R1/R2 en R3', () => {
    expect(generateReference('resistor', ['R1', 'R2'])).toBe('R3');
  });

  it('incrémente C1 en C2', () => {
    expect(generateReference('capacitor', ['C1'])).toBe('C2');
  });

  it('retombe sur X1 pour un symbolId inconnu', () => {
    expect(generateReference('unknown', [])).toBe('X1');
  });

  it('ignore les références d une autre famille', () => {
    expect(generateReference('resistor', ['C1', 'C7', 'R4'])).toBe('R5');
  });
});

describe('computePlacement', () => {
  it('convertit, snappe et référence 2 noeuds', () => {
    const result = computePlacement(
      [
        { id: 'n1', symbolId: 'resistor', x: 100, y: 100 },
        { id: 'n2', symbolId: 'capacitor', x: 200, y: 200 },
      ],
      CTX,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'n1',
      symbolId: 'resistor',
      xMm: 20.32,
      yMm: 20.32,
      rotation: 0,
      reference: 'R1',
    });
    expect(result[1]).toMatchObject({
      id: 'n2',
      symbolId: 'capacitor',
      xMm: 40.64,
      yMm: 40.64,
      rotation: 0,
      reference: 'C1',
    });
  });

  it('tient compte des références existantes', () => {
    const result = computePlacement([{ id: 'n1', symbolId: 'resistor', x: 10, y: 10 }], CTX, [
      'R1',
      'R2',
    ]);
    expect(result[0]?.reference).toBe('R3');
  });

  it('respecte la rotation fournie', () => {
    const result = computePlacement(
      [{ id: 'n1', symbolId: 'diode', x: 10, y: 10, rotation: 90 }],
      CTX,
    );
    expect(result[0]?.rotation).toBe(90);
  });
});

describe('clampToBoard', () => {
  it('borne au plateau', () => {
    expect(clampToBoard(150, 90, 100, 80)).toEqual({ xMm: 100, yMm: 80 });
  });

  it('laisse untouched dans les limites', () => {
    expect(clampToBoard(50, 40, 100, 80)).toEqual({ xMm: 50, yMm: 40 });
  });
});

describe('classification des nets', () => {
  it('reconnaît les nets d’alimentation', () => {
    expect(isPowerNet('VCC')).toBe(true);
    expect(isPowerNet('VCC_5V')).toBe(true);
    expect(isPowerNet('+3V3')).toBe(true);
    expect(isPowerNet('TRIG_IN')).toBe(false);
  });

  it('reconnaît les nets de masse', () => {
    expect(isGndNet('GND')).toBe(true);
    expect(isGndNet('AGND')).toBe(true);
    expect(isGndNet('DGND')).toBe(true);
    expect(isGndNet('VCC_5V')).toBe(false);
  });

  it('construit la map pin -> net', () => {
    const map = buildPinNetMap([
      { name: 'GND', pins: ['U1.2', 'C1.2'] },
      { name: 'VCC_5V', pins: ['U1.1', 'C1.1'] },
    ]);
    expect(map.get('U1.2')).toBe('GND');
    expect(map.get('C1.1')).toBe('VCC_5V');
    expect(map.get('INconnu.1')).toBeUndefined();
  });
});

describe('calculateCost', () => {
  const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 0 };

  it('est nul sans nets et sans chevauchement', () => {
    const comps = [
      { reference: 'U1', xMm: 20, yMm: 20, rotation: 0 },
      { reference: 'C1', xMm: 60, yMm: 60, rotation: 0 },
    ];
    expect(calculateCost(comps, new Map(), board)).toBe(0);
  });

  it('pénalise le chevauchement', () => {
    const comps = [
      { reference: 'U1', xMm: 30, yMm: 30, rotation: 0 },
      { reference: 'C1', xMm: 30, yMm: 30, rotation: 0 },
    ];
    expect(calculateCost(comps, new Map(), board)).toBeGreaterThan(0);
  });

  it('pénalise un composant hors plateau', () => {
    const comps = [{ reference: 'J1', xMm: 500, yMm: 20, rotation: 0 }];
    expect(calculateCost(comps, new Map(), board)).toBeGreaterThanOrEqual(1000);
  });
});

describe('optimizePlacement', () => {
  it('réduit le coût d’un placement initial chaotique', () => {
    const components = [
      { reference: 'U1', xMm: 8, yMm: 70, rotation: 0, widthMm: 10, heightMm: 10 },
      { reference: 'C1', xMm: 90, yMm: 8, rotation: 0, widthMm: 3, heightMm: 2 },
      { reference: 'J1', xMm: 50, yMm: 40, rotation: 0, widthMm: 6, heightMm: 4 },
    ];
    const nets = [
      { name: 'VCC_5V', pins: ['U1.1', 'C1.1'] },
      { name: 'GND', pins: ['U1.2', 'C1.2', 'J1.1'] },
    ];
    const adj = new Map<string, Set<string>>();
    // même adjacency que buildAdjacency (interne) : on ancre le test sur le coût final
    for (const c of components) adj.set(c.reference, new Set());
    for (const net of nets) {
      const refs = [...new Set(net.pins.map((p) => p.split('.')[0]!))];
      for (let i = 0; i < refs.length; i += 1) {
        for (let j = i + 1; j < refs.length; j += 1) {
          adj.get(refs[i]!)!.add(refs[j]!);
          adj.get(refs[j]!)!.add(refs[i]!);
        }
      }
    }
    const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 0 };
    const before = calculateCost(components, adj, board);
    const after = optimizePlacement(components, nets, board);
    expect(calculateCost(after, adj, board)).toBeLessThanOrEqual(before);
    for (const c of after) {
      expect(c.xMm).toBeGreaterThanOrEqual(0);
      expect(c.xMm).toBeLessThanOrEqual(100);
      expect(c.yMm).toBeGreaterThanOrEqual(0);
      expect(c.yMm).toBeLessThanOrEqual(80);
    }
  });
});
