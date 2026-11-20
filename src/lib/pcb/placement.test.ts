import { describe, expect, it } from 'vitest';
import {
  clampToBoard,
  computePlacement,
  generateReference,
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
