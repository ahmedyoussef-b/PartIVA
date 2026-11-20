import { describe, expect, it } from 'vitest';
import {
  normalizeRotation,
  rotationDelta,
  verifyPlacement,
  type ActualFootprint,
  type RequestedPlacement,
} from './verify-placement';

const R1: RequestedPlacement = { reference: 'R1', xMm: 10, yMm: 20, rotation: 0 };
const A1: ActualFootprint = { reference: 'R1', xMm: 10, yMm: 20, rotation: 0 };

describe('normalizeRotation', () => {
  it('ramène dans [0, 360)', () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(0)).toBe(0);
  });
});

describe('rotationDelta', () => {
  it('calcule l écart circulaire minimal', () => {
    expect(rotationDelta(0, 180)).toBe(180);
    expect(rotationDelta(359, 0)).toBe(1);
    expect(rotationDelta(10, 350)).toBe(20);
  });
});

describe('verifyPlacement', () => {
  it('1. correspondance exacte', () => {
    const r = verifyPlacement([R1], [A1]);
    expect(r.ok).toBe(true);
    expect(r.matched).toBe(1);
    expect(r.checked).toBe(1);
    expect(r.misplaced).toEqual([]);
  });

  it('2. référence absente', () => {
    const r = verifyPlacement([R1], []);
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['R1']);
    expect(r.misplaced[0]?.reason).toBe('missing');
    expect(r.misplaced[0]?.actual).toBeNull();
  });

  it('3. écart x de 5 mm', () => {
    const r = verifyPlacement([R1], [{ ...A1, xMm: 15 }]);
    expect(r.ok).toBe(false);
    expect(r.misplaced[0]?.reason).toBe('position');
    expect(r.misplaced[0]?.deltaMm).toBeCloseTo(5, 5);
  });

  it('4. écart y de 5 mm', () => {
    const r = verifyPlacement([R1], [{ ...A1, yMm: 25 }]);
    expect(r.misplaced[0]?.reason).toBe('position');
  });

  it('5. écart dans la tolérance (0.005 mm)', () => {
    const r = verifyPlacement([R1], [{ ...A1, xMm: 10.005 }]);
    expect(r.ok).toBe(true);
    expect(r.matched).toBe(1);
  });

  it('6. écart juste au-delà (0.02 mm)', () => {
    const r = verifyPlacement([R1], [{ ...A1, xMm: 10.02 }]);
    expect(r.ok).toBe(false);
    expect(r.misplaced[0]?.reason).toBe('position');
    expect(r.misplaced[0]?.deltaMm).toBeCloseTo(0.02, 5);
  });

  it('7. rotation 180° vs 0°', () => {
    const r = verifyPlacement([R1], [{ ...A1, rotation: 180 }]);
    expect(r.ok).toBe(false);
    expect(r.misplaced[0]?.reason).toBe('rotation');
  });

  it('8a. rotation 359.6° vs 0° (écart 0.4° ≤ 0.5)', () => {
    const r = verifyPlacement([R1], [{ ...A1, rotation: 359.6 }]);
    expect(r.ok).toBe(true);
  });

  it('8b. rotation 359° vs 0° (écart 1° > 0.5)', () => {
    const r = verifyPlacement([R1], [{ ...A1, rotation: 359 }]);
    expect(r.ok).toBe(false);
    expect(r.misplaced[0]?.reason).toBe('rotation');
  });

  it('9. footprint en trop sur la carte', () => {
    const r = verifyPlacement([R1], [A1, { reference: 'C9', xMm: 1, yMm: 1, rotation: 0 }]);
    expect(r.ok).toBe(true);
    expect(r.extra).toEqual(['C9']);
  });

  it('10. requested vide + actual vide', () => {
    const r = verifyPlacement([], []);
    expect(r.ok).toBe(true);
    expect(r.checked).toBe(0);
    expect(r.matched).toBe(0);
  });

  it('11. requested vide + 1 actual', () => {
    const r = verifyPlacement([], [A1]);
    expect(r.ok).toBe(true);
    expect(r.extra).toEqual(['R1']);
  });

  it('12. références minuscules vs majuscules', () => {
    const r = verifyPlacement([{ ...R1, reference: 'r1' }], [{ ...A1, reference: 'R1' }]);
    expect(r.ok).toBe(true);
    expect(r.matched).toBe(1);
  });

  it('13. doublon dans actual → premier retenu', () => {
    const r = verifyPlacement(
      [R1],
      [
        { reference: 'R1', xMm: 10, yMm: 20, rotation: 0 },
        { reference: 'R1', xMm: 99, yMm: 99, rotation: 0 },
      ],
    );
    expect(r.ok).toBe(true);
    expect(r.matched).toBe(1);
  });

  it('14. toleranceMm personnalisée (1 mm)', () => {
    const r = verifyPlacement([R1], [{ ...A1, xMm: 10.5 }], { toleranceMm: 1 });
    expect(r.ok).toBe(true);
    expect(r.toleranceMm).toBe(1);
  });
});
