import { describe, expect, it } from 'vitest';
import { analyzeRealState } from './simulation';

describe('analyzeRealState — règle GROUND_PLANE (C2)', () => {
  it('ne lève aucune violation critique quand il n’y a aucun réseau', () => {
    const result = analyzeRealState([{ id: 'U1', footprint: 'TO-220-3_Vertical' }], []);
    expect(result.pending).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.isCompliant).toBe(true);
    expect(result.checkedRules).toBe(2);
  });

  it('vérifie GND dès qu’un réseau existe', () => {
    const result = analyzeRealState([], [{ name: 'VCC', pins: [] }]);
    expect(result.pending).toBe(false);
    expect(result.violations).toEqual([
      {
        type: 'GROUND_PLANE',
        severity: 'CRITICAL',
        message: 'Réseau GND manquant ou non connecté (min 2 points requis)',
        location: 'GND',
      },
    ]);
    expect(result.isCompliant).toBe(false);
    expect(result.checkedRules).toBe(3);
  });

  it('considère un GND avec 2 pins conforme', () => {
    const result = analyzeRealState(
      [],
      [
        {
          name: 'GND',
          pins: [
            { componentId: 'U1', pinName: '1' },
            { componentId: 'C1', pinName: '2' },
          ],
        },
      ],
    );
    expect(result.isCompliant).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
