import { describe, expect, it } from 'vitest';
import {
  buildPinNetMap,
  calculateCost,
  clampToBoard,
  computePlacement,
  generateReference,
  inferPlacementRole,
  isGndNet,
  isPowerNet,
  optimizePlacement,
  optimizeRotations,
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

  it('pénalise la congestion sous 2 mm entre bords', () => {
    const board = { widthMm: 100, heightMm: 80 };
    const a = { reference: 'R1', xMm: 20, yMm: 20, rotation: 0, widthMm: 8, heightMm: 8 };
    const near = { ...a, reference: 'R2', xMm: 29 }; // écart entre bords = 1 mm
    const far = { ...a, reference: 'R2', xMm: 40 }; // écart = 12 mm
    expect(calculateCost([a, near], new Map(), board)).toBeGreaterThan(
      calculateCost([a, far], new Map(), board),
    );
  });

  it('pénalise fortement un chevauchement avec les vraies dimensions', () => {
    const board = { widthMm: 100, heightMm: 80 };
    const a = { reference: 'U1', xMm: 30, yMm: 30, rotation: 0, widthMm: 10, heightMm: 10 };
    const overlap = { ...a, reference: 'C1', widthMm: 6, heightMm: 4 };
    const apart = { ...overlap, xMm: 60 };
    expect(calculateCost([a, overlap], new Map(), board)).toBeGreaterThan(
      calculateCost([a, apart], new Map(), board) * 10,
    );
  });

  it('pénalise un composant hors plateau', () => {
    const comps = [{ reference: 'J1', xMm: 500, yMm: 20, rotation: 0 }];
    expect(calculateCost(comps, new Map(), board)).toBeGreaterThanOrEqual(1000);
  });

  it('pénalise une cellule surchargée (> 3 composants)', () => {
    const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 0 };
    const crowded = Array.from({ length: 4 }, (_, i) => ({
      reference: `R${i + 1}`,
      xMm: 10 + i * 0.5,
      yMm: 10,
      rotation: 0,
      widthMm: 1,
      heightMm: 1,
    }));
    const spread = crowded.map((c, i) => ({ ...c, xMm: 10 + i * 20 }));
    expect(calculateCost(crowded, new Map(), board)).toBeGreaterThan(
      calculateCost(spread, new Map(), board),
    );
  });
});

describe('règles métier CDC', () => {
  it('déduit les rôles depuis le type et la rationale du LLM', () => {
    expect(
      inferPlacementRole({
        reference: 'U1',
        value: '5V 2A',
        type: 'Régulateur DC-DC 5V',
        rationale: 'Convertit 24V à 5V',
      }),
    ).toBe('regulator');
    expect(
      inferPlacementRole({
        reference: 'U2',
        value: 'STM32F405',
        type: 'Microcontrôleur STM32F405',
      }),
    ).toBe('mcu');
    expect(
      inferPlacementRole({ reference: 'U3', type: 'Transceiver RS‑485', rationale: 'Modbus RTU' }),
    ).toBe('serial');
    expect(inferPlacementRole({ reference: 'Y1', type: 'Cristal 8 MHz' })).toBe('clock');
    expect(inferPlacementRole({ reference: 'J4', type: 'Connecteur RS‑485 DB9' })).toBe(
      'connector',
    );
    expect(inferPlacementRole({ reference: 'J2', rationale: 'Capteur température PT100' })).toBe(
      'connector',
    );
  });

  it('pénalise un connecteur éloigné du bord supérieur', () => {
    const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 10 };
    const near = [{ reference: 'J1', xMm: 20, yMm: 12, rotation: 0, role: 'connector' as const }];
    const far = [{ ...near[0]!, yMm: 60 }];
    expect(calculateCost(far, new Map(), board)).toBeGreaterThan(
      calculateCost(near, new Map(), board),
    );
  });

  it('récompense un oscillateur proche du MCU et un régulateur éloigné du MCU', () => {
    const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 0 };
    const mcu = { reference: 'U2', xMm: 50, yMm: 50, rotation: 0, role: 'mcu' as const };
    const clockFar = { reference: 'Y1', xMm: 10, yMm: 10, rotation: 0, role: 'clock' as const };
    const clockNear = { ...clockFar, xMm: 53, yMm: 50 };
    expect(calculateCost([mcu, clockFar], new Map(), board)).toBeGreaterThan(
      calculateCost([mcu, clockNear], new Map(), board),
    );
    const regNear = { reference: 'U1', xMm: 55, yMm: 50, rotation: 0, role: 'regulator' as const };
    const regFar = { ...regNear, xMm: 10, yMm: 10 };
    expect(calculateCost([mcu, regNear], new Map(), board)).toBeGreaterThan(
      calculateCost([mcu, regFar], new Map(), board),
    );
  });
});

describe('optimizeRotations', () => {
  it('aligne à 0° les rôles connus et conserve les autres', () => {
    const comps = [
      { reference: 'J1', xMm: 0, yMm: 0, rotation: 90, role: 'connector' as const },
      { reference: 'U1', xMm: 0, yMm: 0, rotation: 180, role: 'regulator' as const },
      { reference: 'C1', xMm: 0, yMm: 0, rotation: 90, role: 'capacitor' as const },
      { reference: 'Y1', xMm: 0, yMm: 0, rotation: 270, role: 'clock' as const },
      { reference: 'R7', xMm: 0, yMm: 0, rotation: 45 },
    ];
    const out = optimizeRotations(comps);
    expect(out.slice(0, 4).map((c) => c.rotation)).toEqual([0, 0, 0, 0]);
    expect(out[4]!.rotation).toBe(45);
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

  it('écarte deux composants initiaux qui se chevauchent', () => {
    const components = [
      { reference: 'U1', xMm: 50, yMm: 40, rotation: 0, widthMm: 12, heightMm: 12 },
      { reference: 'C1', xMm: 51, yMm: 40, rotation: 0, widthMm: 6, heightMm: 4 },
      { reference: 'R1', xMm: 49, yMm: 41, rotation: 0, widthMm: 4, heightMm: 2 },
    ];
    const board = { widthMm: 200, heightMm: 120, originX: 0, originY: 0 };
    const overlaps = (list: typeof components) => {
      let n = 0;
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i]!;
          const b = list[j]!;
          if (
            Math.abs(a.xMm - b.xMm) < (a.widthMm + b.widthMm) / 2 &&
            Math.abs(a.yMm - b.yMm) < (a.heightMm + b.heightMm) / 2
          ) {
            n += 1;
          }
        }
      }
      return n;
    };
    expect(overlaps(components)).toBeGreaterThan(0);
    const out = optimizePlacement(components, [], board);
    expect(overlaps(out)).toBe(0);
  });
});

describe('orientation par flux de signal', () => {
  it('aligne un composant sur l’axe du net critique', () => {
    const comps = [
      { reference: 'U1', xMm: 20, yMm: 40, rotation: 0, role: 'mcu' as const },
      { reference: 'Y1', xMm: 60, yMm: 40, rotation: 90, role: 'clock' as const },
    ];
    const nets = [{ name: 'OSC_IN', pins: ['U1.5', 'Y1.1'] }];
    const out = optimizeRotations(comps, nets);
    expect(out[1]!.rotation).toBe(0); // axe horizontal
  });

  it('pénalise une rotation perpendiculaire à l’axe du signal', () => {
    const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 0 };
    const nets = [{ name: 'CLK', pins: ['U1.1', 'Y1.1'] }];
    const aligned = [
      { reference: 'U1', xMm: 20, yMm: 40, rotation: 0, role: 'mcu' as const },
      { reference: 'Y1', xMm: 60, yMm: 40, rotation: 0, role: 'clock' as const },
    ];
    const perpendicular = [{ ...aligned[0]! }, { ...aligned[1]!, rotation: 90 }];
    expect(calculateCost(perpendicular, new Map(), board, nets)).toBeGreaterThan(
      calculateCost(aligned, new Map(), board, nets),
    );
  });
});

describe('placement séquentiel par blocs', () => {
  const board = { widthMm: 100, heightMm: 80, originX: 0, originY: 5 };

  function components() {
    return [
      {
        reference: 'J1',
        xMm: 50,
        yMm: 70,
        rotation: 90,
        widthMm: 10,
        heightMm: 4,
        role: 'connector' as const,
      },
      {
        reference: 'U1',
        xMm: 10,
        yMm: 10,
        rotation: 180,
        widthMm: 10,
        heightMm: 10,
        role: 'regulator' as const,
      },
      {
        reference: 'C1',
        xMm: 90,
        yMm: 75,
        rotation: 0,
        widthMm: 3,
        heightMm: 2,
        role: 'capacitor' as const,
      },
      { reference: 'D1', xMm: 95, yMm: 75, rotation: 0, widthMm: 3, heightMm: 2 },
    ];
  }

  const nets = [
    { name: 'GND', pins: ['U1.2', 'C1.2', 'J1.1'] },
    { name: 'VCC_5V', pins: ['U1.1', 'C1.1'] },
  ];

  it('verrouille les connecteurs sur le bord supérieur', () => {
    const out = optimizePlacement(components(), nets, board);
    const j1 = out.find((c) => c.reference === 'J1')!;
    expect(j1.locked).toBe(true);
    expect(j1.yMm).toBe(8);
    expect(j1.rotation).toBe(0);
  });

  it('ancre les ICs au centre avec un déplacement limité', () => {
    const out = optimizePlacement(components(), nets, board);
    const u1 = out.find((c) => c.reference === 'U1')!;
    expect(u1.anchorX).toBeDefined();
    expect(u1.movementRangeMm).toBe(2);
    expect(Math.abs(u1.xMm - u1.anchorX!)).toBeLessThanOrEqual(2);
  });

  it('place les passifs à proximité de leur IC', () => {
    const out = optimizePlacement(components(), nets, board);
    const u1 = out.find((c) => c.reference === 'U1')!;
    const c1 = out.find((c) => c.reference === 'C1')!;
    expect(Math.hypot(c1.xMm - u1.xMm, c1.yMm - u1.yMm)).toBeLessThanOrEqual(12);
  });
});
