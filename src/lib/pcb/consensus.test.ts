import { describe, expect, it } from 'vitest';
import { mergePasses, valuesAgree } from './consensus';

const req = (key: string, value: string, category = 'function') => ({ category, key, value });

describe('valuesAgree', () => {
  it('1. deux passes identiques', () => {
    const r = mergePasses(
      [req('Tension', '3,3 V'), req('Courant', '500 mA')],
      [req('Tension', '3,3 V'), req('Courant', '500 mA')],
    );
    expect(r.stableCount).toBe(2);
    expect(r.divergences).toEqual([]);
  });

  it('2. casse/espaces près → stable', () => {
    expect(valuesAgree('  10K  ', '10k')).toBe(true);
  });

  it('3. 3,3 V vs 3.3V → stable', () => {
    expect(valuesAgree('3,3 V', '3.3V')).toBe(true);
  });

  it('4. 3,3 V vs 3,4 V (< 5 %) → stable', () => {
    expect(valuesAgree('3,3 V', '3,4 V')).toBe(true);
  });

  it('5. 3,3 V vs 12 V → divergence value-differs', () => {
    const r = mergePasses([req('Tension', '3,3 V')], [req('Tension', '12 V')]);
    expect(r.stableCount).toBe(0);
    expect(r.divergences).toHaveLength(1);
    expect(r.divergences[0]?.reason).toBe('value-differs');
  });

  it('6. 5 V vs 500 mA → divergence unit-differs', () => {
    const r = mergePasses([req('Alimentation', '5 V')], [req('Alimentation', '500 mA')]);
    expect(r.divergences[0]?.reason).toBe('unit-differs');
  });

  it('7. clé seulement dans pass1 → onlyInPass1, non conservée', () => {
    const r = mergePasses(
      [req('Tension', '3,3 V'), req('Courant', '1 A')],
      [req('Tension', '3,3 V')],
    );
    expect(r.onlyInPass1).toEqual(['courant']);
    expect(r.stableCount).toBe(1);
  });

  it('8. clé seulement dans pass2 → onlyInPass2', () => {
    const r = mergePasses(
      [req('Tension', '3,3 V')],
      [req('Tension', '3,3 V'), req('Puissance', '1 W')],
    );
    expect(r.onlyInPass2).toEqual(['puissance']);
  });

  it('9. ordre des stables = ordre de pass1', () => {
    const r = mergePasses(
      [req('Aaa', '1'), req('Bbb', '2'), req('Ccc', '3')],
      [req('Ccc', '3'), req('Bbb', '2'), req('Aaa', '1')],
    );
    expect(r.requirements.map((x) => x.key)).toEqual(['Aaa', 'Bbb', 'Ccc']);
  });

  it('10. doublon de clé dans pass2 → premier retenu', () => {
    const r = mergePasses(
      [req('Tension', '3,3 V')],
      [req('Tension', '3,3 V'), req('Tension', '12 V')],
    );
    expect(r.divergences).toEqual([]);
    expect(r.stableCount).toBe(1);
  });

  it('11. pass1 vide → requirements vide, onlyInPass2 rempli', () => {
    const r = mergePasses([], [req('Tension', '3,3 V')]);
    expect(r.requirements).toEqual([]);
    expect(r.onlyInPass2).toEqual(['tension']);
  });

  it('12. stableCount === requirements.length', () => {
    const r = mergePasses(
      [req('Tension', '3,3 V'), req('Courant', '1 A')],
      [req('Tension', '3,3 V'), req('Courant', '2 A')],
    );
    expect(r.stableCount).toBe(r.requirements.length);
    expect(r.stableCount).toBe(1);
  });
});
