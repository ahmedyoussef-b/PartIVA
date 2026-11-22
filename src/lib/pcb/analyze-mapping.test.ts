import { describe, expect, it } from 'vitest';
import { normalizeRequirements } from './analyze-mapping';

describe('normalizeRequirements', () => {
  it('1. source présente → conservée, status proposed', () => {
    const out = normalizeRequirements([
      {
        category: 'function',
        key: 'Tension',
        value: '3.3 V',
        status: 'proposed',
        source: 'alimenter en 3,3 V',
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      category: 'function',
      key: 'Tension',
      value: '3.3 V',
      status: 'proposed',
      source: 'alimenter en 3,3 V',
    });
  });

  it('2. source absente → null + status to_verify', () => {
    const out = normalizeRequirements([{ category: 'function', key: 'Tension', value: '3.3 V' }]);
    expect(out[0]?.source).toBeNull();
    expect(out[0]?.status).toBe('to_verify');
  });

  it('3. source vide (espaces) → null + to_verify', () => {
    const out = normalizeRequirements([
      { category: 'function', key: 'Tension', value: '3.3 V', source: '   ' },
    ]);
    expect(out[0]?.source).toBeNull();
    expect(out[0]?.status).toBe('to_verify');
  });

  it('4. source "inféré" → inféré + to_verify', () => {
    const out = normalizeRequirements([
      { category: 'function', key: 'Tension', value: '3.3 V', source: 'inféré' },
    ]);
    expect(out[0]?.source).toBe('inféré');
    expect(out[0]?.status).toBe('to_verify');
  });

  it('5. source "INFÉRÉ" (casse) → idem', () => {
    const out = normalizeRequirements([
      { category: 'function', key: 'Tension', value: '3.3 V', source: 'INFÉRÉ' },
    ]);
    expect(out[0]?.source).toBe('inféré');
    expect(out[0]?.status).toBe('to_verify');
  });

  it('6. source > 200 caractères → tronquée à 200', () => {
    const long = 'x'.repeat(250);
    const out = normalizeRequirements([
      { category: 'function', key: 'k', value: 'v', source: long },
    ]);
    expect(out[0]?.source).toHaveLength(200);
  });

  it('7. key vide → entrée ignorée', () => {
    const out = normalizeRequirements([{ category: 'function', key: '  ', value: 'v' }]);
    expect(out).toEqual([]);
  });

  it('8. value vide → entrée ignorée', () => {
    const out = normalizeRequirements([{ category: 'function', key: 'k', value: '' }]);
    expect(out).toEqual([]);
  });

  it('9. raw.status to_verify avec source valide → conservé', () => {
    const out = normalizeRequirements([
      { category: 'function', key: 'k', value: 'v', status: 'to_verify', source: 'texte du CDC' },
    ]);
    expect(out[0]?.status).toBe('to_verify');
    expect(out[0]?.source).toBe('texte du CDC');
  });

  it('ordre préservé', () => {
    const out = normalizeRequirements([
      { category: 'a', key: 'k1', value: 'v1', source: 's1' },
      { category: 'b', key: 'k2', value: 'v2', source: 's2' },
    ]);
    expect(out.map((r) => r.key)).toEqual(['k1', 'k2']);
  });
});
