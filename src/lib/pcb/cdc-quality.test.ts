import { describe, expect, it } from 'vitest';
import {
  assessCdcQuality,
  computeCompleteness,
  detectConflicts,
  normalizeKey,
  parseQuantity,
} from './cdc-quality';

describe('normalizeKey', () => {
  it('1. accents, apostrophes et espaces normalisés', () => {
    expect(normalizeKey('Tension  d’Alimentation ')).toBe('tension d alimentation');
  });
});

describe('parseQuantity', () => {
  it('2. 3,3 V → 3.3 V', () => {
    expect(parseQuantity('3,3 V')).toEqual({ value: 3.3, unit: 'V', family: 'voltage' });
  });

  it('3. 12V sans espace', () => {
    expect(parseQuantity('12V')).toEqual({ value: 12, unit: 'V', family: 'voltage' });
  });

  it('4. 500 mA → 0.5 A', () => {
    expect(parseQuantity('500 mA')).toEqual({ value: 0.5, unit: 'mA', family: 'current' });
  });

  it('5. 2 kΩ → 2000 ohm', () => {
    const q = parseQuantity('2 kΩ');
    expect(q?.value).toBe(2000);
    expect(q?.family).toBe('resistance');
  });

  it('6. non numérique / sans unité → null', () => {
    expect(parseQuantity('abc')).toBeNull();
    expect(parseQuantity('3,3')).toBeNull();
  });
});

describe('computeCompleteness', () => {
  it('7. 3 catégories couvertes → score 0.5', () => {
    const c = computeCompleteness([
      { category: 'usage', key: 'a', value: 'v' },
      { category: 'function', key: 'b', value: 'v' },
      { category: 'mechanical', key: 'c', value: 'v' },
    ]);
    expect(c.score).toBe(0.5);
    expect(c.covered).toEqual(['usage', 'function', 'mechanical']);
    expect(c.missing).toEqual(['processing', 'manufacturing', 'quality']);
  });

  it('8. 6 couvertes → 1 ; vide → 0', () => {
    const all = ['usage', 'function', 'processing', 'mechanical', 'manufacturing', 'quality'].map(
      (c) => ({
        category: c,
        key: 'k',
        value: 'v',
      }),
    );
    expect(computeCompleteness(all).score).toBe(1);
    expect(computeCompleteness([]).score).toBe(0);
  });
});

describe('detectConflicts', () => {
  const req = (key: string, value: string) => ({ category: 'function', key, value });

  it('9. 3,3 V vs 12 V → values-diverge', () => {
    const conflicts = detectConflicts([
      req("Tension d'alimentation", '3,3 V'),
      req("Tension d'alimentation", '12 V'),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.reason).toBe('values-diverge');
  });

  it('10. 3,3 V vs 3,4 V (< 5 %) → aucun conflit', () => {
    const conflicts = detectConflicts([req('Tension', '3,3 V'), req('Tension', '3,4 V')]);
    expect(conflicts).toEqual([]);
  });

  it('11. 5 V vs 500 mA (familles incompatibles)', () => {
    const conflicts = detectConflicts([req('Alimentation', '5 V'), req('Alimentation', '500 mA')]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.reason).toBe('incompatible-units');
  });

  it('12. clés différentes → aucun conflit', () => {
    const conflicts = detectConflicts([
      req('Tension entrée', '3,3 V'),
      req('Tension sortie', '12 V'),
    ]);
    expect(conflicts).toEqual([]);
  });
});

describe('assessCdcQuality', () => {
  it('13. 2 non sourcées + 1 inféré → unsourced 3', () => {
    const q = assessCdcQuality([
      { category: 'function', key: 'a', value: 'v' },
      { category: 'function', key: 'b', value: 'v', source: '' },
      { category: 'function', key: 'c', value: 'v', source: 'inféré' },
    ]);
    expect(q.unsourced).toBe(3);
  });

  it('14. conflit → ok false ; sans conflit → ok true', () => {
    const withConflict = assessCdcQuality([
      { category: 'function', key: 'Tension', value: '3,3 V' },
      { category: 'function', key: 'Tension', value: '12 V' },
    ]);
    expect(withConflict.ok).toBe(false);

    const clean = assessCdcQuality([{ category: 'function', key: 'Tension', value: '3,3 V' }]);
    expect(clean.ok).toBe(true);
  });

  it('15. validation manuelle -> 0 à vérifier et 0 sans source', () => {
    const inferred = assessCdcQuality([
      {
        category: 'usage',
        key: 'Temperature',
        value: '0-70C',
        source: 'inféré',
        status: 'to_verify',
      },
    ]);
    expect(inferred.toVerify).toBe(1);
    expect(inferred.unsourced).toBe(1);

    const validated = assessCdcQuality([
      {
        category: 'usage',
        key: 'Temperature',
        value: '-20 a +70C',
        source: 'manual',
        status: 'confirmed',
      },
    ]);
    expect(validated.toVerify).toBe(0);
    expect(validated.unsourced).toBe(0);
  });
});
